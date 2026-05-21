import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  View,
} from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { colors, type ColorToken } from '@/constants/colors';
import { COUNTRIES, flagOf, type Country } from '@/constants/countries';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useMe } from '@/hooks/use-me';
import { useTalentSearch } from '@/hooks/use-talent-search';
import { countryPickerBus } from '@/lib/country-picker-bus';
import type { PublicUser } from '@/lib/profile-api';

const LEVELS = [
  { value: null, label: 'All' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
];

const MEDAL_TINT: ColorToken[] = ['primary', 'inkMuted80', 'inkMuted48'];

export default function Leaderboard() {
  const router = useRouter();
  const me = useMe();
  const [skillLevel, setSkillLevel] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);

  const query = useTalentSearch({
    skillLevel: skillLevel ?? undefined,
    country: country ?? undefined,
  });

  const ranked = (query.data?.pages ?? []).flat();
  const myIndex = ranked.findIndex((u) => u.id === me.data?.id);
  const countryName = country
    ? COUNTRIES.find((c) => c.code === country)?.name
    : null;

  const pickCountry = () => {
    countryPickerBus.expect((picked: Country | null) => {
      if (picked) setCountry(picked.code);
    });
    router.push('/country-picker');
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Leaderboard' }} />
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <FlatList
          contentInsetAdjustmentBehavior="automatic"
          data={ranked}
          keyExtractor={(u) => u.id}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.xxxl,
            flexGrow: 1,
          }}
          ListHeaderComponent={
            <View style={{ paddingVertical: spacing.sm, gap: spacing.sm }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: spacing.xs }}
              >
                {LEVELS.map((l) => (
                  <FilterPill
                    key={l.label}
                    label={l.label}
                    active={skillLevel === l.value}
                    onPress={() => setSkillLevel(l.value)}
                  />
                ))}
              </ScrollView>
              <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                <FilterPill
                  label={
                    countryName
                      ? `${flagOf(country!)} ${countryName}`
                      : 'Any country'
                  }
                  active={country != null}
                  onPress={pickCountry}
                />
                {country != null ? (
                  <FilterPill
                    label="Clear"
                    active={false}
                    onPress={() => setCountry(null)}
                  />
                ) : null}
              </View>
            </View>
          }
          renderItem={({ item, index }) => (
            <LeaderboardRow
              user={item}
              rank={index + 1}
              isMe={item.id === me.data?.id}
              onPress={() =>
                router.push({
                  pathname: '/(shared)/profile/[id]',
                  params: { id: item.id },
                })
              }
            />
          )}
          ItemSeparatorComponent={() => (
            <View
              style={{
                height: 1,
                backgroundColor: colors.dividerSoft,
                marginLeft: 44,
              }}
            />
          )}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) {
              query.fetchNextPage();
            }
          }}
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <View style={{ paddingVertical: spacing.xl }}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            query.isLoading ? (
              <View
                style={{ paddingVertical: spacing.huge, alignItems: 'center' }}
              >
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : (
              <EmptyState
                icon="chart.bar"
                title="No ranked students"
                body="Try clearing the filters."
              />
            )
          }
        />

        {!query.isLoading && ranked.length > 0 ? (
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: colors.hairline,
              backgroundColor: colors.canvasParchment,
              paddingHorizontal: spacing.xl,
              paddingVertical: spacing.base,
            }}
          >
            <ThemedText font={fonts.semiBold} size="callout" color="ink">
              {myIndex >= 0
                ? `Your rank: #${myIndex + 1}`
                : `You're outside the top ${ranked.length}`}
            </ThemedText>
          </View>
        ) : null}
      </View>
    </>
  );
}

function LeaderboardRow({
  user,
  rank,
  isMe,
  onPress,
}: {
  user: PublicUser;
  rank: number;
  isMe: boolean;
  onPress: () => void;
}) {
  const rating = user.studentProfile?.averageRating;
  const level = user.studentProfile?.skillLevel;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xs,
        borderRadius: radius.md,
        borderCurve: 'continuous',
        backgroundColor: isMe ? colors.canvasParchment : colors.canvas,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View style={{ width: 28, alignItems: 'center' }}>
        {rank <= 3 ? (
          <Image
            source="sf:medal.fill"
            tintColor={colors[MEDAL_TINT[rank - 1]]}
            style={{ width: 20, height: 20 }}
          />
        ) : (
          <ThemedText font={fonts.semiBold} size="callout" color="inkMuted48">
            {rank}
          </ThemedText>
        )}
      </View>

      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
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
          <ThemedText font={fonts.semiBold} size="callout" color="inkMuted48">
            {(user.fullName ?? user.email).slice(0, 1).toUpperCase()}
          </ThemedText>
        )}
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}
        >
          <ThemedText
            font={fonts.semiBold}
            size="body"
            color="ink"
            numberOfLines={1}
            style={{ flexShrink: 1 }}
          >
            {user.fullName ?? 'Student'}
          </ThemedText>
          {user.isVerified ? (
            <Image
              source="sf:checkmark.seal.fill"
              tintColor={colors.primary}
              style={{ width: 13, height: 13 }}
            />
          ) : null}
        </View>
        {level ? (
          <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
            {level[0].toUpperCase() + level.slice(1)}
          </ThemedText>
        ) : null}
      </View>

      <ThemedText font={fonts.semiBold} size="callout" color="ink">
        {rating != null ? `★ ${rating.toFixed(1)}` : '—'}
      </ThemedText>
    </Pressable>
  );
}

function FilterPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: spacing.base,
        paddingVertical: spacing.sm,
        borderRadius: radius.pill,
        backgroundColor: active ? colors.primary : colors.canvasParchment,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}
    >
      <ThemedText
        font={fonts.regular}
        size="caption"
        color={active ? 'onPrimary' : 'ink'}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}
