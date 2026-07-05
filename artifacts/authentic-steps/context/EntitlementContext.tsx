import { useAuth } from '@clerk/expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getGetEntitlementQueryKey, setAuthTokenGetter, useGetEntitlement } from '@workspace/api-client-react';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type AccessState =
  | 'loading'
  | 'signedOut'
  | 'active'
  | 'needsInvite'
  | 'expired'
  | 'revoked'
  | 'offlineExpired'
  | 'error';

interface CachedEntitlement {
  active: boolean;
  reason: string;
  expiresAt: string | null;
  cachedAt: number;
}

interface EntitlementContextValue {
  state: AccessState;
  expiresAt: string | null;
  isOffline: boolean;
  refresh: () => void;
}

const CACHE_KEY = '@authentic_steps/entitlement_v1';

const EntitlementContext = createContext<EntitlementContextValue | undefined>(undefined);

export function isApiError(err: unknown): err is { status: number } {
  return (
    !!err &&
    typeof err === 'object' &&
    'status' in err &&
    typeof (err as { status: unknown }).status === 'number'
  );
}

function mapEntitlement(active: boolean, reason: string): AccessState {
  if (active) return 'active';
  switch (reason) {
    case 'expired':
      return 'expired';
    case 'revoked':
      return 'revoked';
    case 'none':
    default:
      return 'needsInvite';
  }
}

function graceFromCache(cached: CachedEntitlement | null): AccessState {
  if (!cached) return 'error';
  if (cached.active) {
    if (!cached.expiresAt) return 'active';
    return Date.now() < Date.parse(cached.expiresAt) ? 'active' : 'offlineExpired';
  }
  return mapEntitlement(false, cached.reason);
}

export function EntitlementProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [cacheLoaded, setCacheLoaded] = useState(false);
  const [cached, setCached] = useState<CachedEntitlement | null>(null);

  // Attach the Clerk bearer token to every generated API request (mobile only).
  useEffect(() => {
    if (isSignedIn) {
      setAuthTokenGetter(() => getToken());
    } else {
      setAuthTokenGetter(null);
    }
    return () => setAuthTokenGetter(null);
  }, [isSignedIn, getToken]);

  // Load the cached entitlement once on mount so offline sessions have a baseline.
  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(CACHE_KEY)
      .then((raw) => {
        if (!mounted) return;
        if (raw) {
          try {
            setCached(JSON.parse(raw) as CachedEntitlement);
          } catch {
            setCached(null);
          }
        }
        setCacheLoaded(true);
      })
      .catch(() => {
        if (mounted) setCacheLoaded(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const query = useGetEntitlement({
    query: {
      queryKey: getGetEntitlementQueryKey(),
      enabled: isLoaded && !!isSignedIn,
      retry: 1,
      staleTime: 60_000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  });

  const { isSuccess, data } = query;

  // Persist the last confirmed entitlement + expiry as the offline source of truth.
  useEffect(() => {
    if (isSuccess && data) {
      const next: CachedEntitlement = {
        active: data.active,
        reason: data.reason,
        expiresAt: data.expiresAt ?? null,
        cachedAt: Date.now(),
      };
      setCached(next);
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(next)).catch(() => {});
    }
  }, [isSuccess, data]);

  // Drop the cache on sign-out so a different account can't inherit access.
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      setCached(null);
      AsyncStorage.removeItem(CACHE_KEY).catch(() => {});
    }
  }, [isLoaded, isSignedIn]);

  const { state, isOffline } = useMemo<{ state: AccessState; isOffline: boolean }>(() => {
    if (!isLoaded || !cacheLoaded) return { state: 'loading', isOffline: false };
    if (!isSignedIn) return { state: 'signedOut', isOffline: false };

    if (query.isSuccess && query.data) {
      return { state: mapEntitlement(query.data.active, query.data.reason), isOffline: false };
    }

    if (query.isError && query.error) {
      // A rejected token means the session is no longer valid — force re-auth.
      if (isApiError(query.error) && query.error.status === 401) {
        return { state: 'error', isOffline: false };
      }
      // Network failure or server error → fall back to the offline grace window.
      return { state: graceFromCache(cached), isOffline: true };
    }

    // First response still in flight: honor a valid cached grant optimistically.
    if (cached && cached.active && graceFromCache(cached) === 'active') {
      return { state: 'active', isOffline: false };
    }
    return { state: 'loading', isOffline: false };
  }, [
    isLoaded,
    cacheLoaded,
    isSignedIn,
    query.isSuccess,
    query.data,
    query.isError,
    query.error,
    cached,
  ]);

  const refresh = useCallback(() => {
    void query.refetch();
  }, [query]);

  const value = useMemo<EntitlementContextValue>(
    () => ({
      state,
      isOffline,
      expiresAt: query.data?.expiresAt ?? cached?.expiresAt ?? null,
      refresh,
    }),
    [state, isOffline, query.data, cached, refresh],
  );

  return <EntitlementContext.Provider value={value}>{children}</EntitlementContext.Provider>;
}

export function useEntitlement(): EntitlementContextValue {
  const ctx = useContext(EntitlementContext);
  if (!ctx) throw new Error('useEntitlement must be used within an EntitlementProvider');
  return ctx;
}
