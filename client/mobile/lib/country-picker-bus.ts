import type { Country } from '@/constants/countries';

type Resolver = (country: Country | null) => void;

let pending: Resolver | null = null;

export const countryPickerBus = {
  /** Called by the field component before pushing the picker route. */
  expect(resolver: Resolver) {
    pending = resolver;
  },
  /** Called by the picker route when the user picks (or cancels). */
  resolve(country: Country | null) {
    pending?.(country);
    pending = null;
  },
};
