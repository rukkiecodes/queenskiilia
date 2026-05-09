import { normalizeColor as n } from '@/lib/normalize-color';

export const colors = {
  primary:           n('#0066cc'),
  primaryFocus:      n('#0071e3'),
  primaryOnDark:     n('#2997ff'),

  ink:               n('#1d1d1f'),
  body:              n('#1d1d1f'),
  bodyOnDark:        n('#ffffff'),
  bodyMuted:         n('#cccccc'),
  inkMuted80:        n('#333333'),
  inkMuted48:        n('#7a7a7a'),

  dividerSoft:       n('#f0f0f0'),
  hairline:          n('#e0e0e0'),

  canvas:            n('#ffffff'),
  canvasParchment:   n('#f5f5f7'),
  surfacePearl:      n('#fafafc'),
  surfaceTile1:      n('#272729'),
  surfaceTile2:      n('#2a2a2c'),
  surfaceTile3:      n('#252527'),
  surfaceBlack:      n('#000000'),
  chipTranslucent:   n('#d2d2d7'),

  onPrimary:         n('#ffffff'),
  onDark:            n('#ffffff'),
  onDark60:          n('#ffffff', 0.6),  // translucent white on photographic backgrounds (camera guide, controls overlay)
  scrim:             n('#000000', 0.45),  // dimming behind floating sheets/captures

  danger:            n('#ff3b30'),
  success:           n('#34c759'),
  warning:           n('#ff9500'),
} as const;

export type ColorToken = keyof typeof colors;
