import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '@/src/components/navigation/ScreenHeader';
import { COLORS, SIZES } from '@/src/theme';
import { FAQ_ITEMS, FINANCIAL_TIPS, RESOURCE_LINKS } from '@/src/content/help-center';

export default function HelpScreen() {
  const [openId, setOpenId] = useState<string | null>(FAQ_ITEMS[0]?.id ?? null);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ScreenHeader
          title="Help & resources"
          breadcrumbs={[
            { label: 'Dashboard', href: '/(app)/(tabs)' },
            { label: 'Help' },
          ]}
        />
        <Text style={styles.lead}>
          Learn how Vridhi is designed, get practical money tips, and find answers without leaving the app.
        </Text>

        <Text style={styles.section}>Tips to grow your corpus</Text>
        {FINANCIAL_TIPS.map((tip) => (
          <View key={tip.id} style={styles.card}>
            <Text style={styles.cardTitle}>{tip.title}</Text>
            <Text style={styles.cardBody}>{tip.body}</Text>
          </View>
        ))}

        <Text style={styles.section}>FAQs</Text>
        {FAQ_ITEMS.map((item) => {
          const open = openId === item.id;
          return (
            <Pressable
              key={item.id}
              style={styles.faq}
              onPress={() => setOpenId(open ? null : item.id)}
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}
            >
              <Text style={styles.faqTitle}>{item.title}</Text>
              {open ? <Text style={styles.faqBody}>{item.body}</Text> : null}
            </Pressable>
          );
        })}

        <Text style={styles.section}>External resources</Text>
        {RESOURCE_LINKS.map((link) => (
          <Pressable
            key={link.url}
            style={styles.linkRow}
            onPress={() => void Linking.openURL(link.url)}
          >
            <Text style={styles.linkTitle}>{link.title}</Text>
            <Text style={styles.linkDesc}>{link.description}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: SIZES.padding, paddingBottom: 48 },
  lead: { color: COLORS.textLight, marginBottom: 20, lineHeight: 20 },
  section: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: 8, marginBottom: 12 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  cardTitle: { fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  cardBody: { color: COLORS.textLight, lineHeight: 20 },
  faq: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  faqTitle: { fontWeight: '700', color: COLORS.text },
  faqBody: { color: COLORS.textLight, marginTop: 8, lineHeight: 20 },
  linkRow: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: COLORS.border },
  linkTitle: { color: COLORS.primary, fontWeight: '700' },
  linkDesc: { color: COLORS.textLight, fontSize: 12, marginTop: 4 },
});
