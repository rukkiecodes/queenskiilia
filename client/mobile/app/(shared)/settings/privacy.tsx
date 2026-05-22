import { Stack } from 'expo-router';

import { LegalWebView } from '@/components/legal-webview';
import { LEGAL_URLS } from '@/constants/legal';

export default function Privacy() {
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Privacy Policy' }} />
      <LegalWebView url={LEGAL_URLS.privacy} loadingLabel="Loading policy…" />
    </>
  );
}
