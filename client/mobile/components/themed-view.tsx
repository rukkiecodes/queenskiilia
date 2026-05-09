import { View, type ViewProps } from 'react-native';

import { colors, type ColorToken } from '@/constants/colors';

export type ThemedViewProps = ViewProps & {
  background?: ColorToken;
};

export function ThemedView({ style, background = 'canvas', ...rest }: ThemedViewProps) {
  return <View style={[{ backgroundColor: colors[background] }, style]} {...rest} />;
}
