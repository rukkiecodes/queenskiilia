import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ActionSheetIOS, Alert, Platform, Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import {
  CloudinaryError,
  uploadToCloudinary,
  type ResourceType,
} from '@/lib/cloudinary';
import { useUiStore } from '@/store/ui-store';

type Pickable = 'image' | 'image-or-camera' | 'document';

export type FilePickedValue = {
  url: string;
  publicId: string;
  bytes: number;
  resourceType: ResourceType;
};

type Props = {
  /** what the user is allowed to pick */
  type: Pickable;
  /** sub-folder under EXPO_PUBLIC_CLOUDINARY_FOLDER */
  folder?: string;
  /** label rendered above the field */
  label?: string;
  /** helper text below the field (mime, max size, etc) */
  helper?: string;
  /** required indicator next to label */
  required?: boolean;
  /** controlled value (the uploaded URL+meta) */
  value?: FilePickedValue | null;
  onChange: (value: FilePickedValue | null) => void;
  /** image preview when value is an image */
  showPreview?: boolean;
  /** PDFs only — pass to expo-document-picker */
  documentTypes?: string[];
};

export function FilePicker({
  type,
  folder,
  label,
  helper,
  required,
  value,
  onChange,
  showPreview = true,
  documentTypes,
}: Props) {
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const showToast = useUiStore((s) => s.showToast);

  const startUpload = async (uri: string, mimeType?: string, fileName?: string) => {
    setBusy(true);
    setProgress(0);
    try {
      const resourceType: ResourceType =
        type === 'document' ? (mimeType?.startsWith('image/') ? 'image' : 'raw') : 'image';
      const result = await uploadToCloudinary({
        uri,
        folder,
        resourceType,
        mimeType,
        fileName,
        onProgress: setProgress,
      });
      onChange({
        url: result.secureUrl,
        publicId: result.publicId,
        bytes: result.bytes,
        resourceType: result.resourceType,
      });
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
      quality: 0.85,
    });
    if (!res.canceled && res.assets[0]) {
      const a = res.assets[0];
      await startUpload(a.uri, a.mimeType ?? 'image/jpeg', a.fileName ?? undefined);
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
      quality: 0.85,
    });
    if (!res.canceled && res.assets[0]) {
      const a = res.assets[0];
      await startUpload(a.uri, a.mimeType ?? 'image/jpeg', a.fileName ?? undefined);
    }
  };

  const fromDocument = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: documentTypes ?? '*/*',
      copyToCacheDirectory: true,
    });
    if (!res.canceled && res.assets[0]) {
      const a = res.assets[0];
      await startUpload(a.uri, a.mimeType ?? undefined, a.name);
    }
  };

  const trigger = () => {
    if (busy) return;
    if (type === 'image') return fromGallery();
    if (type === 'document') return fromDocument();

    // image-or-camera → action sheet
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take photo', 'Choose from library'],
          cancelButtonIndex: 0,
        },
        (i) => {
          if (i === 1) fromCamera();
          if (i === 2) fromGallery();
        }
      );
    } else {
      Alert.alert('Add photo', undefined, [
        { text: 'Take photo', onPress: fromCamera },
        { text: 'Choose from library', onPress: fromGallery },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const clear = () => onChange(null);

  const hasImagePreview = showPreview && value && value.resourceType === 'image';

  return (
    <View style={{ gap: spacing.xs, alignSelf: 'stretch' }}>
      {label ? (
        <ThemedText font={fonts.semiBold} size="callout" color="ink">
          {label}
          {required ? (
            <ThemedText font={fonts.semiBold} size="callout" color="danger">
              {' *'}
            </ThemedText>
          ) : null}
        </ThemedText>
      ) : null}

      <Pressable
        onPress={trigger}
        disabled={busy}
        style={({ pressed }) => ({
          borderWidth: 1,
          borderColor: value ? colors.primary : colors.hairline,
          borderRadius: radius.lg,
          borderCurve: 'continuous',
          padding: spacing.lg,
          backgroundColor: colors.canvas,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 120,
          gap: spacing.sm,
          opacity: busy ? 0.7 : 1,
          transform: [{ scale: pressed && !busy ? 0.98 : 1 }],
        })}
      >
        {hasImagePreview ? (
          <Image
            source={{ uri: value!.url }}
            style={{
              width: '100%',
              aspectRatio: 4 / 3,
              borderRadius: radius.md,
            }}
            contentFit="cover"
          />
        ) : null}

        {busy ? (
          <>
            <ThemedText font={fonts.regular} size="body" color="primary">
              Uploading… {progress}%
            </ThemedText>
            <View
              style={{
                height: 4,
                backgroundColor: colors.hairline,
                borderRadius: radius.pill,
                width: '100%',
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  backgroundColor: colors.primary,
                }}
              />
            </View>
          </>
        ) : value ? (
          <ThemedText font={fonts.regular} size="callout" color="primary">
            Uploaded · tap to replace
          </ThemedText>
        ) : (
          <>
            <ThemedText font={fonts.regular} size="body" color="ink">
              {type === 'document'
                ? 'Tap to choose a file'
                : type === 'image-or-camera'
                  ? 'Tap to add a photo'
                  : 'Tap to choose an image'}
            </ThemedText>
            {helper ? (
              <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
                {helper}
              </ThemedText>
            ) : null}
          </>
        )}
      </Pressable>

      {value && !busy ? (
        <Pressable onPress={clear} hitSlop={8} style={{ alignSelf: 'flex-end' }}>
          <ThemedText font={fonts.regular} size="caption" color="danger">
            Remove
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}
