import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useDeleteAccount } from '@/hooks/use-delete-account';
import { GraphQLError } from '@/lib/graphql-client';
import { useAuthStore } from '@/store/auth-store';

const REQUIRED = 'DELETE';

type Removed = { icon: string; label: string };

const REMOVED: Removed[] = [
  { icon: 'person.crop.circle', label: 'Profile, avatar, and bio' },
  { icon: 'photo.on.rectangle', label: 'Portfolio items and uploaded files' },
  { icon: 'star', label: 'Ratings, reviews, and disputes' },
  { icon: 'briefcase', label: 'Project applications and submissions' },
  { icon: 'bubble.left.and.bubble.right', label: 'Chat history' },
  { icon: 'bell', label: 'Notification history and preferences' },
];

const RETAINED: Removed[] = [
  {
    icon: 'doc.text',
    label: 'Transaction records (kept as required by local tax and anti-fraud regulations)',
  },
];

export default function DeleteAccount() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const deleteAccount = useDeleteAccount();
  const [confirmation, setConfirmation] = useState('');

  const canSubmit = confirmation === REQUIRED && !deleteAccount.isPending;

  const onSubmit = () => {
    Alert.alert(
      'Delete account permanently?',
      'You have 30 days to recover by contacting support. After that, this is irreversible.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteAccount.mutate(REQUIRED, {
              onSuccess: async () => {
                // logout() clears SecureStore, wipes the in-memory store, and
                // the AuthGate at the root routes the now-unauthed session
                // back to the onboarding flow on its next render.
                await logout();
                // Belt-and-braces: pop back to the root in case the gate
                // hasn't re-rendered yet (rare on fast devices but cheap).
                router.replace('/');
              },
              onError: (err) => {
                const message =
                  err instanceof GraphQLError
                    ? err.message
                    : 'Something went wrong. Try again in a moment.';
                Alert.alert('Couldn’t delete account', message);
              },
            });
          },
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Delete account' }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingVertical: spacing.xl,
            paddingHorizontal: spacing.lg,
            gap: spacing.xl,
          }}
          style={{ flex: 1, backgroundColor: colors.canvas }}
        >
          <View style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Image
                source="sf:exclamationmark.triangle"
                tintColor={colors.danger}
                style={{ width: 22, height: 22 }}
              />
              <ThemedText font={fonts.bold} size="title3" color="ink">
                This can’t be undone
              </ThemedText>
            </View>
            <ThemedText font={fonts.regular} size="body" color="inkMuted80">
              Your account is soft-deleted immediately and permanently removed
              after 30 days. To recover within that window, email support from
              your registered address.
            </ThemedText>
          </View>

          <View style={{ gap: spacing.sm }}>
            <ThemedText
              font={fonts.semiBold}
              size="caption"
              color="inkMuted48"
              style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
            >
              What gets removed
            </ThemedText>
            <View
              style={{
                borderRadius: radius.lg,
                borderCurve: 'continuous',
                backgroundColor: colors.surfacePearl,
                overflow: 'hidden',
              }}
            >
              {REMOVED.map((row, idx) => (
                <View
                  key={row.label}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.base,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.base,
                    borderTopWidth: idx === 0 ? 0 : 1,
                    borderTopColor: colors.dividerSoft,
                  }}
                >
                  <Image
                    source={`sf:${row.icon}`}
                    tintColor={colors.danger}
                    style={{ width: 18, height: 18 }}
                  />
                  <ThemedText
                    font={fonts.regular}
                    size="body"
                    color="ink"
                    style={{ flex: 1 }}
                  >
                    {row.label}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>

          <View style={{ gap: spacing.sm }}>
            <ThemedText
              font={fonts.semiBold}
              size="caption"
              color="inkMuted48"
              style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
            >
              What we keep
            </ThemedText>
            <View
              style={{
                borderRadius: radius.lg,
                borderCurve: 'continuous',
                backgroundColor: colors.surfacePearl,
                overflow: 'hidden',
              }}
            >
              {RETAINED.map((row, idx) => (
                <View
                  key={row.label}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: spacing.base,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.base,
                    borderTopWidth: idx === 0 ? 0 : 1,
                    borderTopColor: colors.dividerSoft,
                  }}
                >
                  <Image
                    source={`sf:${row.icon}`}
                    tintColor={colors.inkMuted80}
                    style={{ width: 18, height: 18, marginTop: 2 }}
                  />
                  <ThemedText
                    font={fonts.regular}
                    size="callout"
                    color="inkMuted80"
                    style={{ flex: 1 }}
                  >
                    {row.label}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>

          <View style={{ gap: spacing.sm }}>
            <Input
              label={`Type ${REQUIRED} to confirm`}
              value={confirmation}
              onChangeText={setConfirmation}
              autoCapitalize="characters"
              autoCorrect={false}
              spellCheck={false}
              placeholder={REQUIRED}
              hint="The action button stays disabled until this matches exactly."
            />
          </View>

          <Button
            label={deleteAccount.isPending ? 'Deleting…' : 'Delete my account'}
            variant="danger"
            onPress={onSubmit}
            disabled={!canSubmit}
            loading={deleteAccount.isPending}
            fullWidth
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
