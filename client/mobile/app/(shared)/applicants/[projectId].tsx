import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  View,
} from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { colors, type ColorToken } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useSelectStudent } from '@/hooks/use-project-mutations';
import { useProject, useProjectApplications } from '@/hooks/use-projects';
import { useUser } from '@/hooks/use-user';
import { GraphQLError } from '@/lib/graphql-client';
import type { Application } from '@/lib/projects-api';
import { useUiStore } from '@/store/ui-store';

export default function Applicants() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const router = useRouter();
  const showToast = useUiStore((s) => s.showToast);

  const project = useProject(projectId);
  const apps = useProjectApplications(projectId);
  const select = useSelectStudent();

  const isOpen = project.data?.status === 'open';
  const selectedStudentId = project.data?.selectedStudent ?? null;

  const askSelect = (application: Application, name: string | null) => {
    if (!projectId) return;
    Alert.alert(
      'Select this student?',
      `${name ?? 'This student'} will be assigned to "${
        project.data?.title ?? 'this project'
      }". You will be prompted to fund the escrow next.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Select',
          onPress: async () => {
            try {
              await select.mutateAsync({
                projectId,
                studentId: application.studentId,
              });
              // Route business to the (mock) deposit flow
              router.push({
                pathname: '/(business)/projects/deposit/[projectId]',
                params: { projectId },
              });
            } catch (err) {
              const msg =
                err instanceof GraphQLError ? err.message : 'Could not select';
              showToast(msg, 'error');
            }
          },
        },
      ],
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Applicants' }} />
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        data={apps.data ?? []}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: spacing.xxxl,
          gap: spacing.sm,
          flexGrow: 1,
        }}
        style={{ flex: 1, backgroundColor: colors.canvas }}
        ListHeaderComponent={
          project.data ? (
            <View
              style={{
                gap: spacing.xs,
                paddingBottom: spacing.base,
                marginBottom: spacing.sm,
                borderBottomWidth: 1,
                borderBottomColor: colors.dividerSoft,
              }}
            >
              <ThemedText
                font={fonts.semiBold}
                size="headline"
                color="ink"
                numberOfLines={2}
              >
                {project.data.title}
              </ThemedText>
              <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
                {(apps.data?.length ?? 0)} applicant
                {apps.data?.length === 1 ? '' : 's'} ·{' '}
                {project.data.status.replace('_', ' ')}
              </ThemedText>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <ApplicantRow
            application={item}
            isOpen={isOpen}
            isSelected={item.studentId === selectedStudentId}
            onSelect={(name) => askSelect(item, name)}
            isSelecting={
              select.isPending && select.variables?.studentId === item.studentId
            }
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={apps.isFetching}
            onRefresh={() => {
              apps.refetch();
              project.refetch();
            }}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          apps.isLoading ? (
            <View style={{ paddingVertical: spacing.xxxl, alignItems: 'center' }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : apps.error ? (
            <EmptyState
              icon="exclamationmark.triangle"
              title="Could not load applicants"
              body={
                apps.error instanceof GraphQLError
                  ? apps.error.message
                  : 'Pull to retry.'
              }
            />
          ) : (
            <EmptyState
              icon="person.2"
              title="No applicants yet"
              body="Students who apply will appear here. Pull to refresh."
            />
          )
        }
      />
    </>
  );
}

function ApplicantRow({
  application,
  isOpen,
  isSelected,
  onSelect,
  isSelecting,
}: {
  application: Application;
  isOpen: boolean;
  isSelected: boolean;
  onSelect: (name: string | null) => void;
  isSelecting: boolean;
}) {
  const router = useRouter();
  const student = useUser(application.studentId);
  const name = student.data?.fullName ?? null;
  const skillLevel = student.data?.studentProfile?.skillLevel ?? null;
  const rating = student.data?.studentProfile?.averageRating ?? null;
  const isWithdrawn = application.status === 'withdrawn';

  const goToProfile = () => {
    router.push({
      pathname: '/(shared)/profile/[id]',
      params: { id: application.studentId },
    });
  };

  return (
    <View
      style={{
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: isSelected ? colors.primary : colors.hairline,
        backgroundColor: colors.canvas,
        padding: spacing.lg,
        gap: spacing.sm,
      }}
    >
      <Pressable
        onPress={goToProfile}
        style={({ pressed }) => ({
          flexDirection: 'row',
          gap: spacing.base,
          alignItems: 'center',
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.canvasParchment,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {student.data?.avatarUrl ? (
            <Image
              source={{ uri: student.data.avatarUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <ThemedText font={fonts.semiBold} size="body" color="inkMuted48">
              {(name ?? application.studentId).slice(0, 1).toUpperCase()}
            </ThemedText>
          )}
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
            }}
          >
            <ThemedText
              font={fonts.semiBold}
              size="body"
              color="ink"
              numberOfLines={1}
            >
              {student.isLoading ? 'Loading…' : name ?? 'Student'}
            </ThemedText>
            {student.data?.isVerified ? (
              <Image
                source="sf:checkmark.seal.fill"
                tintColor={colors.primary}
                style={{ width: 12, height: 12 }}
              />
            ) : null}
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
            }}
          >
            {skillLevel ? <LevelChip level={skillLevel} /> : null}
            {rating != null ? (
              <ThemedText
                font={fonts.regular}
                size="caption"
                color="inkMuted48"
              >
                ★ {rating.toFixed(1)}
              </ThemedText>
            ) : null}
          </View>
        </View>
        <ApplicationStatusChip status={application.status} />
      </Pressable>

      {application.coverNote ? (
        <ThemedText
          font={fonts.regular}
          size="callout"
          color="ink"
          numberOfLines={3}
        >
          {application.coverNote}
        </ThemedText>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Pressable onPress={goToProfile} hitSlop={6}>
          <ThemedText font={fonts.regular} size="caption" color="primary">
            View profile →
          </ThemedText>
        </Pressable>

        {isOpen && !isWithdrawn ? (
          <Button
            label={isSelecting ? 'Selecting…' : 'Select'}
            onPress={() => onSelect(name)}
            disabled={isSelecting}
            loading={isSelecting}
          />
        ) : isSelected ? (
          <ThemedText font={fonts.semiBold} size="caption" color="primary">
            Selected
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

function LevelChip({ level }: { level: string }) {
  return (
    <View
      style={{
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: radius.pill,
        backgroundColor: colors.canvasParchment,
      }}
    >
      <ThemedText font={fonts.regular} size="caption" color="inkMuted80">
        {capitalize(level)}
      </ThemedText>
    </View>
  );
}

const APP_STATUS: Record<
  Application['status'],
  { bg: ColorToken; fg: ColorToken; label: string }
> = {
  pending:   { bg: 'canvasParchment', fg: 'primary',    label: 'Pending' },
  accepted:  { bg: 'primary',         fg: 'onPrimary',  label: 'Accepted' },
  rejected:  { bg: 'danger',          fg: 'onPrimary',  label: 'Rejected' },
  withdrawn: { bg: 'canvasParchment', fg: 'inkMuted80', label: 'Withdrawn' },
};

function ApplicationStatusChip({ status }: { status: Application['status'] }) {
  const c = APP_STATUS[status];
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

function capitalize(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}
