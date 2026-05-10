import { Stack, useRouter } from 'expo-router';
import { useRef } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';

import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { colors, type ColorToken } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useWithdrawApplication } from '@/hooks/use-project-mutations';
import { useMyApplications } from '@/hooks/use-projects';
import { GraphQLError } from '@/lib/graphql-client';
import type { Application } from '@/lib/projects-api';
import { useUiStore } from '@/store/ui-store';

export default function Applications() {
  const router = useRouter();
  const showToast = useUiStore((s) => s.showToast);
  const { data, isLoading, isFetching, error, refetch } = useMyApplications();
  const withdraw = useWithdrawApplication();

  const handleWithdraw = async (id: string) => {
    try {
      await withdraw.mutateAsync(id);
      showToast('Application withdrawn', 'success');
    } catch (err) {
      const msg = err instanceof GraphQLError ? err.message : 'Could not withdraw';
      showToast(msg, 'error');
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'My applications' }} />
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        data={data ?? []}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: spacing.xxxl,
          gap: spacing.sm,
          flexGrow: 1,
        }}
        style={{ flex: 1, backgroundColor: colors.canvas }}
        renderItem={({ item }) => (
          <ApplicationRow
            application={item}
            onPress={() =>
              router.push({
                pathname: '/(student)/projects/[id]',
                params: { id: item.projectId },
              })
            }
            onWithdraw={() => handleWithdraw(item.id)}
            isWithdrawing={withdraw.isPending && withdraw.variables === item.id}
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
              title="Could not load applications"
              body={error instanceof GraphQLError ? error.message : 'Pull to retry.'}
            />
          ) : (
            <EmptyState
              icon="paperplane"
              title="No applications yet"
              body="Apply to a project from the marketplace and it will show up here."
            />
          )
        }
      />
    </>
  );
}

function ApplicationRow({
  application,
  onPress,
  onWithdraw,
  isWithdrawing,
}: {
  application: Application;
  onPress: () => void;
  onWithdraw: () => void;
  isWithdrawing: boolean;
}) {
  const swipeRef = useRef<SwipeableMethods>(null);
  const isPending = application.status === 'pending';

  const renderRight = () => (
    <Pressable
      onPress={() => {
        swipeRef.current?.close();
        onWithdraw();
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
        {isWithdrawing ? '…' : 'Withdraw'}
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
          font={fonts.regular}
          size="caption"
          color="inkMuted48"
          style={{ flex: 1 }}
          numberOfLines={1}
        >
          Project {application.projectId.slice(0, 8)}…
        </ThemedText>
        <StatusChip status={application.status} />
      </View>
      {application.coverNote ? (
        <ThemedText font={fonts.regular} size="callout" color="ink" numberOfLines={2}>
          {application.coverNote}
        </ThemedText>
      ) : null}
      <ThemedText font={fonts.regular} size="micro" color="inkMuted48">
        Applied {new Date(application.appliedAt).toLocaleDateString()}
      </ThemedText>
    </Pressable>
  );

  if (!isPending) return Row;

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
  Application['status'],
  { bg: ColorToken; fg: ColorToken; label: string }
> = {
  pending:   { bg: 'canvasParchment', fg: 'primary',    label: 'Pending' },
  accepted:  { bg: 'primary',         fg: 'onPrimary',  label: 'Accepted' },
  rejected:  { bg: 'danger',          fg: 'onPrimary',  label: 'Rejected' },
  withdrawn: { bg: 'canvasParchment', fg: 'inkMuted80', label: 'Withdrawn' },
};

function StatusChip({ status }: { status: Application['status'] }) {
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
