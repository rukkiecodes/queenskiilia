import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { z } from 'zod';

import { CurrencyPicker, type CurrencyCode } from '@/components/forms/currency-picker';
import { DateField } from '@/components/forms/date-field';
import { SkillSelector } from '@/components/forms/skill-selector';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useCreateProject } from '@/hooks/use-project-mutations';
import { formatBudget, formatDeadline } from '@/lib/format-deadline';
import { GraphQLError } from '@/lib/graphql-client';
import type { SkillLevel } from '@/lib/projects-api';
import { useUiStore } from '@/store/ui-store';

const SKILL_LEVELS: { value: SkillLevel; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
];

const schema = z.object({
  title: z.string().trim().min(8, 'Give the project a clearer title (8+ chars)'),
  description: z.string().trim().min(40, 'Describe the project (40+ chars)'),
  requiredSkills: z.array(z.string()).min(1, 'Pick at least one skill').max(8),
  skillLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  budget: z.number().positive('Enter a budget'),
  currency: z.enum(['USD', 'GBP', 'EUR', 'NGN']),
  deadline: z.date().refine((d) => d.getTime() > Date.now(), {
    message: 'Deadline must be in the future',
  }),
});

type Phase = 'form' | 'preview';

export default function CreateProject() {
  const router = useRouter();
  const showToast = useUiStore((s) => s.showToast);
  const createProject = useCreateProject();

  const [phase, setPhase] = useState<Phase>('form');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('intermediate');
  const [budgetStr, setBudgetStr] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reviewValues = {
    title: title.trim(),
    description: description.trim(),
    requiredSkills: skills,
    skillLevel,
    budget: Number(budgetStr.replace(/[^\d.]/g, '')),
    currency,
    deadline: deadline ?? new Date(),
  };

  const goToPreview = () => {
    const result = schema.safeParse(reviewValues);
    if (!result.success) {
      const e: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string;
        if (key && !e[key]) e[key] = issue.message;
      }
      setErrors(e);
      return;
    }
    setErrors({});
    setPhase('preview');
  };

  const submit = async () => {
    if (!deadline) return;
    const budget = Number(budgetStr.replace(/[^\d.]/g, ''));
    try {
      await createProject.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        requiredSkills: skills,
        skillLevel,
        budget,
        currency,
        deadline: deadline.toISOString(),
      });
      showToast('Project published', 'success');
      router.back();
    } catch (err) {
      const msg = err instanceof GraphQLError ? err.message : 'Could not publish project';
      showToast(msg, 'error');
      setPhase('form');
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          presentation: 'formSheet',
          headerShown: true,
          title: phase === 'form' ? 'New project' : 'Review',
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
          {phase === 'form' ? (
            <FormPhase
              title={title}
              setTitle={setTitle}
              description={description}
              setDescription={setDescription}
              skills={skills}
              setSkills={setSkills}
              skillLevel={skillLevel}
              setSkillLevel={setSkillLevel}
              budgetStr={budgetStr}
              setBudgetStr={setBudgetStr}
              currency={currency}
              setCurrency={setCurrency}
              deadline={deadline}
              setDeadline={setDeadline}
              errors={errors}
              onContinue={goToPreview}
            />
          ) : (
            <PreviewPhase
              values={reviewValues}
              submitting={createProject.isPending}
              onEdit={() => setPhase('form')}
              onPublish={submit}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

function FormPhase({
  title,
  setTitle,
  description,
  setDescription,
  skills,
  setSkills,
  skillLevel,
  setSkillLevel,
  budgetStr,
  setBudgetStr,
  currency,
  setCurrency,
  deadline,
  setDeadline,
  errors,
  onContinue,
}: {
  title: string;
  setTitle: (s: string) => void;
  description: string;
  setDescription: (s: string) => void;
  skills: string[];
  setSkills: (s: string[]) => void;
  skillLevel: SkillLevel;
  setSkillLevel: (s: SkillLevel) => void;
  budgetStr: string;
  setBudgetStr: (s: string) => void;
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  deadline: Date | null;
  setDeadline: (d: Date | null) => void;
  errors: Record<string, string>;
  onContinue: () => void;
}) {
  return (
    <>
      <Input
        label="Title"
        value={title}
        onChangeText={setTitle}
        placeholder="Build a responsive landing page"
        error={errors.title}
        autoCapitalize="sentences"
      />
      <Input
        label="Description"
        value={description}
        onChangeText={setDescription}
        placeholder="What's the project about? Goals, scope, deliverables…"
        multiline
        numberOfLines={6}
        error={errors.description}
      />

      <SkillSelector
        label="Required skills"
        required
        value={skills}
        onChange={setSkills}
      />
      {errors.requiredSkills ? (
        <ThemedText font={fonts.regular} size="caption" color="danger">
          {errors.requiredSkills}
        </ThemedText>
      ) : null}

      <View style={{ gap: spacing.xs }}>
        <ThemedText font={fonts.semiBold} size="callout" color="ink">
          Skill level
        </ThemedText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
          {SKILL_LEVELS.map((s) => {
            const active = s.value === skillLevel;
            return (
              <Pressable
                key={s.value}
                onPress={() => setSkillLevel(s.value)}
                style={({ pressed }) => ({
                  paddingHorizontal: spacing.base,
                  paddingVertical: spacing.sm,
                  borderRadius: radius.pill,
                  backgroundColor: active ? colors.primary : colors.canvasParchment,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                })}
              >
                <ThemedText
                  font={fonts.regular}
                  size="caption"
                  color={active ? 'onPrimary' : 'ink'}
                >
                  {s.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.base, alignItems: 'flex-end' }}>
        <View style={{ flex: 1 }}>
          <Input
            label="Budget"
            value={budgetStr}
            onChangeText={setBudgetStr}
            placeholder="0"
            keyboardType="number-pad"
            inputMode="numeric"
            error={errors.budget}
          />
        </View>
      </View>
      <CurrencyPicker value={currency} onChange={setCurrency} />

      <DateField
        label="Deadline"
        required
        value={deadline}
        onChange={setDeadline}
      />
      {errors.deadline ? (
        <ThemedText font={fonts.regular} size="caption" color="danger">
          {errors.deadline}
        </ThemedText>
      ) : null}

      <View style={{ marginTop: spacing.base }}>
        <Button label="Review" onPress={onContinue} fullWidth />
      </View>
    </>
  );
}

function PreviewPhase({
  values,
  submitting,
  onEdit,
  onPublish,
}: {
  values: {
    title: string;
    description: string;
    requiredSkills: string[];
    skillLevel: SkillLevel;
    budget: number;
    currency: CurrencyCode;
    deadline: Date;
  };
  submitting: boolean;
  onEdit: () => void;
  onPublish: () => void;
}) {
  return (
    <>
      <ThemedText font={fonts.regular} size="body" color="inkMuted48">
        This is how students will see your project.
      </ThemedText>

      <View
        style={{
          borderRadius: radius.lg,
          borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: colors.hairline,
          padding: spacing.lg,
          gap: spacing.sm,
        }}
      >
        <ThemedText font={fonts.semiBold} size="headline" color="ink">
          {values.title}
        </ThemedText>
        <ThemedText font={fonts.regular} size="body" color="ink">
          {values.description}
        </ThemedText>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
          {values.requiredSkills.map((s) => (
            <View
              key={s}
              style={{
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xxs,
                borderRadius: radius.pill,
                backgroundColor: colors.canvasParchment,
              }}
            >
              <ThemedText font={fonts.regular} size="caption" color="inkMuted80">
                {s}
              </ThemedText>
            </View>
          ))}
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingTop: spacing.xs,
          }}
        >
          <View>
            <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
              Budget
            </ThemedText>
            <ThemedText font={fonts.semiBold} size="title3" color="ink">
              {formatBudget(values.budget, values.currency)}
            </ThemedText>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
              {capitalize(values.skillLevel)}
            </ThemedText>
            <ThemedText font={fonts.regular} size="body" color="ink">
              {formatDeadline(values.deadline.toISOString())}
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={{ gap: spacing.sm, marginTop: spacing.base }}>
        <Button
          label={submitting ? 'Publishing…' : 'Publish'}
          onPress={onPublish}
          loading={submitting}
          disabled={submitting}
          fullWidth
        />
        <Button
          label="Edit"
          variant="ghost"
          onPress={onEdit}
          disabled={submitting}
          fullWidth
        />
      </View>
    </>
  );
}

function capitalize(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}
