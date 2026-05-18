import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';

import { RatingStars } from '@/components/ratings/rating-stars';
import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useMe } from '@/hooks/use-me';
import { useProjectRatings, useSubmitRating } from '@/hooks/use-ratings';
import { useProject } from '@/hooks/use-projects';
import { useUser } from '@/hooks/use-user';
import { GraphQLError } from '@/lib/graphql-client';
import type { ReviewerType, SubmitRatingInput } from '@/lib/ratings-api';
import { useUiStore } from '@/store/ui-store';

type Dimensions = Pick<
  SubmitRatingInput,
  | 'quality'
  | 'communication'
  | 'speed'
  | 'professionalism'
  | 'paymentFairness'
  | 'clarity'
  | 'respect'
>;

const STUDENT_TO_BUSINESS: { key: keyof Dimensions; label: string }[] = [
  { key: 'paymentFairness', label: 'Payment fairness' },
  { key: 'clarity', label: 'Clarity of brief' },
  { key: 'communication', label: 'Communication' },
  { key: 'respect', label: 'Respect' },
];

const BUSINESS_TO_STUDENT: { key: keyof Dimensions; label: string }[] = [
  { key: 'quality', label: 'Quality of work' },
  { key: 'communication', label: 'Communication' },
  { key: 'speed', label: 'Speed' },
  { key: 'professionalism', label: 'Professionalism' },
];

export default function RateProject() {
  const router = useRouter();
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const showToast = useUiStore((s) => s.showToast);

  const { data: me } = useMe();
  const project = useProject(projectId);
  const ratings = useProjectRatings(projectId);
  const submit = useSubmitRating();

  const myReview = useMemo(
    () => ratings.data?.find((r) => r.reviewerId === me?.id),
    [ratings.data, me?.id],
  );

  // Determine reviewee
  const myType: ReviewerType | null =
    me?.accountType === 'student'
      ? 'student'
      : me?.accountType === 'business'
        ? 'business'
        : null;

  const revieweeId =
    myType === 'student'
      ? project.data?.businessId
      : project.data?.selectedStudent;

  const reviewee = useUser(revieweeId ?? undefined);

  const dimensions = myType === 'student' ? STUDENT_TO_BUSINESS : BUSINESS_TO_STUDENT;

  const [scores, setScores] = useState<Dimensions>({});
  const [comment, setComment] = useState('');

  const handleSubmit = async () => {
    if (!projectId || !revieweeId || !myType) return;

    const allRated = dimensions.every((d) => scores[d.key] != null);
    if (!allRated) {
      showToast('Rate each dimension to submit', 'error');
      return;
    }

    try {
      await submit.mutateAsync({
        projectId,
        revieweeId,
        reviewerType: myType,
        ...scores,
        comment: comment.trim() || undefined,
      });
      showToast('Rating submitted', 'success');
      router.back();
    } catch (err) {
      const msg =
        err instanceof GraphQLError ? err.message : 'Could not submit rating';
      showToast(msg, 'error');
    }
  };

  if (project.isLoading || ratings.isLoading) {
    return (
      <>
        <Stack.Screen options={{ presentation: 'formSheet', title: 'Rate' }} />
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

  if (!project.data || !revieweeId) {
    return (
      <>
        <Stack.Screen options={{ presentation: 'formSheet', title: 'Rate' }} />
        <View style={{ flex: 1, backgroundColor: colors.canvas }}>
          <EmptyState icon="questionmark.circle" title="Project not found" />
        </View>
      </>
    );
  }

  const revieweeName =
    reviewee.data?.businessProfile?.companyName ??
    reviewee.data?.fullName ??
    'the other party';

  if (myReview) {
    return (
      <>
        <Stack.Screen
          options={{
            presentation: 'formSheet',
            headerShown: true,
            title: 'Already rated',
          }}
        />
        <ScrollView
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}
          style={{ flex: 1, backgroundColor: colors.canvas }}
        >
          <ThemedText font={fonts.semiBold} size="title3" color="ink">
            Thanks for rating
          </ThemedText>
          <ThemedText font={fonts.regular} size="body" color="inkMuted48">
            You’ve already submitted your rating for {revieweeName} on this
            project. You can’t change it.
          </ThemedText>
          <Button label="Done" onPress={() => router.back()} fullWidth />
        </ScrollView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          presentation: 'formSheet',
          headerShown: true,
          title: `Rate ${revieweeName}`,
          sheetGrabberVisible: true,
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: colors.canvas }}
      >
        <ScrollView
          contentContainerStyle={{
            padding: spacing.xl,
            paddingBottom: spacing.xxxl,
            gap: spacing.lg,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedText font={fonts.regular} size="body" color="inkMuted48">
            Your honest feedback helps future {myType === 'student' ? 'students' : 'businesses'} make better decisions.
          </ThemedText>

          <View style={{ gap: spacing.base }}>
            {dimensions.map((d) => (
              <View
                key={d.key}
                style={{
                  padding: spacing.lg,
                  borderRadius: radius.lg,
                  borderCurve: 'continuous',
                  borderWidth: 1,
                  borderColor: colors.hairline,
                  gap: spacing.sm,
                }}
              >
                <ThemedText font={fonts.semiBold} size="body" color="ink">
                  {d.label}
                </ThemedText>
                <RatingStars
                  value={scores[d.key] ?? null}
                  onChange={(n) =>
                    setScores((prev) => ({ ...prev, [d.key]: n }))
                  }
                  size="lg"
                />
              </View>
            ))}
          </View>

          <Input
            label="Comment (optional)"
            value={comment}
            onChangeText={setComment}
            placeholder={`Anything else you want ${revieweeName.split(' ')[0]} to know?`}
            multiline
            numberOfLines={4}
            maxLength={500}
          />

          <Button
            label={submit.isPending ? 'Submitting…' : 'Submit rating'}
            onPress={handleSubmit}
            disabled={submit.isPending}
            loading={submit.isPending}
            fullWidth
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
