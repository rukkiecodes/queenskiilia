import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';

import { UserCard } from '@/components/cards/user-card';
import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { colors } from '@/constants/colors';
import { COUNTRIES, flagOf } from '@/constants/countries';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useDebounce } from '@/hooks/use-debounce';
import { useTalentSearch } from '@/hooks/use-talent-search';
import { GraphQLError } from '@/lib/graphql-client';
import type { PublicUser } from '@/lib/profile-api';
import { useTalentFiltersStore } from '@/store/talent-filters-store';

export default function BusinessTalent() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  const skillLevel = useTalentFiltersStore((s) => s.skillLevel);
  const country = useTalentFiltersStore((s) => s.country);
  const minRating = useTalentFiltersStore((s) => s.minRating);
  const setSkillLevel = useTalentFiltersStore((s) => s.setSkillLevel);
  const setCountry = useTalentFiltersStore((s) => s.setCountry);
  const setMinRating = useTalentFiltersStore((s) => s.setMinRating);

  const {
    data,
    isFetching,
    isFetchingNextPage,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = useTalentSearch({
    search: debouncedSearch || undefined,
    skillLevel: skillLevel ?? undefined,
    country: country ?? undefined,
    minRating: minRating ?? undefined,
  });

  const users = useMemo<PublicUser[]>(() => data?.pages.flat() ?? [], [data]);

  const countryName = country
    ? COUNTRIES.find((c) => c.code === country)?.name
    : null;

  const activeFilters: { label: string; clear: () => void }[] = [];
  if (skillLevel) {
    activeFilters.push({
      label: skillLevel[0].toUpperCase() + skillLevel.slice(1),
      clear: () => setSkillLevel(null),
    });
  }
  if (country) {
    activeFilters.push({
      label: `${flagOf(country)} ${countryName ?? country}`,
      clear: () => setCountry(null),
    });
  }
  if (minRating != null) {
    activeFilters.push({
      label: `★ ${minRating.toFixed(1)}+`,
      clear: () => setMinRating(null),
    });
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerSearchBarOptions: {
            placeholder: 'Name or skill',
            onChangeText: (event) => setSearchInput(event.nativeEvent.text),
            hideWhenScrolling: false,
          },
        }}
      />
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        data={users}
        keyExtractor={(u) => u.id}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.xxxl,
          gap: spacing.sm,
          flexGrow: 1,
        }}
        style={{ flex: 1, backgroundColor: colors.canvas }}
        ListHeaderComponent={
          activeFilters.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                gap: spacing.xs,
                paddingVertical: spacing.sm,
              }}
            >
              {activeFilters.map((f) => (
                <Pressable
                  key={f.label}
                  onPress={f.clear}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.xxs,
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.sm,
                    borderRadius: radius.pill,
                    backgroundColor: colors.primary,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <ThemedText font={fonts.regular} size="caption" color="onPrimary">
                    {f.label} ✕
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          ) : null
        }
        renderItem={({ item }) => (
          <UserCard
            user={item}
            onPress={() =>
              router.push({
                pathname: '/(shared)/portfolio/student/[studentId]',
                params: { studentId: item.id },
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
              title="Could not load talent"
              body={
                error instanceof GraphQLError ? error.message : 'Pull to retry.'
              }
            />
          ) : (
            <EmptyState
              icon="person.2"
              title="No students match"
              body={
                debouncedSearch || activeFilters.length > 0
                  ? 'Try a different search or clear some filters.'
                  : 'Students who have signed up will appear here.'
              }
            />
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={{ paddingVertical: spacing.lg, alignItems: 'center' }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : !hasNextPage && users.length > 0 ? (
            <ThemedText
              font={fonts.regular}
              size="caption"
              color="inkMuted48"
              style={{ textAlign: 'center', paddingVertical: spacing.lg }}
            >
              That’s everyone matching.
            </ThemedText>
          ) : null
        }
      />
    </>
  );
}
