import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts, fontSize } from '@/constants/typography';
import { useSubmitReport } from '@/hooks/use-reports';
import { GraphQLError } from '@/lib/graphql-client';
import {
  REPORT_REASON_LABELS,
  type ReportReason,
  type ReportTargetType,
} from '@/lib/reports-api';
import { useUiStore } from '@/store/ui-store';

const REASONS: ReportReason[] = ['spam', 'harassment', 'inappropriate', 'scam', 'other'];
const TARGET_LABEL: Record<ReportTargetType, string> = {
  user:    'this user',
  project: 'this project',
  message: 'this message',
};

export default function ReportScreen() {
  const router = useRouter();
  const showToast = useUiStore((s) => s.showToast);

  const params = useLocalSearchParams<{
    targetType?: string;
    targetId?: string;
  }>();

  // Defensive coercion — typed-routes treats search params as `string`, but
  // unfamiliar callers could omit them or pass a typo. We bail with a clear
  // empty state instead of submitting garbage.
  const targetType =
    params.targetType === 'user' ||
    params.targetType === 'project' ||
    params.targetType === 'message'
      ? params.targetType
      : null;
  const targetId = typeof params.targetId === 'string' ? params.targetId : null;

  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');

  const submit = useSubmitReport();

  const onSubmit = () => {
    if (!reason || !targetType || !targetId) return;
    submit.mutate(
      { targetType, targetId, reason, details: details.trim() || undefined },
      {
        onSuccess: () => {
          showToast('Thanks — our team will review.', 'success');
          router.back();
        },
        onError: (err) => {
          const msg = err instanceof GraphQLError ? err.message : 'Could not submit report';
          Alert.alert('Couldn’t submit report', msg);
        },
      },
    );
  };

  if (!targetType || !targetId) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: 'Report' }} />
        <View
          style={{
            flex: 1,
            backgroundColor: colors.canvas,
            alignItems: 'center',
            justifyContent: 'center',
            padding: spacing.xl,
            gap: spacing.sm,
          }}
        >
          <Image
            source="sf:exclamationmark.triangle"
            tintColor={colors.inkMuted48}
            style={{ width: 36, height: 36 }}
          />
          <ThemedText font={fonts.semiBold} size="body" color="ink">
            Missing target
          </ThemedText>
          <ThemedText
            font={fonts.regular}
            size="caption"
            color="inkMuted48"
            style={{ textAlign: 'center' }}
          >
            Open the report screen from a project or profile so we know what to review.
          </ThemedText>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Report' }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingVertical: spacing.lg,
            paddingHorizontal: spacing.lg,
            gap: spacing.xl,
          }}
          style={{ flex: 1, backgroundColor: colors.canvas }}
        >
          <View style={{ gap: spacing.sm }}>
            <ThemedText font={fonts.bold} size="title3" color="ink">
              Report {TARGET_LABEL[targetType]}
            </ThemedText>
            <ThemedText font={fonts.regular} size="body" color="inkMuted80">
              Reports stay anonymous to the reported account. Our team reviews
              every submission within 48 hours.
            </ThemedText>
          </View>

          <View style={{ gap: spacing.sm }}>
            <ThemedText
              font={fonts.semiBold}
              size="caption"
              color="inkMuted48"
              style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
            >
              Reason
            </ThemedText>
            <View
              style={{
                borderRadius: radius.lg,
                borderCurve: 'continuous',
                backgroundColor: colors.surfacePearl,
                overflow: 'hidden',
              }}
            >
              {REASONS.map((r, idx) => {
                const selected = reason === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setReason(r)}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.base,
                      paddingVertical: spacing.base,
                      paddingHorizontal: spacing.base,
                      backgroundColor: pressed ? colors.canvasParchment : 'transparent',
                      borderTopWidth: idx === 0 ? 0 : 1,
                      borderTopColor: colors.dividerSoft,
                    })}
                  >
                    <Image
                      source={selected ? 'sf:largecircle.fill.circle' : 'sf:circle'}
                      tintColor={selected ? colors.primary : colors.inkMuted48}
                      style={{ width: 22, height: 22 }}
                    />
                    <ThemedText
                      font={fonts.regular}
                      size="body"
                      color="ink"
                      style={{ flex: 1 }}
                    >
                      {REPORT_REASON_LABELS[r]}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={{ gap: spacing.sm }}>
            <ThemedText
              font={fonts.semiBold}
              size="caption"
              color="inkMuted48"
              style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
            >
              Details (optional)
            </ThemedText>
            <TextInput
              value={details}
              onChangeText={setDetails}
              multiline
              maxLength={500}
              placeholder="Add context to help our team review."
              placeholderTextColor={colors.inkMuted48}
              style={{
                minHeight: 120,
                padding: spacing.base,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: colors.hairline,
                backgroundColor: colors.canvas,
                fontFamily: fonts.regular,
                fontSize: fontSize.body,
                color: colors.ink,
                textAlignVertical: 'top',
              }}
            />
            <ThemedText
              font={fonts.regular}
              size="caption"
              color="inkMuted48"
              style={{ textAlign: 'right' }}
            >
              {details.length}/500
            </ThemedText>
          </View>

          <Button
            label={submit.isPending ? 'Submitting…' : 'Submit report'}
            variant="danger"
            onPress={onSubmit}
            disabled={!reason || submit.isPending}
            loading={submit.isPending}
            fullWidth
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
