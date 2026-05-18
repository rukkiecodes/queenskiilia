import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { colors, type ColorToken } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useMe } from '@/hooks/use-me';
import { useProject } from '@/hooks/use-projects';
import { useSubmission } from '@/hooks/use-submissions';
import { useUser } from '@/hooks/use-user';
import { formatBudget, formatDeadline } from '@/lib/format-deadline';
import { GraphQLError } from '@/lib/graphql-client';
import type { SubmissionStatus } from '@/lib/submissions-api';

export default function ActiveProject() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const project = useProject(id);
  const submission = useSubmission(id);
  const { data: me } = useMe();
  const business = useUser(project.data?.businessId);

  if (project.isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Workspace' }} />
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

  if (project.error || !project.data) {
    return (
      <>
        <Stack.Screen options={{ title: 'Workspace' }} />
        <View style={{ flex: 1, backgroundColor: colors.canvas }}>
          <EmptyState
            icon="exclamationmark.triangle"
            title="Could not load workspace"
            body={
              project.error instanceof GraphQLError
                ? project.error.message
                : 'Pull to refresh.'
            }
          />
        </View>
      </>
    );
  }

  const p = project.data;
  const isMine = me?.id === p.selectedStudent;
  const isActive = p.status === 'in_progress';
  const isCompleted = p.status === 'completed';
  const sub = submission.data;
  const subStatus: SubmissionStatus | null = sub?.status ?? null;

  if (!isMine) {
    return (
      <>
        <Stack.Screen options={{ title: 'Workspace' }} />
        <View style={{ flex: 1, backgroundColor: colors.canvas }}>
          <EmptyState
            icon="lock"
            title="Workspace unavailable"
            body="Only the student selected for this project can open the workspace."
          />
        </View>
      </>
    );
  }

  const canSubmit =
    isActive && (subStatus == null || subStatus === 'revision_requested');

  return (
    <>
      <Stack.Screen options={{ title: 'Workspace' }} />
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
            refreshing={project.isFetching || submission.isFetching}
            onRefresh={() => {
              project.refetch();
              submission.refetch();
            }}
            tintColor={colors.primary}
          />
        }
      >
        {isCompleted ? <CompletionBanner role="student" /> : null}

        <View style={{ gap: spacing.xs }}>
          <ThemedText
            font={fonts.regular}
            size="caption"
            color="inkMuted48"
          >
            {business.data?.businessProfile?.companyName ??
              business.data?.fullName ??
              ''}
          </ThemedText>
          <ThemedText font={fonts.bold} size="title2" color="ink">
            {p.title}
          </ThemedText>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              flexWrap: 'wrap',
            }}
          >
            <StatusPill status={p.status} />
            <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
              {formatBudget(p.budget, p.currency)} · {formatDeadline(p.deadline)}
            </ThemedText>
          </View>
        </View>

        <View style={{ gap: spacing.xs }}>
          <ThemedText font={fonts.semiBold} size="callout" color="inkMuted48">
            BRIEF
          </ThemedText>
          <ThemedText font={fonts.regular} size="body" color="ink" selectable>
            {p.description}
          </ThemedText>
        </View>

        <SubmissionPanel
          status={subStatus}
          feedback={sub?.feedback ?? null}
          submittedAt={sub?.submittedAt ?? null}
          isCompleted={isCompleted}
        />

        {canSubmit ? (
          <Button
            label={subStatus === 'revision_requested' ? 'Submit revision' : 'Submit work'}
            onPress={() =>
              router.push({
                pathname: '/(student)/projects/submit/[id]',
                params: { id: p.id },
              })
            }
            fullWidth
          />
        ) : null}

        {/* Chat shortcut — the chat is created on demand by chat(projectId) lazy-create */}
        <Pressable
          onPress={async () => {
            // We can't push to a chat without the chatId — route to the chat list
            // and let user tap into this conversation. Future: dedicated route by
            // projectId that resolves to chatId server-side.
            router.push('/(student)/chat');
          }}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: spacing.lg,
            borderRadius: radius.lg,
            borderCurve: 'continuous',
            borderWidth: 1,
            borderColor: colors.hairline,
            backgroundColor: colors.canvas,
            transform: [{ scale: pressed ? 0.99 : 1 }],
          })}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Image
              source="sf:message.fill"
              tintColor={colors.primary}
              style={{ width: 20, height: 20 }}
            />
            <ThemedText font={fonts.semiBold} size="body" color="ink">
              Open chat
            </ThemedText>
          </View>
          <Image
            source="sf:chevron.right"
            tintColor={colors.inkMuted48}
            style={{ width: 14, height: 14 }}
          />
        </Pressable>

        {isCompleted ? (
          <Button
            label="Rate your experience"
            variant="outline"
            onPress={() =>
              router.push({
                pathname: '/(shared)/rate/[projectId]',
                params: { projectId: p.id },
              })
            }
            fullWidth
          />
        ) : null}

        {isActive ? (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/(shared)/dispute/[projectId]',
                params: { projectId: p.id },
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
    </>
  );
}

function SubmissionPanel({
  status,
  feedback,
  submittedAt,
  isCompleted,
}: {
  status: SubmissionStatus | null;
  feedback: string | null;
  submittedAt: string | null;
  isCompleted: boolean;
}) {
  let label = 'Nothing submitted yet';
  let body =
    'Upload your work files and notes when you’re ready for the business to review.';
  let tone: ColorToken = 'inkMuted48';

  if (status === 'submitted') {
    label = 'Awaiting review';
    body = `Submitted ${submittedAt ? new Date(submittedAt).toLocaleString() : ''}. The business will approve or request a revision.`;
    tone = 'primary';
  } else if (status === 'revision_requested') {
    label = 'Revision requested';
    body =
      feedback ??
      'The business asked for changes. Review the feedback in chat and submit a revision.';
    tone = 'warning';
  } else if (status === 'approved' || isCompleted) {
    label = 'Approved';
    body = 'Your work was approved. Funds have been released.';
    tone = 'primary';
  }

  return (
    <View
      style={{
        padding: spacing.lg,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        backgroundColor: colors.canvasParchment,
        gap: spacing.xs,
      }}
    >
      <ThemedText font={fonts.semiBold} size="callout" color={tone}>
        {label.toUpperCase()}
      </ThemedText>
      <ThemedText font={fonts.regular} size="body" color="ink">
        {body}
      </ThemedText>
    </View>
  );
}

function CompletionBanner({ role }: { role: 'student' | 'business' }) {
  return (
    <View
      style={{
        padding: spacing.lg,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        backgroundColor: colors.primary,
        gap: spacing.xxs,
      }}
    >
      <ThemedText font={fonts.semiBold} size="caption" color="onPrimary">
        PROJECT COMPLETED
      </ThemedText>
      <ThemedText font={fonts.semiBold} size="headline" color="onPrimary">
        {role === 'student' ? 'Nice work!' : 'You’re all set!'}
      </ThemedText>
      <ThemedText font={fonts.regular} size="callout" color="onPrimary">
        {role === 'student'
          ? 'Your work was approved and funds are on the way. A new portfolio entry has been added.'
          : 'Work approved, funds released. Take a moment to rate the experience below.'}
      </ThemedText>
    </View>
  );
}

const STATUS: Record<
  string,
  { bg: ColorToken; fg: ColorToken; label: string }
> = {
  open:        { bg: 'primary',         fg: 'onPrimary',  label: 'Open' },
  in_progress: { bg: 'canvasParchment', fg: 'primary',    label: 'In progress' },
  completed:   { bg: 'primary',         fg: 'onPrimary',  label: 'Completed' },
  cancelled:   { bg: 'canvasParchment', fg: 'inkMuted48', label: 'Cancelled' },
};

function StatusPill({ status }: { status: string }) {
  const c = STATUS[status] ?? STATUS.in_progress;
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
