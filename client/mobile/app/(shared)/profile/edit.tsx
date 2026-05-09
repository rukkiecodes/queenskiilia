import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { ProfileForm } from '@/components/forms/profile-form';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { useMe } from '@/hooks/use-me';
import { useUiStore } from '@/store/ui-store';

export default function ProfileEdit() {
  const router = useRouter();
  const { data: me } = useMe();
  const showToast = useUiStore((s) => s.showToast);

  if (!me) {
    return <View style={{ flex: 1, backgroundColor: colors.canvas }} />;
  }

  const handleSubmitted = () => {
    showToast('Profile saved', 'success');
    router.back();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.canvas }}
    >
      <ScrollView
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: spacing.xxxl,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <ProfileForm me={me} submitLabel="Save changes" onSubmitted={handleSubmitted} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
