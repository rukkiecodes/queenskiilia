import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { OtpInput } from '@/components/ui/otp-input';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useRequestOtp, useVerifyOtp } from '@/hooks/use-auth-mutations';
import { AuthApiError } from '@/lib/auth-api';
import { useAuthFlowStore } from '@/store/auth-flow-store';
import { useUiStore } from '@/store/ui-store';

const EXPIRY_SECONDS = 10 * 60;
const RESEND_AFTER = 60;

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
};

export default function OtpScreen() {
  const router = useRouter();
  const email = useAuthFlowStore((s) => s.email);
  const accountType = useAuthFlowStore((s) => s.accountType);
  const showToast = useUiStore((s) => s.showToast);
  const verify = useVerifyOtp();
  const requestOtp = useRequestOtp();

  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [remaining, setRemaining] = useState(EXPIRY_SECONDS);
  const [resendIn, setResendIn] = useState(RESEND_AFTER);
  const submittedRef = useRef('');

  useEffect(() => {
    if (!email || !accountType) {
      router.replace('/(auth)/onboarding');
    }
  }, [email, accountType, router]);

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
      setResendIn((r) => Math.max(0, r - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const handleSubmit = async (value: string) => {
    if (!email || value.length !== 6) return;
    if (submittedRef.current === value) return;
    submittedRef.current = value;
    setError(false);
    try {
      await verify.mutateAsync({ email, otp: value });
      // root layout's AuthGate redirects to dashboard
    } catch (e) {
      submittedRef.current = '';
      setError(true);
      setCode('');
      const msg = e instanceof AuthApiError ? e.message : 'Verification failed';
      showToast(msg, 'error');
    }
  };

  const resend = async () => {
    if (!email || !accountType || resendIn > 0) return;
    try {
      await requestOtp.mutateAsync({ email, accountType });
      setRemaining(EXPIRY_SECONDS);
      setResendIn(RESEND_AFTER);
      setCode('');
      showToast('Code resent', 'success');
    } catch (e) {
      const msg = e instanceof AuthApiError ? e.message : 'Could not resend';
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
          Enter the code
        </ThemedText>
        <ThemedText font={fonts.regular} size="body" color="inkMuted48">
          We sent a 6-digit code to {email ?? 'your email'}.
        </ThemedText>

        <View style={{ marginTop: spacing.lg }}>
          <OtpInput
            value={code}
            onChange={(v) => {
              setCode(v);
              if (error) setError(false);
            }}
            onComplete={handleSubmit}
            error={error}
          />
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: spacing.base,
          }}
        >
          <ThemedText
            font={fonts.regular}
            size="caption"
            color="inkMuted48"
            style={{ fontVariant: ['tabular-nums'] as never }}
          >
            Expires in {formatTime(remaining)}
          </ThemedText>

          <Pressable onPress={resend} disabled={resendIn > 0} hitSlop={8}>
            <ThemedText
              font={fonts.regular}
              size="caption"
              color={resendIn > 0 ? 'inkMuted48' : 'primary'}
            >
              {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
            </ThemedText>
          </Pressable>
        </View>

        <View style={{ flex: 1 }} />

        <Button
          label="Verify"
          onPress={() => handleSubmit(code)}
          loading={verify.isPending}
          disabled={code.length !== 6}
          fullWidth
        />
      </View>
    </KeyboardAvoidingView>
  );
}
