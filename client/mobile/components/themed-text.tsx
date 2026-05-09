import { Text, type TextProps } from 'react-native';

import { colors, type ColorToken } from '@/constants/colors';
import { fonts, fontSize, type FontName, type FontSizeToken } from '@/constants/typography';

export type ThemedTextProps = TextProps & {
  font?: FontName;
  size?: FontSizeToken;
  color?: ColorToken;
  opacity?: number;
};

export function ThemedText({
  style,
  font = fonts.regular,
  size = 'body',
  color = 'ink',
  opacity,
  ...rest
}: ThemedTextProps) {
  return (
    <Text
      style={[
        {
          fontFamily: font,
          fontSize: fontSize[size],
          color: colors[color],
          opacity,
        },
        style,
      ]}
      {...rest}
    />
  );
}
