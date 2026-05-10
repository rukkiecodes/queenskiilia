import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  View,
} from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';

import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { colors, type ColorToken } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useCancelProject } from '@/hooks/use-project-mutations';
import { useMyProjects } from '@/hooks/use-projects';
import { formatBudget, formatDeadline } from '@/lib/format-deadline';
import { GraphQLError } from '@/lib/graphql-client';
import type { Project, ProjectStatus } from '@/lib/projects-api';
import { useUiStore } from '@/store/ui-store';

type Filter = 'all' | ProjectStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
];

export default function BusinessProjects() {
  const router = useRouter();
  const showToast = useUiStore((s) => s.showToast);
  const { data, isLoading, isFetching, error, refetch } = useMyProjects();
  const cancel = useCancelProject();

  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo<Project[]>(() => {
    const all = data ?? [];
    return filter === 'all' ? all : all.filter((p) => p.status === filter);
  }, [data, filter]);

  const askCancel = (project: Project) => {
    Alert.alert(
      'Cancel project?',
      `"${project.title}" will be marked as cancelled. Students will no longer be able to apply, and pending applications will be closed.`,
      [
        { text: 'Keep it open', style: 'cancel' },
        {
          text: 'Cancel project',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancel.mutateAsync(project.id);
              showToast('Project cancelled', 'success');
            } catch (err) {
              const msg =
                err instanceof GraphQLError ? err.message : 'Could not cancel';
              showToast(msg, 'error');
            }
          },
        },
      ],
    );
  };

  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      data={filtered}
      keyExtractor={(p) => p.id}
      contentContainerStyle={{
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.xxxl,
        gap: spacing.sm,
        flexGrow: 1,
      }}
      style={{ flex: 1, backgroundColor: colors.canvas }}
      ListHeaderComponent={
        <View style={{ paddingVertical: spacing.sm, gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {FILTERS.map((f) => (
              <Pressable
                key={f.value}
                onPress={() => setFilter(f.value)}
                style={({ pressed }) => ({
                  paddingHorizontal: spacing.base,
                  paddingVertical: spacing.sm,
                  borderRadius: radius.pill,
                  backgroundColor:
                    filter === f.value ? colors.primary : colors.canvasParchment,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                })}
              >
                <ThemedText
                  font={fonts.regular}
                  size="caption"
                  color={filter === f.value ? 'onPrimary' : 'ink'}
                >
                  {f.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <BusinessProjectRow
          project={item}
          onPress={() =>
            router.push({
              pathname: '/(shared)/applicants/[projectId]',
              params: { projectId: item.id },
            })
          }
          onCancel={() => askCancel(item)}
          isCancelling={cancel.isPending && cancel.variables === item.id}
        />
      )}
      refreshControl={
        <RefreshControl
          refreshing={isFetching}
          onRefresh={refetch}
          tintColor={colors.primary}
        />
      }
      ListEmptyComponent={
        isLoading ? (
          <View style={{ paddingVertical: spacing.xxxl, alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : error ? (
          <EmptyState
            icon="exclamationmark.triangle"
            title="Could not load projects"
            body={error instanceof GraphQLError ? error.message : 'Pull to retry.'}
          />
        ) : (
          <EmptyState
            icon="square.and.pencil"
            title={filter === 'all' ? 'No projects yet' : 'Nothing here'}
            body={
              filter === 'all'
                ? 'Post your first project to start receiving applications from students.'
                : 'Switch filters or post a new project.'
            }
            cta={
              filter === 'all' ? (
                <Button
                  label="Post a project"
                  onPress={() => router.push('/(business)/projects/create')}
                />
              ) : null
            }
          />
        )
      }
    />
  );
}

function BusinessProjectRow({
  project,
  onPress,
  onCancel,
  isCancelling,
}: {
  project: Project;
  onPress: () => void;
  onCancel: () => void;
  isCancelling: boolean;
}) {
  const swipeRef = useRef<SwipeableMethods>(null);
  const canCancel = project.status === 'open';

  const renderRight = () => (
    <Pressable
      onPress={() => {
        swipeRef.current?.close();
        onCancel();
      }}
      style={({ pressed }) => ({
        backgroundColor: colors.danger,
        justifyContent: 'center',
        alignItems: 'center',
        width: 96,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        marginLeft: spacing.xs,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <ThemedText font={fonts.semiBold} size="callout" color="onPrimary">
        {isCancelling ? '…' : 'Cancel'}
      </ThemedText>
    </Pressable>
  );

  const Row = (
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
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <ThemedText
          font={fonts.semiBold}
          size="body"
          color="ink"
          style={{ flex: 1, marginRight: spacing.sm }}
          numberOfLines={1}
        >
          {project.title}
        </ThemedText>
        <StatusChip status={project.status} />
      </View>
      <ThemedText font={fonts.regular} size="caption" color="inkMuted48" numberOfLines={1}>
        {project.description}
      </ThemedText>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <ThemedText font={fonts.semiBold} size="callout" color="ink">
          {formatBudget(project.budget, project.currency)}
        </ThemedText>
        <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
          {formatDeadline(project.deadline)}
        </ThemedText>
      </View>
    </Pressable>
  );

  if (!canCancel) return Row;

  return (
    <ReanimatedSwipeable
      ref={swipeRef}
      friction={2}
      rightThreshold={48}
      renderRightActions={renderRight}
      overshootRight={false}
    >
      {Row}
    </ReanimatedSwipeable>
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

function StatusChip({ status }: { status: ProjectStatus }) {
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
