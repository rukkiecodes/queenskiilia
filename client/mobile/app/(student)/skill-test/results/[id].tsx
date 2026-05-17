import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { colors, type ColorToken } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useAssessment } from '@/hooks/use-assessments';
import { GraphQLError } from '@/lib/graphql-client';
import type { SkillLevel } from '@/lib/skills-api';

const BADGE_SIZE = 140;

type Tone = { bg: ColorToken; fg: ColorToken; label: string };

const LEVEL: Record<SkillLevel, Tone> = {
  beginner:     { bg: 'canvasParchment', fg: 'inkMuted80', label: 'Beginner' },
  intermediate: { bg: 'canvasParchment', fg: 'primary',    label: 'Intermediate' },
  advanced:     { bg: 'primary',         fg: 'onPrimary',  label: 'Advanced' },
  expert:       { bg: 'primary',         fg: 'onPrimary',  label: 'Expert' },
};

export default function Results() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error } = useAssessment(id);

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Results', presentation: 'modal' }} />
        <View
          style={{
            flex: 1,
            backgroundColor: colors.canvas,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ActivityIndicator color={colors.primary} />
        </View>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <Stack.Screen options={{ title: 'Results', presentation: 'modal' }} />
        <View style={{ flex: 1, backgroundColor: colors.canvas }}>
          <EmptyState
            icon="questionmark.circle"
            title="Could not load result"
            body={
              error instanceof GraphQLError
                ? error.message
                : 'Please try again.'
            }
            cta={
              <Button
                label="Done"
                onPress={() => router.replace('/(student)/skill-test')}
              />
            }
          />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Results', presentation: 'modal' }} />
      <View
        style={{
          flex: 1,
          backgroundColor: colors.canvas,
          padding: spacing.xl,
          paddingBottom: spacing.xxxl,
          gap: spacing.lg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <BadgeReveal level={data.level} />

        <View style={{ gap: spacing.xs, alignItems: 'center' }}>
          <ThemedText
            font={fonts.semiBold}
            size="caption"
            color="inkMuted48"
          >
            {LEVEL[data.level].label.toUpperCase()} BADGE EARNED
          </ThemedText>
          <ThemedText
            font={fonts.bold}
            size="title2"
            color="ink"
            style={{ textAlign: 'center' }}
          >
            {data.category}
          </ThemedText>
        </View>

        <View
          style={{
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.lg,
            borderRadius: radius.lg,
            backgroundColor: colors.canvasParchment,
            alignItems: 'center',
            gap: spacing.xxs,
          }}
        >
          <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
            Score
          </ThemedText>
          <ThemedText
            font={fonts.bold}
            size="title1"
            color="ink"
            style={{ fontVariant: ['tabular-nums'] as never }}
          >
            {data.score ?? 0}
            <ThemedText font={fonts.regular} size="title3" color="inkMuted48">
              {' '}/ 10
            </ThemedText>
          </ThemedText>
        </View>

        <View style={{ flex: 1 }} />

        <Button
          label="Done"
          onPress={() => router.replace('/(student)/skill-test')}
          fullWidth
        />
      </View>
    </>
  );
}

function BadgeReveal({ level }: { level: SkillLevel }) {
  const tone = LEVEL[level];
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);
  const sealScale = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });
    scale.value = withSpring(1, { damping: 12, stiffness: 180, mass: 0.7 });
    sealScale.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.back(1.4)),
    });
  }, [opacity, scale, sealScale]);

  const wrapperStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const sealStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sealScale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: BADGE_SIZE,
          height: BADGE_SIZE,
          borderRadius: BADGE_SIZE / 2,
          backgroundColor: colors[tone.bg],
          alignItems: 'center',
          justifyContent: 'center',
        },
        wrapperStyle,
      ]}
    >
      <Animated.View style={sealStyle}>
        <Image
          source="sf:checkmark.seal.fill"
          tintColor={colors[tone.fg]}
          style={{ width: 72, height: 72 }}
        />
      </Animated.View>
    </Animated.View>
  );
}
