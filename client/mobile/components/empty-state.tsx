import { Image } from 'expo-image';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';

type Props = {
  icon: string; // SF Symbol
  title: string;
  body?: string;
  cta?: React.ReactNode;
};

export function EmptyState({ icon, title, body, cta }: Props) {
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.huge,
        paddingHorizontal: spacing.xl,
        gap: spacing.base,
      }}
    >
      <Image
        source={`sf:${icon}`}
        tintColor={colors.inkMuted48}
        style={{ width: 44, height: 44 }}
      />
      <ThemedText font={fonts.semiBold} size="title3" color="ink">
        {title}
      </ThemedText>
      {body ? (
        <ThemedText
          font={fonts.regular}
          size="body"
          color="inkMuted48"
          style={{ textAlign: 'center', maxWidth: 320 }}
        >
          {body}
        </ThemedText>
      ) : null}
      {cta ? <View style={{ marginTop: spacing.sm }}>{cta}</View> : null}
    </View>
  );
}
