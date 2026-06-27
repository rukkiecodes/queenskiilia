import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import type { ReportTargetType } from '@/lib/reports-api';

type Props = {
  targetType: ReportTargetType;
  targetId: string;
  /** Override the default "Report this user/project/message" text. */
  label?: string;
};

const DEFAULT_LABELS: Record<ReportTargetType, string> = {
  user:    'Report this user',
  project: 'Report this project',
  message: 'Report this message',
};

/**
 * Compact link-style row used at the bottom of project + profile screens to
 * surface the content-moderation report flow (Google Play §8). Tapping it
 * pushes the shared `/report` screen with the target wired up via params.
 */
export function ReportButton({ targetType, targetId, label }: Props) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/(shared)/report',
          params: { targetType, targetId },
        })
      }
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.base,
        opacity: pressed ? 0.6 : 1,
      })}
      accessibilityRole="button"
      accessibilityLabel={label ?? DEFAULT_LABELS[targetType]}
    >
      <Image
        source="sf:flag"
        tintColor={colors.inkMuted48}
        style={{ width: 14, height: 14 }}
      />
      <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
        {label ?? DEFAULT_LABELS[targetType]}
      </ThemedText>
    </Pressable>
  );
}
