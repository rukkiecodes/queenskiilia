import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { Toaster } from '@/components/ui/toaster';
import { colors } from '@/constants/colors';
import { useMe } from '@/hooks/use-me';
import { profileComplete } from '@/lib/profile-status';
import { useAuthStore } from '@/store/auth-store';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60, retry: 1 },
  },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Poppins-BlackItalic':      'https://res.cloudinary.com/rukkiecodes/raw/upload/v1760611864/recido/fonts/Poppins/Poppins-BlackItalic_mbvrvq.ttf',
    'Poppins-Bold':             'https://res.cloudinary.com/rukkiecodes/raw/upload/v1760611853/recido/fonts/Poppins/Poppins-Bold_p3q09s.ttf',
    'Poppins-BoldItalic':       'https://res.cloudinary.com/rukkiecodes/raw/upload/v1760611868/recido/fonts/Poppins/Poppins-BoldItalic_gakapk.ttf',
    'Poppins-ExtraBold':        'https://res.cloudinary.com/rukkiecodes/raw/upload/v1760611858/recido/fonts/Poppins/Poppins-ExtraBold_pjngop.ttf',
    'Poppins-ExtraBoldItalic':  'https://res.cloudinary.com/rukkiecodes/raw/upload/v1760611856/recido/fonts/Poppins/Poppins-ExtraBoldItalic_js2psb.ttf',
    'Poppins-ExtraLight':       'https://res.cloudinary.com/rukkiecodes/raw/upload/v1760611843/recido/fonts/Poppins/Poppins-ExtraLight_xnhmwg.ttf',
    'Poppins-ExtraLightItalic': 'https://res.cloudinary.com/rukkiecodes/raw/upload/v1760611871/recido/fonts/Poppins/Poppins-ExtraLightItalic_xuwnqt.ttf',
    'Poppins-Italic':           'https://res.cloudinary.com/rukkiecodes/raw/upload/v1760611873/recido/fonts/Poppins/Poppins-Italic_ytdbdl.ttf',
    'Poppins-Light':            'https://res.cloudinary.com/rukkiecodes/raw/upload/v1760611846/recido/fonts/Poppins/Poppins-Light_ngo0ao.ttf',
    'Poppins-LightItalic':      'https://res.cloudinary.com/rukkiecodes/raw/upload/v1760611875/recido/fonts/Poppins/Poppins-LightItalic_lxrsut.ttf',
    'Poppins-Medium':           'https://res.cloudinary.com/rukkiecodes/raw/upload/v1760611861/recido/fonts/Poppins/Poppins-Medium_hwse5m.ttf',
    'Poppins-MediumItalic':     'https://res.cloudinary.com/rukkiecodes/raw/upload/v1760611878/recido/fonts/Poppins/Poppins-MediumItalic_qscdr9.ttf',
    'Poppins-Regular':          'https://res.cloudinary.com/rukkiecodes/raw/upload/v1760611848/recido/fonts/Poppins/Poppins-Regular_zfzt5q.ttf',
    'Poppins-SemiBold':         'https://res.cloudinary.com/rukkiecodes/raw/upload/v1760611887/recido/fonts/Poppins/Poppins-SemiBold_k9tmyh.ttf',
    'Poppins-SemiBoldItalic':   'https://res.cloudinary.com/rukkiecodes/raw/upload/v1760611880/recido/fonts/Poppins/Poppins-SemiBoldItalic_j3fkfz.ttf',
    'Poppins-Thin':             'https://res.cloudinary.com/rukkiecodes/raw/upload/v1760611882/recido/fonts/Poppins/Poppins-Thin_x1o769.ttf',
    'Poppins-ThinItalic':       'https://res.cloudinary.com/rukkiecodes/raw/upload/v1760611884/recido/fonts/Poppins/Poppins-ThinItalic_v4p3mp.ttf',
  });

  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (fontsLoaded && hydrated) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, hydrated]);

  if (!fontsLoaded || !hydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AuthGate />
        <Toaster />
        <StatusBar style="dark" />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

// Routes outside any group that should never trigger a forced redirect — they
// are transient (modals, formSheets) layered over whatever the user was doing.
const TRANSIENT_ROUTES = new Set(['country-picker']);

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const { data: me, isLoading: meLoading, isFetching: meFetching } = useMe();

  useEffect(() => {
    const seg0 = segments[0];
    const seg1 = segments[1];
    const authed = !!user && !!accessToken;

    if (TRANSIENT_ROUTES.has(seg0)) return;

    if (!authed) {
      if (seg0 !== '(auth)') router.replace('/(auth)');
      return;
    }

    // Wait for `me` before deciding between profile-setup and dashboard.
    // First load: no cached data; subsequent navigations: stale data is fine.
    if (!me && (meLoading || meFetching)) return;

    const complete = profileComplete(me);

    if (!complete) {
      if (!(seg0 === '(auth)' && seg1 === 'profile-setup')) {
        router.replace('/(auth)/profile-setup');
      }
      return;
    }

    if (seg0 === '(auth)') {
      const dest = me!.accountType === 'business' ? '/(business)/dashboard' : '/(student)/dashboard';
      router.replace(dest);
    }
  }, [segments, user, accessToken, me, meLoading, meFetching, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(student)" />
      <Stack.Screen name="(business)" />
      <Stack.Screen name="(shared)" />
      <Stack.Screen name="country-picker" options={{ presentation: 'formSheet' }} />
    </Stack>
  );
}
