import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useInitiateEscrow } from '@/hooks/use-payments';
import { useProject } from '@/hooks/use-projects';
import { useUser } from '@/hooks/use-user';
import { formatBudget } from '@/lib/format-deadline';
import { GraphQLError } from '@/lib/graphql-client';
import { useUiStore } from '@/store/ui-store';

const PLATFORM_FEE_PERCENT = 15;

export default function DepositMock() {
  const router = useRouter();
  const showToast = useUiStore((s) => s.showToast);
  const { projectId } = useLocalSearchParams<{ projectId: string }>();

  const project = useProject(projectId);
  const student = useUser(project.data?.selectedStudent ?? undefined);
  const initiate = useInitiateEscrow();

  const fee = useMemo(() => {
    if (!project.data) return 0;
    return Math.round((project.data.budget * PLATFORM_FEE_PERCENT) / 100);
  }, [project.data]);

  const total = (project.data?.budget ?? 0) + fee;

  const confirmDeposit = async () => {
    if (!project.data || !project.data.selectedStudent) return;
    try {
      await initiate.mutateAsync({
        projectId: project.data.id,
        studentId: project.data.selectedStudent,
        amount: project.data.budget,
        currency: project.data.currency,
        gateway: 'mock',
        gatewayRef: `mock_${Date.now()}`,
      });
      showToast('Mock deposit confirmed', 'success');
      router.replace('/(business)/payments');
    } catch (err) {
      const msg =
        err instanceof GraphQLError ? err.message : 'Could not start escrow';
      showToast(msg, 'error');
    }
  };

  if (project.isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Fund escrow' }} />
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

  if (!project.data) {
    return (
      <>
        <Stack.Screen options={{ title: 'Fund escrow' }} />
        <View style={{ flex: 1, backgroundColor: colors.canvas }}>
          <EmptyState
            icon="questionmark.circle"
            title="Project not found"
          />
        </View>
      </>
    );
  }

  const studentName =
    student.data?.fullName ?? student.data?.studentProfile?.university ?? 'Student';

  return (
    <>
      <Stack.Screen options={{ title: 'Fund escrow' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: spacing.xxxl,
          gap: spacing.lg,
        }}
        style={{ flex: 1, backgroundColor: colors.canvas }}
      >
        <View
          style={{
            paddingHorizontal: spacing.base,
            paddingVertical: spacing.sm,
            borderRadius: radius.pill,
            backgroundColor: colors.warning,
            alignSelf: 'flex-start',
          }}
        >
          <ThemedText font={fonts.semiBold} size="caption" color="onPrimary">
            MOCK PAYMENT — no real money moves
          </ThemedText>
        </View>

        <View style={{ gap: spacing.xs }}>
          <ThemedText font={fonts.bold} size="title2" color="ink">
            Fund escrow
          </ThemedText>
          <ThemedText font={fonts.regular} size="body" color="inkMuted48">
            Your funds are held until work is approved. Until then, you can
            release or refund at any time.
          </ThemedText>
        </View>

        <Section title="Project">
          <Row label="Title" value={project.data.title} />
          <Row label="Student" value={studentName} />
        </Section>

        <Section title="Breakdown">
          <Row
            label="Project budget"
            value={formatBudget(project.data.budget, project.data.currency)}
          />
          <Row
            label={`Platform fee (${PLATFORM_FEE_PERCENT}%)`}
            value={formatBudget(fee, project.data.currency)}
            muted
          />
          <Row
            label="Total to deposit"
            value={formatBudget(total, project.data.currency)}
            emphasis
          />
        </Section>

        <View
          style={{
            padding: spacing.lg,
            borderRadius: radius.lg,
            backgroundColor: colors.canvasParchment,
            gap: spacing.xs,
          }}
        >
          <ThemedText font={fonts.semiBold} size="callout" color="ink">
            Fee disclosure
          </ThemedText>
          <ThemedText font={fonts.regular} size="caption" color="inkMuted80">
            Platform takes {PLATFORM_FEE_PERCENT}% of the project budget to cover
            payment processing, dispute resolution, and platform operations.
          </ThemedText>
          <ThemedText
            font={fonts.regular}
            size="micro"
            color="inkMuted48"
            style={{ marginTop: spacing.xs }}
          >
            QueenSkiilia is not a bank. In production, escrow is facilitated by
            Paystack. This is a mock deposit for development only — no payment
            method is required and no funds will move.
          </ThemedText>
        </View>

        <Button
          label={initiate.isPending ? 'Confirming…' : 'Confirm mock deposit'}
          onPress={confirmDeposit}
          loading={initiate.isPending}
          disabled={initiate.isPending}
          fullWidth
        />
      </ScrollView>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing.sm }}>
      <ThemedText font={fonts.semiBold} size="callout" color="inkMuted48">
        {title.toUpperCase()}
      </ThemedText>
      <View
        style={{
          borderRadius: radius.lg,
          borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: colors.hairline,
          backgroundColor: colors.canvas,
          overflow: 'hidden',
        }}
      >
        {children}
      </View>
    </View>
  );
}

function Row({
  label,
  value,
  muted,
  emphasis,
}: {
  label: string;
  value: string;
  muted?: boolean;
  emphasis?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.base,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.dividerSoft,
      }}
    >
      <ThemedText
        font={fonts.regular}
        size="callout"
        color={muted ? 'inkMuted48' : 'inkMuted48'}
      >
        {label}
      </ThemedText>
      <ThemedText
        font={emphasis ? fonts.semiBold : fonts.regular}
        size={emphasis ? 'headline' : 'body'}
        color={muted ? 'inkMuted80' : 'ink'}
      >
        {value}
      </ThemedText>
    </View>
  );
}
