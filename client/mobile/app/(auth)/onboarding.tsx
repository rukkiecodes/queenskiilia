import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';

type Slide = { title: string; body: string };

const SLIDES: Slide[] = [
  {
    title: 'Find skilled student talent',
    body: 'Businesses post real projects. Students earn while they learn.',
  },
  {
    title: 'Build a verified portfolio',
    body: 'Every completed project becomes a portfolio entry — reviewed and rated.',
  },
  {
    title: 'Get paid, safely',
    body: 'Escrow protects both sides. No payment until the work is approved.',
  },
];

export default function Onboarding() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  const next = () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      router.replace('/(auth)/account-type');
    }
  };

  const skip = () => router.replace('/(auth)/account-type');

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={{ alignItems: 'flex-end', padding: spacing.base }}>
        <Pressable onPress={skip} hitSlop={12}>
          <ThemedText font={fonts.regular} size="callout" color="inkMuted48">
            Skip
          </ThemedText>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={{ width, paddingHorizontal: spacing.xl, justifyContent: 'center' }}>
            <ThemedText
              font={fonts.bold}
              size="title2"
              color="ink"
              style={{ marginBottom: spacing.base }}
            >
              {item.title}
            </ThemedText>
            <ThemedText font={fonts.regular} size="headline" color="inkMuted48">
              {item.body}
            </ThemedText>
          </View>
        )}
      />

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          gap: spacing.sm,
          marginBottom: spacing.xl,
        }}
      >
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={{
              width: i === index ? 20 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: i === index ? colors.primary : colors.hairline,
            }}
          />
        ))}
      </View>

      <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl }}>
        <Button
          label={index === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          onPress={next}
          fullWidth
        />
      </View>
    </View>
  );
}
