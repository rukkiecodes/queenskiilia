import { Alert, Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { colors, type ColorToken } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { formatBudget } from '@/lib/format-deadline';
import type { EscrowAccount, EscrowStatus } from '@/lib/payments-api';

const STATUS: Record<
  EscrowStatus,
  { bg: ColorToken; fg: ColorToken; label: string }
> = {
  held:     { bg: 'primary',         fg: 'onPrimary',  label: 'Held' },
  released: { bg: 'canvasParchment', fg: 'primary',    label: 'Released' },
  refunded: { bg: 'canvasParchment', fg: 'inkMuted80', label: 'Refunded' },
};

type Props = {
  escrow: EscrowAccount;
  projectTitle?: string | null;
  onPress?: () => void;
  /** Show the Release Funds CTA on this card when status is "held". */
  onRelease?: () => void;
  /** Disabled while a mutation is in flight. */
  releasing?: boolean;
};

export function EscrowCard({
  escrow,
  projectTitle,
  onPress,
  onRelease,
  releasing,
}: Props) {
  const s = STATUS[escrow.status];

  const askRelease = () => {
    if (!onRelease) return;
    Alert.alert(
      'Release funds?',
      `${formatBudget(
        escrow.amount,
        escrow.currency,
      )} will be released to the student. This cannot be reversed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Release', onPress: onRelease },
      ],
    );
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: colors.hairline,
        backgroundColor: colors.canvas,
        padding: spacing.lg,
        gap: spacing.sm,
        transform: [{ scale: pressed && onPress ? 0.99 : 1 }],
      })}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: spacing.sm,
        }}
      >
        <ThemedText
          font={fonts.semiBold}
          size="body"
          color="ink"
          numberOfLines={1}
          style={{ flex: 1 }}
        >
          {projectTitle ?? `Project ${escrow.projectId.slice(0, 8)}…`}
        </ThemedText>
        <View
          style={{
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xxs,
            borderRadius: radius.pill,
            backgroundColor: colors[s.bg],
          }}
        >
          <ThemedText font={fonts.regular} size="caption" color={s.fg}>
            {s.label}
          </ThemedText>
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <ThemedText font={fonts.semiBold} size="title3" color="ink">
          {formatBudget(escrow.amount, escrow.currency)}
        </ThemedText>
        {escrow.platformFee != null ? (
          <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
            +{formatBudget(escrow.platformFee, escrow.currency)} fee
          </ThemedText>
        ) : null}
      </View>

      <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
        {escrow.status === 'released' && escrow.releasedAt
          ? `Released ${new Date(escrow.releasedAt).toLocaleDateString()}`
          : `Funded ${new Date(escrow.createdAt).toLocaleDateString()}`}
        {escrow.gateway === 'mock' ? ' · Mock' : ''}
      </ThemedText>

      {onRelease && escrow.status === 'held' ? (
        <Button
          label={releasing ? 'Releasing…' : 'Release funds'}
          onPress={askRelease}
          disabled={releasing}
          loading={releasing}
          fullWidth
        />
      ) : null}
    </Pressable>
  );
}
