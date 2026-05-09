import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import type { AccountType } from '@/lib/auth-api';
import { useAuthFlowStore } from '@/store/auth-flow-store';

type Card = { key: AccountType; title: string; body: string; icon: string };

const CARDS: Card[] = [
  {
    key: 'student',
    title: 'I am a student',
    body: 'Earn money completing real projects from businesses.',
    icon: 'graduationcap.fill',
  },
  {
    key: 'business',
    title: 'I am a business',
    body: 'Hire vetted student talent for real-world projects.',
    icon: 'briefcase.fill',
  },
];

export default function AccountTypeScreen() {
  const router = useRouter();
  const setAccountType = useAuthFlowStore((s) => s.setAccountType);
  const [pick, setPick] = useState<AccountType | null>(null);

  const proceed = () => {
    if (!pick) return;
    setAccountType(pick);
    router.push('/(auth)/email');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, padding: spacing.xl }}>
      <ThemedText font={fonts.bold} size="title2" color="ink" style={{ marginBottom: spacing.sm }}>
        Choose your account
      </ThemedText>
      <ThemedText
        font={fonts.regular}
        size="body"
        color="inkMuted48"
        style={{ marginBottom: spacing.xxl }}
      >
        You can switch later in settings.
      </ThemedText>

      <View style={{ gap: spacing.base }}>
        {CARDS.map((c) => {
          const selected = pick === c.key;
          return (
            <Pressable
              key={c.key}
              onPress={() => setPick(c.key)}
              style={({ pressed }) => ({
                borderWidth: selected ? 2 : 1,
                borderColor: selected ? colors.primaryFocus : colors.hairline,
                borderRadius: radius.lg,
                borderCurve: 'continuous',
                padding: spacing.lg,
                backgroundColor: colors.canvas,
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.base,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              <Image
                source={`sf:${c.icon}`}
                tintColor={selected ? colors.primary : colors.ink}
                style={{ width: 28, height: 28 }}
              />
              <View style={{ flex: 1 }}>
                <ThemedText font={fonts.semiBold} size="headline" color="ink">
                  {c.title}
                </ThemedText>
                <ThemedText font={fonts.regular} size="callout" color="inkMuted48">
                  {c.body}
                </ThemedText>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={{ flex: 1 }} />

      <Button label="Continue" onPress={proceed} disabled={!pick} fullWidth />
    </View>
  );
}
