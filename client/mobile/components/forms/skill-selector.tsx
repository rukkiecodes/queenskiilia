import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Input } from '@/components/ui/input';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';

/**
 * Common skills suggested by default — searchable, multi-select. Caller can
 * also type a custom skill via the "Add" affordance at the bottom of the
 * search results.
 */
const SUGGESTED_SKILLS = [
  'React',
  'React Native',
  'Next.js',
  'TypeScript',
  'JavaScript',
  'HTML/CSS',
  'Tailwind CSS',
  'Node.js',
  'Python',
  'Django',
  'Flask',
  'FastAPI',
  'PostgreSQL',
  'MongoDB',
  'GraphQL',
  'REST APIs',
  'Figma',
  'UI/UX Design',
  'Prototyping',
  'Mobile App Development',
  'iOS',
  'Android',
  'Swift',
  'Kotlin',
  'Pandas',
  'Data Analysis',
  'Tableau',
  'Excel',
  'SEO',
  'Content Writing',
  'Copywriting',
  'Marketing Strategy',
  'Social Media Management',
  'Video Editing',
  'Photography',
  'Illustration',
  'Brand Design',
];

type Props = {
  label?: string;
  required?: boolean;
  value: string[];
  onChange: (skills: string[]) => void;
  max?: number;
};

export function SkillSelector({
  label = 'Skills',
  required,
  value,
  onChange,
  max = 8,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = SUGGESTED_SKILLS.filter((s) => !value.includes(s));
    if (!q) return pool;
    return pool.filter((s) => s.toLowerCase().includes(q));
  }, [query, value]);

  const exactMatch = useMemo(() => {
    const q = query.trim();
    if (!q) return false;
    return [...SUGGESTED_SKILLS, ...value].some(
      (s) => s.toLowerCase() === q.toLowerCase(),
    );
  }, [query, value]);

  const add = (skill: string) => {
    if (value.length >= max) return;
    onChange([...value, skill]);
    setQuery('');
  };

  const remove = (skill: string) => {
    onChange(value.filter((s) => s !== skill));
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
        onPress={() => setOpen(true)}
        style={({ pressed }) => ({
          minHeight: 52,
          borderWidth: 1,
          borderColor: colors.hairline,
          borderRadius: radius.md,
          borderCurve: 'continuous',
          padding: spacing.sm,
          backgroundColor: colors.canvas,
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.xs,
          alignItems: 'center',
          transform: [{ scale: pressed ? 0.99 : 1 }],
        })}
      >
        {value.length === 0 ? (
          <ThemedText
            font={fonts.regular}
            size="body"
            color="inkMuted48"
            style={{ paddingHorizontal: spacing.xs }}
          >
            Tap to add skills
          </ThemedText>
        ) : (
          value.map((s) => (
            <Tag
              key={s}
              label={s}
              onRemove={(e) => {
                e?.stopPropagation?.();
                remove(s);
              }}
            />
          ))
        )}
      </Pressable>

      <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
        {value.length}/{max} skills
      </ThemedText>

      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.canvas }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: spacing.xl,
              paddingVertical: spacing.lg,
              borderBottomWidth: 1,
              borderBottomColor: colors.hairline,
            }}
          >
            <ThemedText font={fonts.semiBold} size="headline" color="ink">
              Skills
            </ThemedText>
            <Pressable onPress={() => setOpen(false)} hitSlop={8}>
              <ThemedText font={fonts.regular} size="body" color="primary">
                Done
              </ThemedText>
            </Pressable>
          </View>

          <View style={{ padding: spacing.xl, gap: spacing.lg, flex: 1 }}>
            <Input
              value={query}
              onChangeText={setQuery}
              placeholder="Search or add a skill"
              leftIcon="magnifyingglass"
              autoCapitalize="words"
              autoCorrect={false}
            />

            {value.length > 0 ? (
              <View style={{ gap: spacing.xs }}>
                <ThemedText font={fonts.semiBold} size="caption" color="inkMuted48">
                  SELECTED
                </ThemedText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                  {value.map((s) => (
                    <Tag key={s} label={s} onRemove={() => remove(s)} />
                  ))}
                </View>
              </View>
            ) : null}

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ gap: spacing.xs, paddingVertical: spacing.xs }}
            >
              <ThemedText font={fonts.semiBold} size="caption" color="inkMuted48">
                {query.trim() ? 'MATCHES' : 'SUGGESTED'}
              </ThemedText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                {filtered.map((s) => (
                  <Tag key={s} label={s} onPress={() => add(s)} />
                ))}
                {query.trim() && !exactMatch ? (
                  <Tag
                    label={`+ Add “${query.trim()}”`}
                    accent
                    onPress={() => add(query.trim())}
                  />
                ) : null}
              </View>
            </ScrollView>

            {value.length >= max ? (
              <ThemedText font={fonts.regular} size="caption" color="danger">
                Up to {max} skills.
              </ThemedText>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Tag({
  label,
  onPress,
  onRemove,
  accent,
}: {
  label: string;
  onPress?: (e?: any) => void;
  onRemove?: (e?: any) => void;
  accent?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xxs,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: radius.pill,
        backgroundColor: accent ? colors.primary : colors.canvasParchment,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <ThemedText
        font={fonts.regular}
        size="caption"
        color={accent ? 'onPrimary' : 'inkMuted80'}
      >
        {label}
      </ThemedText>
      {onRemove ? (
        <Pressable onPress={onRemove} hitSlop={6}>
          <Image
            source="sf:xmark.circle.fill"
            tintColor={accent ? colors.onDark60 : colors.inkMuted48}
            style={{ width: 14, height: 14 }}
          />
        </Pressable>
      ) : null}
    </Pressable>
  );
}
