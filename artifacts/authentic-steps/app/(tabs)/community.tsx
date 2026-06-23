import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';

type Tab = 'gratitude' | 'iamwall' | 'actions';

interface FeedPost {
  id: string;
  name: string;
  text: string;
  likes: number;
  ticks: number;
  timeAgo: string;
  liked: boolean;
  ticked: boolean;
}

const GRATITUDE_FEED: FeedPost[] = [
  { id: '1', name: 'GoldenFalcon', text: 'The way sunlight came through my window this morning. Small things matter.', likes: 12, ticks: 8, timeAgo: '2h ago', liked: false, ticked: false },
  { id: '2', name: 'JadeWolf', text: 'My mum made my favourite dinner without me asking. She always knows.', likes: 24, ticks: 15, timeAgo: '3h ago', liked: false, ticked: false },
  { id: '3', name: 'AzureEagle', text: 'Getting through a really hard week. Grateful I did not give up.', likes: 41, ticks: 29, timeAgo: '5h ago', liked: false, ticked: false },
  { id: '4', name: 'CrimsonOtter', text: 'My dog, always my dog. Pure joy every single morning.', likes: 33, ticks: 18, timeAgo: '6h ago', liked: false, ticked: false },
  { id: '5', name: 'EmeraldCrane', text: 'A friend checked in on me out of nowhere. Connection is everything.', likes: 19, ticks: 11, timeAgo: '8h ago', liked: false, ticked: false },
];

const IAM_POSTS: FeedPost[] = [
  { id: 'i1', name: 'SilverLynx', text: 'I am growing through what I am going through', likes: 28, ticks: 20, timeAgo: '1h ago', liked: false, ticked: false },
  { id: 'i2', name: 'CoralDeer', text: 'I am allowed to take up space', likes: 35, ticks: 24, timeAgo: '2h ago', liked: false, ticked: false },
  { id: 'i3', name: 'IndigoSwan', text: 'I am someone who keeps going', likes: 17, ticks: 13, timeAgo: '4h ago', liked: false, ticked: false },
  { id: 'i4', name: 'TealRaven', text: 'I am at peace with this moment', likes: 22, ticks: 16, timeAgo: '6h ago', liked: false, ticked: false },
  { id: 'i5', name: 'AmberFox', text: 'I am becoming who I am meant to be', likes: 31, ticks: 19, timeAgo: '7h ago', liked: false, ticked: false },
];

const INTENTION_POSTS: FeedPost[] = [
  { id: 'a1', name: 'VioletBear', text: 'Going for a 20-minute walk before school', likes: 14, ticks: 9, timeAgo: '1h ago', liked: false, ticked: false },
  { id: 'a2', name: 'CopperHawk', text: 'Putting my phone away at dinner with family', likes: 18, ticks: 12, timeAgo: '3h ago', liked: false, ticked: false },
  { id: 'a3', name: 'ScarletOwl', text: 'Reading for 15 minutes before sleeping', likes: 25, ticks: 17, timeAgo: '5h ago', liked: false, ticked: false },
];

const TAB_DESCRIPTORS: Record<Tab, string> = {
  gratitude: 'See what your community is grateful for today — every entry is a small act of courage.',
  iamwall: 'Read the I Am statements others are living by today. Add your voice to the wall.',
  actions: 'See the intentions others have set. One step at a time, together.',
};

export default function CommunityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('gratitude');
  const [gratitude, setGratitude] = useState<FeedPost[]>(GRATITUDE_FEED);
  const [iamPosts, setIamPosts] = useState<FeedPost[]>(IAM_POSTS);
  const [intentions, setIntentions] = useState<FeedPost[]>(INTENTION_POSTS);

  const breathAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, {
          toValue: 1,
          duration: 3500,
          useNativeDriver: false,
        }),
        Animated.timing(breathAnim, {
          toValue: 0,
          duration: 3500,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const glowOpacity = breathAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.18] });
  const textScale = breathAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.012] });

  function getFeed() {
    if (activeTab === 'gratitude') return gratitude;
    if (activeTab === 'iamwall') return iamPosts;
    return intentions;
  }

  function getSetFeed() {
    if (activeTab === 'gratitude') return setGratitude;
    if (activeTab === 'iamwall') return setIamPosts;
    return setIntentions;
  }

  async function handleReact(id: string, type: 'like' | 'tick') {
    await Haptics.selectionAsync();
    const setFeed = getSetFeed();
    setFeed(prev => prev.map(p => {
      if (p.id !== id) return p;
      if (type === 'like') {
        return { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 };
      }
      return { ...p, ticked: !p.ticked, ticks: p.ticked ? p.ticks - 1 : p.ticks + 1 };
    }));
  }

  const feed = getFeed();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      <LinearGradient
        colors={['#193b83', '#03989e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.banner, { paddingTop: Platform.OS === 'web' ? insets.top + 67 : insets.top + 20 }]}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            styles.bannerGlow,
            { opacity: glowOpacity },
          ]}
        />
        <View style={styles.bannerDots}>
          {[...Array(5)].map((_, i) => (
            <View key={i} style={styles.bannerDot} />
          ))}
        </View>
        <Animated.Text
          style={[styles.bannerQuote, { transform: [{ scale: textScale }] }]}
        >
          Let's change the world{'\n'}one day at a time.
        </Animated.Text>
        <Text style={styles.bannerSub}>Authentic Steps For Youth</Text>
      </LinearGradient>

      <View
        style={[
          styles.header,
          { backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>Community</Text>
        <Text style={[styles.screenSubtitle, { color: colors.mutedForeground }]}>Anonymous — you are SilverFalcon here</Text>
        <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
          {([['gratitude', 'Gratitude'], ['iamwall', 'I Am Wall'], ['actions', 'Intentions']] as const).map(([id, label]) => (
            <Pressable
              key={id}
              onPress={() => setActiveTab(id)}
              style={[
                styles.tabBtn,
                activeTab === id && { borderBottomWidth: 2, borderBottomColor: colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === id ? colors.primary : colors.mutedForeground },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Platform.OS === 'web' ? 160 : 140 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.wallIntro, { borderLeftColor: colors.primary }]}>
          <Text style={[styles.wallIntroText, { color: colors.foreground }]}>
            {TAB_DESCRIPTORS[activeTab]}
          </Text>
        </View>

        <View style={[styles.notice, { backgroundColor: colors.secondary }]}>
          <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
          <Text style={[styles.noticeText, { color: colors.mutedForeground }]}>
            Reactions only — this space is moderated and safe.
          </Text>
        </View>

        {feed.map(post => (
          <View
            key={post.id}
            style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.postHeader}>
              <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
                <Ionicons name="person" size={14} color={colors.primary} />
              </View>
              <View style={styles.postMeta}>
                <Text style={[styles.postName, { color: colors.foreground }]}>{post.name}</Text>
                <Text style={[styles.postTime, { color: colors.mutedForeground }]}>{post.timeAgo}</Text>
              </View>
            </View>
            <Text style={[styles.postText, { color: colors.foreground }]}>{post.text}</Text>
            <View style={styles.reactRow}>
              <Pressable
                onPress={() => handleReact(post.id, 'like')}
                style={[
                  styles.reactBtn,
                  post.liked && { backgroundColor: `${colors.primary}15` },
                ]}
              >
                <Ionicons
                  name={post.liked ? 'heart' : 'heart-outline'}
                  size={18}
                  color={post.liked ? colors.primary : colors.mutedForeground}
                />
                <Text style={[styles.reactCount, { color: post.liked ? colors.primary : colors.mutedForeground }]}>
                  {post.likes}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleReact(post.id, 'tick')}
                style={[
                  styles.reactBtn,
                  post.ticked && { backgroundColor: `${colors.accent}15` },
                ]}
              >
                <Ionicons
                  name={post.ticked ? 'checkmark-circle' : 'checkmark-circle-outline'}
                  size={18}
                  color={post.ticked ? colors.accent : colors.mutedForeground}
                />
                <Text style={[styles.reactCount, { color: post.ticked ? colors.accent : colors.mutedForeground }]}>
                  {post.ticks}
                </Text>
              </Pressable>
            </View>
          </View>
        ))}

        <View style={[styles.phase2, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Ionicons name="rocket-outline" size={20} color={colors.primary} />
          <Text style={[styles.phase2Title, { color: colors.foreground }]}>Full community coming soon</Text>
          <Text style={[styles.phase2Desc, { color: colors.mutedForeground }]}>
            Share your own gratitude, I Am statements, and intentions with the Authentic Steps community. Help Seeking spaces and Youth Peer Guides are on the way.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  banner: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    overflow: 'hidden',
    alignItems: 'center',
    gap: 6,
  },
  bannerGlow: {
    backgroundColor: '#fff',
    borderRadius: 0,
  },
  bannerDots: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
    opacity: 0.45,
  },
  bannerDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  bannerQuote: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  bannerSub: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.2,
    marginTop: 4,
    textTransform: 'uppercase',
  },

  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 0, borderBottomWidth: 1, gap: 2 },
  screenTitle: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  screenSubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 10 },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 10 },

  wallIntro: {
    borderLeftWidth: 3,
    paddingLeft: 12,
    paddingVertical: 4,
    marginBottom: 2,
  },
  wallIntroText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },

  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  noticeText: { fontSize: 12, fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 16 },
  postCard: { borderRadius: 14, padding: 14, borderWidth: 1, gap: 10 },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  postMeta: { flex: 1, gap: 1 },
  postName: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  postTime: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  postText: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 22 },
  reactRow: { flexDirection: 'row', gap: 10 },
  reactBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  reactCount: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  phase2: { borderRadius: 14, padding: 18, borderWidth: 1, alignItems: 'center', gap: 8, marginTop: 8 },
  phase2Title: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  phase2Desc: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 18 },
});
