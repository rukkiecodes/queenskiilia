import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { colors, type ColorToken } from '@/constants/colors';
import { COUNTRIES, flagOf } from '@/constants/countries';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import type { PublicUser } from '@/lib/profile-api';

type Props = {
  user: PublicUser;
  onPress: () => void;
};

const LEVEL_PALETTE: Record<string, { bg: ColorToken; fg: ColorToken }> = {
  beginner:     { bg: 'canvasParchment', fg: 'inkMuted80' },
  intermediate: { bg: 'canvasParchment', fg: 'primary' },
  advanced:     { bg: 'primary',         fg: 'onPrimary' },
  expert:       { bg: 'primary',         fg: 'onPrimary' },
};

const MAX_VISIBLE_SKILLS = 3;

export function UserCard({ user, onPress }: Props) {
  const skills = user.studentProfile?.skills ?? [];
  const visibleSkills = skills.slice(0, MAX_VISIBLE_SKILLS);
  const overflow = skills.length - visibleSkills.length;
  const level = user.studentProfile?.skillLevel;
  const rating = user.studentProfile?.averageRating;
  const country = user.country ? COUNTRIES.find((c) => c.code === user.country) : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: colors.hairline,
        backgroundColor: colors.canvas,
        padding: spacing.lg,
        gap: spacing.sm,
        transform: [{ scale: pressed ? 0.99 : 1 }],
      })}
    >
      <View style={{ flexDirection: 'row', gap: spacing.base, alignItems: 'center' }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
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
            <ThemedText font={fonts.semiBold} size="body" color="inkMuted48">
              {(user.fullName ?? user.email).slice(0, 1).toUpperCase()}
            </ThemedText>
          )}
        </View>

        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <ThemedText
              font={fonts.semiBold}
              size="body"
              color="ink"
              numberOfLines={1}
              style={{ flex: 1 }}
            >
              {user.fullName ?? 'Student'}
            </ThemedText>
            {user.isVerified ? (
              <Image
                source="sf:checkmark.seal.fill"
                tintColor={colors.primary}
                style={{ width: 14, height: 14 }}
              />
            ) : null}
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
              flexWrap: 'wrap',
            }}
          >
            {level ? <LevelChip level={level} /> : null}
            {rating != null ? (
              <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
                ★ {rating.toFixed(1)}
              </ThemedText>
            ) : null}
            {country ? (
              <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
                {flagOf(country.code)} {country.name}
              </ThemedText>
            ) : null}
          </View>
        </View>
      </View>

      {user.studentProfile?.university ? (
        <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
          {user.studentProfile.university}
        </ThemedText>
      ) : null}

      {visibleSkills.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
          {visibleSkills.map((skill) => (
            <SkillChip key={skill} label={skill} />
          ))}
          {overflow > 0 ? <SkillChip label={`+${overflow}`} /> : null}
        </View>
      ) : null}
    </Pressable>
  );
}

function LevelChip({ level }: { level: string }) {
  const c = LEVEL_PALETTE[level] ?? LEVEL_PALETTE.beginner;
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
        {level[0].toUpperCase() + level.slice(1)}
      </ThemedText>
    </View>
  );
}

function SkillChip({ label }: { label: string }) {
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
        {label}
      </ThemedText>
    </View>
  );
}
