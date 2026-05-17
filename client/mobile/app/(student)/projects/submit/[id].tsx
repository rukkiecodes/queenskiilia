import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useSubmitWork } from '@/hooks/use-submissions';
import {
  CloudinaryError,
  uploadToCloudinary,
  type ResourceType,
} from '@/lib/cloudinary';
import { GraphQLError } from '@/lib/graphql-client';
import { useUiStore } from '@/store/ui-store';

type Attached = {
  url: string;
  isImage: boolean;
  label: string;
};

const MAX_FILES = 8;
const MAX_FILE_MB = 5;

export default function SubmitWork() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const showToast = useUiStore((s) => s.showToast);
  const submit = useSubmitWork();

  const [files, setFiles] = useState<Attached[]>([]);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  const addFile = (a: Attached) =>
    setFiles((prev) => (prev.length >= MAX_FILES ? prev : [...prev, a]));

  const removeFile = (url: string) =>
    setFiles((prev) => prev.filter((a) => a.url !== url));

  const upload = async (
    uri: string,
    mimeType: string | undefined,
    fileName: string,
    resourceType: ResourceType,
  ) => {
    setUploading(true);
    try {
      const result = await uploadToCloudinary({
        uri,
        folder: `submissions/${id}`,
        resourceType,
        mimeType,
        fileName,
      });
      addFile({
        url: result.secureUrl,
        isImage: result.resourceType === 'image',
        label: fileName,
      });
    } catch (err) {
      const msg = err instanceof CloudinaryError ? err.message : 'Upload failed';
      showToast(msg, 'error');
    } finally {
      setUploading(false);
    }
  };

  const fromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return showToast('Photo library access denied', 'error');
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.85,
    });
    if (!res.canceled && res.assets[0]) {
      const a = res.assets[0];
      const fileName = a.fileName ?? `image-${Date.now()}.jpg`;
      await upload(a.uri, a.mimeType ?? 'image/jpeg', fileName, 'image');
    }
  };

  const fromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return showToast('Camera access denied', 'error');
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      quality: 0.85,
    });
    if (!res.canceled && res.assets[0]) {
      const a = res.assets[0];
      const fileName = a.fileName ?? `image-${Date.now()}.jpg`;
      await upload(a.uri, a.mimeType ?? 'image/jpeg', fileName, 'image');
    }
  };

  const fromDocument = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*', 'application/zip', '*/*'],
      copyToCacheDirectory: true,
    });
    if (!res.canceled && res.assets[0]) {
      const a = res.assets[0];
      if (a.size && a.size > MAX_FILE_MB * 1024 * 1024) {
        showToast(`File over ${MAX_FILE_MB}MB`, 'error');
        return;
      }
      const isImage = (a.mimeType ?? '').startsWith('image/');
      await upload(
        a.uri,
        a.mimeType ?? undefined,
        a.name,
        isImage ? 'image' : 'raw',
      );
    }
  };

  const pickFile = () => {
    if (files.length >= MAX_FILES) {
      showToast(`Max ${MAX_FILES} files`, 'error');
      return;
    }
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take photo', 'Photos', 'Files / PDF'],
          cancelButtonIndex: 0,
        },
        (i) => {
          if (i === 1) fromCamera();
          else if (i === 2) fromGallery();
          else if (i === 3) fromDocument();
        },
      );
    } else {
      Alert.alert('Add file', undefined, [
        { text: 'Take photo', onPress: fromCamera },
        { text: 'Photos', onPress: fromGallery },
        { text: 'Files / PDF', onPress: fromDocument },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const handleSubmit = async () => {
    if (!id) return;
    if (files.length === 0) {
      showToast('Add at least one file', 'error');
      return;
    }
    try {
      await submit.mutateAsync({
        projectId: id,
        fileUrls: files.map((f) => f.url),
        notes: notes.trim() || undefined,
      });
      showToast('Work submitted for review', 'success');
      router.back();
    } catch (err) {
      const msg =
        err instanceof GraphQLError ? err.message : 'Could not submit';
      showToast(msg, 'error');
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          presentation: 'formSheet',
          headerShown: true,
          title: 'Submit work',
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
            gap: spacing.lg,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedText font={fonts.regular} size="body" color="inkMuted48">
            Attach your deliverables and add a short note describing what you’ve
            submitted. Up to {MAX_FILES} files, {MAX_FILE_MB}MB each.
          </ThemedText>

          {files.length > 0 ? (
            <View style={{ gap: spacing.xs }}>
              {files.map((f) => (
                <View
                  key={f.url}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.sm,
                    padding: spacing.sm,
                    borderRadius: radius.md,
                    borderCurve: 'continuous',
                    backgroundColor: colors.canvasParchment,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: radius.md,
                      backgroundColor: colors.canvas,
                      overflow: 'hidden',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {f.isImage ? (
                      <Image
                        source={{ uri: f.url }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                      />
                    ) : (
                      <Image
                        source="sf:doc.fill"
                        tintColor={colors.inkMuted48}
                        style={{ width: 20, height: 20 }}
                      />
                    )}
                  </View>
                  <ThemedText
                    font={fonts.regular}
                    size="callout"
                    color="ink"
                    style={{ flex: 1 }}
                    numberOfLines={1}
                  >
                    {f.label}
                  </ThemedText>
                  <Pressable onPress={() => removeFile(f.url)} hitSlop={6}>
                    <Image
                      source="sf:xmark.circle.fill"
                      tintColor={colors.inkMuted48}
                      style={{ width: 20, height: 20 }}
                    />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}

          <Button
            label={uploading ? 'Uploading…' : 'Add file'}
            variant="outline"
            onPress={pickFile}
            disabled={uploading || files.length >= MAX_FILES}
            loading={uploading}
            fullWidth
          />

          <Input
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="What you delivered, anything the reviewer should know…"
            multiline
            numberOfLines={5}
          />

          <Button
            label={submit.isPending ? 'Submitting…' : 'Submit for review'}
            onPress={handleSubmit}
            disabled={submit.isPending || uploading || files.length === 0}
            loading={submit.isPending}
            fullWidth
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
