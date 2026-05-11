import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  View,
} from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { colors, type ColorToken } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useActiveSession, useMyAssessments } from '@/hooks/use-assessments';
import { GraphQLError } from '@/lib/graphql-client';
import type { SkillAssessment, SkillLevel } from '@/lib/skills-api';

export default function SkillTestIndex() {
  const router = useRouter();
  const assessments = useMyAssessments();
  const active = useActiveSession();

  const hasActive = !!active.data;

  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      data={assessments.data ?? []}
      keyExtractor={(a) => a.id}
      contentContainerStyle={{
        padding: spacing.xl,
        paddingBottom: spacing.xxxl,
        gap: spacing.sm,
        flexGrow: 1,
      }}
      style={{ flex: 1, backgroundColor: colors.canvas }}
      ListHeaderComponent={
        <View style={{ gap: spacing.lg, paddingBottom: spacing.lg }}>
          <View style={{ gap: spacing.xs }}>
            <ThemedText font={fonts.bold} size="title2" color="ink">
              Skill assessments
            </ThemedText>
            <ThemedText font={fonts.regular} size="body" color="inkMuted48">
              Earn level badges per category. Higher levels unlock higher-budget projects.
            </ThemedText>
          </View>

          {hasActive ? (
            <ActiveSessionCard
              category={active.data!.category}
              expiresAt={active.data!.expiresAt}
              onResume={() => router.push('/(student)/skill-test/session')}
            />
          ) : (
            <Button
              label="Start a new assessment"
              onPress={() => router.push('/(student)/skill-test/start')}
              fullWidth
            />
          )}

          {(assessments.data?.length ?? 0) > 0 ? (
            <ThemedText font={fonts.semiBold} size="callout" color="inkMuted48">
              HISTORY
            </ThemedText>
          ) : null}
        </View>
      }
      renderItem={({ item }) => <AssessmentRow assessment={item} />}
      refreshControl={
        <RefreshControl
          refreshing={assessments.isFetching || active.isFetching}
          onRefresh={() => {
            assessments.refetch();
            active.refetch();
          }}
          tintColor={colors.primary}
        />
      }
      ListEmptyComponent={
        assessments.isLoading ? (
          <View style={{ paddingVertical: spacing.xxxl, alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : assessments.error ? (
          <EmptyState
            icon="exclamationmark.triangle"
            title="Could not load history"
            body={
              assessments.error instanceof GraphQLError
                ? assessments.error.message
                : 'Pull to retry.'
            }
          />
        ) : (
          <EmptyState
            icon="checkmark.seal"
            title="No badges yet"
            body="Complete an assessment to earn your first level badge."
          />
        )
      }
    />
  );
}

function ActiveSessionCard({
  category,
  expiresAt,
  onResume,
}: {
  category: string;
  expiresAt: string;
  onResume: () => void;
}) {
  const minutesLeft = Math.max(
    0,
    Math.floor((new Date(expiresAt).getTime() - Date.now()) / 60000),
  );
  return (
    <Pressable
      onPress={onResume}
      style={({ pressed }) => ({
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        borderWidth: 2,
        borderColor: colors.primary,
        backgroundColor: colors.canvas,
        padding: spacing.lg,
        gap: spacing.xs,
        transform: [{ scale: pressed ? 0.99 : 1 }],
      })}
    >
      <ThemedText font={fonts.semiBold} size="caption" color="primary">
        ACTIVE ASSESSMENT
      </ThemedText>
      <ThemedText font={fonts.semiBold} size="headline" color="ink">
        {category}
      </ThemedText>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: spacing.xs,
        }}
      >
        <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
          {minutesLeft} minute{minutesLeft === 1 ? '' : 's'} left
        </ThemedText>
        <ThemedText font={fonts.regular} size="caption" color="primary">
          Resume →
        </ThemedText>
      </View>
    </Pressable>
  );
}

const LEVEL_PALETTE: Record<
  SkillLevel,
  { bg: ColorToken; fg: ColorToken; label: string }
> = {
  beginner:     { bg: 'canvasParchment', fg: 'inkMuted80', label: 'Beginner' },
  intermediate: { bg: 'canvasParchment', fg: 'primary',    label: 'Intermediate' },
  advanced:     { bg: 'primary',         fg: 'onPrimary',  label: 'Advanced' },
  expert:       { bg: 'primary',         fg: 'onPrimary',  label: 'Expert' },
};

function AssessmentRow({ assessment }: { assessment: SkillAssessment }) {
  const c = LEVEL_PALETTE[assessment.level];
  return (
    <View
      style={{
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: colors.hairline,
        backgroundColor: colors.canvas,
        padding: spacing.lg,
        gap: spacing.xs,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <ThemedText
          font={fonts.semiBold}
          size="body"
          color="ink"
          style={{ flex: 1, marginRight: spacing.sm }}
          numberOfLines={1}
        >
          {assessment.category}
        </ThemedText>
        <View
          style={{
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xxs,
            borderRadius: radius.pill,
            backgroundColor: colors[c.bg],
          }}
        >
          <ThemedText font={fonts.regular} size="caption" color={c.fg}>
            {c.label}
          </ThemedText>
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
          {assessment.score != null ? `${assessment.score}/10` : '—'} ·{' '}
          {new Date(assessment.completedAt).toLocaleDateString()}
        </ThemedText>
      </View>
    </View>
  );
}
