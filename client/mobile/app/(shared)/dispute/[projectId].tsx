import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { colors, type ColorToken } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useProjectDispute, useRaiseDispute } from '@/hooks/use-disputes';
import { useProject } from '@/hooks/use-projects';
import {
  CloudinaryError,
  uploadToCloudinary,
  type ResourceType,
} from '@/lib/cloudinary';
import type { Dispute, DisputeStatus } from '@/lib/disputes-api';
import { parseDate } from '@/lib/format-deadline';
import { GraphQLError } from '@/lib/graphql-client';
import { useUiStore } from '@/store/ui-store';

const MAX_EVIDENCE = 5;
const MAX_FILE_MB = 5;

export default function ProjectDispute() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const showToast = useUiStore((s) => s.showToast);

  const project = useProject(projectId);
  const dispute = useProjectDispute(projectId);
  const raise = useRaiseDispute();

  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState<{ url: string; label: string; isImage: boolean }[]>(
    [],
  );
  const [uploading, setUploading] = useState(false);

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
        folder: `disputes/${projectId}`,
        resourceType,
        mimeType,
        fileName,
      });
      setEvidence((prev) =>
        prev.length >= MAX_EVIDENCE
          ? prev
          : [
              ...prev,
              {
                url: result.secureUrl,
                label: fileName,
                isImage: result.resourceType === 'image',
              },
            ],
      );
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
      await upload(
        a.uri,
        a.mimeType ?? 'image/jpeg',
        a.fileName ?? `image-${Date.now()}.jpg`,
        'image',
      );
    }
  };

  const fromDocument = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*', '*/*'],
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

  const pickEvidence = () => {
    if (evidence.length >= MAX_EVIDENCE) {
      showToast(`Max ${MAX_EVIDENCE} files`, 'error');
      return;
    }
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Photos', 'Files / PDF'],
          cancelButtonIndex: 0,
        },
        (i) => {
          if (i === 1) fromGallery();
          else if (i === 2) fromDocument();
        },
      );
    } else {
      Alert.alert('Add evidence', undefined, [
        { text: 'Photos', onPress: fromGallery },
        { text: 'Files / PDF', onPress: fromDocument },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const submit = async () => {
    if (!projectId) return;
    const note = reason.trim();
    if (note.length < 20) {
      showToast('Reason must be at least 20 characters', 'error');
      return;
    }
    Alert.alert(
      'Raise dispute?',
      'This freezes the escrow until an admin resolves the case. Use this only for serious issues — for normal feedback use chat or request a revision instead.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Raise dispute',
          style: 'destructive',
          onPress: async () => {
            try {
              await raise.mutateAsync({
                projectId,
                reason: note,
                evidence: evidence.map((e) => e.url),
              });
              showToast('Dispute submitted', 'success');
            } catch (err) {
              const msg =
                err instanceof GraphQLError ? err.message : 'Could not raise dispute';
              showToast(msg, 'error');
            }
          },
        },
      ],
    );
  };

  if (project.isLoading || dispute.isLoading) {
    return (
      <>
        <Stack.Screen options={{ presentation: 'formSheet', title: 'Dispute' }} />
        <View
          style={{
            flex: 1,
            backgroundColor: colors.canvas,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ActivityIndicator color={colors.primary} />
        </View>
      </>
    );
  }

  if (!project.data) {
    return (
      <>
        <Stack.Screen options={{ presentation: 'formSheet', title: 'Dispute' }} />
        <View style={{ flex: 1, backgroundColor: colors.canvas }}>
          <EmptyState icon="questionmark.circle" title="Project not found" />
        </View>
      </>
    );
  }

  // Existing dispute → show status timeline
  if (dispute.data) {
    return (
      <DisputeStatusView
        dispute={dispute.data}
        refreshing={dispute.isFetching}
        onRefresh={dispute.refetch}
      />
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          presentation: 'formSheet',
          headerShown: true,
          title: 'Report an issue',
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
          <View
            style={{
              padding: spacing.lg,
              borderRadius: radius.lg,
              backgroundColor: colors.canvasParchment,
              gap: spacing.xs,
            }}
          >
            <ThemedText font={fonts.semiBold} size="callout" color="warning">
              BEFORE YOU RAISE A DISPUTE
            </ThemedText>
            <ThemedText font={fonts.regular} size="caption" color="inkMuted80">
              Disputes are reserved for serious issues — work not delivered, money not released, breach of terms. For normal disagreements try chat first, or request a revision (business) or message the business (student). Raising a dispute freezes the escrow until an admin reviews.
            </ThemedText>
          </View>

          <Input
            label="What happened?"
            value={reason}
            onChangeText={setReason}
            placeholder="Describe the issue in detail. The admin uses this to decide. (20+ characters)"
            multiline
            numberOfLines={6}
            maxLength={2000}
            hint={`${reason.length}/2000`}
          />

          <View style={{ gap: spacing.xs }}>
            <ThemedText font={fonts.semiBold} size="callout" color="ink">
              Evidence (optional)
            </ThemedText>
            <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
              Up to {MAX_EVIDENCE} files, {MAX_FILE_MB}MB each — screenshots, PDFs, chat exports.
            </ThemedText>

            {evidence.length > 0 ? (
              <View style={{ gap: spacing.xs, marginTop: spacing.xs }}>
                {evidence.map((f) => (
                  <View
                    key={f.url}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.sm,
                      padding: spacing.sm,
                      borderRadius: radius.md,
                      backgroundColor: colors.canvasParchment,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
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
                          style={{ width: 18, height: 18 }}
                        />
                      )}
                    </View>
                    <ThemedText
                      font={fonts.regular}
                      size="caption"
                      color="ink"
                      style={{ flex: 1 }}
                      numberOfLines={1}
                    >
                      {f.label}
                    </ThemedText>
                    <Pressable
                      onPress={() =>
                        setEvidence((prev) => prev.filter((e) => e.url !== f.url))
                      }
                      hitSlop={6}
                    >
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
              label={uploading ? 'Uploading…' : 'Add evidence'}
              variant="outline"
              onPress={pickEvidence}
              disabled={uploading || evidence.length >= MAX_EVIDENCE}
              loading={uploading}
              fullWidth
            />
          </View>

          <Button
            label={raise.isPending ? 'Submitting…' : 'Raise dispute'}
            variant="danger"
            onPress={submit}
            disabled={raise.isPending || uploading || reason.trim().length < 20}
            loading={raise.isPending}
            fullWidth
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const STATUS_TONE: Record<
  DisputeStatus,
  { bg: ColorToken; fg: ColorToken; label: string; body: string }
> = {
  raised: {
    bg: 'canvasParchment',
    fg: 'warning',
    label: 'Raised',
    body: 'Your case is in the queue. An admin will review it.',
  },
  reviewing: {
    bg: 'canvasParchment',
    fg: 'primary',
    label: 'Under review',
    body: 'An admin is investigating. You may be contacted for more info.',
  },
  resolved: {
    bg: 'primary',
    fg: 'onPrimary',
    label: 'Resolved',
    body: 'Admin has resolved this dispute.',
  },
};

function DisputeStatusView({
  dispute,
  refreshing,
  onRefresh,
}: {
  dispute: Dispute;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const tone = STATUS_TONE[dispute.status];
  return (
    <>
      <Stack.Screen
        options={{
          presentation: 'formSheet',
          headerShown: true,
          title: 'Dispute',
          sheetGrabberVisible: true,
        }}
      />
      <ScrollView
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: spacing.xxxl,
          gap: spacing.lg,
        }}
        style={{ flex: 1, backgroundColor: colors.canvas }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View
          style={{
            padding: spacing.lg,
            borderRadius: radius.lg,
            backgroundColor: colors[tone.bg],
            gap: spacing.xxs,
          }}
        >
          <ThemedText font={fonts.semiBold} size="caption" color={tone.fg}>
            {tone.label.toUpperCase()}
          </ThemedText>
          <ThemedText font={fonts.regular} size="body" color="ink">
            {tone.body}
          </ThemedText>
          <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
            Raised {parseDate(dispute.createdAt).toLocaleString()}
            {dispute.resolvedAt
              ? ` · Resolved ${parseDate(dispute.resolvedAt).toLocaleString()}`
              : ''}
          </ThemedText>
        </View>

        <View style={{ gap: spacing.xs }}>
          <ThemedText font={fonts.semiBold} size="callout" color="inkMuted48">
            REASON
          </ThemedText>
          <ThemedText font={fonts.regular} size="body" color="ink" selectable>
            {dispute.reason}
          </ThemedText>
        </View>

        {dispute.evidence.length > 0 ? (
          <View style={{ gap: spacing.xs }}>
            <ThemedText font={fonts.semiBold} size="callout" color="inkMuted48">
              EVIDENCE ({dispute.evidence.length})
            </ThemedText>
            <View style={{ gap: spacing.xs }}>
              {dispute.evidence.map((url) => (
                <ThemedText
                  key={url}
                  font={fonts.regular}
                  size="caption"
                  color="primary"
                  selectable
                  numberOfLines={1}
                >
                  {url}
                </ThemedText>
              ))}
            </View>
          </View>
        ) : null}

        {dispute.resolution ? (
          <View style={{ gap: spacing.xs }}>
            <ThemedText font={fonts.semiBold} size="callout" color="inkMuted48">
              ADMIN RESOLUTION
            </ThemedText>
            <View
              style={{
                padding: spacing.lg,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: colors.hairline,
                gap: spacing.xs,
              }}
            >
              <ThemedText font={fonts.semiBold} size="body" color="ink">
                {dispute.resolution[0].toUpperCase() + dispute.resolution.slice(1)}
              </ThemedText>
              {dispute.adminNote ? (
                <ThemedText
                  font={fonts.regular}
                  size="callout"
                  color="ink"
                  selectable
                >
                  {dispute.adminNote}
                </ThemedText>
              ) : null}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </>
  );
}
