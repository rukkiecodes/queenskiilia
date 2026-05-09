import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { FilePicker, type FilePickedValue } from '@/components/forms/file-picker';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useSubmitVerification } from '@/hooks/use-submit-verification';
import { GraphQLError } from '@/lib/graphql-client';
import { useUiStore } from '@/store/ui-store';

export function IdUploadForm() {
  const router = useRouter();
  const showToast = useUiStore((s) => s.showToast);
  const submit = useSubmitVerification();
  const [uploaded, setUploaded] = useState<FilePickedValue | null>(null);

  const handleSubmit = async () => {
    if (!uploaded) return;
    try {
      await submit.mutateAsync({ type: 'id_document', documentUrl: uploaded.url });
      showToast('ID submitted for review', 'success');
      router.back();
    } catch (err) {
      const msg = err instanceof GraphQLError ? err.message : 'Could not submit ID';
      showToast(msg, 'error');
    }
  };

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ gap: spacing.xs }}>
        <ThemedText font={fonts.semiBold} size="title3" color="ink">
          Government ID
        </ThemedText>
        <ThemedText font={fonts.regular} size="body" color="inkMuted48">
          Upload a clear photo of your national ID, passport, or driver’s license. Make sure the
          edges are visible and details are readable.
        </ThemedText>
      </View>

      <FilePicker
        type="image-or-camera"
        folder="verification/id"
        label="ID document"
        helper="JPG or PNG · clear, no glare"
        value={uploaded}
        onChange={setUploaded}
        showPreview
      />

      <Button
        label="Submit for review"
        onPress={handleSubmit}
        disabled={!uploaded || submit.isPending}
        loading={submit.isPending}
        fullWidth
      />
    </View>
  );
}
