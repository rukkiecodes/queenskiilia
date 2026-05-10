import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { colors } from '@/constants/colors';
import { COUNTRIES, flagOf } from '@/constants/countries';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useUser } from '@/hooks/use-user';
import { GraphQLError } from '@/lib/graphql-client';

const AVATAR_SIZE = 96;

export default function PublicProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: user, isLoading, isFetching, error, refetch } = useUser(id);

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
