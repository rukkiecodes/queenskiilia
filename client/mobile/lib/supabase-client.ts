import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!URL || !ANON_KEY) {
  throw new Error('EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY missing');
}

/**
 * Supabase client scoped to Realtime use only. We do NOT use Supabase Auth —
 * authentication lives in our own JWT issued by main-server. The anon key is
 * exposed in the mobile bundle and is fine to ship; production hardening
 * (custom JWT signer / RLS) lands as a separate polish item.
 *
 * Chat security is enforced server-side: chat-service mutations require a
 * valid main-server JWT + participant check. Realtime is a side channel that
 * only notifies — the worst a bad actor with the anon key can do is see that
 * messages exist (with content). Mitigation: clients only subscribe to channels
 * scoped to chats they participate in.
 */
export const supabase = createClient(URL, ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});
