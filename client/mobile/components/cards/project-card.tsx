import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { formatBudget, formatDeadline } from '@/lib/format-deadline';
import type { Project } from '@/lib/projects-api';

type Props = {
  project: Project;
  onPress: () => void;
};

const MAX_VISIBLE_SKILLS = 3;

export function ProjectCard({ project, onPress }: Props) {
  const visibleSkills = project.requiredSkills.slice(0, MAX_VISIBLE_SKILLS);
  const overflow = project.requiredSkills.length - visibleSkills.length;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: colors.hairline,
        backgroundColor: colors.canvas,
        padding: spacing.lg,
        gap: spacing.sm,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <ThemedText
        font={fonts.semiBold}
        size="headline"
        color="ink"
        numberOfLines={2}
      >
        {project.title}
      </ThemedText>

      <ThemedText
        font={fonts.regular}
        size="callout"
        color="inkMuted48"
        numberOfLines={2}
      >
        {project.description}
      </ThemedText>

      {visibleSkills.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
          {visibleSkills.map((skill) => (
            <SkillChip key={skill} label={skill} />
          ))}
          {overflow > 0 ? <SkillChip label={`+${overflow}`} /> : null}
        </View>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: spacing.xs,
        }}
      >
        <ThemedText font={fonts.semiBold} size="callout" color="ink">
          {formatBudget(project.budget, project.currency)}
        </ThemedText>
        <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
          {formatDeadline(project.deadline)}
        </ThemedText>
      </View>
    </Pressable>
  );
}

function SkillChip({ label }: { label: string }) {
  return (
    <View
      style={{
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: radius.pill,
        backgroundColor: colors.canvasParchment,
      }}
    >
      <ThemedText font={fonts.regular} size="caption" color="inkMuted80">
        {label}
      </ThemedText>
    </View>
  );
}
