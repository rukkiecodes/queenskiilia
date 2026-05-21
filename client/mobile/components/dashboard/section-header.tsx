import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';

type Props = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
};

/** Section title with an optional trailing text action (e.g. "See all"). */
export function SectionHeader({ title, actionLabel, onAction }: Props) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.sm,
      }}
    >
      <ThemedText font={fonts.semiBold} size="headline" color="ink">
        {title}
      </ThemedText>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <ThemedText font={fonts.regular} size="callout" color="primary">
            {actionLabel}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}
