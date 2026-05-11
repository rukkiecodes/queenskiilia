import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Switch,
  View,
} from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useMe } from '@/hooks/use-me';
import {
  usePortfolioItem,
  useUpdatePortfolioItemVisibility,
} from '@/hooks/use-portfolio';
import { GraphQLError } from '@/lib/graphql-client';

export default function PortfolioItemDetail() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const { data: item, isLoading, isFetching, error, refetch } = usePortfolioItem(itemId);
  const { data: me } = useMe();
  const visibility = useUpdatePortfolioItemVisibility();

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Portfolio item' }} />
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

  if (error || !item) {
    return (
      <>
        <Stack.Screen options={{ title: 'Portfolio item' }} />
        <View style={{ flex: 1, backgroundColor: colors.canvas }}>
          <EmptyState
            icon="questionmark.circle"
            title="Item unavailable"
            body={
              error instanceof GraphQLError
                ? error.message
                : 'This portfolio item could not be loaded.'
            }
          />
        </View>
      </>
    );
  }

  const isOwner = !!me && me.id === item.studentId;

  return (
    <>
      <Stack.Screen options={{ title: '' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: spacing.xxxl,
          gap: spacing.lg,
        }}
        style={{ flex: 1, backgroundColor: colors.canvas }}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      >
        <View style={{ gap: spacing.xs }}>
          <ThemedText
            font={fonts.regular}
            size="caption"
            color="inkMuted48"
          >
            {item.businessName} ·{' '}
            {new Date(item.completedAt).toLocaleDateString()}
          </ThemedText>
          <ThemedText font={fonts.bold} size="title2" color="ink">
            {item.projectTitle}
          </ThemedText>
        </View>

        {item.fileUrls.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm }}
            style={{ marginHorizontal: -spacing.xl }}
            contentInset={{ left: spacing.xl, right: spacing.xl }}
            contentOffset={{ x: -spacing.xl, y: 0 }}
          >
            {item.fileUrls.map((url) => (
              <Pressable
                key={url}
                style={{
                  width: 240,
                  aspectRatio: 4 / 3,
                  borderRadius: radius.lg,
                  borderCurve: 'continuous',
                  overflow: 'hidden',
                  backgroundColor: colors.canvasParchment,
                }}
              >
                <Image
                  source={{ uri: url }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        {item.description ? (
          <View style={{ gap: spacing.xs }}>
            <ThemedText
              font={fonts.semiBold}
              size="callout"
              color="inkMuted48"
            >
              ABOUT
            </ThemedText>
            <ThemedText font={fonts.regular} size="body" color="ink" selectable>
              {item.description}
            </ThemedText>
          </View>
        ) : null}

        {item.skills.length > 0 ? (
          <View style={{ gap: spacing.sm }}>
            <ThemedText
              font={fonts.semiBold}
              size="callout"
              color="inkMuted48"
            >
              SKILLS
            </ThemedText>
            <View
              style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}
            >
              {item.skills.map((s) => (
                <View
                  key={s}
                  style={{
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xxs,
                    borderRadius: radius.pill,
                    backgroundColor: colors.canvasParchment,
                  }}
                >
                  <ThemedText
                    font={fonts.regular}
                    size="caption"
                    color="inkMuted80"
                  >
                    {s}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {item.clientRating != null || item.clientReview ? (
          <View
            style={{
              padding: spacing.lg,
              borderRadius: radius.lg,
              borderCurve: 'continuous',
              backgroundColor: colors.canvasParchment,
              gap: spacing.xs,
            }}
          >
            <ThemedText font={fonts.semiBold} size="callout" color="inkMuted48">
              CLIENT REVIEW
            </ThemedText>
            {item.clientRating != null ? (
              <ThemedText font={fonts.semiBold} size="title3" color="ink">
                ★ {item.clientRating.toFixed(1)}
              </ThemedText>
            ) : null}
            {item.clientReview ? (
              <ThemedText
                font={fonts.regular}
                size="body"
                color="ink"
                selectable
              >
                {item.clientReview}
              </ThemedText>
            ) : null}
          </View>
        ) : null}

        {isOwner ? (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: spacing.base,
              borderTopWidth: 1,
              borderTopColor: colors.dividerSoft,
            }}
          >
            <View style={{ flex: 1, gap: spacing.xxs }}>
              <ThemedText font={fonts.semiBold} size="body" color="ink">
                Public on your portfolio
              </ThemedText>
              <ThemedText
                font={fonts.regular}
                size="caption"
                color="inkMuted48"
              >
                {item.isPublic
                  ? 'Businesses viewing your portfolio can see this.'
                  : 'Hidden from your public portfolio.'}
              </ThemedText>
            </View>
            <Switch
              value={item.isPublic}
              onValueChange={(next) =>
                visibility.mutate({ id: item.id, isPublic: next })
              }
              trackColor={{
                true: colors.primary,
                false: colors.hairline,
              }}
            />
          </View>
        ) : null}
      </ScrollView>
    </>
  );
}
