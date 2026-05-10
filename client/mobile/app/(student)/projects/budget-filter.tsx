import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useProjectFiltersStore } from '@/store/project-filters-store';

export default function BudgetFilter() {
  const router = useRouter();
  const { budgetMin, budgetMax, setBudget } = useProjectFiltersStore();

  const [minStr, setMinStr] = useState(budgetMin != null ? String(budgetMin) : '');
  const [maxStr, setMaxStr] = useState(budgetMax != null ? String(budgetMax) : '');
  const [error, setError] = useState<string>();

  const apply = () => {
    const min = minStr.trim() ? Number(minStr.replace(/[^\d.]/g, '')) : null;
    const max = maxStr.trim() ? Number(maxStr.replace(/[^\d.]/g, '')) : null;

    if (min != null && Number.isNaN(min)) return setError('Enter a valid minimum');
    if (max != null && Number.isNaN(max)) return setError('Enter a valid maximum');
    if (min != null && max != null && min > max) {
      return setError('Minimum must be below maximum');
    }

    setBudget(min, max);
    router.back();
  };

  const clear = () => {
    setBudget(null, null);
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          presentation: 'formSheet',
          headerShown: true,
          title: 'Budget',
          sheetGrabberVisible: true,
          sheetAllowedDetents: [0.5, 0.99],
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: colors.canvas }}
      >
        <ScrollView
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedText font={fonts.regular} size="body" color="inkMuted48">
            Filter projects by budget. Leave a field empty for no limit.
          </ThemedText>

          <View style={{ flexDirection: 'row', gap: spacing.base }}>
            <View style={{ flex: 1 }}>
              <Input
                label="Minimum"
                value={minStr}
                onChangeText={(t) => {
                  setMinStr(t);
                  setError(undefined);
                }}
                placeholder="0"
                keyboardType="number-pad"
                inputMode="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Maximum"
                value={maxStr}
                onChangeText={(t) => {
                  setMaxStr(t);
                  setError(undefined);
                }}
                placeholder="Any"
                keyboardType="number-pad"
                inputMode="numeric"
              />
            </View>
          </View>

          {error ? (
            <ThemedText font={fonts.regular} size="caption" color="danger">
              {error}
            </ThemedText>
          ) : null}

          <View style={{ gap: spacing.sm, marginTop: spacing.base }}>
            <Button label="Apply" onPress={apply} fullWidth />
            <Button label="Clear" variant="ghost" onPress={clear} fullWidth />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
