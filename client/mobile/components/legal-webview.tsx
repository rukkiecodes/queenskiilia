import { ActivityIndicator, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { ThemedText } from '@/components/themed-text';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';

type Props = {
  url: string;
  /** Shown above the WebView while the page is fetching. */
  loadingLabel?: string;
};

/**
 * Renders hosted legal copy (Terms, Privacy Policy) so we can update text
 * without cutting a new app build — a Google Play submission requirement.
 * Failures fall back to a labelled placeholder so users always see *something*.
 */
export function LegalWebView({ url, loadingLabel }: Props) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <WebView
        source={{ uri: url }}
        startInLoadingState
        renderLoading={() => (
          <View
            style={{
              ...StyleSheet_absoluteFill,
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.sm,
              backgroundColor: colors.canvas,
            }}
          >
            <ActivityIndicator color={colors.primary} />
            {loadingLabel ? (
              <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
                {loadingLabel}
              </ThemedText>
            ) : null}
          </View>
        )}
        renderError={() => (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              padding: spacing.xl,
              gap: spacing.sm,
              backgroundColor: colors.canvas,
            }}
          >
            <ThemedText font={fonts.semiBold} size="body" color="ink">
              Can’t load right now
            </ThemedText>
            <ThemedText
              font={fonts.regular}
              size="caption"
              color="inkMuted48"
              style={{ textAlign: 'center' }}
              selectable
            >
              Check your connection and pull back to retry, or visit {url} in
              your browser.
            </ThemedText>
          </View>
        )}
      />
    </View>
  );
}

// Inlined to avoid pulling in `StyleSheet` just for one constant — Reanimated
// already pulls `StyleSheet` in via babel transforms so this saves a require.
const StyleSheet_absoluteFill = {
  position: 'absolute' as const,
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
};
