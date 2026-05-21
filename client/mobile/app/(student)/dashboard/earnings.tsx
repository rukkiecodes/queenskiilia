import { Stack } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useMe } from '@/hooks/use-me';
import { useMyEscrows } from '@/hooks/use-payments';
import { useMyProjects } from '@/hooks/use-projects';
import { formatBudget, parseDate } from '@/lib/format-deadline';
import type { EscrowAccount } from '@/lib/payments-api';

const STATUS_LABEL: Record<EscrowAccount['status'], string> = {
  held: 'Pending',
  released: 'Received',
  refunded: 'Refunded',
};

export default function Earnings() {
  const me = useMe();
  const escrows = useMyEscrows();
  const projects = useMyProjects();

  const myId = me.data?.id;

  const projectTitles = useMemo(() => {
    const map = new Map<string, string>();
    for (const project of projects.data ?? []) {
      map.set(project.id, project.title);
    }
    return map;
  }, [projects.data]);

  const mine = useMemo(
    () => (escrows.data ?? []).filter((e) => e.studentId === myId),
    [escrows.data, myId],
  );

  const released = mine.filter((e) => e.status === 'released');
  const held = mine.filter((e) => e.status === 'held');

  const netOf = (e: EscrowAccount) => e.amount - (e.platformFee ?? 0);
  const totalEarned = released.reduce((sum, e) => sum + netOf(e), 0);
  const heldTotal = held.reduce((sum, e) => sum + e.amount, 0);
  const currency = released[0]?.currency ?? held[0]?.currency ?? 'USD';

  const history = useMemo(
    () =>
      [...mine].sort(
        (a, b) =>
          parseDate(b.createdAt).getTime() - parseDate(a.createdAt).getTime(),
      ),
    [mine],
  );

  if (me.isLoading || escrows.isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: 'Earnings' }} />
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

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Earnings' }} />
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
            refreshing={escrows.isFetching && !escrows.isLoading}
            onRefresh={() => {
              escrows.refetch();
              projects.refetch();
            }}
            tintColor={colors.primary}
          />
        }
      >
        <View style={{ gap: spacing.xs }}>
          <ThemedText font={fonts.regular} size="callout" color="inkMuted48">
            Total earned
          </ThemedText>
          <ThemedText font={fonts.semiBold} size="title1" color="ink">
            {formatBudget(totalEarned, currency)}
          </ThemedText>
          <ThemedText font={fonts.regular} size="callout" color="inkMuted48">
            {formatBudget(heldTotal, currency)} held in escrow
          </ThemedText>
        </View>

        <View style={{ gap: spacing.md }}>
          <ThemedText font={fonts.semiBold} size="headline" color="ink">
            Transaction history
          </ThemedText>
          {history.length > 0 ? (
            <View
              style={{
                borderWidth: 1,
                borderColor: colors.hairline,
                borderRadius: radius.lg,
                borderCurve: 'continuous',
                overflow: 'hidden',
              }}
            >
              {history.map((escrow, index) => (
                <TransactionRow
                  key={escrow.id}
                  escrow={escrow}
                  title={projectTitles.get(escrow.projectId) ?? 'Project'}
                  amount={
                    escrow.status === 'released'
                      ? netOf(escrow)
                      : escrow.amount
                  }
                  showDivider={index < history.length - 1}
                />
              ))}
            </View>
          ) : (
            <ThemedText font={fonts.regular} size="callout" color="inkMuted48">
              No transactions yet. Earnings from completed projects appear here.
            </ThemedText>
          )}
        </View>

        <View
          style={{
            gap: spacing.xs,
            padding: spacing.lg,
            borderRadius: radius.lg,
            borderCurve: 'continuous',
            backgroundColor: colors.canvasParchment,
          }}
        >
          <ThemedText font={fonts.semiBold} size="callout" color="ink">
            Withdrawals
          </ThemedText>
          <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
            Bank withdrawals are coming soon. Released funds stay in your
            balance until then.
          </ThemedText>
        </View>
      </ScrollView>
    </>
  );
}

function TransactionRow({
  escrow,
  title,
  amount,
  showDivider,
}: {
  escrow: EscrowAccount;
  title: string;
  amount: number;
  showDivider: boolean;
}) {
  const date = parseDate(escrow.releasedAt ?? escrow.createdAt);
  const dateLabel = Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.base,
        padding: spacing.lg,
        borderBottomWidth: showDivider ? 1 : 0,
        borderBottomColor: colors.dividerSoft,
      }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <ThemedText
          font={fonts.semiBold}
          size="callout"
          color="ink"
          numberOfLines={1}
        >
          {title}
        </ThemedText>
        <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
          {[STATUS_LABEL[escrow.status], dateLabel].filter(Boolean).join('  ·  ')}
        </ThemedText>
      </View>
      <ThemedText font={fonts.semiBold} size="callout" color="ink">
        {formatBudget(amount, escrow.currency)}
      </ThemedText>
    </View>
  );
}
