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

export function BusinessDocumentForm() {
  const router = useRouter();
  const showToast = useUiStore((s) => s.showToast);
  const submit = useSubmitVerification();
  const [uploaded, setUploaded] = useState<FilePickedValue | null>(null);

  const handleSubmit = async () => {
    if (!uploaded) return;
    try {
      await submit.mutateAsync({ type: 'business_doc', documentUrl: uploaded.url });
      showToast('Document submitted for review', 'success');
      router.back();
    } catch (err) {
      const msg = err instanceof GraphQLError ? err.message : 'Could not submit document';
      showToast(msg, 'error');
    }
  };

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ gap: spacing.xs }}>
        <ThemedText font={fonts.semiBold} size="title3" color="ink">
          Business registration
        </ThemedText>
        <ThemedText font={fonts.regular} size="body" color="inkMuted48">
          Upload your certificate of incorporation, business permit, or recent tax filing. PDF
          preferred for multi-page documents.
        </ThemedText>
      </View>

      <FilePicker
        type="document"
        folder="verification/business"
        label="Business document"
        helper="PDF · 10MB max"
        documentTypes={['application/pdf', 'image/*']}
        value={uploaded}
        onChange={setUploaded}
        showPreview={false}
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
