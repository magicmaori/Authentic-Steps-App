export type AffirmationTheme = 'confidence' | 'resilience' | 'relationships' | 'purpose' | 'calm';

export interface Affirmation {
  id: string;
  text: string;
  theme: AffirmationTheme;
}

export const THEME_LABELS: Record<AffirmationTheme, string> = {
  confidence: 'Confidence',
  resilience: 'Resilience',
  relationships: 'Relationships',
  purpose: 'Purpose',
  calm: 'Calm',
};

export const affirmations: Affirmation[] = [
  { id: 'c1', theme: 'confidence', text: 'I am capable of handling whatever comes my way' },
  { id: 'c2', theme: 'confidence', text: 'I am worthy of love and belonging' },
  { id: 'c3', theme: 'confidence', text: 'I am strong in ways I am still discovering' },
  { id: 'c4', theme: 'confidence', text: 'I am confident in who I am' },
  { id: 'c5', theme: 'confidence', text: 'I am growing more confident every day' },
  { id: 'c6', theme: 'confidence', text: 'I am brave enough to try' },
  { id: 'c7', theme: 'confidence', text: 'I am enough, exactly as I am' },
  { id: 'c8', theme: 'confidence', text: 'I am proud of how far I have come' },
  { id: 'c9', theme: 'confidence', text: 'I am someone who matters' },
  { id: 'c10', theme: 'confidence', text: 'I am learning to trust myself' },
  { id: 'c11', theme: 'confidence', text: 'I am creative and full of ideas' },
  { id: 'c12', theme: 'confidence', text: 'I am allowed to take up space' },

  { id: 'r1', theme: 'resilience', text: 'I am resilient and can bounce back' },
  { id: 'r2', theme: 'resilience', text: 'I am stronger than my struggles' },
  { id: 'r3', theme: 'resilience', text: 'I am not defined by my hard days' },
  { id: 'r4', theme: 'resilience', text: 'I am learning from every experience' },
  { id: 'r5', theme: 'resilience', text: 'I am able to get through difficult times' },
  { id: 'r6', theme: 'resilience', text: 'I am growing through what I am going through' },
  { id: 'r7', theme: 'resilience', text: 'I am tougher than I think' },
  { id: 'r8', theme: 'resilience', text: 'I am finding strength in hard moments' },
  { id: 'r9', theme: 'resilience', text: 'I am someone who keeps going' },
  { id: 'r10', theme: 'resilience', text: 'I am capable of starting again' },
  { id: 'r11', theme: 'resilience', text: 'I am more than my struggles' },
  { id: 'r12', theme: 'resilience', text: 'I am becoming braver every day' },

  { id: 'rel1', theme: 'relationships', text: 'I am a good friend to others and myself' },
  { id: 'rel2', theme: 'relationships', text: 'I am deserving of healthy relationships' },
  { id: 'rel3', theme: 'relationships', text: 'I am loved by people who care about me' },
  { id: 'rel4', theme: 'relationships', text: 'I am someone who makes a positive difference' },
  { id: 'rel5', theme: 'relationships', text: 'I am worthy of being listened to' },
  { id: 'rel6', theme: 'relationships', text: 'I am someone who brings good to others' },
  { id: 'rel7', theme: 'relationships', text: 'I am learning how to ask for help' },
  { id: 'rel8', theme: 'relationships', text: 'I am building connections that matter' },
  { id: 'rel9', theme: 'relationships', text: 'I am surrounded by people who support me' },
  { id: 'rel10', theme: 'relationships', text: 'I am worthy of kindness' },
  { id: 'rel11', theme: 'relationships', text: 'I am someone worth knowing' },
  { id: 'rel12', theme: 'relationships', text: 'I am open to giving and receiving support' },

  { id: 'p1', theme: 'purpose', text: 'I am working towards something meaningful' },
  { id: 'p2', theme: 'purpose', text: 'I am exactly where I need to be right now' },
  { id: 'p3', theme: 'purpose', text: 'I am discovering what matters to me' },
  { id: 'p4', theme: 'purpose', text: 'I am creating my own path' },
  { id: 'p5', theme: 'purpose', text: 'I am building the life I want' },
  { id: 'p6', theme: 'purpose', text: 'I am someone with a unique gift to offer' },
  { id: 'p7', theme: 'purpose', text: 'I am passionate about what drives me' },
  { id: 'p8', theme: 'purpose', text: 'I am making progress, even when I cannot see it' },
  { id: 'p9', theme: 'purpose', text: 'I am becoming who I am meant to be' },
  { id: 'p10', theme: 'purpose', text: 'I am part of something bigger than myself' },
  { id: 'p11', theme: 'purpose', text: 'I am finding my voice' },
  { id: 'p12', theme: 'purpose', text: 'I am open to new experiences' },

  { id: 'ca1', theme: 'calm', text: 'I am at peace with this moment' },
  { id: 'ca2', theme: 'calm', text: 'I am allowed to slow down' },
  { id: 'ca3', theme: 'calm', text: 'I am choosing calm over chaos' },
  { id: 'ca4', theme: 'calm', text: 'I am breathing through the hard moments' },
  { id: 'ca5', theme: 'calm', text: 'I am safe right now' },
  { id: 'ca6', theme: 'calm', text: 'I am taking things one step at a time' },
  { id: 'ca7', theme: 'calm', text: 'I am allowed to rest and recharge' },
  { id: 'ca8', theme: 'calm', text: 'I am releasing what is out of my control' },
  { id: 'ca9', theme: 'calm', text: 'I am finding peace within myself' },
  { id: 'ca10', theme: 'calm', text: 'I am present in this moment' },
  { id: 'ca11', theme: 'calm', text: 'I am doing my best and that is enough' },
  { id: 'ca12', theme: 'calm', text: 'I am allowed to feel all my feelings' },
];

export const ANIMALS = [
  'Falcon', 'Wolf', 'Tiger', 'Eagle', 'Fox', 'Bear', 'Lion', 'Hawk',
  'Deer', 'Owl', 'Swan', 'Crane', 'Otter', 'Dolphin', 'Raven', 'Lynx',
];

export const COLORS_LIST = [
  'Silver', 'Golden', 'Azure', 'Crimson', 'Jade', 'Amber', 'Cobalt',
  'Violet', 'Scarlet', 'Emerald', 'Copper', 'Indigo', 'Teal', 'Coral',
];

export function generateAnonymousName(): string {
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const color = COLORS_LIST[Math.floor(Math.random() * COLORS_LIST.length)];
  return `${color}${animal}`;
}
