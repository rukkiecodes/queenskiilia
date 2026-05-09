import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { colors } from '@/constants/colors';
import { COUNTRIES, flagOf } from '@/constants/countries';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useMe } from '@/hooks/use-me';

const AVATAR_SIZE = 96;

export default function ProfileIndex() {
  const router = useRouter();
  const { data: me, isFetching, refetch } = useMe();

  if (!me) {
    return <View style={{ flex: 1, backgroundColor: colors.canvas }} />;
  }

  const isStudent = me.accountType === 'student';
  const country = me.country ? COUNTRIES.find((c) => c.code === me.country) : null;

  return (
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
          {me.avatarUrl ? (
            <Image
              source={{ uri: me.avatarUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <ThemedText font={fonts.semiBold} size="title3" color="inkMuted48">
              {(me.fullName ?? me.email).slice(0, 1).toUpperCase()}
            </ThemedText>
          )}
        </View>

        <ThemedText font={fonts.semiBold} size="title3" color="ink">
          {me.fullName ?? '—'}
        </ThemedText>

        <ThemedText font={fonts.regular} size="callout" color="inkMuted48" selectable>
          {me.email}
        </ThemedText>

        {me.isVerified ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xxs,
              borderRadius: radius.pill,
              backgroundColor: colors.canvasParchment,
            }}
          >
            <Image
              source="sf:checkmark.seal.fill"
              tintColor={colors.primary}
              style={{ width: 14, height: 14 }}
            />
            <ThemedText font={fonts.regular} size="caption" color="primary">
              Verified
            </ThemedText>
          </View>
        ) : null}
      </View>

      <Section title="About">
        <Row label="Country">
          {country ? (
            <ThemedText font={fonts.regular} size="body" color="ink">
              {flagOf(country.code)}  {country.name}
            </ThemedText>
          ) : (
            <ThemedText font={fonts.regular} size="body" color="inkMuted48">
              —
            </ThemedText>
          )}
        </Row>
        <Row label="Account">
          <ThemedText font={fonts.regular} size="body" color="ink">
            {isStudent ? 'Student' : 'Business'}
          </ThemedText>
        </Row>
      </Section>

      {isStudent && me.studentProfile ? (
        <Section title="Student details">
          {me.studentProfile.bio ? (
            <Row label="Bio" stacked>
              <ThemedText font={fonts.regular} size="body" color="ink">
                {me.studentProfile.bio}
              </ThemedText>
            </Row>
          ) : null}
          <Row label="University">
            <ThemedText font={fonts.regular} size="body" color="ink">
              {me.studentProfile.university ?? '—'}
            </ThemedText>
          </Row>
          <Row label="Graduation">
            <ThemedText font={fonts.regular} size="body" color="ink">
              {me.studentProfile.graduationYear ?? '—'}
            </ThemedText>
          </Row>
          {me.studentProfile.skills.length > 0 ? (
            <Row label="Skills">
              <ThemedText font={fonts.regular} size="body" color="ink">
                {me.studentProfile.skills.join(', ')}
              </ThemedText>
            </Row>
          ) : null}
          <Row label="Total earnings">
            <ThemedText font={fonts.regular} size="body" color="ink">
              ${me.studentProfile.totalEarnings.toFixed(2)}
            </ThemedText>
          </Row>
          {me.studentProfile.averageRating != null ? (
            <Row label="Rating">
              <ThemedText font={fonts.regular} size="body" color="ink">
                {me.studentProfile.averageRating.toFixed(1)} / 5
              </ThemedText>
            </Row>
          ) : null}
        </Section>
      ) : null}

      {!isStudent && me.businessProfile ? (
        <Section title="Business details">
          <Row label="Company">
            <ThemedText font={fonts.regular} size="body" color="ink">
              {me.businessProfile.companyName}
            </ThemedText>
          </Row>
          <Row label="Industry">
            <ThemedText font={fonts.regular} size="body" color="ink">
              {me.businessProfile.industry ?? '—'}
            </ThemedText>
          </Row>
          {me.businessProfile.website ? (
            <Pressable hitSlop={4}>
              <Row label="Website">
                <ThemedText font={fonts.regular} size="body" color="primary">
                  {me.businessProfile.website}
                </ThemedText>
              </Row>
            </Pressable>
          ) : null}
          {me.businessProfile.description ? (
            <Row label="About" stacked>
              <ThemedText font={fonts.regular} size="body" color="ink">
                {me.businessProfile.description}
              </ThemedText>
            </Row>
          ) : null}
          <Row label="Projects posted">
            <ThemedText font={fonts.regular} size="body" color="ink">
              {me.businessProfile.totalProjectsPosted}
            </ThemedText>
          </Row>
          {me.businessProfile.averageRating != null ? (
            <Row label="Rating">
              <ThemedText font={fonts.regular} size="body" color="ink">
                {me.businessProfile.averageRating.toFixed(1)} / 5
              </ThemedText>
            </Row>
          ) : null}
        </Section>
      ) : null}

      <Button
        label="Edit profile"
        variant="outline"
        onPress={() => router.push('/(shared)/profile/edit')}
        fullWidth
      />
    </ScrollView>
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

function Row({
  label,
  children,
  stacked,
}: {
  label: string;
  children: React.ReactNode;
  stacked?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: stacked ? 'column' : 'row',
        alignItems: stacked ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        gap: stacked ? spacing.xs : spacing.base,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.dividerSoft,
      }}
    >
      <ThemedText
        font={fonts.regular}
        size="callout"
        color="inkMuted48"
        style={{ minWidth: stacked ? undefined : 90 }}
      >
        {label}
      </ThemedText>
      <View style={{ flex: stacked ? undefined : 1, alignItems: stacked ? 'flex-start' : 'flex-end' }}>
        {children}
      </View>
    </View>
  );
}
