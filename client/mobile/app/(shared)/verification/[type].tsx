import { Stack, useLocalSearchParams } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BusinessDocumentForm } from '@/components/verification/document-upload-form';
import { FaceCapture } from '@/components/verification/face-capture';
import { IdUploadForm } from '@/components/verification/id-upload-form';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { isValidVerificationType } from '@/lib/verification-steps';

export default function VerificationUpload() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const valid = type && isValidVerificationType(type);

  if (!valid) {
    return (
      <>
        <Stack.Screen
          options={{
            presentation: 'formSheet',
            headerShown: true,
            title: 'Upload document',
          }}
        />
        <View
          style={{
            flex: 1,
            backgroundColor: colors.canvas,
            padding: spacing.xl,
          }}
        >
          <ThemedText font={fonts.regular} size="body" color="danger">
            Unknown verification type.
          </ThemedText>
        </View>
      </>
    );
  }

  // Face capture is full-screen modal — needs the entire viewport for the camera
  // and oval guide.
  if (type === 'face') {
    return (
      <>
        <Stack.Screen
          options={{
            presentation: 'fullScreenModal',
            headerShown: false,
          }}
        />
        <FaceCapture />
      </>
    );
  }

  // ID + business doc forms render inside a formSheet
  return (
    <>
      <Stack.Screen
        options={{
          presentation: 'formSheet',
          headerShown: true,
          title: type === 'business_doc' ? 'Business registration' : 'Government ID',
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
          }}
          keyboardShouldPersistTaps="handled"
        >
          {type === 'business_doc' ? <BusinessDocumentForm /> : <IdUploadForm />}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
