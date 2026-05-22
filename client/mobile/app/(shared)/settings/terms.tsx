import { Stack } from 'expo-router';

import { LegalWebView } from '@/components/legal-webview';
import { LEGAL_URLS } from '@/constants/legal';

export default function Terms() {
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Terms of Service' }} />
      <LegalWebView url={LEGAL_URLS.terms} loadingLabel="Loading terms…" />
    </>
  );
}
