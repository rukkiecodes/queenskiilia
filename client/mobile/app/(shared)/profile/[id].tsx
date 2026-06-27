import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { ReportButton } from '@/components/report-button';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { useMe } from '@/hooks/use-me';
import { colors } from '@/constants/colors';
import { COUNTRIES, flagOf } from '@/constants/countries';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useUserRatings } from '@/hooks/use-ratings';
import { useUser } from '@/hooks/use-user';
import { parseDate } from '@/lib/format-deadline';
import { GraphQLError } from '@/lib/graphql-client';
import { ratingMean } from '@/lib/ratings-api';

import { RatingStars } from '@/components/ratings/rating-stars';

const AVATAR_SIZE = 96;

export default function PublicProfile() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: user, isLoading, isFetching, error, refetch } = useUser(id);
  const ratings = useUserRatings(id);
  const { data: me } = useMe();
  const isSelf = !!me && me.id === id;

  if (isLoading) {
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

  if (error || !user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <EmptyState
          icon="questionmark.circle"
          title="Profile unavailable"
          body={
            error instanceof GraphQLError
              ? error.message
              : 'This profile could not be loaded.'
          }
        />
      </View>
    );
  }

  const country = user.country
    ? COUNTRIES.find((c) => c.code === user.country)
    : null;

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: '' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: spacing.xxxl,
          gap: spacing.xl,
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
        <View style={{ alignItems: 'center', gap: spacing.sm }}>
          <View
            style={{
              width: AVATAR_SIZE,
              height: AVATAR_SIZE,
              borderRadius: AVATAR_SIZE / 2,
              backgroundColor: colors.canvasParchment,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {user.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
            ) : (
              <ThemedText font={fonts.semiBold} size="title3" color="inkMuted48">
                {(user.fullName ?? user.email).slice(0, 1).toUpperCase()}
              </ThemedText>
            )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <ThemedText font={fonts.semiBold} size="title3" color="ink">
              {user.fullName ?? '—'}
            </ThemedText>
            {user.isVerified ? (
              <Image
                source="sf:checkmark.seal.fill"
                tintColor={colors.primary}
                style={{ width: 16, height: 16 }}
              />
            ) : null}
          </View>

          <ThemedText font={fonts.regular} size="callout" color="inkMuted48">
            {user.accountType === 'business' ? 'Business' : 'Student'}
          </ThemedText>
        </View>

        {user.accountType === 'student' && user.studentProfile ? (
          <Section title="Student details">
            {user.studentProfile.university ? (
              <Row label="University" value={user.studentProfile.university} />
            ) : null}
            {user.studentProfile.skillLevel ? (
              <Row
                label="Level"
                value={capitalize(user.studentProfile.skillLevel)}
              />
            ) : null}
            {user.studentProfile.averageRating != null ? (
              <Row
                label="Rating"
                value={`${user.studentProfile.averageRating.toFixed(1)} / 5`}
              />
            ) : null}
            {country ? (
              <Row label="Country" value={`${flagOf(country.code)}  ${country.name}`} />
            ) : null}
          </Section>
        ) : null}

        {user.accountType === 'student' ? (
          <Button
            label="View portfolio"
            variant="outline"
            onPress={() =>
              router.push({
                pathname: '/(shared)/portfolio/student/[studentId]',
                params: { studentId: user.id },
              })
            }
            fullWidth
          />
        ) : null}

        {user.accountType === 'business' && user.businessProfile ? (
          <Section title="About">
            <Row label="Company" value={user.businessProfile.companyName} />
            {user.businessProfile.industry ? (
              <Row label="Industry" value={user.businessProfile.industry} />
            ) : null}
            {country ? (
              <Row label="Country" value={`${flagOf(country.code)}  ${country.name}`} />
            ) : null}
          </Section>
        ) : null}

        {(ratings.data?.length ?? 0) > 0 ? (
          <View style={{ gap: spacing.sm }}>
            <ThemedText font={fonts.semiBold} size="callout" color="inkMuted48">
              RECENT REVIEWS
            </ThemedText>
            <View style={{ gap: spacing.xs }}>
              {ratings.data!
                .slice()
                .sort(
                  (a, b) =>
                    parseDate(b.createdAt).getTime() -
                    parseDate(a.createdAt).getTime(),
                )
                .slice(0, 5)
                .map((r) => {
                  const mean = ratingMean(r);
                  return (
                    <View
                      key={r.id}
                      style={{
                        borderRadius: radius.lg,
                        borderCurve: 'continuous',
                        borderWidth: 1,
                        borderColor: colors.hairline,
                        padding: spacing.lg,
                        gap: spacing.xs,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <RatingStars
                          value={mean != null ? Math.round(mean) : null}
                          size="sm"
                        />
                        <ThemedText
                          font={fonts.regular}
                          size="caption"
                          color="inkMuted48"
                        >
                          {parseDate(r.createdAt).toLocaleDateString()}
                        </ThemedText>
                      </View>
                      {r.comment ? (
                        <ThemedText
                          font={fonts.regular}
                          size="body"
                          color="ink"
                          selectable
                        >
                          {r.comment}
                        </ThemedText>
                      ) : (
                        <ThemedText
                          font={fonts.regular}
                          size="caption"
                          color="inkMuted48"
                        >
                          No written feedback
                        </ThemedText>
                      )}
                    </View>
                  );
                })}
            </View>
          </View>
        ) : null}

        {/* §8 moderation hook — hidden on the user's own profile, where the
            button would be a footgun. */}
        {!isSelf ? <ReportButton targetType="user" targetId={id} /> : null}
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

function Row({ label, value }: { label: string; value: string }) {
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
      <ThemedText font={fonts.regular} size="callout" color="inkMuted48">
        {label}
      </ThemedText>
      <ThemedText font={fonts.regular} size="body" color="ink" style={{ flex: 1, textAlign: 'right' }}>
        {value}
      </ThemedText>
    </View>
  );
}

function capitalize(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}
