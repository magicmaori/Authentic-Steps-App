import type { GroundingSession, RitualEntry, UserData } from '@/context/AppContext';

/**
 * Deterministic demo data used only when EXPO_PUBLIC_SCREENSHOT_MODE=1.
 * Lets us capture realistic, populated App Store / Play Store screenshots
 * without a real Clerk session or weeks of real usage. Never bundled into
 * a normal build's behavior beyond gating on that env flag.
 */

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

export const SCREENSHOT_MODE = process.env.EXPO_PUBLIC_SCREENSHOT_MODE === '1';

export function buildScreenshotUser(): UserData {
  return {
    anonymousName: 'SilverFalcon',
    currentStreak: 12,
    longestStreak: 21,
    totalRituals: 47,
    streakFreezes: 2,
    flexDaysUsedThisWeek: 0,
    milestones: [
      { id: 'first', label: 'First Step', description: 'Completed your first daily ritual', earnedAt: isoDaysAgo(46) },
      { id: 'streak7', label: 'Roots', description: '7-day streak — you are building something real', earnedAt: isoDaysAgo(30) },
    ],
    totalEncouragements: 34,
    lastCheckIn: isoDaysAgo(0),
    lastFlexWeek: '',
    hasOnboarded: true,
    themePreference: 'light',
    recoveryCode: 'SILVERFALCON-7K2Q',
    favouriteTools: ['breathing-box', 'grounding-54321'],
    notifRitual: true,
    notifEvening: true,
    notifMilestone: true,
    ritualHour: 9,
    ritualMinute: 0,
    eveningHour: 20,
    eveningMinute: 0,
    chimeEnabled: true,
  };
}

const GRATITUDE_BANK: { text: string; category: 'people' | 'experiences' | 'things' | 'self' }[] = [
  { text: 'My best friend texted me first today', category: 'people' },
  { text: 'The walk to school felt calm and quiet', category: 'experiences' },
  { text: 'A warm cup of tea before class', category: 'things' },
  { text: 'I stood up for myself today', category: 'self' },
];

const INTENTIONS = [
  { text: 'Go for a 20-minute walk after school', category: 'movement' as const },
  { text: 'Call my grandma and actually listen', category: 'connection' as const },
  { text: 'Read one chapter before bed', category: 'learning' as const },
  { text: 'Go to bed by 10pm tonight', category: 'rest' as const },
];

const I_AM_STATEMENTS = [
  'I am growing through what I am going through',
  'I am allowed to take up space',
  'I am someone who keeps going',
  'I am becoming who I am meant to be',
];

export function buildScreenshotEntries(): Record<string, RitualEntry> {
  const entries: Record<string, RitualEntry> = {};
  for (let i = 0; i < 12; i++) {
    const date = isoDaysAgo(i);
    entries[date] = {
      date,
      gratitudes: [GRATITUDE_BANK[i % GRATITUDE_BANK.length], GRATITUDE_BANK[(i + 1) % GRATITUDE_BANK.length], GRATITUDE_BANK[(i + 2) % GRATITUDE_BANK.length]],
      intention: INTENTIONS[i % INTENTIONS.length].text,
      intentionCategory: INTENTIONS[i % INTENTIONS.length].category,
      iAmStatement: I_AM_STATEMENTS[i % I_AM_STATEMENTS.length],
      completedSteps: ['gratitude', 'intention', 'iAm'],
      isComplete: true,
    };
  }
  return entries;
}

export function buildScreenshotExercises(): Record<string, string> {
  const today = isoDaysAgo(0);
  return {
    'breathing-box': today,
  };
}

export function buildScreenshotGrounding(): GroundingSession[] {
  const now = Date.now();
  return [
    {
      id: String(now - 86_400_000),
      date: isoDaysAgo(1),
      timestamp: now - 86_400_000,
      senses: [
        { sense: 'see', icon: 'eye', answers: ['My desk lamp', 'A poster', 'My phone', 'The window', 'A plant'] },
        { sense: 'touch', icon: 'hand-left', answers: ['My blanket', 'The floor', 'My sleeve', 'My hair'] },
        { sense: 'hear', icon: 'ear', answers: ['Traffic outside', 'Music playing', 'My own breathing'] },
        { sense: 'smell', icon: 'flower', answers: ['Fresh air', 'Coffee'] },
        { sense: 'taste', icon: 'restaurant', answers: ['Mint gum'] },
      ],
    },
    {
      id: String(now - 3 * 86_400_000),
      date: isoDaysAgo(3),
      timestamp: now - 3 * 86_400_000,
      senses: [
        { sense: 'see', icon: 'eye', answers: ['A cloud', 'My shoes', 'A tree', 'A car', 'The sky'] },
        { sense: 'touch', icon: 'hand-left', answers: ['A cool railing', 'My jacket', 'The ground', 'My watch'] },
        { sense: 'hear', icon: 'ear', answers: ['Birds', 'Wind', 'Footsteps'] },
        { sense: 'smell', icon: 'flower', answers: ['Rain', 'Grass'] },
        { sense: 'taste', icon: 'restaurant', answers: ['Water'] },
      ],
    },
  ];
}
