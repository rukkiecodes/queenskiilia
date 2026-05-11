import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import {
  useActiveSession,
  useSkillCategories,
  useStartAssessment,
} from '@/hooks/use-assessments';
import { GraphQLError } from '@/lib/graphql-client';
import type { SkillLevel } from '@/lib/skills-api';
import { useUiStore } from '@/store/ui-store';

const LEVELS: { value: SkillLevel; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
];

export default function StartAssessment() {
  const router = useRouter();
  const showToast = useUiStore((s) => s.showToast);

  const categories = useSkillCategories();
  const active = useActiveSession();
  const start = useStartAssessment();

  const [query, setQuery] = useState('');
  const [pickedCategory, setPickedCategory] = useState<string | null>(null);
  const [pickedLevel, setPickedLevel] = useState<SkillLevel>('intermediate');

  const grouped = useMemo(() => {
    const all = categories.data ?? [];
    const q = query.trim().toLowerCase();
    const filtered = q
      ? all.filter((c) => c.name.toLowerCase().includes(q))
      : all;
    const byParent = new Map<string, typeof all>();
    for (const c of filtered) {
      const k = c.parentCategory ?? 'Other';
      const existing = byParent.get(k) ?? [];
      existing.push(c);
      byParent.set(k, existing);
    }
    return Array.from(byParent.entries()).sort(([a], [b]) =>
      a.localeCompare(b),
    );
  }, [categories.data, query]);

  const begin = async () => {
    if (!pickedCategory) return;
    if (active.data) {
      showToast(
        'Finish your active assessment before starting another',
        'error',
      );
      return;
    }
    try {
      await start.mutateAsync({ category: pickedCategory, level: pickedLevel });
      router.replace('/(student)/skill-test/session');
    } catch (err) {
      const msg = err instanceof GraphQLError ? err.message : 'Could not start';
      showToast(msg, 'error');
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          presentation: 'formSheet',
          headerShown: true,
          title: 'New assessment',
          sheetGrabberVisible: true,
          sheetAllowedDetents: [0.99],
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: colors.canvas }}
      >
        <ScrollView
          contentContainerStyle={{
            padding: spacing.xl,
            paddingBottom: spacing.xxxl,
            gap: spacing.lg,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {active.data ? (
            <View
              style={{
                padding: spacing.lg,
                borderRadius: radius.lg,
                backgroundColor: colors.canvasParchment,
                gap: spacing.xs,
              }}
            >
              <ThemedText font={fonts.semiBold} size="callout" color="ink">
                You have an active assessment
              </ThemedText>
              <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
                Finish or let it expire before starting a new one.
              </ThemedText>
              <Button
                label="Resume active assessment"
                variant="ghost"
                onPress={() => {
                  router.dismiss();
                  router.push('/(student)/skill-test/session');
                }}
                fullWidth
              />
            </View>
          ) : null}

          <View style={{ gap: spacing.xs }}>
            <ThemedText font={fonts.semiBold} size="callout" color="ink">
              Category
            </ThemedText>
            <Input
              value={query}
              onChangeText={setQuery}
              placeholder="Search categories"
              leftIcon="magnifyingglass"
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          {categories.isLoading ? (
            <View style={{ paddingVertical: spacing.xxl, alignItems: 'center' }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : categories.error ? (
            <EmptyState
              icon="exclamationmark.triangle"
              title="Could not load categories"
              body={
                categories.error instanceof GraphQLError
                  ? categories.error.message
                  : 'Pull to retry.'
              }
            />
          ) : (
            <View style={{ gap: spacing.lg }}>
              {grouped.map(([parent, cats]) => (
                <View key={parent} style={{ gap: spacing.xs }}>
                  <ThemedText
                    font={fonts.semiBold}
                    size="caption"
                    color="inkMuted48"
                  >
                    {parent.toUpperCase()}
                  </ThemedText>
                  <View
                    style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}
                  >
                    {cats.map((c) => {
                      const selected = pickedCategory === c.name;
                      return (
                        <Pressable
                          key={c.id}
                          onPress={() => setPickedCategory(c.name)}
                          style={({ pressed }) => ({
                            paddingHorizontal: spacing.base,
                            paddingVertical: spacing.sm,
                            borderRadius: radius.pill,
                            backgroundColor: selected
                              ? colors.primary
                              : colors.canvasParchment,
                            transform: [{ scale: pressed ? 0.97 : 1 }],
                          })}
                        >
                          <ThemedText
                            font={fonts.regular}
                            size="caption"
                            color={selected ? 'onPrimary' : 'ink'}
                          >
                            {c.name}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={{ gap: spacing.xs, marginTop: spacing.base }}>
            <ThemedText font={fonts.semiBold} size="callout" color="ink">
              Level
            </ThemedText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
              {LEVELS.map((l) => {
                const selected = pickedLevel === l.value;
                return (
                  <Pressable
                    key={l.value}
                    onPress={() => setPickedLevel(l.value)}
                    style={({ pressed }) => ({
                      paddingHorizontal: spacing.base,
                      paddingVertical: spacing.sm,
                      borderRadius: radius.pill,
                      backgroundColor: selected
                        ? colors.primary
                        : colors.canvasParchment,
                      transform: [{ scale: pressed ? 0.97 : 1 }],
                    })}
                  >
                    <ThemedText
                      font={fonts.regular}
                      size="caption"
                      color={selected ? 'onPrimary' : 'ink'}
                    >
                      {l.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Button
            label={start.isPending ? 'Starting…' : 'Start assessment'}
            onPress={begin}
            disabled={!pickedCategory || start.isPending || !!active.data}
            loading={start.isPending}
            fullWidth
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
