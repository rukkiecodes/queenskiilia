import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Input } from '@/components/ui/input';
import { colors } from '@/constants/colors';
import { COUNTRIES, flagOf, type Country } from '@/constants/countries';
import { spacing } from '@/constants/spacing';
import { fonts, fontSize } from '@/constants/typography';
import { countryPickerBus } from '@/lib/country-picker-bus';

export default function CountryPicker() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q,
    );
  }, [query]);

  const select = (country: Country) => {
    countryPickerBus.resolve(country);
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          presentation: 'formSheet',
          headerShown: true,
          title: 'Select country',
          sheetGrabberVisible: true,
          sheetAllowedDetents: [0.99],
        }}
      />
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }}>
          <Input
            value={query}
            onChangeText={setQuery}
            placeholder="Search countries"
            leftIcon="magnifyingglass"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.code}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => (
            <View
              style={{
                height: 1,
                backgroundColor: colors.hairline,
                marginLeft: spacing.lg,
              }}
            />
          )}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => select(item)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                backgroundColor: pressed ? colors.canvasParchment : colors.canvas,
              })}
            >
              <ThemedText
                style={{ fontSize: fontSize.headline }}
                color="ink"
                font={fonts.regular}
              >
                {flagOf(item.code)}
              </ThemedText>
              <ThemedText
                font={fonts.regular}
                size="body"
                color="ink"
                style={{ flex: 1 }}
              >
                {item.name}
              </ThemedText>
              <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
                {item.code}
              </ThemedText>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={{ padding: spacing.xxl, alignItems: 'center' }}>
              <ThemedText font={fonts.regular} size="body" color="inkMuted48">
                No countries match "{query}"
              </ThemedText>
            </View>
          }
        />
      </View>
    </>
  );
}
