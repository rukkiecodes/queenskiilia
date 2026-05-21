import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

/**
 * Refetches a query whenever the screen regains focus, skipping the initial
 * focus (the query already fetched on mount). Keeps read-only dashboards in
 * sync with data changed elsewhere without a manual pull-to-refresh.
 */
export function useRefreshOnFocus(refetch: () => unknown) {
  const firstFocus = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      refetch();
    }, [refetch]),
  );
}
