import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import type { PortfolioItem } from '@/lib/portfolio-api';

type Props = {
  item: PortfolioItem;
  onPress: () => void;
  /** Show the public/private chip — true for owner view, false for public profile view */
  showVisibility?: boolean;
  /** Compact grid variant — narrower card with image at top */
  layout?: 'list' | 'grid';
};

export function PortfolioItemCard({
  item,
  onPress,
  showVisibility = false,
  layout = 'list',
}: Props) {
  const cover = item.fileUrls[0];

  if (layout === 'grid') {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          borderRadius: radius.lg,
          borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: colors.hairline,
          backgroundColor: colors.canvas,
          overflow: 'hidden',
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
      >
        <View
          style={{
            aspectRatio: 1,
            backgroundColor: colors.canvasParchment,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {cover ? (
            <Image
              source={{ uri: cover }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <Image
              source="sf:photo"
              tintColor={colors.inkMuted48}
              style={{ width: 32, height: 32 }}
            />
          )}
        </View>
        <View style={{ padding: spacing.md, gap: spacing.xxs }}>
          <ThemedText
            font={fonts.semiBold}
            size="callout"
            color="ink"
            numberOfLines={2}
          >
            {item.projectTitle}
          </ThemedText>
          <ThemedText
            font={fonts.regular}
            size="caption"
            color="inkMuted48"
            numberOfLines={1}
          >
            {item.businessName}
          </ThemedText>
          {item.clientRating != null ? (
            <ThemedText font={fonts.regular} size="caption" color="inkMuted80">
              ★ {item.clientRating.toFixed(1)}
            </ThemedText>
          ) : null}
        </View>
        {showVisibility && !item.isPublic ? (
          <View
            style={{
              position: 'absolute',
              top: spacing.sm,
              right: spacing.sm,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xxs,
              borderRadius: radius.pill,
              backgroundColor: colors.scrim,
            }}
          >
            <ThemedText font={fonts.regular} size="micro" color="onPrimary">
              Hidden
            </ThemedText>
          </View>
        ) : null}
      </Pressable>
    );
  }

  // List variant
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: colors.hairline,
        backgroundColor: colors.canvas,
        padding: spacing.lg,
        gap: spacing.sm,
        flexDirection: 'row',
        transform: [{ scale: pressed ? 0.99 : 1 }],
      })}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: radius.md,
          borderCurve: 'continuous',
          backgroundColor: colors.canvasParchment,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {cover ? (
          <Image
            source={{ uri: cover }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        ) : (
          <Image
            source="sf:photo"
            tintColor={colors.inkMuted48}
            style={{ width: 24, height: 24 }}
          />
        )}
      </View>
      <View style={{ flex: 1, gap: spacing.xxs }}>
        <ThemedText
          font={fonts.semiBold}
          size="body"
          color="ink"
          numberOfLines={2}
        >
          {item.projectTitle}
        </ThemedText>
        <ThemedText
          font={fonts.regular}
          size="caption"
          color="inkMuted48"
          numberOfLines={1}
        >
          {item.businessName} · {new Date(item.completedAt).toLocaleDateString()}
        </ThemedText>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            marginTop: spacing.xxs,
          }}
        >
          {item.clientRating != null ? (
            <ThemedText font={fonts.regular} size="caption" color="inkMuted80">
              ★ {item.clientRating.toFixed(1)}
            </ThemedText>
          ) : null}
          {showVisibility && !item.isPublic ? (
            <View
              style={{
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xxs,
                borderRadius: radius.pill,
                backgroundColor: colors.canvasParchment,
              }}
            >
              <ThemedText font={fonts.regular} size="micro" color="inkMuted80">
                Hidden
              </ThemedText>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
