import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { Stack, useRouter, type Href } from 'expo-router';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useMe } from '@/hooks/use-me';
import { useAuthStore } from '@/store/auth-store';

type Row = {
  icon: string;
  label: string;
  href?: Href;
  description?: string;
};

type Section = {
  title: string;
  rows: Row[];
};

const SECTIONS: Section[] = [
  {
    title: 'Preferences',
    rows: [
      {
        icon: 'bell',
        label: 'Notifications',
        href: '/(shared)/settings/notifications',
      },
    ],
  },
  {
    title: 'Support',
    rows: [
      { icon: 'questionmark.circle', label: 'Help', href: '/(shared)/settings/help' },
      { icon: 'info.circle', label: 'About', href: '/(shared)/settings/about' },
    ],
  },
  {
    title: 'Legal',
    rows: [
      { icon: 'doc.text', label: 'Terms of Service', href: '/(shared)/settings/terms' },
      { icon: 'hand.raised', label: 'Privacy Policy', href: '/(shared)/settings/privacy' },
    ],
  },
];

export default function SettingsHome() {
  const router = useRouter();
  const authUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  // `useMe` carries avatarUrl + fullName; the auth-store user only carries
  // the identity bits returned by /auth/verify-otp.
  const { data: me } = useMe();
  const displayName = me?.fullName ?? authUser?.email ?? 'Your profile';
  const email = authUser?.email ?? me?.email ?? '';
  const avatarUrl = me?.avatarUrl ?? null;

  const confirmLogout = () => {
    Alert.alert(
      'Sign out?',
      'You can sign back in anytime with your email.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: () => logout() },
      ],
      { cancelable: true },
    );
  };

  const version = Constants.expoConfig?.version ?? '—';

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Settings' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.lg,
          gap: spacing.xl,
        }}
        style={{ flex: 1, backgroundColor: colors.canvas }}
      >
        {/* Profile preview — tap to edit */}
        <Pressable
          onPress={() => router.push('/(shared)/profile')}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.base,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.base,
            borderRadius: radius.lg,
            borderCurve: 'continuous',
            backgroundColor: pressed ? colors.canvasParchment : colors.surfacePearl,
          })}
        >
          {avatarUrl ? (
            <Image
              source={avatarUrl}
              style={{ width: 56, height: 56, borderRadius: radius.pill }}
              contentFit="cover"
            />
          ) : (
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: radius.pill,
                backgroundColor: colors.canvasParchment,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Image
                source="sf:person"
                tintColor={colors.inkMuted48}
                style={{ width: 24, height: 24 }}
              />
            </View>
          )}
          <View style={{ flex: 1, gap: spacing.xxs }}>
            <ThemedText font={fonts.semiBold} size="body" color="ink" numberOfLines={1}>
              {displayName}
            </ThemedText>
            <ThemedText
              font={fonts.regular}
              size="caption"
              color="inkMuted48"
              numberOfLines={1}
            >
              {email}
            </ThemedText>
          </View>
          <Image
            source="sf:chevron.right"
            tintColor={colors.inkMuted48}
            style={{ width: 14, height: 14 }}
          />
        </Pressable>

        {/* Verification quick link */}
        <Pressable
          onPress={() => router.push('/(shared)/verification')}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.base,
            paddingVertical: spacing.base,
            paddingHorizontal: spacing.base,
            borderRadius: radius.lg,
            borderCurve: 'continuous',
            backgroundColor: pressed ? colors.canvasParchment : colors.surfacePearl,
          })}
        >
          <Image
            source="sf:checkmark.seal"
            tintColor={colors.primary}
            style={{ width: 22, height: 22 }}
          />
          <ThemedText font={fonts.regular} size="body" color="ink" style={{ flex: 1 }}>
            Verification
          </ThemedText>
          <Image
            source="sf:chevron.right"
            tintColor={colors.inkMuted48}
            style={{ width: 14, height: 14 }}
          />
        </Pressable>

        {SECTIONS.map((section) => (
          <View key={section.title} style={{ gap: spacing.sm }}>
            <ThemedText
              font={fonts.semiBold}
              size="caption"
              color="inkMuted48"
              style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
            >
              {section.title}
            </ThemedText>
            <View
              style={{
                borderRadius: radius.lg,
                borderCurve: 'continuous',
                backgroundColor: colors.surfacePearl,
                overflow: 'hidden',
              }}
            >
              {section.rows.map((row, idx) => (
                <Pressable
                  key={row.label}
                  onPress={() => row.href && router.push(row.href)}
                  disabled={!row.href}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.base,
                    paddingVertical: spacing.base,
                    paddingHorizontal: spacing.base,
                    backgroundColor:
                      pressed && row.href ? colors.canvasParchment : 'transparent',
                    borderTopWidth: idx === 0 ? 0 : 1,
                    borderTopColor: colors.dividerSoft,
                  })}
                >
                  <Image
                    source={`sf:${row.icon}`}
                    tintColor={colors.inkMuted80}
                    style={{ width: 22, height: 22 }}
                  />
                  <ThemedText
                    font={fonts.regular}
                    size="body"
                    color="ink"
                    style={{ flex: 1 }}
                  >
                    {row.label}
                  </ThemedText>
                  <Image
                    source="sf:chevron.right"
                    tintColor={colors.inkMuted48}
                    style={{ width: 14, height: 14 }}
                  />
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        {/* Account section — destructive actions live alone at the bottom */}
        <View style={{ gap: spacing.sm }}>
          <ThemedText
            font={fonts.semiBold}
            size="caption"
            color="inkMuted48"
            style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
          >
            Account
          </ThemedText>
          <View style={{ gap: spacing.md }}>
            <Button label="Sign out" variant="outline" onPress={confirmLogout} fullWidth />
            <Button
              label="Delete account"
              variant="danger"
              onPress={() => router.push('/(shared)/settings/delete-account')}
              fullWidth
            />
          </View>
        </View>

        <View
          style={{
            alignItems: 'center',
            paddingTop: spacing.lg,
            paddingBottom: spacing.xl,
          }}
        >
          <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
            QueenSkiilia · v{version}
          </ThemedText>
        </View>
      </ScrollView>
    </>
  );
}
