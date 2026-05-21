import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';

import { SectionHeader } from '@/components/dashboard/section-header';
import { StatTile } from '@/components/dashboard/stat-tile';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useMe } from '@/hooks/use-me';
import { useMyEscrows } from '@/hooks/use-payments';
import { useMyProjects, useProjectApplications } from '@/hooks/use-projects';
import { useRefreshOnFocus } from '@/hooks/use-refresh-on-focus';
import { useTalentSearch } from '@/hooks/use-talent-search';
import { formatBudget } from '@/lib/format-deadline';
import type { Project } from '@/lib/projects-api';

const ACTIVE_PREVIEW = 3;
const TALENT_PREVIEW = 3;

export default function BusinessDashboard() {
  const router = useRouter();
  const me = useMe();
  const mine = useMyProjects();
  const escrows = useMyEscrows();
  const talent = useTalentSearch();

  const refetchAll = useCallback(() => {
    me.refetch();
    mine.refetch();
    escrows.refetch();
    talent.refetch();
  }, [me, mine, escrows, talent]);

  useRefreshOnFocus(refetchAll);

  const profile = me.data?.businessProfile;
  const projects = mine.data ?? [];
  const activeProjects = projects.filter(
    (p) => p.status === 'open' || p.status === 'in_progress',
  );
  const totalSpent = (escrows.data ?? [])
    .filter((e) => e.status === 'released')
    .reduce((sum, e) => sum + e.amount, 0);
  const suggestedTalent = (talent.data?.pages[0] ?? []).slice(0, TALENT_PREVIEW);

  if (me.isLoading) {
    return (
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
    );
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        padding: spacing.xl,
        gap: spacing.xl,
        paddingBottom: spacing.xxxl,
      }}
      style={{ flex: 1, backgroundColor: colors.canvas }}
      refreshControl={
        <RefreshControl
          refreshing={me.isFetching && !me.isLoading}
          onRefresh={refetchAll}
          tintColor={colors.primary}
        />
      }
    >
      <View style={{ gap: 2 }}>
        <ThemedText font={fonts.regular} size="callout" color="inkMuted48">
          Welcome back
        </ThemedText>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}
        >
          <ThemedText
            font={fonts.semiBold}
            size="title3"
            color="ink"
            numberOfLines={1}
            style={{ flexShrink: 1 }}
          >
            {profile?.companyName ?? me.data?.fullName ?? 'Your business'}
          </ThemedText>
          {me.data?.isVerified ? (
            <Image
              source="sf:checkmark.seal.fill"
              tintColor={colors.primary}
              style={{ width: 18, height: 18 }}
            />
          ) : null}
        </View>
      </View>

      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <StatTile label="Posted" value={String(projects.length)} />
          <StatTile label="Active" value={String(activeProjects.length)} />
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <StatTile label="Total spent" value={formatBudget(totalSpent)} />
          <StatTile
            label="Avg rating"
            value={
              profile?.averageRating != null
                ? `★ ${profile.averageRating.toFixed(1)}`
                : '—'
            }
          />
        </View>
      </View>

      <Button
        label="Post a project"
        onPress={() => router.push('/(business)/projects/create')}
        fullWidth
      />

      <View style={{ gap: spacing.md }}>
        <SectionHeader
          title="Active projects"
          actionLabel="See all"
          onAction={() => router.push('/(business)/projects')}
        />
        {activeProjects.length > 0 ? (
          activeProjects.slice(0, ACTIVE_PREVIEW).map((project) => (
            <ActiveProjectRow
              key={project.id}
              project={project}
              onPress={() =>
                router.push({
                  pathname: '/(shared)/applicants/[projectId]',
                  params: { projectId: project.id },
                })
              }
            />
          ))
        ) : (
          <EmptyLine text="No active projects. Post one to start hiring." />
        )}
      </View>

      <View style={{ gap: spacing.md }}>
        <SectionHeader
          title="Talent suggestions"
          actionLabel="See all"
          onAction={() => router.push('/(business)/talent')}
        />
        {suggestedTalent.length > 0 ? (
          suggestedTalent.map((student) => (
            <Pressable
              key={student.id}
              onPress={() =>
                router.push({
                  pathname: '/(shared)/profile/[id]',
                  params: { id: student.id },
                })
              }
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.base,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                borderRadius: radius.lg,
                borderCurve: 'continuous',
                borderWidth: 1,
                borderColor: colors.hairline,
                backgroundColor: colors.canvas,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: colors.canvasParchment,
                  overflow: 'hidden',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {student.avatarUrl ? (
                  <Image
                    source={{ uri: student.avatarUrl }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                  />
                ) : (
                  <ThemedText
                    font={fonts.semiBold}
                    size="body"
                    color="inkMuted48"
                  >
                    {(student.fullName ?? student.email)
                      .slice(0, 1)
                      .toUpperCase()}
                  </ThemedText>
                )}
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <ThemedText
                  font={fonts.semiBold}
                  size="body"
                  color="ink"
                  numberOfLines={1}
                >
                  {student.fullName ?? 'Student'}
                </ThemedText>
                <ThemedText
                  font={fonts.regular}
                  size="caption"
                  color="inkMuted48"
                  numberOfLines={1}
                >
                  {[
                    capitalize(student.studentProfile?.skillLevel),
                    student.studentProfile?.averageRating != null
                      ? `★ ${student.studentProfile.averageRating.toFixed(1)}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join('  ·  ') || 'New talent'}
                </ThemedText>
              </View>
              <Image
                source="sf:chevron.right"
                tintColor={colors.inkMuted48}
                style={{ width: 13, height: 13 }}
              />
            </Pressable>
          ))
        ) : (
          <EmptyLine text="No talent to suggest yet." />
        )}
      </View>
    </ScrollView>
  );
}

function capitalize(value: string | null | undefined): string | null {
  if (!value) return null;
  return value[0].toUpperCase() + value.slice(1);
}

function EmptyLine({ text }: { text: string }) {
  return (
    <ThemedText font={fonts.regular} size="callout" color="inkMuted48">
      {text}
    </ThemedText>
  );
}

function ActiveProjectRow({
  project,
  onPress,
}: {
  project: Project;
  onPress: () => void;
}) {
  const applications = useProjectApplications(project.id);
  const pendingCount = (applications.data ?? []).filter(
    (a) => a.status === 'pending',
  ).length;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: colors.hairline,
        backgroundColor: colors.canvas,
        padding: spacing.lg,
        gap: spacing.xs,
        transform: [{ scale: pressed ? 0.99 : 1 }],
      })}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: spacing.sm,
        }}
      >
        <ThemedText
          font={fonts.semiBold}
          size="body"
          color="ink"
          numberOfLines={1}
          style={{ flex: 1 }}
        >
          {project.title}
        </ThemedText>
        <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
          {project.status === 'open' ? 'Open' : 'In progress'}
        </ThemedText>
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <ThemedText font={fonts.semiBold} size="callout" color="ink">
          {formatBudget(project.budget, project.currency)}
        </ThemedText>
        <ThemedText font={fonts.regular} size="caption" color="primary">
          {applications.isLoading
            ? '…'
            : `${pendingCount} ${pendingCount === 1 ? 'applicant' : 'applicants'}`}
        </ThemedText>
      </View>
    </Pressable>
  );
}
