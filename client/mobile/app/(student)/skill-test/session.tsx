import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  View,
} from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useActiveSession, useSubmitAssessment } from '@/hooks/use-assessments';
import { formatCountdown, useCountdown } from '@/hooks/use-countdown';
import { GraphQLError } from '@/lib/graphql-client';
import { useAssessmentStore } from '@/store/assessment-store';
import { useUiStore } from '@/store/ui-store';

export default function Session() {
  const router = useRouter();
  const showToast = useUiStore((s) => s.showToast);
  const active = useActiveSession();
  const submit = useSubmitAssessment();

  const sessionId = useAssessmentStore((s) => s.sessionId);
  const currentIndex = useAssessmentStore((s) => s.currentIndex);
  const answers = useAssessmentStore((s) => s.answers);
  const bind = useAssessmentStore((s) => s.bind);
  const setAnswer = useAssessmentStore((s) => s.setAnswer);
  const advance = useAssessmentStore((s) => s.advance);
  const reset = useAssessmentStore((s) => s.reset);

  // Bind session state when the active session arrives / changes
  useEffect(() => {
    if (active.data?.id && active.data.id !== sessionId) {
      bind(active.data.id);
    }
  }, [active.data?.id, sessionId, bind]);

  const session = active.data;
  const totalQuestions = session?.questions.length ?? 0;
  const question = session?.questions[currentIndex];
  const isLast = currentIndex >= totalQuestions - 1;
  const hasAnswer = question != null && answers[question.index] != null;

  const handleSubmit = useCallback(
    async (auto = false) => {
      if (!session || submit.isPending) return;

      // Backend treats missing entries as wrong; we send -1 for unanswered to make intent explicit.
      const payload = session.questions.map((q) => ({
        questionIndex: q.index,
        selectedOption: answers[q.index] ?? -1,
      }));

      try {
        const result = await submit.mutateAsync({
          sessionId: session.id,
          answers: payload,
        });
        reset();
        router.replace({
          pathname: '/(student)/skill-test/results/[id]',
          params: { id: result.id },
        });
        if (auto) showToast('Time’s up — assessment submitted', 'info');
      } catch (err) {
        const msg =
          err instanceof GraphQLError ? err.message : 'Could not submit';
        showToast(msg, 'error');
      }
    },
    [session, answers, submit, reset, router, showToast],
  );

  // Countdown — auto-submit on expiry
  const secondsLeft = useCountdown(session?.expiresAt ?? null);
  const submittedOnTimerRef = useRef(false);
  useEffect(() => {
    if (
      session &&
      secondsLeft === 0 &&
      !submittedOnTimerRef.current &&
      !submit.isPending
    ) {
      submittedOnTimerRef.current = true;
      void handleSubmit(true);
    }
  }, [secondsLeft, session, handleSubmit, submit.isPending]);

  const cancelToIndex = () => {
    Alert.alert(
      'Leave assessment?',
      'Your answers so far will be kept and the timer keeps running. You can resume from this tab.',
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', onPress: () => router.replace('/(student)/skill-test/index') },
      ],
    );
  };

  const onTapNext = () => {
    if (!session || !hasAnswer) return;
    if (isLast) {
      handleSubmit();
      return;
    }
    advance();
  };

  // Loading state
  if (active.isLoading) {
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

  // No active session — kick back to index
  if (!session) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <Stack.Screen options={{ title: 'Assessment' }} />
        <EmptyState
          icon="questionmark.circle"
          title="No active assessment"
          body="Start one from the previous screen."
          cta={
            <Button
              label="Back"
              onPress={() => router.replace('/(student)/skill-test/index')}
            />
          }
        />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: session.category,
          headerLeft: () => (
            <Pressable onPress={cancelToIndex} hitSlop={8}>
              <ThemedText font={fonts.regular} size="body" color="primary">
                Leave
              </ThemedText>
            </Pressable>
          ),
          headerRight: () => (
            <ThemedText
              font={fonts.semiBold}
              size="callout"
              color={secondsLeft < 60 ? 'danger' : 'ink'}
              style={{ fontVariant: ['tabular-nums'] as never }}
            >
              {formatCountdown(secondsLeft)}
            </ThemedText>
          ),
        }}
      />
      <ScrollView
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: spacing.xxxl,
          gap: spacing.xl,
          flexGrow: 1,
        }}
        style={{ flex: 1, backgroundColor: colors.canvas }}
        keyboardShouldPersistTaps="handled"
      >
        <SessionHeader index={currentIndex} total={totalQuestions} />

        {question ? (
          <View style={{ gap: spacing.lg }}>
            <ThemedText font={fonts.semiBold} size="title3" color="ink">
              {question.text}
            </ThemedText>

            <View style={{ gap: spacing.sm }}>
              {question.options.map((option, optionIndex) => (
                <OptionRow
                  key={optionIndex}
                  label={option}
                  selected={answers[question.index] === optionIndex}
                  onPress={() => setAnswer(question.index, optionIndex)}
                />
              ))}
            </View>
          </View>
        ) : null}

        <View style={{ flex: 1 }} />

        <Button
          label={isLast ? (submit.isPending ? 'Submitting…' : 'Submit') : 'Next'}
          onPress={onTapNext}
          disabled={!hasAnswer || submit.isPending}
          loading={submit.isPending && isLast}
          fullWidth
        />
      </ScrollView>
    </>
  );
}

function SessionHeader({ index, total }: { index: number; total: number }) {
  const progress = total > 0 ? Math.min(1, (index + 1) / total) : 0;
  return (
    <View style={{ gap: spacing.xs }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <ThemedText font={fonts.semiBold} size="caption" color="inkMuted48">
          QUESTION {index + 1} OF {total}
        </ThemedText>
        <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
          {Math.round(progress * 100)}%
        </ThemedText>
      </View>
      <View
        style={{
          height: 4,
          borderRadius: radius.pill,
          backgroundColor: colors.canvasParchment,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height: '100%',
            width: `${progress * 100}%`,
            backgroundColor: colors.primary,
          }}
        />
      </View>
    </View>
  );
}

function OptionRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? colors.primaryFocus : colors.hairline,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        padding: spacing.lg,
        backgroundColor: colors.canvas,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.base,
        transform: [{ scale: pressed ? 0.99 : 1 }],
      })}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: radius.pill,
          borderWidth: 2,
          borderColor: selected ? colors.primary : colors.hairline,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected ? (
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: radius.pill,
              backgroundColor: colors.primary,
            }}
          />
        ) : null}
      </View>
      <ThemedText
        font={fonts.regular}
        size="body"
        color="ink"
        style={{ flex: 1 }}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}
