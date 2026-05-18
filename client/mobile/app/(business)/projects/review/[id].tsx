import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useProject } from '@/hooks/use-projects';
import { useReviewSubmission, useSubmission } from '@/hooks/use-submissions';
import { useUser } from '@/hooks/use-user';
import { formatBudget } from '@/lib/format-deadline';
import { GraphQLError } from '@/lib/graphql-client';
import { useUiStore } from '@/store/ui-store';

export default function ReviewSubmission() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const showToast = useUiStore((s) => s.showToast);
  const review = useReviewSubmission();

  const project = useProject(id);
  const submission = useSubmission(id);
  const student = useUser(project.data?.selectedStudent ?? undefined);

  const [feedback, setFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  if (project.isLoading || submission.isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Review submission' }} />
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
        <Stack.Screen options={{ title: 'Review submission' }} />
        <View style={{ flex: 1, backgroundColor: colors.canvas }}>
          <EmptyState
            icon="exclamationmark.triangle"
            title="Project not found"
          />
        </View>
      </>
    );
  }

  const sub = submission.data;

  if (!sub) {
    return (
      <>
        <Stack.Screen options={{ title: 'Review submission' }} />
        <View style={{ flex: 1, backgroundColor: colors.canvas }}>
          <EmptyState
            icon="tray"
            title="Nothing to review"
            body="The student hasn’t submitted work for this project yet."
          />
        </View>
      </>
    );
  }

  const studentName =
    student.data?.fullName ?? student.data?.studentProfile?.university ?? 'Student';

  const isCompleted = project.data.status === 'completed';
  const isApproved = sub.status === 'approved';
  const isRevisionRequested = sub.status === 'revision_requested';
  const canReview = sub.status === 'submitted' && !isCompleted;

  const askApprove = () => {
    Alert.alert(
      'Approve & release funds?',
      `This marks the project completed, releases ${formatBudget(
        project.data!.budget,
        project.data!.currency,
      )} to ${studentName}, and creates a portfolio entry for them.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              const res = await review.mutateAsync({
                projectId: project.data!.id,
                approve: true,
              });
              if (res.releaseError) {
                showToast(
                  `Approved, but funds not released: ${res.releaseError}`,
                  'error',
                );
              } else {
                showToast('Approved & funds released', 'success');
              }
              router.back();
            } catch (err) {
              const msg =
                err instanceof GraphQLError ? err.message : 'Could not approve';
              showToast(msg, 'error');
            }
          },
        },
      ],
    );
  };

  const sendRevision = async () => {
    const note = feedback.trim();
    if (note.length < 5) {
      showToast('Add a short feedback note', 'error');
      return;
    }
    try {
      await review.mutateAsync({
        projectId: project.data!.id,
        approve: false,
        feedback: note,
      });
      showToast('Revision requested', 'success');
      router.back();
    } catch (err) {
      const msg = err instanceof GraphQLError ? err.message : 'Could not send';
      showToast(msg, 'error');
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Review submission' }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: colors.canvas }}
      >
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{
            padding: spacing.xl,
            paddingBottom: spacing.xxxl,
            gap: spacing.lg,
          }}
          refreshControl={
            <RefreshControl
              refreshing={project.isFetching || submission.isFetching}
              onRefresh={() => {
                project.refetch();
                submission.refetch();
              }}
              tintColor={colors.primary}
            />
          }
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ gap: spacing.xs }}>
            <ThemedText
              font={fonts.regular}
              size="caption"
              color="inkMuted48"
            >
              Submitted by {studentName} ·{' '}
              {new Date(sub.submittedAt).toLocaleString()}
            </ThemedText>
            <ThemedText font={fonts.bold} size="title3" color="ink">
              {project.data.title}
            </ThemedText>
          </View>

          {isApproved || isCompleted ? (
            <View
              style={{
                padding: spacing.lg,
                borderRadius: radius.lg,
                backgroundColor: colors.primary,
              }}
            >
              <ThemedText font={fonts.semiBold} size="callout" color="onPrimary">
                APPROVED · PROJECT COMPLETED
              </ThemedText>
            </View>
          ) : isRevisionRequested ? (
            <View
              style={{
                padding: spacing.lg,
                borderRadius: radius.lg,
                backgroundColor: colors.canvasParchment,
                gap: spacing.xs,
              }}
            >
              <ThemedText font={fonts.semiBold} size="callout" color="warning">
                REVISION REQUESTED
              </ThemedText>
              {sub.feedback ? (
                <ThemedText font={fonts.regular} size="body" color="ink">
                  {sub.feedback}
                </ThemedText>
              ) : null}
            </View>
          ) : null}

          {sub.fileUrls.length > 0 ? (
            <View style={{ gap: spacing.sm }}>
              <ThemedText
                font={fonts.semiBold}
                size="callout"
                color="inkMuted48"
              >
                FILES ({sub.fileUrls.length})
              </ThemedText>
              <View style={{ gap: spacing.xs }}>
                {sub.fileUrls.map((url) => (
                  <FileRow key={url} url={url} />
                ))}
              </View>
            </View>
          ) : null}

          {sub.notes ? (
            <View style={{ gap: spacing.xs }}>
              <ThemedText
                font={fonts.semiBold}
                size="callout"
                color="inkMuted48"
              >
                NOTES
              </ThemedText>
              <ThemedText font={fonts.regular} size="body" color="ink" selectable>
                {sub.notes}
              </ThemedText>
            </View>
          ) : null}

          {canReview ? (
            showFeedback ? (
              <View style={{ gap: spacing.sm }}>
                <Input
                  label="What needs to change?"
                  value={feedback}
                  onChangeText={setFeedback}
                  placeholder="Be specific so the student can act on it."
                  multiline
                  numberOfLines={4}
                />
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <Button
                      label="Cancel"
                      variant="ghost"
                      onPress={() => {
                        setShowFeedback(false);
                        setFeedback('');
                      }}
                      fullWidth
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      label={review.isPending ? 'Sending…' : 'Send revision'}
                      onPress={sendRevision}
                      disabled={review.isPending}
                      loading={review.isPending}
                      fullWidth
                    />
                  </View>
                </View>
              </View>
            ) : (
              <View style={{ gap: spacing.sm, marginTop: spacing.base }}>
                <Button
                  label={review.isPending ? 'Approving…' : 'Approve & release funds'}
                  onPress={askApprove}
                  disabled={review.isPending}
                  loading={review.isPending}
                  fullWidth
                />
                <Button
                  label="Request revision"
                  variant="outline"
                  onPress={() => setShowFeedback(true)}
                  disabled={review.isPending}
                  fullWidth
                />
              </View>
            )
          ) : null}

          {isCompleted ? (
            <Button
              label="Rate the student"
              variant="outline"
              onPress={() =>
                router.push({
                  pathname: '/(shared)/rate/[projectId]',
                  params: { projectId: project.data!.id },
                })
              }
              fullWidth
            />
          ) : null}

          {!isCompleted ? (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(shared)/dispute/[projectId]',
                  params: { projectId: project.data!.id },
                })
              }
              hitSlop={6}
              style={{ alignSelf: 'center', padding: spacing.sm }}
            >
              <ThemedText font={fonts.regular} size="caption" color="danger">
                Report an issue
              </ThemedText>
            </Pressable>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

function FileRow({ url }: { url: string }) {
  const isImage = /\.(jpg|jpeg|png|webp|gif|heic)(?:\?|$)/i.test(url);
  return (
    <Pressable
      onPress={() => {
        // future: open in viewer; for now, no-op
      }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.sm,
        borderRadius: radius.md,
        borderCurve: 'continuous',
        backgroundColor: colors.canvasParchment,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: radius.md,
          backgroundColor: colors.canvas,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isImage ? (
          <Image
            source={{ uri: url }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        ) : (
          <Image
            source="sf:doc.fill"
            tintColor={colors.inkMuted48}
            style={{ width: 22, height: 22 }}
          />
        )}
      </View>
      <ThemedText
        font={fonts.regular}
        size="caption"
        color="inkMuted80"
        style={{ flex: 1 }}
        numberOfLines={1}
      >
        {url.split('/').pop()}
      </ThemedText>
    </Pressable>
  );
}
