import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { colors, type ColorToken } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useMe } from '@/hooks/use-me';
import {
  canSubmit,
  deriveSteps,
  statusLabel,
  type VerificationStatus,
  type VerificationStep,
} from '@/lib/verification-steps';

export default function VerificationIndex() {
  const router = useRouter();
  const { data: me, isFetching, refetch } = useMe();

  if (!me) {
    return <View style={{ flex: 1, backgroundColor: colors.canvas }} />;
  }

  const steps = deriveSteps(me);

  const openStep = (step: VerificationStep) => {
    if (!canSubmit(step.status)) return;
    router.push({
      pathname: '/(shared)/verification/[type]',
      params: { type: step.type },
    });
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Verification' }} />
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
            refreshing={isFetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      >
        <View style={{ gap: spacing.xs }}>
          <ThemedText font={fonts.regular} size="body" color="inkMuted48">
            {me.accountType === 'business'
              ? 'Verify your business to start posting projects and hiring talent.'
              : 'Verify your identity to apply for higher-tier projects and unlock payouts.'}
          </ThemedText>
        </View>

        <View style={{ gap: spacing.base }}>
          {steps.map((step) => (
            <StepCard key={step.type} step={step} onPress={() => openStep(step)} />
          ))}
        </View>
      </ScrollView>
    </>
  );
}

function StepCard({
  step,
  onPress,
}: {
  step: VerificationStep;
  onPress: () => void;
}) {
  const tappable = canSubmit(step.status);

  return (
    <Pressable
      onPress={onPress}
      disabled={!tappable}
      style={({ pressed }) => ({
        borderWidth: 1,
        borderColor: colors.hairline,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        backgroundColor: colors.canvas,
        padding: spacing.lg,
        gap: spacing.sm,
        opacity: tappable ? 1 : 0.92,
        transform: [{ scale: pressed && tappable ? 0.98 : 1 }],
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.base }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: radius.pill,
            backgroundColor: colors.canvasParchment,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image
            source={`sf:${step.icon}`}
            tintColor={colors.ink}
            style={{ width: 20, height: 20 }}
          />
        </View>

        <View style={{ flex: 1 }}>
          <ThemedText font={fonts.semiBold} size="body" color="ink">
            {step.title}
          </ThemedText>
          <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
            {step.subtitle}
          </ThemedText>
        </View>

        <StatusChip status={step.status} />
      </View>

      {step.status === 'rejected' && step.latest?.adminNote ? (
        <View
          style={{
            backgroundColor: colors.canvasParchment,
            borderRadius: radius.md,
            borderCurve: 'continuous',
            padding: spacing.md,
          }}
        >
          <ThemedText font={fonts.semiBold} size="caption" color="danger">
            Reviewer note
          </ThemedText>
          <ThemedText font={fonts.regular} size="caption" color="ink">
            {step.latest.adminNote}
          </ThemedText>
        </View>
      ) : null}

      {tappable ? (
        <ThemedText font={fonts.regular} size="caption" color="primary">
          {step.status === 'rejected' ? 'Resubmit document' : 'Start step'}
        </ThemedText>
      ) : null}
    </Pressable>
  );
}

function StatusChip({ status }: { status: VerificationStatus }) {
  const palette: Record<
    VerificationStatus,
    { bg: ColorToken; fg: ColorToken }
  > = {
    'not-submitted': { bg: 'canvasParchment', fg: 'inkMuted80' },
    pending: { bg: 'canvasParchment', fg: 'primary' },
    approved: { bg: 'primary', fg: 'onPrimary' },
    rejected: { bg: 'danger', fg: 'onPrimary' },
  };
  const c = palette[status];

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
        {statusLabel(status)}
      </ThemedText>
    </View>
  );
}
