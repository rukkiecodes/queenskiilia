import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { colors, type ColorToken } from '@/constants/colors';
import { COUNTRIES, flagOf } from '@/constants/countries';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useMe } from '@/hooks/use-me';
import { useWithdrawApplication } from '@/hooks/use-project-mutations';
import { useMyApplications, useProject } from '@/hooks/use-projects';
import { useUser } from '@/hooks/use-user';
import { formatBudget, formatDeadline } from '@/lib/format-deadline';
import { GraphQLError } from '@/lib/graphql-client';
import type { Application, Project, ProjectStatus } from '@/lib/projects-api';
import { useUiStore } from '@/store/ui-store';

export default function ProjectDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const showToast = useUiStore((s) => s.showToast);

  const projectQuery = useProject(id);
  const project = projectQuery.data;
  const business = useUser(project?.businessId);
  const { data: me } = useMe();
  const myApps = useMyApplications();
  const withdraw = useWithdrawApplication();

  const myApplication = useMemo<Application | undefined>(
    () =>
      project ? myApps.data?.find((a) => a.projectId === project.id) : undefined,
    [myApps.data, project],
  );

  if (projectQuery.isLoading) {
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

  if (projectQuery.error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <EmptyState
          icon="exclamationmark.triangle"
          title="Could not load project"
          body={
            projectQuery.error instanceof GraphQLError
              ? projectQuery.error.message
              : 'Please try again.'
          }
        />
      </View>
    );
  }

  if (!project) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <EmptyState icon="questionmark.circle" title="Project not found" />
      </View>
    );
  }

  const isMine = !!me && project.selectedStudent === me.id;
  const country = business.data?.country
    ? COUNTRIES.find((c) => c.code === business.data!.country)
    : null;

  const handleWithdraw = async () => {
    if (!myApplication) return;
    try {
      await withdraw.mutateAsync(myApplication.id);
      showToast('Application withdrawn', 'success');
    } catch (err) {
      const msg = err instanceof GraphQLError ? err.message : 'Could not withdraw';
      showToast(msg, 'error');
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerBackTitle: 'Projects', title: '' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: spacing.xxxl,
          gap: spacing.lg,
        }}
        style={{ flex: 1, backgroundColor: colors.canvas }}
        refreshControl={
          <RefreshControl
            refreshing={projectQuery.isFetching}
            onRefresh={() => {
              projectQuery.refetch();
              business.refetch();
              myApps.refetch();
            }}
            tintColor={colors.primary}
          />
        }
      >
        <BusinessHeader
          businessId={project.businessId}
          name={
            business.data?.businessProfile?.companyName ??
            business.data?.fullName ??
            null
          }
          avatarUrl={business.data?.avatarUrl ?? null}
          isVerified={!!business.data?.isVerified}
          countryName={country?.name ?? null}
          countryCode={business.data?.country ?? null}
          loading={business.isLoading}
        />

        <View style={{ gap: spacing.sm }}>
          <ThemedText font={fonts.bold} size="title2" color="ink">
            {project.title}
          </ThemedText>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              flexWrap: 'wrap',
            }}
          >
            <StatusPill status={project.status} />
            <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
              {capitalize(project.skillLevel)} · {formatDeadline(project.deadline)}
            </ThemedText>
          </View>
        </View>

        <View style={{ gap: spacing.xs }}>
          <ThemedText font={fonts.semiBold} size="callout" color="inkMuted48">
            ABOUT THIS PROJECT
          </ThemedText>
          <ThemedText font={fonts.regular} size="body" color="ink" selectable>
            {project.description}
          </ThemedText>
        </View>

        {project.requiredSkills.length > 0 ? (
          <View style={{ gap: spacing.sm }}>
            <ThemedText font={fonts.semiBold} size="callout" color="inkMuted48">
              REQUIRED SKILLS
            </ThemedText>
            <View
              style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}
            >
              {project.requiredSkills.map((skill) => (
                <View
                  key={skill}
                  style={{
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xxs,
                    borderRadius: radius.pill,
                    backgroundColor: colors.canvasParchment,
                  }}
                >
                  <ThemedText font={fonts.regular} size="caption" color="inkMuted80">
                    {skill}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingTop: spacing.base,
            borderTopWidth: 1,
            borderTopColor: colors.dividerSoft,
          }}
        >
          <View>
            <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
              Budget
            </ThemedText>
            <ThemedText font={fonts.semiBold} size="title3" color="ink">
              {formatBudget(project.budget, project.currency)}
            </ThemedText>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
              Deadline
            </ThemedText>
            <ThemedText font={fonts.regular} size="body" color="ink">
              {new Date(project.deadline).toLocaleDateString()}
            </ThemedText>
          </View>
        </View>

        <ActionArea
          project={project}
          isMine={isMine}
          myApplication={myApplication}
          onApply={() =>
            router.push({
              pathname: '/(student)/projects/apply',
              params: { projectId: project.id },
            })
          }
          onWithdraw={handleWithdraw}
          onOpenWorkspace={() =>
            router.push({
              pathname: '/(student)/projects/active/[id]',
              params: { id: project.id },
            })
          }
          withdrawing={withdraw.isPending}
        />
      </ScrollView>
    </>
  );
}

function BusinessHeader({
  businessId,
  name,
  avatarUrl,
  isVerified,
  countryName,
  countryCode,
  loading,
}: {
  businessId: string;
  name: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
  countryName: string | null;
  countryCode: string | null;
  loading: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.base }}>
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
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        ) : (
          <ThemedText font={fonts.semiBold} size="body" color="inkMuted48">
            {(name ?? businessId).slice(0, 1).toUpperCase()}
          </ThemedText>
        )}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xxs }}
        >
          <ThemedText font={fonts.semiBold} size="body" color="ink">
            {loading ? 'Loading…' : name ?? 'Business'}
          </ThemedText>
          {isVerified ? (
            <Image
              source="sf:checkmark.seal.fill"
              tintColor={colors.primary}
              style={{ width: 14, height: 14 }}
            />
          ) : null}
        </View>
        {countryCode || countryName ? (
          <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
            {countryCode ? flagOf(countryCode) : ''} {countryName ?? ''}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

const STATUS_PALETTE: Record<
  ProjectStatus,
  { bg: ColorToken; fg: ColorToken; label: string }
> = {
  open:        { bg: 'primary',         fg: 'onPrimary',  label: 'Open' },
  in_progress: { bg: 'canvasParchment', fg: 'primary',    label: 'In progress' },
  completed:   { bg: 'canvasParchment', fg: 'inkMuted80', label: 'Completed' },
  cancelled:   { bg: 'canvasParchment', fg: 'inkMuted48', label: 'Cancelled' },
};

function StatusPill({ status }: { status: ProjectStatus }) {
  const c = STATUS_PALETTE[status];
  return (
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
  );
}

function ActionArea({
  project,
  isMine,
  myApplication,
  onApply,
  onWithdraw,
  onOpenWorkspace,
  withdrawing,
}: {
  project: Project;
  isMine: boolean;
  myApplication: Application | undefined;
  onApply: () => void;
  onWithdraw: () => void;
  onOpenWorkspace: () => void;
  withdrawing: boolean;
}) {
  if (project.status === 'in_progress' && isMine) {
    return (
      <Button label="Open project workspace" onPress={onOpenWorkspace} fullWidth />
    );
  }

  if (myApplication) {
    return (
      <View style={{ gap: spacing.sm }}>
        <ApplicationStatusChip status={myApplication.status} />
        {myApplication.status === 'pending' ? (
          <Pressable onPress={onWithdraw} disabled={withdrawing} hitSlop={8}>
            <ThemedText
              font={fonts.regular}
              size="callout"
              color={withdrawing ? 'inkMuted48' : 'danger'}
              style={{ textAlign: 'center' }}
            >
              {withdrawing ? 'Withdrawing…' : 'Withdraw application'}
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
    );
  }

  if (project.status !== 'open') {
    return <Button label="Applications closed" disabled fullWidth />;
  }

  return <Button label="Apply" onPress={onApply} fullWidth />;
}

function ApplicationStatusChip({ status }: { status: Application['status'] }) {
  const palette: Record<
    Application['status'],
    { bg: ColorToken; fg: ColorToken; label: string }
  > = {
    pending:   { bg: 'canvasParchment', fg: 'primary',    label: 'Application pending' },
    accepted:  { bg: 'primary',         fg: 'onPrimary',  label: 'Application accepted' },
    rejected:  { bg: 'danger',          fg: 'onPrimary',  label: 'Application rejected' },
    withdrawn: { bg: 'canvasParchment', fg: 'inkMuted80', label: 'Application withdrawn' },
  };
  const c = palette[status];
  return (
    <View
      style={{
        paddingHorizontal: spacing.base,
        paddingVertical: spacing.sm,
        borderRadius: radius.lg,
        backgroundColor: colors[c.bg],
        alignItems: 'center',
      }}
    >
      <ThemedText font={fonts.semiBold} size="callout" color={c.fg}>
        {c.label}
      </ThemedText>
    </View>
  );
}

function capitalize(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}
