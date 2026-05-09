import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { ProfileForm } from '@/components/forms/profile-form';
import { ThemedText } from '@/components/themed-text';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useMe } from '@/hooks/use-me';

export default function ProfileSetup() {
  const { data: me } = useMe();

  if (!me) {
    return <View style={{ flex: 1, backgroundColor: colors.canvas }} />;
  }

  const isStudent = me.accountType === 'student';

  return (
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
          <ThemedText font={fonts.bold} size="title2" color="ink">
            Set up your profile
          </ThemedText>
          <ThemedText font={fonts.regular} size="body" color="inkMuted48">
            {isStudent
              ? 'Tell businesses who you are and where you study.'
              : "Tell students who you are and what your company does."}
          </ThemedText>
        </View>

        <ProfileForm me={me} submitLabel="Save and continue" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
