import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { z } from 'zod';

import { AvatarPicker } from '@/components/forms/avatar-picker';
import { CountryField } from '@/components/forms/country-field';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import {
  useUpdateBusinessProfile,
  useUpdateProfile,
  useUpdateStudentProfile,
} from '@/hooks/use-profile-mutations';
import { GraphQLError } from '@/lib/graphql-client';
import type { Me } from '@/lib/profile-api';
import { useUiStore } from '@/store/ui-store';

const CURRENT_YEAR = new Date().getFullYear();

const studentSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name'),
  country: z.string().min(2, 'Pick a country'),
  avatarUrl: z.string().nullable(),
  bio: z
    .string()
    .trim()
    .min(10, 'Tell us a bit more (10+ characters)')
    .max(280, 'Keep it under 280 characters'),
  university: z.string().trim().min(2, 'Enter your university'),
  graduationYear: z
    .number({ message: 'Enter a year' })
    .int()
    .min(CURRENT_YEAR - 10, `Must be ${CURRENT_YEAR - 10} or later`)
    .max(CURRENT_YEAR + 10, `Must be ${CURRENT_YEAR + 10} or earlier`),
});

const businessSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name'),
  country: z.string().min(2, 'Pick a country'),
  avatarUrl: z.string().nullable(),
  companyName: z.string().trim().min(2, 'Enter your company name'),
  website: z
    .union([z.literal(''), z.string().url('Enter a valid URL')])
    .optional(),
  industry: z.string().trim().min(2, 'Enter your industry'),
});

type StudentForm = z.infer<typeof studentSchema>;
type BusinessForm = z.infer<typeof businessSchema>;

type Props = {
  me: Me;
  submitLabel?: string;
  onSubmitted?: () => void;
};

export function ProfileForm({ me, submitLabel = 'Save', onSubmitted }: Props) {
  const showToast = useUiStore((s) => s.showToast);
  const updateProfile = useUpdateProfile();
  const updateStudent = useUpdateStudentProfile();
  const updateBusiness = useUpdateBusinessProfile();

  const isStudent = me.accountType === 'student';
  const schema = useMemo(
    () => (isStudent ? studentSchema : businessSchema),
    [isStudent],
  );

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<StudentForm | BusinessForm>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: defaultsFor(me, isStudent),
  });

  useEffect(() => {
    reset(defaultsFor(me, isStudent));
  }, [me, isStudent, reset]);

  const submit = async (values: StudentForm | BusinessForm) => {
    try {
      await updateProfile.mutateAsync({
        fullName: values.fullName,
        country: values.country,
        avatarUrl: values.avatarUrl ?? undefined,
      });

      if (isStudent) {
        const v = values as StudentForm;
        await updateStudent.mutateAsync({
          bio: v.bio,
          university: v.university,
          graduationYear: v.graduationYear,
        });
      } else {
        const v = values as BusinessForm;
        await updateBusiness.mutateAsync({
          companyName: v.companyName,
          website: v.website || undefined,
          industry: v.industry,
        });
      }

      onSubmitted?.();
    } catch (err) {
      const msg = err instanceof GraphQLError ? err.message : 'Could not save profile';
      showToast(msg, 'error');
    }
  };

  const submitting =
    updateProfile.isPending || updateStudent.isPending || updateBusiness.isPending;

  return (
    <View style={{ gap: spacing.lg }}>
      <Controller
        control={control}
        name="avatarUrl"
        render={({ field: { value, onChange } }) => (
          <AvatarPicker value={value ?? null} onChange={onChange} />
        )}
      />

      <Controller
        control={control}
        name="fullName"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            label="Full name"
            value={value as string}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.fullName?.message}
            placeholder="Your full name"
            autoCapitalize="words"
            autoComplete="name"
            returnKeyType="next"
          />
        )}
      />

      <Controller
        control={control}
        name="country"
        render={({ field: { value, onChange } }) => (
          <View style={{ gap: spacing.xs }}>
            <CountryField
              label="Country"
              required
              value={(value as string) || null}
              onChange={(code) => onChange(code ?? '')}
            />
            {errors.country ? (
              <ThemedText font={fonts.regular} size="caption" color="danger">
                {errors.country.message as string}
              </ThemedText>
            ) : null}
          </View>
        )}
      />

      {isStudent ? (
        <>
          <Controller
            control={control}
            name={'bio' as const}
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Bio"
                value={(value as string) ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                error={(errors as any).bio?.message}
                placeholder="A short intro — your skills, what you're studying, what you're good at"
                multiline
                numberOfLines={4}
                maxLength={280}
                hint="280 characters max"
              />
            )}
          />
          <Controller
            control={control}
            name={'university' as const}
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="University"
                value={(value as string) ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                error={(errors as any).university?.message}
                placeholder="University of Lagos"
                autoCapitalize="words"
              />
            )}
          />
          <Controller
            control={control}
            name={'graduationYear' as const}
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Graduation year"
                value={value != null ? String(value) : ''}
                onChangeText={(t) => {
                  const n = parseInt(t.replace(/\D/g, ''), 10);
                  onChange(Number.isFinite(n) ? n : undefined);
                }}
                onBlur={onBlur}
                error={(errors as any).graduationYear?.message}
                placeholder={String(CURRENT_YEAR + 1)}
                keyboardType="number-pad"
                inputMode="numeric"
                maxLength={4}
              />
            )}
          />
        </>
      ) : (
        <>
          <Controller
            control={control}
            name={'companyName' as const}
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Company name"
                value={(value as string) ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                error={(errors as any).companyName?.message}
                placeholder="Acme Studios"
                autoCapitalize="words"
              />
            )}
          />
          <Controller
            control={control}
            name={'website' as const}
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Website"
                value={(value as string) ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                error={(errors as any).website?.message}
                placeholder="https://acme.com"
                autoCapitalize="none"
                autoComplete="url"
                keyboardType="url"
                hint="Optional"
              />
            )}
          />
          <Controller
            control={control}
            name={'industry' as const}
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Industry"
                value={(value as string) ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                error={(errors as any).industry?.message}
                placeholder="Software, retail, fintech…"
                autoCapitalize="words"
              />
            )}
          />
        </>
      )}

      <View style={{ marginTop: spacing.sm }}>
        <Button
          label={submitLabel}
          onPress={handleSubmit(submit)}
          disabled={!isValid || submitting}
          loading={submitting}
          fullWidth
        />
      </View>
    </View>
  );
}

function defaultsFor(me: Me, isStudent: boolean): StudentForm | BusinessForm {
  if (isStudent) {
    return {
      fullName: me.fullName ?? '',
      country: me.country ?? '',
      avatarUrl: me.avatarUrl ?? null,
      bio: me.studentProfile?.bio ?? '',
      university: me.studentProfile?.university ?? '',
      graduationYear: me.studentProfile?.graduationYear ?? CURRENT_YEAR + 1,
    } satisfies StudentForm;
  }
  return {
    fullName: me.fullName ?? '',
    country: me.country ?? '',
    avatarUrl: me.avatarUrl ?? null,
    companyName: me.businessProfile?.companyName ?? '',
    website: me.businessProfile?.website ?? '',
    industry: me.businessProfile?.industry ?? '',
  } satisfies BusinessForm;
}
