import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';

export type CurrencyCode = 'USD' | 'GBP' | 'EUR' | 'NGN';

const CURRENCIES: CurrencyCode[] = ['USD', 'GBP', 'EUR', 'NGN'];

type Props = {
  label?: string;
  value: CurrencyCode;
  onChange: (c: CurrencyCode) => void;
};

/**
 * Apple-style segmented control: pill-shaped, hairline border, selected
 * segment fills with `colors.primary`.
 */
export function CurrencyPicker({ label = 'Currency', value, onChange }: Props) {
  return (
    <View style={{ gap: spacing.xs, alignSelf: 'stretch' }}>
      {label ? (
        <ThemedText font={fonts.semiBold} size="callout" color="ink">
          {label}
        </ThemedText>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          borderRadius: radius.pill,
          borderWidth: 1,
          borderColor: colors.hairline,
          backgroundColor: colors.canvas,
          padding: 2,
          alignSelf: 'flex-start',
        }}
      >
        {CURRENCIES.map((c) => {
          const selected = value === c;
          return (
            <Pressable
              key={c}
              onPress={() => onChange(c)}
              style={({ pressed }) => ({
                paddingHorizontal: spacing.base,
                paddingVertical: spacing.xxs + spacing.xxs,
                borderRadius: radius.pill,
                backgroundColor: selected ? colors.primary : 'transparent',
                opacity: pressed && !selected ? 0.6 : 1,
              })}
            >
              <ThemedText
                font={fonts.regular}
                size="caption"
                color={selected ? 'onPrimary' : 'ink'}
              >
                {c}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
