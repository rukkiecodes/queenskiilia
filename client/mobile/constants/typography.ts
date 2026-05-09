import { normalizeFontSize as f } from '@/lib/normalize-font-size';

export const fonts = {
  blackItalic:      'Poppins-BlackItalic',
  bold:             'Poppins-Bold',
  boldItalic:       'Poppins-BoldItalic',
  extraBold:        'Poppins-ExtraBold',
  extraBoldItalic:  'Poppins-ExtraBoldItalic',
  extraLight:       'Poppins-ExtraLight',
  extraLightItalic: 'Poppins-ExtraLightItalic',
  italic:           'Poppins-Italic',
  light:            'Poppins-Light',
  lightItalic:      'Poppins-LightItalic',
  medium:           'Poppins-Medium',
  mediumItalic:     'Poppins-MediumItalic',
  regular:          'Poppins-Regular',
  semiBold:         'Poppins-SemiBold',
  semiBoldItalic:   'Poppins-SemiBoldItalic',
  thin:             'Poppins-Thin',
  thinItalic:       'Poppins-ThinItalic',
} as const;

export type FontName = (typeof fonts)[keyof typeof fonts];

export const fontSize = {
  heroDisplay: f(80),
  title1:      f(56),
  title2:      f(40),
  title3:      f(28),
  headline:    f(20),
  body:        f(17),
  callout:     f(15),
  caption:     f(13),
  micro:       f(11),
} as const;

export type FontSizeToken = keyof typeof fontSize;
