import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { colors } from '@/constants/colors';
import { SUPPORT_EMAIL } from '@/constants/legal';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';

type Faq = { question: string; answer: string };

const FAQS: Faq[] = [
  {
    question: 'How do escrow payments work?',
    answer:
      'When a business selects you for a project, they fund an escrow account up front. The funds are held until the work is approved, then released to you. Disputes pause the release until reviewed.',
  },
  {
    question: 'When do I get paid?',
    answer:
      'Earnings are released as soon as the business approves your submission. You can track every transaction in the Earnings screen.',
  },
  {
    question: 'How do I get verified?',
    answer:
      'Open Settings → Verification and submit a government-issued ID and a quick selfie. Most accounts are reviewed within 48 hours.',
  },
  {
    question: 'Can I delete my account?',
    answer:
      'Yes — Settings → Delete account permanently removes your profile, portfolio, and ratings after a 30-day grace window. Transaction records are kept for legal reasons.',
  },
  {
    question: 'I found a bug or have feedback.',
    answer: `Email us at ${SUPPORT_EMAIL} and we’ll get back to you within 1 business day.`,
  },
];

function FaqItem({ item }: { item: Faq }) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable
      onPress={() => setOpen((v) => !v)}
      style={({ pressed }) => ({
        paddingVertical: spacing.base,
        paddingHorizontal: spacing.base,
        backgroundColor: pressed ? colors.canvasParchment : 'transparent',
        gap: spacing.sm,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <ThemedText
          font={fonts.semiBold}
          size="body"
          color="ink"
          style={{ flex: 1 }}
        >
          {item.question}
        </ThemedText>
        <Image
          source={open ? 'sf:chevron.up' : 'sf:chevron.down'}
          tintColor={colors.inkMuted48}
          style={{ width: 14, height: 14 }}
        />
      </View>
      {open ? (
        <ThemedText
          font={fonts.regular}
          size="callout"
          color="inkMuted80"
          selectable
        >
          {item.answer}
        </ThemedText>
      ) : null}
    </Pressable>
  );
}

export default function Help() {
  const contactSupport = () => {
    const subject = encodeURIComponent('QueenSkiilia support');
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}`).catch(() => {
      // Falls through silently — if no mail client is installed there's
      // nothing useful we can do here besides showing the email address,
      // which is already visible just above.
    });
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Help' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.lg,
          gap: spacing.xl,
        }}
        style={{ flex: 1, backgroundColor: colors.canvas }}
      >
        <ThemedText font={fonts.regular} size="body" color="inkMuted80">
          Tap a question to expand the answer. Still stuck? Email support and
          we’ll reply within one business day.
        </ThemedText>

        <View
          style={{
            borderRadius: radius.lg,
            borderCurve: 'continuous',
            backgroundColor: colors.surfacePearl,
            overflow: 'hidden',
          }}
        >
          {FAQS.map((item, idx) => (
            <View
              key={item.question}
              style={{
                borderTopWidth: idx === 0 ? 0 : 1,
                borderTopColor: colors.dividerSoft,
              }}
            >
              <FaqItem item={item} />
            </View>
          ))}
        </View>

        <View style={{ gap: spacing.sm, alignItems: 'center' }}>
          <ThemedText
            font={fonts.regular}
            size="caption"
            color="inkMuted48"
            selectable
          >
            {SUPPORT_EMAIL}
          </ThemedText>
          <Button label="Contact support" onPress={contactSupport} />
        </View>
      </ScrollView>
    </>
  );
}
