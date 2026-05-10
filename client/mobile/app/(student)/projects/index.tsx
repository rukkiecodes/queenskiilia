import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';

import { ProjectCard } from '@/components/cards/project-card';
import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useDebounce } from '@/hooks/use-debounce';
import { useProjects } from '@/hooks/use-projects';
import { formatBudget } from '@/lib/format-deadline';
import { GraphQLError } from '@/lib/graphql-client';
import type { Project, SkillLevel, SortBy } from '@/lib/projects-api';
import { useProjectFiltersStore } from '@/store/project-filters-store';

const SKILL_LEVELS: { value: SkillLevel; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
];

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'latest', label: 'Latest' },
  { value: 'budget_high', label: 'Budget: high to low' },
  { value: 'budget_low', label: 'Budget: low to high' },
  { value: 'deadline_soon', label: 'Deadline soonest' },
];

export default function StudentProjects() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  const skillLevel = useProjectFiltersStore((s) => s.skillLevel);
  const budgetMin = useProjectFiltersStore((s) => s.budgetMin);
  const budgetMax = useProjectFiltersStore((s) => s.budgetMax);
  const sortBy = useProjectFiltersStore((s) => s.sortBy);
  const setSkillLevel = useProjectFiltersStore((s) => s.setSkillLevel);
  const setSortBy = useProjectFiltersStore((s) => s.setSortBy);

  const {
    data,
    isFetching,
    isFetchingNextPage,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = useProjects({
    status: 'open',
    search: debouncedSearch || undefined,
    skillLevel: skillLevel ?? undefined,
    budgetMin: budgetMin ?? undefined,
    budgetMax: budgetMax ?? undefined,
    sortBy,
  });

  const projects = useMemo<Project[]>(() => data?.pages.flat() ?? [], [data]);

  const sortLabel =
    SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? 'Latest';

  const budgetLabel = useMemo(() => {
    if (budgetMin == null && budgetMax == null) return null;
    const min = budgetMin != null ? formatBudget(budgetMin) : 'Any';
    const max = budgetMax != null ? formatBudget(budgetMax) : 'Any';
    return `${min} – ${max}`;
  }, [budgetMin, budgetMax]);

  const openSortMenu = () => {
    if (Platform.OS === 'ios') {
      const labels = SORT_OPTIONS.map((o) => o.label);
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', ...labels],
          cancelButtonIndex: 0,
          title: 'Sort by',
        },
        (i) => {
          if (i > 0) setSortBy(SORT_OPTIONS[i - 1].value);
        },
      );
    } else {
      Alert.alert('Sort by', undefined, [
        ...SORT_OPTIONS.map((o) => ({
          text: o.label,
          onPress: () => setSortBy(o.value),
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ]);
    }
  };

  const openSkillLevelMenu = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'All levels', ...SKILL_LEVELS.map((s) => s.label)],
          cancelButtonIndex: 0,
          title: 'Skill level',
        },
        (i) => {
          if (i === 1) setSkillLevel(null);
          else if (i > 1) setSkillLevel(SKILL_LEVELS[i - 2].value);
        },
      );
    } else {
      Alert.alert('Skill level', undefined, [
        { text: 'All levels', onPress: () => setSkillLevel(null) },
        ...SKILL_LEVELS.map((s) => ({
          text: s.label,
          onPress: () => setSkillLevel(s.value),
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ]);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerSearchBarOptions: {
            placeholder: 'Search projects',
            onChangeText: (event) => setSearchInput(event.nativeEvent.text),
            hideWhenScrolling: false,
          },
        }}
      />
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        data={projects}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.xxxl,
          gap: spacing.base,
          flexGrow: 1,
        }}
        style={{ flex: 1, backgroundColor: colors.canvas }}
        ListHeaderComponent={
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.xs, paddingVertical: spacing.sm }}
          >
            <FilterChip
              label={skillLevel ? labelFor(skillLevel) : 'All levels'}
              active={skillLevel != null}
              onPress={openSkillLevelMenu}
            />
            <FilterChip
              label={budgetLabel ?? 'Budget'}
              active={budgetMin != null || budgetMax != null}
              onPress={() => router.push('/(student)/projects/budget-filter')}
            />
            <FilterChip
              label={`Sort: ${sortLabel}`}
              active={sortBy !== 'latest'}
              onPress={openSortMenu}
            />
          </ScrollView>
        }
        renderItem={({ item }) => (
          <ProjectCard
            project={item}
            onPress={() =>
              router.push({
                pathname: '/(student)/projects/[id]',
                params: { id: item.id },
              })
            }
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isFetchingNextPage}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.6}
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
              icon="briefcase"
              title="No projects match"
              body={
                debouncedSearch || skillLevel || budgetMin != null || budgetMax != null
                  ? 'Try clearing some filters or a different search term.'
                  : 'New projects show up here as businesses post them. Pull to refresh.'
              }
            />
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={{ paddingVertical: spacing.lg, alignItems: 'center' }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : !hasNextPage && projects.length > 0 ? (
            <ThemedText
              font={fonts.regular}
              size="caption"
              color="inkMuted48"
              style={{ textAlign: 'center', paddingVertical: spacing.lg }}
            >
              That’s everything for now.
            </ThemedText>
          ) : null
        }
      />
    </>
  );
}

function labelFor(level: SkillLevel): string {
  return SKILL_LEVELS.find((s) => s.value === level)?.label ?? level;
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: spacing.base,
        paddingVertical: spacing.sm,
        borderRadius: radius.pill,
        backgroundColor: active ? colors.primary : colors.canvasParchment,
        transform: [{ scale: pressed ? 0.96 : 1 }],
      })}
    >
      <ThemedText
        font={fonts.regular}
        size="caption"
        color={active ? 'onPrimary' : 'ink'}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}
