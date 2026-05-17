import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  View,
} from 'react-native';

import { EscrowCard } from '@/components/cards/escrow-card';
import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useMyEscrows, useReleaseFunds } from '@/hooks/use-payments';
import { useMyProjects } from '@/hooks/use-projects';
import { GraphQLError } from '@/lib/graphql-client';
import type { EscrowAccount, EscrowStatus } from '@/lib/payments-api';
import { useUiStore } from '@/store/ui-store';

type Filter = 'all' | EscrowStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'held', label: 'Held' },
  { value: 'released', label: 'Released' },
  { value: 'refunded', label: 'Refunded' },
];

export default function BusinessPayments() {
  const showToast = useUiStore((s) => s.showToast);
  const escrows = useMyEscrows();
  const projects = useMyProjects();
  const release = useReleaseFunds();

  const [filter, setFilter] = useState<Filter>('all');

  // Build a projectId → title lookup so cards can show real project names
  const titleByProject = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of projects.data ?? []) m.set(p.id, p.title);
    return m;
  }, [projects.data]);

  const filtered = useMemo<EscrowAccount[]>(() => {
    const all = escrows.data ?? [];
    return filter === 'all' ? all : all.filter((e) => e.status === filter);
  }, [escrows.data, filter]);

  const handleRelease = async (projectId: string) => {
    try {
      await release.mutateAsync(projectId);
      showToast('Funds released to student', 'success');
    } catch (err) {
      const msg =
        err instanceof GraphQLError ? err.message : 'Could not release funds';
      showToast(msg, 'error');
    }
  };

  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      data={filtered}
      keyExtractor={(e) => e.id}
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
        <EscrowCard
          escrow={item}
          projectTitle={titleByProject.get(item.projectId) ?? null}
          onRelease={() => handleRelease(item.projectId)}
          releasing={release.isPending && release.variables === item.projectId}
        />
      )}
      refreshControl={
        <RefreshControl
          refreshing={escrows.isFetching || projects.isFetching}
          onRefresh={() => {
            escrows.refetch();
            projects.refetch();
          }}
          tintColor={colors.primary}
        />
      }
      ListEmptyComponent={
        escrows.isLoading ? (
          <View style={{ paddingVertical: spacing.xxxl, alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : escrows.error ? (
          <EmptyState
            icon="exclamationmark.triangle"
            title="Could not load escrows"
            body={
              escrows.error instanceof GraphQLError
                ? escrows.error.message
                : 'Pull to retry.'
            }
          />
        ) : (
          <EmptyState
            icon="creditcard"
            title={filter === 'all' ? 'No escrows yet' : 'Nothing here'}
            body={
              filter === 'all'
                ? 'Once you select a student and fund the escrow, it will appear here.'
                : 'Switch filters to see escrows in other states.'
            }
          />
        )
      }
    />
  );
}
