import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useApplyToProject } from '@/hooks/use-project-mutations';
import { useMyApplications, useProject } from '@/hooks/use-projects';
import { useUser } from '@/hooks/use-user';
import { formatBudget, formatDeadline } from '@/lib/format-deadline';
import { GraphQLError } from '@/lib/graphql-client';
import { useUiStore } from '@/store/ui-store';

const MIN_LENGTH = 20;
const MAX_LENGTH = 500;

export default function Apply() {
  const router = useRouter();
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const showToast = useUiStore((s) => s.showToast);

  const project = useProject(projectId);
  const business = useUser(project.data?.businessId);
  const myApps = useMyApplications();
  const apply = useApplyToProject();

  const [coverNote, setCoverNote] = useState('');
  const [error, setError] = useState<string>();

  const alreadyApplied = useMemo(
    () =>
      project.data
        ? myApps.data?.some((a) => a.projectId === project.data!.id && a.status !== 'withdrawn')
        : false,
    [myApps.data, project.data],
  );

  const businessName =
    business.data?.businessProfile?.companyName ?? business.data?.fullName ?? null;

  const submit = async () => {
    if (!project.data) return;
    const note = coverNote.trim();
    if (note.length < MIN_LENGTH) {
      setError(`Cover note must be at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (note.length > MAX_LENGTH) {
      setError(`Cover note must be ${MAX_LENGTH} characters or less.`);
      return;
    }
    setError(undefined);
    try {
      await apply.mutateAsync({ projectId: project.data.id, coverNote: note });
      showToast('Application submitted', 'success');
      router.back();
    } catch (err) {
      const msg = err instanceof GraphQLError ? err.message : 'Could not submit application';
      setError(msg);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          presentation: 'formSheet',
          headerShown: true,
          title: 'Apply',
          sheetGrabberVisible: true,
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
          {project.data ? (
            <ProjectSummary
              title={project.data.title}
              businessName={businessName}
              businessLoading={business.isLoading}
              budget={formatBudget(project.data.budget, project.data.currency)}
              deadline={formatDeadline(project.data.deadline)}
            />
          ) : null}

          {alreadyApplied ? (
            <View
              style={{
                padding: spacing.lg,
                borderRadius: radius.lg,
                backgroundColor: colors.canvasParchment,
                gap: spacing.xs,
              }}
            >
              <ThemedText font={fonts.semiBold} size="callout" color="ink">
                Already applied
              </ThemedText>
              <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
                You can withdraw the existing application from the project detail screen first.
              </ThemedText>
            </View>
          ) : (
            <View style={{ gap: spacing.xs }}>
              <ThemedText font={fonts.semiBold} size="callout" color="ink">
                Cover note
              </ThemedText>
              <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
                Tell the business why you’re a good fit. {MIN_LENGTH}–{MAX_LENGTH} characters.
              </ThemedText>
              <Input
                value={coverNote}
                onChangeText={(t) => {
                  setCoverNote(t);
                  if (error) setError(undefined);
                }}
                placeholder="Hi! I’m interested in this project because…"
                multiline
                numberOfLines={6}
                maxLength={MAX_LENGTH}
                error={error}
                hint={`${coverNote.length}/${MAX_LENGTH}`}
              />
            </View>
          )}

          <Button
            label={alreadyApplied ? 'Already applied' : 'Submit application'}
            onPress={submit}
            disabled={alreadyApplied || apply.isPending || coverNote.trim().length < MIN_LENGTH}
            loading={apply.isPending}
            fullWidth
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

function ProjectSummary({
  title,
  businessName,
  businessLoading,
  budget,
  deadline,
}: {
  title: string;
  businessName: string | null;
  businessLoading: boolean;
  budget: string;
  deadline: string;
}) {
  return (
    <View
      style={{
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: colors.hairline,
        padding: spacing.lg,
        gap: spacing.xs,
      }}
    >
      <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
        {businessLoading ? 'Loading…' : businessName ?? 'Business'}
      </ThemedText>
      <ThemedText font={fonts.semiBold} size="headline" color="ink" numberOfLines={2}>
        {title}
      </ThemedText>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs }}>
        <ThemedText font={fonts.regular} size="caption" color="ink">
          {budget}
        </ThemedText>
        <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
          {deadline}
        </ThemedText>
      </View>
    </View>
  );
}
