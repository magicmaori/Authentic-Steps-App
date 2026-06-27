/**
 * Smoke tests: tapping each helpline card triggers Linking.openURL with the
 * correct tel: URL. Covers Emergency (000), Kids Helpline (1800551800), and
 * all other cards in the HELPLINES constant.
 *
 * Uses react-test-renderer (same as the other test files in this project).
 * Each helpline Pressable has a testID of `helpline-card-<num>` so cards can
 * be located without walking the React fiber tree.
 *
 * NOTE: jest.mock() is hoisted before variable declarations, so factory
 * functions must be fully self-contained — no outer variable references.
 */

// ─── Module mocks ─────────────────────────────────────────────────────────────

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}));

jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement(View, props, children),
  };
});

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    background: '#ffffff',
    foreground: '#000000',
    mutedForeground: '#666666',
    card: '#ffffff',
    border: '#e0e0e0',
    primary: '#1a5c3a',
    secondary: '#f0f0f0',
    gradientStart: '#1a5c3a',
  }),
}));

jest.mock('@/components/VideoPlaceholder', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    VideoPlaceholder: () => React.createElement(View, null),
  };
});

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import React from 'react';
import { act, create } from 'react-test-renderer';
import { Alert, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import SupportScreen from '../app/(tabs)/support';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Expected helpline entries — must stay in sync with the HELPLINES constant in
 * support.tsx. `num` matches both the testID suffix and the raw dial string.
 */
const EXPECTED_HELPLINES = [
  { name: 'Kids Helpline', num: '1800551800' },
  { name: 'Lifeline',      num: '131114'     },
  { name: 'Beyond Blue',   num: '1300224636' },
  { name: '13YARN',        num: '139276'     },
  { name: 'Emergency',     num: '000'        },
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Support screen – helpline card calls', () => {
  let root: ReturnType<typeof create>;
  let openURLSpy: jest.SpyInstance;

  beforeEach(() => {
    openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    act(() => {
      root = create(<SupportScreen />);
    });
  });

  afterEach(() => {
    openURLSpy.mockRestore();
    act(() => {
      root.unmount();
    });
  });

  it.each(EXPECTED_HELPLINES)(
    'tapping $name card calls Linking.openURL with tel:$num',
    async ({ num }) => {
      const card = root.root.findByProps({ testID: `helpline-card-${num}` });
      expect(card).toBeTruthy();

      await act(async () => {
        card.props.onPress();
      });

      expect(openURLSpy).toHaveBeenCalledWith(`tel:${num}`);
      expect(openURLSpy).toHaveBeenCalledTimes(1);
    },
  );

  it('Emergency (000) card specifically triggers tel:000', async () => {
    const card = root.root.findByProps({ testID: 'helpline-card-000' });
    await act(async () => { card.props.onPress(); });
    expect(openURLSpy).toHaveBeenCalledWith('tel:000');
  });

  it('Kids Helpline card specifically triggers tel:1800551800', async () => {
    const card = root.root.findByProps({ testID: 'helpline-card-1800551800' });
    await act(async () => { card.props.onPress(); });
    expect(openURLSpy).toHaveBeenCalledWith('tel:1800551800');
  });

  it('Beyond Blue card specifically triggers tel:1300224636', async () => {
    const card = root.root.findByProps({ testID: 'helpline-card-1300224636' });
    await act(async () => { card.props.onPress(); });
    expect(openURLSpy).toHaveBeenCalledWith('tel:1300224636');
  });

  it('does not throw when Linking.openURL rejects (callNumber shows an Alert instead)', async () => {
    openURLSpy.mockRejectedValueOnce(new Error('not supported'));
    const card = root.root.findByProps({ testID: 'helpline-card-000' });

    await expect(
      act(async () => { card.props.onPress(); }),
    ).resolves.not.toThrow();
  });
});

// ─── Triage flow call buttons ──────────────────────────────────────────────────

describe('Support screen – triage flow call buttons', () => {
  let root: ReturnType<typeof create>;
  let openURLSpy: jest.SpyInstance;

  beforeEach(() => {
    openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    act(() => {
      root = create(<SupportScreen />);
    });
  });

  afterEach(() => {
    openURLSpy.mockRestore();
    act(() => {
      root.unmount();
    });
  });

  it('urgency="right now" path: call button triggers tel:1800551800', async () => {
    // Step 1 — open triage
    await act(async () => {
      root.root.findByProps({ testID: 'triage-start-btn' }).props.onPress();
    });

    // Step 2 — choose "right now" → goes straight to routed
    await act(async () => {
      root.root.findByProps({ testID: 'triage-urgency-right-now' }).props.onPress();
    });

    // Step 3 — tap the call button
    await act(async () => {
      root.root.findByProps({ testID: 'triage-call-right-now' }).props.onPress();
    });

    expect(openURLSpy).toHaveBeenCalledWith('tel:1800551800');
    expect(openURLSpy).toHaveBeenCalledTimes(1);
  });

  it('supportType="professional help" path: call button triggers tel:1800551800', async () => {
    // Step 1 — open triage
    await act(async () => {
      root.root.findByProps({ testID: 'triage-start-btn' }).props.onPress();
    });

    // Step 2 — choose "today" → goes to area step
    await act(async () => {
      root.root.findByProps({ testID: 'triage-urgency-today' }).props.onPress();
    });

    // Step 3 — choose any area → goes to type step
    await act(async () => {
      root.root.findByProps({ testID: 'triage-area-emotions' }).props.onPress();
    });

    // Step 4 — choose "professional help" → routed with supportType set
    await act(async () => {
      root.root.findByProps({ testID: 'triage-type-professional-help' }).props.onPress();
    });

    // Step 5 — tap the call button
    await act(async () => {
      root.root.findByProps({ testID: 'triage-call-professional' }).props.onPress();
    });

    expect(openURLSpy).toHaveBeenCalledWith('tel:1800551800');
    expect(openURLSpy).toHaveBeenCalledTimes(1);
  });
});

// ─── "Start over" reset ────────────────────────────────────────────────────────

describe('Support screen – "Start over" reset', () => {
  let root: ReturnType<typeof create>;
  let openURLSpy: jest.SpyInstance;

  beforeEach(() => {
    openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    act(() => {
      root = create(<SupportScreen />);
    });
  });

  afterEach(() => {
    openURLSpy.mockRestore();
    act(() => {
      root.unmount();
    });
  });

  it('urgency="right now" routed view: tapping "Start over" returns to idle (start button visible)', async () => {
    // Navigate to routed view via urgency='right now'
    await act(async () => {
      root.root.findByProps({ testID: 'triage-start-btn' }).props.onPress();
    });
    await act(async () => {
      root.root.findByProps({ testID: 'triage-urgency-right-now' }).props.onPress();
    });

    // Reset button must be present in the routed view
    const resetBtn = root.root.findByProps({ testID: 'triage-reset-btn' });
    expect(resetBtn).toBeTruthy();

    await act(async () => {
      resetBtn.props.onPress();
    });

    // After reset, the initial "I need some support" button must be visible again
    expect(() =>
      root.root.findByProps({ testID: 'triage-start-btn' }),
    ).not.toThrow();
    // And the routed-view reset button must no longer be rendered
    expect(() =>
      root.root.findByProps({ testID: 'triage-reset-btn' }),
    ).toThrow();
  });

  it('professional-help routed view: tapping "Start over" returns to idle (start button visible)', async () => {
    // Navigate to routed view via professional-help path
    await act(async () => {
      root.root.findByProps({ testID: 'triage-start-btn' }).props.onPress();
    });
    await act(async () => {
      root.root.findByProps({ testID: 'triage-urgency-today' }).props.onPress();
    });
    await act(async () => {
      root.root.findByProps({ testID: 'triage-area-emotions' }).props.onPress();
    });
    await act(async () => {
      root.root.findByProps({ testID: 'triage-type-professional-help' }).props.onPress();
    });

    // Reset button must be present in the routed view
    const resetBtn = root.root.findByProps({ testID: 'triage-reset-btn' });
    expect(resetBtn).toBeTruthy();

    await act(async () => {
      resetBtn.props.onPress();
    });

    // After reset, the initial "I need some support" button must be visible again
    expect(() =>
      root.root.findByProps({ testID: 'triage-start-btn' }),
    ).not.toThrow();
    // And the routed-view reset button must no longer be rendered
    expect(() =>
      root.root.findByProps({ testID: 'triage-reset-btn' }),
    ).toThrow();
  });
});

// ─── Web-chat button ───────────────────────────────────────────────────────────

describe('Support screen – web-chat button', () => {
  let root: ReturnType<typeof create>;
  let openURLSpy: jest.SpyInstance;
  let openBrowserSpy: jest.SpyInstance;

  beforeEach(async () => {
    openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    openBrowserSpy = jest.spyOn(WebBrowser, 'openBrowserAsync').mockResolvedValue({ type: 'opened' } as any);

    await act(async () => {
      root = create(<SupportScreen />);
    });

    // Navigate triage to the "right now" routed view where the chat button lives
    await act(async () => {
      root.root.findByProps({ testID: 'triage-start-btn' }).props.onPress();
    });
    await act(async () => {
      root.root.findByProps({ testID: 'triage-urgency-right-now' }).props.onPress();
    });
  });

  afterEach(() => {
    openURLSpy.mockRestore();
    openBrowserSpy.mockRestore();
    act(() => { root.unmount(); });
  });

  it('calls openBrowserAsync with the Kids Helpline webchat URL', async () => {
    const btn = root.root.findByProps({ testID: 'triage-webchat-btn' });
    expect(btn).toBeTruthy();

    await act(async () => { btn.props.onPress(); });

    expect(openBrowserSpy).toHaveBeenCalledWith(
      'https://kidshelpline.com.au/get-help/webchat',
    );
    expect(openBrowserSpy).toHaveBeenCalledTimes(1);
  });

  it('shows an Alert and does not throw when openBrowserAsync rejects', async () => {
    openBrowserSpy.mockRejectedValueOnce(new Error('browser not available'));
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const btn = root.root.findByProps({ testID: 'triage-webchat-btn' });

    await expect(
      act(async () => { btn.props.onPress(); }),
    ).resolves.not.toThrow();

    expect(alertSpy).toHaveBeenCalledWith(
      'Chat unavailable',
      expect.stringContaining('kidshelpline.com.au'),
    );

    alertSpy.mockRestore();
  });
});
