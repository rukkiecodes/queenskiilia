import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, View } from 'react-native';
import { z } from 'zod';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useRequestOtp } from '@/hooks/use-auth-mutations';
import { AuthApiError } from '@/lib/auth-api';
import { useAuthFlowStore } from '@/store/auth-flow-store';
import { useUiStore } from '@/store/ui-store';

const emailSchema = z.string().email('Enter a valid email');

export default function EmailScreen() {
  const router = useRouter();
  const accountType = useAuthFlowStore((s) => s.accountType);
  const setEmailInFlow = useAuthFlowStore((s) => s.setEmail);
  const showToast = useUiStore((s) => s.showToast);
  const requestOtp = useRequestOtp();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();

  const submit = async () => {
    if (!accountType) {
      router.replace('/(auth)/account-type');
      return;
    }
    const parsed = emailSchema.safeParse(email.trim().toLowerCase());
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setError(undefined);
    try {
      await requestOtp.mutateAsync({ email: parsed.data, accountType });
      setEmailInFlow(parsed.data);
      router.push('/(auth)/otp');
    } catch (e) {
      const msg = e instanceof AuthApiError ? e.message : 'Could not send code';
      showToast(msg, 'error');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.canvas }}
    >
      <View style={{ flex: 1, padding: spacing.xl, gap: spacing.lg }}>
        <ThemedText font={fonts.bold} size="title2" color="ink">
          What’s your email?
        </ThemedText>
        <ThemedText font={fonts.regular} size="body" color="inkMuted48">
          We’ll send you a 6-digit code to sign in.
        </ThemedText>

        <Input
          label="Email"
          leftIcon="envelope"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            if (error) setError(undefined);
          }}
          error={error}
          placeholder="you@example.com"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          inputMode="email"
          returnKeyType="send"
          onSubmitEditing={submit}
        />

        <View style={{ flex: 1 }} />

        <Button
          label="Send code"
          onPress={submit}
          loading={requestOtp.isPending}
          disabled={!email}
          fullWidth
        />
      </View>
    </KeyboardAvoidingView>
  );
}
