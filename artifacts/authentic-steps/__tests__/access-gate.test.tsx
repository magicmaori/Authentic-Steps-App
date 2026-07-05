/**
 * Security-critical coverage for the invite-only access boundary.
 *
 * Two layers are verified:
 *  1. The EntitlementProvider state machine (the REAL provider is rendered with
 *     mocked Clerk / API / AsyncStorage) — proves how signed-out, no-invite,
 *     expired, revoked, and offline-grace inputs map to an AccessState.
 *  2. routeForAccessState (the REAL pure routing decision used by AccessGate) —
 *     proves each state redirects to the correct screen and that a signed-out /
 *     unentitled user can never stay on the tabs.
 *
 * Together these cover the four "done looks like" scenarios:
 *   - Signed-out  → sign-in, cannot reach tabs
 *   - Signed-in, no invite → redeem
 *   - Expired / revoked → locked with the right reason
 *   - Offline grace: cached-active works offline until cached expiry, then
 *     requires re-verify (offlineExpired → locked)
 */

// ─── Mutable mock state (must be prefixed `mock*` for jest hoisting) ──────────

interface MockQuery {
  isSuccess: boolean;
  isError: boolean;
  data: { active: boolean; reason: string; expiresAt: string | null } | undefined;
  error: unknown;
  refetch: jest.Mock;
}

const mockAuth: {
  isLoaded: boolean;
  isSignedIn: boolean;
  getToken: jest.Mock;
  signOut: jest.Mock;
} = {
  isLoaded: true,
  isSignedIn: true,
  getToken: jest.fn().mockResolvedValue('test-token'),
  signOut: jest.fn().mockResolvedValue(undefined),
};

const mockQuery: MockQuery = {
  isSuccess: false,
  isError: false,
  data: undefined,
  error: undefined,
  refetch: jest.fn(),
};

const mockStore: Record<string, string> = {};

// ─── Module mocks ─────────────────────────────────────────────────────────────

jest.mock('@clerk/expo', () => ({
  useAuth: () => mockAuth,
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((k: string) => Promise.resolve(mockStore[k] ?? null)),
  setItem: jest.fn((k: string, v: string) => {
    mockStore[k] = v;
    return Promise.resolve();
  }),
  removeItem: jest.fn((k: string) => {
    delete mockStore[k];
    return Promise.resolve();
  }),
}));

jest.mock('@workspace/api-client-react', () => ({
  useGetEntitlement: () => mockQuery,
  setAuthTokenGetter: jest.fn(),
  getGetEntitlementQueryKey: () => ['entitlement'],
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import React from 'react';
import { act, create } from 'react-test-renderer';

import {
  EntitlementProvider,
  routeForAccessState,
  useEntitlement,
  type AccessState,
} from '../context/EntitlementContext';

const CACHE_KEY = '@authentic_steps/entitlement_v1';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function flushPromises(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

/** Renders the real provider and returns the resolved entitlement value. */
async function renderState(): Promise<{ state: AccessState; isOffline: boolean; expiresAt: string | null }> {
  let captured: { state: AccessState; isOffline: boolean; expiresAt: string | null } = {
    state: 'loading',
    isOffline: false,
    expiresAt: null,
  };

  function Probe() {
    const { state, isOffline, expiresAt } = useEntitlement();
    captured = { state, isOffline, expiresAt };
    return null;
  }

  let root: ReturnType<typeof create> | undefined;
  await act(async () => {
    root = create(
      <EntitlementProvider>
        <Probe />
      </EntitlementProvider>,
    );
    await flushPromises();
  });
  act(() => root!.unmount());
  return captured;
}

function resetMocks() {
  jest.clearAllMocks();
  for (const k of Object.keys(mockStore)) delete mockStore[k];
  mockAuth.isLoaded = true;
  mockAuth.isSignedIn = true;
  mockAuth.getToken = jest.fn().mockResolvedValue('test-token');
  mockAuth.signOut = jest.fn().mockResolvedValue(undefined);
  mockQuery.isSuccess = false;
  mockQuery.isError = false;
  mockQuery.data = undefined;
  mockQuery.error = undefined;
  mockQuery.refetch = jest.fn();
}

const HOUR = 60 * 60 * 1000;

// ─── 1. State machine ────────────────────────────────────────────────────────

describe('EntitlementProvider – access state machine', () => {
  beforeEach(resetMocks);

  it('is "loading" until Clerk finishes loading', async () => {
    mockAuth.isLoaded = false;
    const { state } = await renderState();
    expect(state).toBe('loading');
  });

  it('is "signedOut" when Clerk is loaded but no user is signed in', async () => {
    mockAuth.isSignedIn = false;
    const { state } = await renderState();
    expect(state).toBe('signedOut');
  });

  it('is "active" when the API confirms an active entitlement', async () => {
    mockQuery.isSuccess = true;
    mockQuery.data = { active: true, reason: 'active', expiresAt: null };
    const { state } = await renderState();
    expect(state).toBe('active');
  });

  it('is "needsInvite" when signed in but the API reports no entitlement', async () => {
    mockQuery.isSuccess = true;
    mockQuery.data = { active: false, reason: 'none', expiresAt: null };
    const { state } = await renderState();
    expect(state).toBe('needsInvite');
  });

  it('is "expired" when the API reports an expired entitlement', async () => {
    mockQuery.isSuccess = true;
    mockQuery.data = { active: false, reason: 'expired', expiresAt: null };
    const { state } = await renderState();
    expect(state).toBe('expired');
  });

  it('is "revoked" when the API reports a revoked entitlement', async () => {
    mockQuery.isSuccess = true;
    mockQuery.data = { active: false, reason: 'revoked', expiresAt: null };
    const { state } = await renderState();
    expect(state).toBe('revoked');
  });

  it('is "error" (forces re-auth) when the token is rejected with 401', async () => {
    mockQuery.isError = true;
    mockQuery.error = { status: 401 };
    const { state } = await renderState();
    expect(state).toBe('error');
  });
});

// ─── 2. Offline grace ────────────────────────────────────────────────────────

describe('EntitlementProvider – offline grace window', () => {
  beforeEach(resetMocks);

  function seedCache(entry: {
    active: boolean;
    reason: string;
    expiresAt: string | null;
  }) {
    mockStore[CACHE_KEY] = JSON.stringify({ ...entry, cachedAt: Date.now() });
  }

  it('keeps a cached-active grant working offline while cached expiry is in the future', async () => {
    seedCache({ active: true, reason: 'active', expiresAt: new Date(Date.now() + HOUR).toISOString() });
    mockQuery.isError = true;
    mockQuery.error = { status: 0 }; // network failure, not 401
    const { state, isOffline } = await renderState();
    expect(state).toBe('active');
    expect(isOffline).toBe(true);
  });

  it('locks with "offlineExpired" once the cached expiry has passed', async () => {
    seedCache({ active: true, reason: 'active', expiresAt: new Date(Date.now() - HOUR).toISOString() });
    mockQuery.isError = true;
    mockQuery.error = { status: 0 };
    const { state, isOffline } = await renderState();
    expect(state).toBe('offlineExpired');
    expect(isOffline).toBe(true);
  });

  it('falls back to "error" offline when there is no cached grant at all', async () => {
    mockQuery.isError = true;
    mockQuery.error = { status: 0 };
    const { state, isOffline } = await renderState();
    expect(state).toBe('error');
    expect(isOffline).toBe(true);
  });

  it('honors a cached inactive verdict (expired) even offline', async () => {
    seedCache({ active: false, reason: 'expired', expiresAt: null });
    mockQuery.isError = true;
    mockQuery.error = { status: 0 };
    const { state } = await renderState();
    expect(state).toBe('expired');
  });

  it('a cached-active grant with no expiry never times out offline', async () => {
    seedCache({ active: true, reason: 'active', expiresAt: null });
    mockQuery.isError = true;
    mockQuery.error = { status: 0 };
    const { state } = await renderState();
    expect(state).toBe('active');
  });
});

// ─── 3. Routing decision (AccessGate boundary) ───────────────────────────────

describe('routeForAccessState – invite-only gate routing', () => {
  const TABS = ['(tabs)'];
  const SIGN_IN = ['(auth)', 'sign-in'];
  const SIGN_UP = ['(auth)', 'sign-up'];
  const REDEEM = ['(auth)', 'redeem'];
  const LOCKED = ['(auth)', 'locked'];

  it('never redirects while still loading', () => {
    expect(routeForAccessState('loading', TABS)).toEqual({ type: 'stay' });
  });

  // Signed-out: sent to sign-in, cannot reach the tabs
  it('sends a signed-out user on the tabs to sign-in', () => {
    expect(routeForAccessState('signedOut', TABS)).toEqual({
      type: 'replace',
      pathname: '/(auth)/sign-in',
    });
  });

  it('leaves a signed-out user already on sign-in alone', () => {
    expect(routeForAccessState('signedOut', SIGN_IN)).toEqual({ type: 'stay' });
  });

  it('leaves a signed-out user on sign-up alone', () => {
    expect(routeForAccessState('signedOut', SIGN_UP)).toEqual({ type: 'stay' });
  });

  it('pulls a signed-out user off the redeem screen (no invite bypass)', () => {
    expect(routeForAccessState('signedOut', REDEEM)).toEqual({
      type: 'replace',
      pathname: '/(auth)/sign-in',
    });
  });

  // No invite: sent to redeem
  it('sends a no-invite user on the tabs to redeem', () => {
    expect(routeForAccessState('needsInvite', TABS)).toEqual({
      type: 'replace',
      pathname: '/(auth)/redeem',
    });
  });

  it('leaves a no-invite user already on redeem alone', () => {
    expect(routeForAccessState('needsInvite', REDEEM)).toEqual({ type: 'stay' });
  });

  // Expired / revoked / offlineExpired / error: locked with the right reason
  it.each<AccessState>(['expired', 'revoked', 'offlineExpired', 'error'])(
    'sends "%s" to the locked screen carrying its reason',
    (state) => {
      expect(routeForAccessState(state, TABS)).toEqual({
        type: 'replace',
        pathname: '/(auth)/locked',
        params: { reason: state },
      });
    },
  );

  it('leaves a locked user on the locked screen alone', () => {
    expect(routeForAccessState('expired', LOCKED)).toEqual({ type: 'stay' });
  });

  // Active: allowed into the app, bounced out of the auth stack
  it('sends an active user sitting in the auth stack into the tabs', () => {
    expect(routeForAccessState('active', SIGN_IN)).toEqual({
      type: 'replace',
      pathname: '/(tabs)',
    });
  });

  it('leaves an active user on the tabs alone', () => {
    expect(routeForAccessState('active', TABS)).toEqual({ type: 'stay' });
  });
});
