import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  View,
} from 'react-native';

import { ChatPreviewCard } from '@/components/cards/chat-preview-card';
import { EmptyState } from '@/components/empty-state';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { useMyChats } from '@/hooks/use-my-chats';
import { GraphQLError } from '@/lib/graphql-client';

/**
 * Shared by (student)/chat and (business)/chat — myChats returns whichever
 * chats the current user is a participant in.
 */
export function ChatList() {
  const router = useRouter();
  const { data, isLoading, isFetching, error, refetch } = useMyChats();

  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      data={data ?? []}
      keyExtractor={(c) => c.id}
      contentContainerStyle={{
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
        paddingBottom: spacing.xxxl,
        flexGrow: 1,
      }}
      style={{ flex: 1, backgroundColor: colors.canvas }}
      renderItem={({ item }) => (
        <ChatPreviewCard
          chat={item}
          onPress={() =>
            router.push({
              pathname: '/(shared)/chat/[chatId]',
              params: { chatId: item.id },
            })
          }
        />
      )}
      refreshControl={
        <RefreshControl
          refreshing={isFetching}
          onRefresh={refetch}
          tintColor={colors.primary}
        />
      }
      ListEmptyComponent={
        isLoading ? (
          <View style={{ paddingVertical: spacing.xxxl, alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : error ? (
          <EmptyState
            icon="exclamationmark.triangle"
            title="Could not load chats"
            body={
              error instanceof GraphQLError ? error.message : 'Pull to retry.'
            }
          />
        ) : (
          <EmptyState
            icon="message"
            title="No conversations yet"
            body="Chats appear here once you’re selected for a project (students) or you pick a student to work with (businesses)."
          />
        )
      }
    />
  );
}
