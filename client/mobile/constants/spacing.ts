import { normalizeSize as s } from '@/lib/normalize-size';

export const spacing = {
  xxs: s(2),
  xs:  s(4),
  sm:  s(8),
  md:  s(12),
  base: s(16),
  lg:  s(20),
  xl:  s(24),
  xxl: s(32),
  xxxl: s(48),
  huge: s(64),
} as const;

export const radius = {
  sm:  s(6),
  md:  s(10),
  lg:  s(14),
  xl:  s(20),
  pill: 999,
} as const;

export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radius;
