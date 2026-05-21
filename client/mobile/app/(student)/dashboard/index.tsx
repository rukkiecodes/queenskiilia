import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';

import { NotificationCard } from '@/components/cards/notification-card';
import { ProjectCard } from '@/components/cards/project-card';
import { SectionHeader } from '@/components/dashboard/section-header';
import { StatTile } from '@/components/dashboard/stat-tile';
import { ThemedText } from '@/components/themed-text';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useMe } from '@/hooks/use-me';
import { useMyNotifications } from '@/hooks/use-my-notifications';
import { useProjects, useMyProjects } from '@/hooks/use-projects';
import { useRefreshOnFocus } from '@/hooks/use-refresh-on-focus';
import { formatBudget } from '@/lib/format-deadline';
import { profileComplete } from '@/lib/profile-status';

const AVAILABLE_PREVIEW = 5;
const ACTIVE_PREVIEW = 3;
const NOTIF_PREVIEW = 3;

export default function StudentDashboard() {
  const router = useRouter();
  const me = useMe();
  const open = useProjects({ status: 'open' });
  const mine = useMyProjects();
  const notifications = useMyNotifications();

  const refetchAll = useCallback(() => {
    me.refetch();
    open.refetch();
    mine.refetch();
    notifications.refetch();
  }, [me, open, mine, notifications]);

  useRefreshOnFocus(refetchAll);

  const profile = me.data?.studentProfile;
  const myId = me.data?.id;

  const activeProjects = (mine.data ?? []).filter(
    (p) => p.status === 'in_progress' && p.selectedStudent === myId,
  );
  const availableProjects = (open.data?.pages[0] ?? []).slice(
    0,
    AVAILABLE_PREVIEW,
  );
  const unreadNotifications = (notifications.data ?? [])
    .filter((n) => !n.isRead)
    .slice(0, NOTIF_PREVIEW);

  const showProfileBanner = me.data != null && !profileComplete(me.data);
  const showSkillBanner = me.data != null && !profile?.skillLevel;

  if (me.isLoading) {
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

  return (
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
          refreshing={me.isFetching && !me.isLoading}
          onRefresh={refetchAll}
          tintColor={colors.primary}
        />
      }
    >
      <View
        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.base }}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.canvasParchment,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {me.data?.avatarUrl ? (
            <Image
              source={{ uri: me.data.avatarUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <ThemedText font={fonts.semiBold} size="title3" color="inkMuted48">
              {(me.data?.fullName ?? me.data?.email ?? '?')
                .slice(0, 1)
                .toUpperCase()}
            </ThemedText>
          )}
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <ThemedText font={fonts.regular} size="callout" color="inkMuted48">
            Welcome back
          </ThemedText>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}
          >
            <ThemedText
              font={fonts.semiBold}
              size="title3"
              color="ink"
              numberOfLines={1}
              style={{ flexShrink: 1 }}
            >
              {me.data?.fullName ?? 'Student'}
            </ThemedText>
            {me.data?.isVerified ? (
              <Image
                source="sf:checkmark.seal.fill"
                tintColor={colors.primary}
                style={{ width: 18, height: 18 }}
              />
            ) : null}
          </View>
        </View>
      </View>

      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <StatTile
            label="Skill level"
            value={capitalize(profile?.skillLevel) ?? '—'}
          />
          <StatTile label="Active projects" value={String(activeProjects.length)} />
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <StatTile
            label="Total earned"
            value={formatBudget(profile?.totalEarnings ?? 0)}
          />
          <StatTile
            label="Avg rating"
            value={
              profile?.averageRating != null
                ? `★ ${profile.averageRating.toFixed(1)}`
                : '—'
            }
          />
        </View>
      </View>

      <View style={{ gap: spacing.sm }}>
        <NavRow
          icon="creditcard"
          label="Earnings"
          onPress={() => router.push('/(student)/dashboard/earnings')}
        />
        <NavRow
          icon="chart.bar"
          label="Leaderboard"
          onPress={() => router.push('/(student)/dashboard/leaderboard')}
        />
      </View>

      {showProfileBanner ? (
        <Banner
          icon="person.crop.circle.badge.exclamationmark"
          title="Finish your profile"
          body="Add your details so businesses can find and trust you."
          onPress={() => router.push('/(shared)/profile/edit')}
        />
      ) : null}
      {showSkillBanner ? (
        <Banner
          icon="star.circle"
          title="Take a skill test"
          body="Earn a skill badge to unlock better-matched projects."
          onPress={() => router.push('/(student)/skill-test')}
        />
      ) : null}

      <View style={{ gap: spacing.md }}>
        <SectionHeader
          title="Available projects"
          actionLabel="See all"
          onAction={() => router.push('/(student)/projects')}
        />
        {availableProjects.length > 0 ? (
          availableProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onPress={() =>
                router.push({
                  pathname: '/(student)/projects/[id]',
                  params: { id: project.id },
                })
              }
            />
          ))
        ) : (
          <EmptyLine text="No open projects right now." />
        )}
      </View>

      <View style={{ gap: spacing.md }}>
        <SectionHeader title="Active projects" />
        {activeProjects.length > 0 ? (
          activeProjects.slice(0, ACTIVE_PREVIEW).map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onPress={() =>
                router.push({
                  pathname: '/(student)/projects/active/[id]',
                  params: { id: project.id },
                })
              }
            />
          ))
        ) : (
          <EmptyLine text="You have no active projects yet." />
        )}
      </View>

      <View style={{ gap: spacing.md }}>
        <SectionHeader
          title="Notifications"
          actionLabel="See all"
          onAction={() => router.push('/(shared)/notifications')}
        />
        {unreadNotifications.length > 0 ? (
          unreadNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onPress={() => router.push('/(shared)/notifications')}
            />
          ))
        ) : (
          <EmptyLine text="You're all caught up." />
        )}
      </View>
    </ScrollView>
  );
}

function capitalize(value: string | null | undefined): string | null {
  if (!value) return null;
  return value[0].toUpperCase() + value.slice(1);
}

function EmptyLine({ text }: { text: string }) {
  return (
    <ThemedText font={fonts.regular} size="callout" color="inkMuted48">
      {text}
    </ThemedText>
  );
}

function NavRow({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.base,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: colors.hairline,
        backgroundColor: colors.canvas,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Image
        source={`sf:${icon}`}
        tintColor={colors.primary}
        style={{ width: 20, height: 20 }}
      />
      <ThemedText
        font={fonts.semiBold}
        size="body"
        color="ink"
        style={{ flex: 1 }}
      >
        {label}
      </ThemedText>
      <Image
        source="sf:chevron.right"
        tintColor={colors.inkMuted48}
        style={{ width: 13, height: 13 }}
      />
    </Pressable>
  );
}

function Banner({
  icon,
  title,
  body,
  onPress,
}: {
  icon: string;
  title: string;
  body: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.base,
        padding: spacing.lg,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        backgroundColor: colors.canvasParchment,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Image
        source={`sf:${icon}`}
        tintColor={colors.primary}
        style={{ width: 26, height: 26 }}
      />
      <View style={{ flex: 1, gap: 2 }}>
        <ThemedText font={fonts.semiBold} size="callout" color="ink">
          {title}
        </ThemedText>
        <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
          {body}
        </ThemedText>
      </View>
      <Image
        source="sf:chevron.right"
        tintColor={colors.inkMuted48}
        style={{ width: 13, height: 13 }}
      />
    </Pressable>
  );
}
