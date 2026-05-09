import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { colors } from '@/constants/colors';
import { COUNTRIES, flagOf, type Country } from '@/constants/countries';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { countryPickerBus } from '@/lib/country-picker-bus';

type Props = {
  label?: string;
  required?: boolean;
  /** ISO 3166-1 alpha-2 code, or null if not set */
  value: string | null;
  onChange: (code: string | null) => void;
  placeholder?: string;
};

export function CountryField({
  label,
  required,
  value,
  onChange,
  placeholder = 'Select a country',
}: Props) {
  const router = useRouter();
  const selected = value ? COUNTRIES.find((c) => c.code === value) : undefined;

  const open = () => {
    countryPickerBus.expect((country: Country | null) => {
      if (country) onChange(country.code);
    });
    router.push('/country-picker');
  };

  return (
    <View style={{ gap: spacing.xs, alignSelf: 'stretch' }}>
      {label ? (
        <ThemedText font={fonts.semiBold} size="callout" color="ink">
          {label}
          {required ? (
            <ThemedText font={fonts.semiBold} size="callout" color="danger">
              {' *'}
            </ThemedText>
          ) : null}
        </ThemedText>
      ) : null}

      <Pressable
        onPress={open}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          borderWidth: 1,
          borderColor: colors.hairline,
          borderRadius: radius.md,
          borderCurve: 'continuous',
          paddingHorizontal: spacing.base,
          paddingVertical: spacing.md,
          backgroundColor: colors.canvas,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
      >
        {selected ? (
          <>
            <ThemedText font={fonts.regular} size="body" color="ink">
              {flagOf(selected.code)}
            </ThemedText>
            <ThemedText
              font={fonts.regular}
              size="body"
              color="ink"
              style={{ flex: 1 }}
            >
              {selected.name}
            </ThemedText>
          </>
        ) : (
          <ThemedText
            font={fonts.regular}
            size="body"
            color="inkMuted48"
            style={{ flex: 1 }}
          >
            {placeholder}
          </ThemedText>
        )}
      </Pressable>
    </View>
  );
}
