import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ActionSheetIOS, Alert, Platform, Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { CloudinaryError, uploadToCloudinary } from '@/lib/cloudinary';
import { useUiStore } from '@/store/ui-store';

type Props = {
  size?: number;
  value: string | null;
  onChange: (url: string | null) => void;
  folder?: string;
};

export function AvatarPicker({
  size = 112,
  value,
  onChange,
  folder = 'avatars',
}: Props) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const showToast = useUiStore((s) => s.showToast);

  const upload = async (uri: string, mimeType?: string) => {
    setBusy(true);
    setProgress(0);
    try {
      const result = await uploadToCloudinary({
        uri,
        folder,
        resourceType: 'image',
        mimeType,
        onProgress: setProgress,
      });
      onChange(result.secureUrl);
    } catch (err) {
      const msg = err instanceof CloudinaryError ? err.message : 'Upload failed';
      showToast(msg, 'error');
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  const fromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showToast('Photo library access denied', 'error');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!res.canceled && res.assets[0]) {
      await upload(res.assets[0].uri, res.assets[0].mimeType ?? 'image/jpeg');
    }
  };

  const fromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      showToast('Camera access denied', 'error');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!res.canceled && res.assets[0]) {
      await upload(res.assets[0].uri, res.assets[0].mimeType ?? 'image/jpeg');
    }
  };

  const trigger = () => {
    if (busy) return;
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: value
            ? ['Cancel', 'Take photo', 'Choose from library', 'Remove']
            : ['Cancel', 'Take photo', 'Choose from library'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: value ? 3 : undefined,
        },
        (i) => {
          if (i === 1) fromCamera();
          if (i === 2) fromGallery();
          if (i === 3) onChange(null);
        },
      );
    } else {
      Alert.alert('Profile photo', undefined, [
        { text: 'Take photo', onPress: fromCamera },
        { text: 'Choose from library', onPress: fromGallery },
        ...(value
          ? [{ text: 'Remove', style: 'destructive' as const, onPress: () => onChange(null) }]
          : []),
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  return (
    <View style={{ alignItems: 'center', gap: spacing.sm }}>
      <Pressable
        onPress={trigger}
        disabled={busy}
        style={({ pressed }) => ({
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.canvasParchment,
          borderWidth: value ? 0 : 1,
          borderColor: colors.hairline,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          opacity: busy ? 0.7 : 1,
          transform: [{ scale: pressed && !busy ? 0.97 : 1 }],
        })}
      >
        {value ? (
          <Image
            source={{ uri: value }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        ) : busy ? (
          <ThemedText font={fonts.regular} size="caption" color="primary">
            {progress}%
          </ThemedText>
        ) : (
          <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
            Add photo
          </ThemedText>
        )}
      </Pressable>

      <Pressable onPress={trigger} hitSlop={8} disabled={busy}>
        <ThemedText font={fonts.regular} size="callout" color="primary">
          {value ? 'Edit photo' : 'Add a photo'}
        </ThemedText>
      </Pressable>
    </View>
  );
}
