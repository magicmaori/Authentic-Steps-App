import AsyncStorage from '@react-native-async-storage/async-storage';
import { deflateSync, decompressSync, strFromU8, strToU8 } from 'fflate';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { generateAnonymousName } from '@/constants/affirmations';

export type GratitudeCategory = 'people' | 'experiences' | 'things' | 'self';
export type IntentionCategory = 'movement' | 'connection' | 'learning' | 'rest' | 'creativity';
export type ThemePreference = 'system' | 'light' | 'dark';

export interface GroundingSense {
  sense: string;
  icon: string;
  answers: string[];
}

export interface GroundingSession {
  id: string;
  date: string;
  timestamp: number;
  senses: GroundingSense[];
}

export interface GratitudeEntry {
  text: string;
  category: GratitudeCategory;
}

export interface RitualEntry {
  date: string;
  gratitudes: GratitudeEntry[];
  intention: string;
  intentionCategory: IntentionCategory | '';
  iAmStatement: string;
  completedSteps: string[];
  isComplete: boolean;
}

export interface Milestone {
  id: string;
  label: string;
  description: string;
  earnedAt: string;
}

export interface UserData {
  anonymousName: string;
  currentStreak: number;
  longestStreak: number;
  totalRituals: number;
  streakFreezes: number;
  flexDaysUsedThisWeek: number;
  milestones: Milestone[];
  totalEncouragements: number;
  lastCheckIn: string;
  lastFlexWeek: string;
  hasOnboarded: boolean;
  themePreference: ThemePreference;
  recoveryCode: string;
  favouriteTools: string[];
}

export type RestoreResult =
  | { ok: true }
  | { ok: false; reason: 'format' | 'incomplete' | 'corrupted' | 'invalid_data' | 'save_failed' };

interface AppContextType {
  userData: UserData;
  entries: Record<string, RitualEntry>;
  todayEntry: RitualEntry | null;
  isLoaded: boolean;
  saveGratitude: (gratitudes: GratitudeEntry[]) => Promise<void>;
  saveIntention: (intention: string, category: IntentionCategory | '') => Promise<void>;
  saveIAmStatement: (statement: string) => Promise<void>;
  markRitualComplete: () => Promise<void>;
  useFlex: () => Promise<boolean>;
  useStreakFreeze: () => Promise<boolean>;
  isStepDone: (step: 'gratitude' | 'intention' | 'iAm') => boolean;
  getStreakCalendar: () => { date: string; done: boolean; flex: boolean }[];
  completeOnboarding: () => Promise<void>;
  setThemePreference: (pref: ThemePreference) => Promise<void>;
  buildRecoveryPayload: () => string;
  restoreFromCode: (code: string) => Promise<RestoreResult>;
  toggleFavouriteTool: (toolId: string) => Promise<void>;
  completedExercises: Record<string, string>;
  markExerciseDone: (toolId: string) => Promise<void>;
  isExerciseDoneToday: (toolId: string) => boolean;
  groundingSessions: GroundingSession[];
  saveGroundingSession: (senses: GroundingSense[]) => Promise<void>;
}

function generateRecoveryCode(anonymousName: string): string {
  const parts = anonymousName.match(/[A-Z][a-z]+/g) ?? [anonymousName];
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const suffix = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return [...parts.map(p => p.toUpperCase()), suffix].join('-');
}

function encodePayload(userData: UserData, entries: Record<string, RitualEntry>): string {
  const json = JSON.stringify({ userData, entries });
  const compressed = deflateSync(strToU8(json), { level: 6 });
  let binary = '';
  for (let i = 0; i < compressed.length; i++) {
    binary += String.fromCharCode(compressed[i]);
  }
  return btoa(binary);
}

type DecodePayloadResult =
  | { ok: true; userData: UserData; entries: Record<string, RitualEntry> }
  | { ok: false; reason: 'corrupted' };

function decodePayload(raw: string): DecodePayloadResult {
  try {
    const binary = atob(raw);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const decompressed = decompressSync(bytes);
    const parsed = JSON.parse(strFromU8(decompressed));
    return { ok: true, userData: parsed.userData, entries: parsed.entries };
  } catch {
    return { ok: false, reason: 'corrupted' };
  }
}

const defaultUser: UserData = {
  anonymousName: '',
  currentStreak: 0,
  longestStreak: 0,
  totalRituals: 0,
  streakFreezes: 0,
  flexDaysUsedThisWeek: 0,
  milestones: [],
  totalEncouragements: 0,
  lastCheckIn: '',
  lastFlexWeek: '',
  hasOnboarded: false,
  themePreference: 'system',
  recoveryCode: '',
  favouriteTools: [],
};

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY_USER = '@authentic_steps_user';
const STORAGE_KEY_ENTRIES = '@authentic_steps_entries';
const STORAGE_KEY_EXERCISES = '@authentic_steps_exercises';
const STORAGE_KEY_GROUNDING = '@authentic_steps_grounding';

function todayString(): string {
  return new Date().toISOString().split('T')[0];
}

function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split('T')[0];
}

const MILESTONES = [
  { id: 'first', trigger: 'first_checkin', label: 'First Step', description: 'Completed your first daily ritual' },
  { id: 'streak7', trigger: 'streak_7', label: 'Roots', description: '7-day streak — you are building something real' },
  { id: 'streak30', trigger: 'streak_30', label: 'Deep Roots', description: '30 days strong — extraordinary commitment' },
  { id: 'streak100', trigger: 'streak_100', label: 'Ancient Tree', description: '100 days — you are unstoppable' },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [userData, setUserData] = useState<UserData>(defaultUser);
  const [entries, setEntries] = useState<Record<string, RitualEntry>>({});
  const [completedExercises, setCompletedExercises] = useState<Record<string, string>>({});
  const [groundingSessions, setGroundingSessions] = useState<GroundingSession[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [userRaw, entriesRaw, exercisesRaw, groundingRaw] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_USER),
        AsyncStorage.getItem(STORAGE_KEY_ENTRIES),
        AsyncStorage.getItem(STORAGE_KEY_EXERCISES),
        AsyncStorage.getItem(STORAGE_KEY_GROUNDING),
      ]);
      if (userRaw) {
        const parsed = JSON.parse(userRaw) as Partial<UserData>;
        const name = parsed.anonymousName || generateAnonymousName();
        const recoveryCode = parsed.recoveryCode || generateRecoveryCode(name);
        const merged: UserData = {
          ...defaultUser,
          ...parsed,
          anonymousName: name,
          recoveryCode,
          hasOnboarded: parsed.hasOnboarded ?? (parsed.totalRituals !== undefined && parsed.totalRituals > 0),
        };
        setUserData(merged);
        if (!parsed.recoveryCode || !parsed.anonymousName) {
          await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(merged));
        }
      } else {
        const name = generateAnonymousName();
        const newUser: UserData = {
          ...defaultUser,
          anonymousName: name,
          recoveryCode: generateRecoveryCode(name),
        };
        setUserData(newUser);
        await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
      }
      if (entriesRaw) setEntries(JSON.parse(entriesRaw));
      if (exercisesRaw) {
        const parsed: Record<string, string> = JSON.parse(exercisesRaw);
        const today = todayString();
        const filtered: Record<string, string> = {};
        for (const [toolId, date] of Object.entries(parsed)) {
          if (date === today) filtered[toolId] = date;
        }
        setCompletedExercises(filtered);
      }
      if (groundingRaw) {
        const parsed: GroundingSession[] = JSON.parse(groundingRaw);
        setGroundingSessions(parsed);
      }
    } catch {
    } finally {
      setIsLoaded(true);
    }
  }

  async function saveUser(updated: UserData) {
    setUserData(updated);
    await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated));
  }

  async function saveEntries(updated: Record<string, RitualEntry>) {
    setEntries(updated);
    await AsyncStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(updated));
  }

  function getTodayEntry(): RitualEntry | null {
    return entries[todayString()] ?? null;
  }

  function isStepDone(step: 'gratitude' | 'intention' | 'iAm'): boolean {
    const entry = getTodayEntry();
    if (!entry) return false;
    return entry.completedSteps.includes(step);
  }

  const buildRecoveryPayload = useCallback((): string => {
    const base64 = encodePayload(userData, entries);
    return `${userData.recoveryCode}#${base64}`;
  }, [userData, entries]);

  const restoreFromCode = useCallback(async (code: string): Promise<RestoreResult> => {
    const trimmed = code.trim();
    const hashIndex = trimmed.indexOf('#');
    if (hashIndex === -1) return { ok: false, reason: 'format' };
    const payloadRaw = trimmed.slice(hashIndex + 1).trim();
    if (!payloadRaw) return { ok: false, reason: 'incomplete' };
    const decoded = decodePayload(payloadRaw);
    if (!decoded.ok) return { ok: false, reason: 'corrupted' };
    const { userData: restoredUser, entries: restoredEntries } = decoded;
    if (
      !restoredUser ||
      typeof restoredUser.anonymousName !== 'string' ||
      !restoredUser.anonymousName ||
      typeof restoredUser.currentStreak !== 'number' ||
      typeof restoredUser.totalRituals !== 'number' ||
      typeof restoredUser.recoveryCode !== 'string'
    ) return { ok: false, reason: 'invalid_data' };
    const safeUser: UserData = {
      ...defaultUser,
      ...restoredUser,
    };
    const safeEntries: Record<string, RitualEntry> = restoredEntries ?? {};
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(safeUser)),
        AsyncStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(safeEntries)),
      ]);
      setUserData(safeUser);
      setEntries(safeEntries);
      return { ok: true };
    } catch {
      return { ok: false, reason: 'save_failed' };
    }
  }, []);

  const saveGratitude = useCallback(async (gratitudes: GratitudeEntry[]) => {
    const today = todayString();
    const existing = entries[today] ?? {
      date: today,
      gratitudes: [],
      intention: '',
      intentionCategory: '',
      iAmStatement: '',
      completedSteps: [],
      isComplete: false,
    };
    const steps = existing.completedSteps.includes('gratitude')
      ? existing.completedSteps
      : [...existing.completedSteps, 'gratitude'];
    const updated = { ...existing, gratitudes, completedSteps: steps };
    await saveEntries({ ...entries, [today]: updated });
  }, [entries]);

  const saveIntention = useCallback(async (intention: string, intentionCategory: IntentionCategory | '') => {
    const today = todayString();
    const existing = entries[today] ?? {
      date: today,
      gratitudes: [],
      intention: '',
      intentionCategory: '',
      iAmStatement: '',
      completedSteps: [],
      isComplete: false,
    };
    const steps = existing.completedSteps.includes('intention')
      ? existing.completedSteps
      : [...existing.completedSteps, 'intention'];
    const updated = { ...existing, intention, intentionCategory, completedSteps: steps };
    await saveEntries({ ...entries, [today]: updated });
  }, [entries]);

  const saveIAmStatement = useCallback(async (statement: string) => {
    const today = todayString();
    const existing = entries[today] ?? {
      date: today,
      gratitudes: [],
      intention: '',
      intentionCategory: '',
      iAmStatement: '',
      completedSteps: [],
      isComplete: false,
    };
    const steps = existing.completedSteps.includes('iAm')
      ? existing.completedSteps
      : [...existing.completedSteps, 'iAm'];
    const updated = { ...existing, iAmStatement: statement, completedSteps: steps };
    await saveEntries({ ...entries, [today]: updated });
  }, [entries]);

  const markRitualComplete = useCallback(async () => {
    const today = todayString();
    const existing = entries[today];
    if (!existing) return;

    const updated = { ...existing, isComplete: true };
    const newEntries = { ...entries, [today]: updated };

    let newUser = { ...userData };
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yString = yesterday.toISOString().split('T')[0];

    if (newUser.lastCheckIn === yString || newUser.lastCheckIn === today) {
      if (newUser.lastCheckIn !== today) {
        newUser.currentStreak += 1;
      }
    } else {
      newUser.currentStreak = 1;
    }
    if (newUser.currentStreak > newUser.longestStreak) {
      newUser.longestStreak = newUser.currentStreak;
    }
    if (newUser.lastCheckIn !== today) {
      newUser.totalRituals += 1;
    }
    newUser.lastCheckIn = today;

    const newMilestones = [...newUser.milestones];
    const hasMilestone = (id: string) => newMilestones.some(m => m.id === id);

    if (!hasMilestone('first')) {
      const m = MILESTONES.find(x => x.id === 'first')!;
      newMilestones.push({ id: m.id, label: m.label, description: m.description, earnedAt: today });
      if (newUser.streakFreezes < 2) newUser.streakFreezes += 1;
    }
    if (newUser.currentStreak >= 7 && !hasMilestone('streak7')) {
      const m = MILESTONES.find(x => x.id === 'streak7')!;
      newMilestones.push({ id: m.id, label: m.label, description: m.description, earnedAt: today });
      if (newUser.streakFreezes < 2) newUser.streakFreezes += 1;
    }
    if (newUser.currentStreak >= 30 && !hasMilestone('streak30')) {
      const m = MILESTONES.find(x => x.id === 'streak30')!;
      newMilestones.push({ id: m.id, label: m.label, description: m.description, earnedAt: today });
    }
    newUser.milestones = newMilestones;

    await saveEntries(newEntries);
    await saveUser(newUser);
  }, [entries, userData]);

  const useFlex = useCallback(async (): Promise<boolean> => {
    const thisWeek = getWeekKey(new Date());
    if (userData.lastFlexWeek === thisWeek && userData.flexDaysUsedThisWeek >= 1) {
      return false;
    }
    const newUser = {
      ...userData,
      flexDaysUsedThisWeek: userData.lastFlexWeek === thisWeek ? userData.flexDaysUsedThisWeek + 1 : 1,
      lastFlexWeek: thisWeek,
    };
    await saveUser(newUser);
    return true;
  }, [userData]);

  const useStreakFreeze = useCallback(async (): Promise<boolean> => {
    if (userData.streakFreezes <= 0) return false;
    const newUser = { ...userData, streakFreezes: userData.streakFreezes - 1 };
    await saveUser(newUser);
    return true;
  }, [userData]);

  const completeOnboarding = useCallback(async () => {
    const newUser = { ...userData, hasOnboarded: true };
    await saveUser(newUser);
  }, [userData]);

  const setThemePreference = useCallback(async (pref: ThemePreference) => {
    const newUser = { ...userData, themePreference: pref };
    await saveUser(newUser);
  }, [userData]);

  const toggleFavouriteTool = useCallback(async (toolId: string) => {
    const current = userData.favouriteTools ?? [];
    const updated = current.includes(toolId)
      ? current.filter(id => id !== toolId)
      : [...current, toolId];
    await saveUser({ ...userData, favouriteTools: updated });
  }, [userData]);

  const markExerciseDone = useCallback(async (toolId: string) => {
    const today = todayString();
    if (completedExercises[toolId] === today) return;
    const updated = { ...completedExercises, [toolId]: today };
    setCompletedExercises(updated);
    await AsyncStorage.setItem(STORAGE_KEY_EXERCISES, JSON.stringify(updated));
  }, [completedExercises]);

  const isExerciseDoneToday = useCallback((toolId: string): boolean => {
    return completedExercises[toolId] === todayString();
  }, [completedExercises]);

  const saveGroundingSession = useCallback(async (senses: GroundingSense[]) => {
    const now = Date.now();
    const session: GroundingSession = {
      id: now.toString(),
      date: todayString(),
      timestamp: now,
      senses,
    };
    const updated = [session, ...groundingSessions];
    setGroundingSessions(updated);
    await AsyncStorage.setItem(STORAGE_KEY_GROUNDING, JSON.stringify(updated));
  }, [groundingSessions]);

  function getStreakCalendar() {
    const days: { date: string; done: boolean; flex: boolean }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const entry = entries[ds];
      days.push({
        date: ds,
        done: entry?.isComplete ?? false,
        flex: entry ? (entry.completedSteps.length >= 2 && !entry.isComplete) : false,
      });
    }
    return days;
  }

  const todayEntry = getTodayEntry();

  return (
    <AppContext.Provider value={{
      userData,
      entries,
      todayEntry,
      isLoaded,
      saveGratitude,
      saveIntention,
      saveIAmStatement,
      markRitualComplete,
      useFlex,
      useStreakFreeze,
      isStepDone,
      getStreakCalendar,
      completeOnboarding,
      setThemePreference,
      buildRecoveryPayload,
      restoreFromCode,
      toggleFavouriteTool,
      completedExercises,
      markExerciseDone,
      isExerciseDoneToday,
      groundingSessions,
      saveGroundingSession,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

/** Returns the context value or null when called outside AppProvider (e.g. ErrorFallback). */
export function useAppOptional() {
  return useContext(AppContext);
}
