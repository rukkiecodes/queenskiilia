import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  View,
} from 'react-native';

import { ChatBubble } from '@/components/chat/chat-bubble';
import { ChatInput } from '@/components/chat/chat-input';
import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import {
  useMarkChatRead,
  useSendMessage,
} from '@/hooks/use-chat-mutations';
import { useChatRoom } from '@/hooks/use-chat-room';
import { useMyChats } from '@/hooks/use-my-chats';
import { useUser } from '@/hooks/use-user';
import { CloudinaryError, uploadToCloudinary } from '@/lib/cloudinary';
import { GraphQLError } from '@/lib/graphql-client';
import { useAuthStore } from '@/store/auth-store';
import { useChatStore } from '@/store/chat-store';
import { useUiStore } from '@/store/ui-store';

export default function ChatRoom() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const myId = useAuthStore((s) => s.user?.id);
  const showToast = useUiStore((s) => s.showToast);
  const [uploading, setUploading] = useState(false);

  // Look up chat metadata from the cached myChats list
  const chatsQuery = useMyChats();
  const chat = chatsQuery.data?.find((c) => c.id === chatId);

  const room = useChatRoom(chatId);
  const messages = useChatStore((s) =>
    chatId ? s.byChat[chatId] ?? [] : [],
  );

  const otherId =
    chat && myId ? (myId === chat.studentId ? chat.businessId : chat.studentId) : undefined;
  const other = useUser(otherId);

  const send = useSendMessage();
  const markRead = useMarkChatRead();

  // Mark messages read on mount and whenever the chat has unread messages
  useEffect(() => {
    if (!chatId) return;
    markRead.mutate(chatId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, chat?.unreadCount]);

  const headerTitle =
    other.data?.businessProfile?.companyName ??
    other.data?.fullName ??
    (chat ? 'Conversation' : 'Loading…');

  const uploadAndSend = async (uri: string, mimeType?: string, currentChatId?: string) => {
    if (!currentChatId) return;
    setUploading(true);
    try {
      const result = await uploadToCloudinary({
        uri,
        folder: `chat/${currentChatId}`,
        resourceType: 'image',
        mimeType,
      });
      send.mutate({ chatId: currentChatId, attachmentUrls: [result.secureUrl] });
    } catch (err) {
      const msg =
        err instanceof CloudinaryError ? err.message : 'Could not upload attachment';
      showToast(msg, 'error');
    } finally {
      setUploading(false);
    }
  };

  const pickAndSendAttachment = (currentChatId: string) => {
    const fromGallery = async () => {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        showToast('Photo library access denied', 'error');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        quality: 0.85,
      });
      if (!res.canceled && res.assets[0]) {
        await uploadAndSend(
          res.assets[0].uri,
          res.assets[0].mimeType ?? 'image/jpeg',
          currentChatId,
        );
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
        quality: 0.85,
      });
      if (!res.canceled && res.assets[0]) {
        await uploadAndSend(
          res.assets[0].uri,
          res.assets[0].mimeType ?? 'image/jpeg',
          currentChatId,
        );
      }
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take photo', 'Choose from library'],
          cancelButtonIndex: 0,
        },
        (i) => {
          if (i === 1) fromCamera();
          if (i === 2) fromGallery();
        },
      );
    } else {
      Alert.alert('Add photo', undefined, [
        { text: 'Take photo', onPress: fromCamera },
        { text: 'Choose from library', onPress: fromGallery },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  // Find the index of the last own message that is read — used to show "Seen"
  const lastSeenOwnIndex = useMemo(() => {
    if (!myId) return -1;
    return messages.findIndex(
      (m) => m.senderId === myId && m.isRead && !m.id.startsWith('temp-'),
    );
  }, [messages, myId]);

  if (chatsQuery.isLoading || (!chat && !chatsQuery.error)) {
    return (
      <>
        <Stack.Screen options={{ title: '' }} />
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

  if (!chat) {
    return (
      <>
        <Stack.Screen options={{ title: 'Chat' }} />
        <View style={{ flex: 1, backgroundColor: colors.canvas }}>
          <EmptyState
            icon="questionmark.circle"
            title="Chat not found"
            body={
              chatsQuery.error instanceof GraphQLError
                ? chatsQuery.error.message
                : 'This conversation could not be loaded.'
            }
          />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: headerTitle }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: colors.canvas }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          inverted
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.base,
          }}
          renderItem={({ item, index }) => (
            <ChatBubble
              message={item}
              isMine={item.senderId === myId}
              showSeen={index === lastSeenOwnIndex}
            />
          )}
          ListEmptyComponent={
            room.isLoading ? (
              <View style={{ paddingVertical: spacing.xxxl, alignItems: 'center' }}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : (
              <View
                style={{
                  paddingVertical: spacing.xxxl,
                  alignItems: 'center',
                  // The FlatList is inverted — flip the placeholder back upright.
                  transform: [{ scaleY: -1 }],
                }}
              >
                <ThemedText
                  font={fonts.regular}
                  size="body"
                  color="inkMuted48"
                >
                  Say hello — this is a new conversation.
                </ThemedText>
              </View>
            )
          }
        />

        <ChatInput
          onSend={(text) =>
            send.mutate({ chatId: chat.id, content: text })
          }
          onAttach={() => pickAndSendAttachment(chat.id)}
          busy={send.isPending || uploading}
        />
      </KeyboardAvoidingView>
    </>
  );
}
