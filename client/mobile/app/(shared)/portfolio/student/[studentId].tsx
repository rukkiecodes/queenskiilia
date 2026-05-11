import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Share,
  View,
} from 'react-native';

import { PortfolioItemCard } from '@/components/cards/portfolio-item-card';
import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useStudentPortfolio } from '@/hooks/use-portfolio';
import { useUser } from '@/hooks/use-user';
import { GraphQLError } from '@/lib/graphql-client';
import { useUiStore } from '@/store/ui-store';

export default function StudentPortfolioView() {
  const { studentId } = useLocalSearchParams<{ studentId: string }>();
  const router = useRouter();
  const showToast = useUiStore((s) => s.showToast);

  const user = useUser(studentId);
  const portfolio = useStudentPortfolio(studentId);
  const items = portfolio.data ?? [];

  const studentName =
    user.data?.fullName ?? user.data?.studentProfile?.university ?? 'Student';

  const onShare = async () => {
    if (!studentId) return;
    const url = `queenskillamobile://portfolio/student/${studentId}`;
    try {
      await Share.share({
        message: `Check out ${studentName}’s portfolio on QueenSkiilia: ${url}`,
        url, // iOS uses this; Android falls back to message
      });
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Could not open share sheet',
        'error',
      );
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Portfolio',
          headerRight: () => (
            <Pressable onPress={onShare} hitSlop={8}>
              <Image
                source="sf:square.and.arrow.up"
                tintColor={colors.primary}
                style={{ width: 22, height: 22 }}
              />
            </Pressable>
          ),
        }}
      />
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        data={items}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={{ gap: spacing.sm }}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.xxxl,
          gap: spacing.sm,
          flexGrow: 1,
        }}
        style={{ flex: 1, backgroundColor: colors.canvas }}
        ListHeaderComponent={
          <View
            style={{
              paddingVertical: spacing.lg,
              gap: spacing.sm,
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: colors.canvasParchment,
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {user.data?.avatarUrl ? (
                <Image
                  source={{ uri: user.data.avatarUrl }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              ) : (
                <ThemedText
                  font={fonts.semiBold}
                  size="title3"
                  color="inkMuted48"
                >
                  {studentName.slice(0, 1).toUpperCase()}
                </ThemedText>
              )}
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
              }}
            >
              <ThemedText
                font={fonts.semiBold}
                size="title3"
                color="ink"
              >
                {user.isLoading ? 'Loading…' : studentName}
              </ThemedText>
              {user.data?.isVerified ? (
                <Image
                  source="sf:checkmark.seal.fill"
                  tintColor={colors.primary}
                  style={{ width: 14, height: 14 }}
                />
              ) : null}
            </View>
            <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
              {items.length} public item{items.length === 1 ? '' : 's'}
            </ThemedText>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ flex: 1, maxWidth: '50%' }}>
            <PortfolioItemCard
              item={item}
              layout="grid"
              onPress={() =>
                router.push({
                  pathname: '/(shared)/portfolio/[itemId]',
                  params: { itemId: item.id },
                })
              }
            />
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={portfolio.isFetching}
            onRefresh={() => {
              portfolio.refetch();
              user.refetch();
            }}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          portfolio.isLoading ? (
            <View style={{ paddingVertical: spacing.xxxl, alignItems: 'center' }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : portfolio.error ? (
            <EmptyState
              icon="exclamationmark.triangle"
              title="Could not load portfolio"
              body={
                portfolio.error instanceof GraphQLError
                  ? portfolio.error.message
                  : 'Pull to retry.'
              }
            />
          ) : (
            <EmptyState
              icon="folder"
              title="No public items"
              body="This student hasn’t shared any portfolio items yet."
            />
          )
        }
      />
    </>
  );
}
