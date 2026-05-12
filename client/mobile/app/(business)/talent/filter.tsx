import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';

import { CountryField } from '@/components/forms/country-field';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useTalentFiltersStore } from '@/store/talent-filters-store';

const LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
];

const RATING_OPTIONS = [
  { value: null, label: 'Any' },
  { value: 3, label: '3.0+' },
  { value: 4, label: '4.0+' },
  { value: 4.5, label: '4.5+' },
];

export default function TalentFilter() {
  const router = useRouter();
  const filters = useTalentFiltersStore();

  const [skillLevel, setSkillLevel] = useState<string | null>(filters.skillLevel);
  const [country, setCountry] = useState<string | null>(filters.country);
  const [minRating, setMinRating] = useState<number | null>(filters.minRating);

  const apply = () => {
    filters.setSkillLevel(skillLevel);
    filters.setCountry(country);
    filters.setMinRating(minRating);
    router.back();
  };

  const clear = () => {
    filters.reset();
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          presentation: 'formSheet',
          headerShown: true,
          title: 'Filters',
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
          <View style={{ gap: spacing.xs }}>
            <ThemedText font={fonts.semiBold} size="callout" color="ink">
              Skill level
            </ThemedText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
              <Pill
                label="Any"
                active={skillLevel == null}
                onPress={() => setSkillLevel(null)}
              />
              {LEVELS.map((l) => (
                <Pill
                  key={l.value}
                  label={l.label}
                  active={skillLevel === l.value}
                  onPress={() => setSkillLevel(l.value)}
                />
              ))}
            </View>
          </View>

          <CountryField
            label="Country"
            value={country}
            onChange={(c) => setCountry(c)}
            placeholder="Any country"
          />

          <View style={{ gap: spacing.xs }}>
            <ThemedText font={fonts.semiBold} size="callout" color="ink">
              Minimum rating
            </ThemedText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
              {RATING_OPTIONS.map((r) => (
                <Pill
                  key={r.label}
                  label={r.label}
                  active={minRating === r.value}
                  onPress={() => setMinRating(r.value)}
                />
              ))}
            </View>
          </View>

          <View style={{ gap: spacing.sm, marginTop: spacing.base }}>
            <Button label="Apply" onPress={apply} fullWidth />
            <Button label="Clear all" variant="ghost" onPress={clear} fullWidth />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

function Pill({
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
