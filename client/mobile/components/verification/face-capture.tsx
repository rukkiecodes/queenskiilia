import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, View, useWindowDimensions } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useSubmitVerification } from '@/hooks/use-submit-verification';
import { CloudinaryError, uploadToCloudinary } from '@/lib/cloudinary';
import { GraphQLError } from '@/lib/graphql-client';
import { useUiStore } from '@/store/ui-store';

type Phase = 'capture' | 'preview' | 'uploading';

export function FaceCapture() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const showToast = useUiStore((s) => s.showToast);
  const submit = useSubmitVerification();

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [phase, setPhase] = useState<Phase>('capture');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const ovalWidth = Math.min(width * 0.7, 280);
  const ovalHeight = ovalWidth * 1.3;

  if (!permission) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surfaceBlack }} />
    );
  }

  if (!permission.granted) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.canvas,
          padding: spacing.xl,
          gap: spacing.lg,
          justifyContent: 'center',
        }}
      >
        <ThemedText font={fonts.semiBold} size="title3" color="ink">
          Camera access needed
        </ThemedText>
        <ThemedText font={fonts.regular} size="body" color="inkMuted48">
          We need access to your front camera to take a photo for face verification. The photo is
          only used by our review team.
        </ThemedText>
        <Button label="Allow camera" onPress={requestPermission} fullWidth />
        <Button
          label="Cancel"
          variant="ghost"
          onPress={() => router.back()}
          fullWidth
        />
      </View>
    );
  }

  const capture = async () => {
    const result = await cameraRef.current?.takePictureAsync({
      quality: 0.85,
      skipProcessing: false,
    });
    if (result?.uri) {
      setPhotoUri(result.uri);
      setPhase('preview');
    }
  };

  const retake = () => {
    setPhotoUri(null);
    setPhase('capture');
  };

  const useThisPhoto = async () => {
    if (!photoUri) return;
    setPhase('uploading');
    setProgress(0);
    try {
      const uploaded = await uploadToCloudinary({
        uri: photoUri,
        folder: 'verification/face',
        resourceType: 'image',
        mimeType: 'image/jpeg',
        onProgress: setProgress,
      });
      await submit.mutateAsync({ type: 'face', documentUrl: uploaded.secureUrl });
      showToast('Selfie submitted for review', 'success');
      router.back();
    } catch (err) {
      const msg =
        err instanceof CloudinaryError
          ? err.message
          : err instanceof GraphQLError
            ? err.message
            : 'Could not submit selfie';
      showToast(msg, 'error');
      setPhase('preview');
    }
  };

  // Capture phase: live camera with oval guide
  if (phase === 'capture') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surfaceBlack }}>
        <CameraView
          ref={cameraRef}
          style={{ flex: 1 }}
          facing="front"
          mute
        />

        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: ovalWidth,
              height: ovalHeight,
              borderRadius: radius.pill,
              borderWidth: 3,
              borderColor: colors.onDark60,
            }}
          />
        </View>

        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: spacing.xxl,
            left: 0,
            right: 0,
            alignItems: 'center',
            paddingHorizontal: spacing.xl,
          }}
        >
          <ThemedText
            font={fonts.regular}
            size="body"
            color="onDark"
            style={{ textAlign: 'center' }}
          >
            Center your face in the oval
          </ThemedText>
        </View>

        <View
          style={{
            position: 'absolute',
            bottom: spacing.xxl,
            left: 0,
            right: 0,
            alignItems: 'center',
            gap: spacing.lg,
            paddingHorizontal: spacing.xl,
          }}
        >
          <Pressable
            onPress={capture}
            style={({ pressed }) => ({
              width: 76,
              height: 76,
              borderRadius: radius.pill,
              backgroundColor: colors.onDark,
              borderWidth: 4,
              borderColor: colors.onDark60,
              transform: [{ scale: pressed ? 0.92 : 1 }],
            })}
          />
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <ThemedText font={fonts.regular} size="callout" color="onDark">
              Cancel
            </ThemedText>
          </Pressable>
        </View>
      </View>
    );
  }

  // Preview / uploading phase: show captured photo with actions
  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceBlack }}>
      {photoUri ? (
        <Image
          source={{ uri: photoUri }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
        />
      ) : null}

      {phase === 'uploading' ? (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colors.scrim,
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.base,
          }}
        >
          <ActivityIndicator color={colors.onDark} size="large" />
          <ThemedText font={fonts.regular} size="body" color="onDark">
            Submitting… {progress}%
          </ThemedText>
        </View>
      ) : (
        <View
          style={{
            position: 'absolute',
            bottom: spacing.xxl,
            left: 0,
            right: 0,
            paddingHorizontal: spacing.xl,
            gap: spacing.sm,
          }}
        >
          <Button label="Use this photo" onPress={useThisPhoto} fullWidth />
          <Button label="Retake" variant="outline" onPress={retake} fullWidth />
        </View>
      )}

    </View>
  );
}
