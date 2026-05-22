import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';

export default function About() {
  const version = Constants.expoConfig?.version ?? '—';
  // runtimeVersion is what EAS Updates pins the JS bundle against; surfacing
  // it here gives support a clean way to ask "which build are you on?".
  const runtimeVersion =
    typeof Constants.expoConfig?.runtimeVersion === 'string'
      ? Constants.expoConfig.runtimeVersion
      : null;

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'About' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingVertical: spacing.xxl,
          paddingHorizontal: spacing.xl,
          gap: spacing.xl,
          alignItems: 'center',
        }}
        style={{ flex: 1, backgroundColor: colors.canvas }}
      >
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: radius.xl,
            borderCurve: 'continuous',
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image
            source="sf:crown"
            tintColor={colors.onPrimary}
            style={{ width: 44, height: 44 }}
          />
        </View>

        <View style={{ gap: spacing.xs, alignItems: 'center' }}>
          <ThemedText font={fonts.bold} size="title3" color="ink">
            QueenSkiilia
          </ThemedText>
          <ThemedText font={fonts.regular} size="body" color="inkMuted48">
            Version {version}
          </ThemedText>
          {runtimeVersion ? (
            <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
              Runtime {runtimeVersion}
            </ThemedText>
          ) : null}
        </View>

        <ThemedText
          font={fonts.regular}
          size="body"
          color="inkMuted80"
          style={{ textAlign: 'center', maxWidth: 320 }}
        >
          A marketplace connecting students with verified businesses for paid
          project work. Built with care for African creators.
        </ThemedText>

        <ThemedText
          font={fonts.regular}
          size="caption"
          color="inkMuted48"
          style={{ marginTop: spacing.xl }}
        >
          © {new Date().getFullYear()} QueenSkiilia
        </ThemedText>
      </ScrollView>
    </>
  );
}
