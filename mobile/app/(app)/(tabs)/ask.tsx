import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES } from '@/src/theme';
import PrimaryButton from '@/src/components/form/PrimaryButton';
import { AiApi } from '@/src/api/imports.api';

interface ChatItem {
  role: 'user' | 'assistant';
  content: string;
}

export default function AskScreen() {
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [disclaimer, setDisclaimer] = useState(
    'Vridhi explains recorded finances. It does not provide professional financial, investment, tax, or legal advice.',
  );

  async function send() {
    const content = input.trim();
    if (!content || loading) return;
    const next = [...messages, { role: 'user' as const, content }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const result = await AiApi.chat({ conversationId, messages: next });
      setConversationId(result.conversationId);
      setDisclaimer(result.disclaimer);
      setMessages([...next, result.message]);
    } catch (error: any) {
      setMessages([
        ...next,
        {
          role: 'assistant',
          content:
            error?.response?.data?.message ??
            'I could not answer that right now. Check that the API is running and OPENAI_API_KEY is set.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Text style={styles.title}>Ask Vridhi</Text>
        <Text style={styles.disclaimer}>{disclaimer}</Text>
        <ScrollView contentContainerStyle={styles.thread}>
          {messages.length === 0 ? (
            <Text style={styles.empty}>
              Ask about this month's spending, savings rate, budgets, or account balances. Answers use your recorded data.
            </Text>
          ) : (
            messages.map((message, index) => (
              <View
                key={`${message.role}-${index}`}
                style={[styles.bubble, message.role === 'user' ? styles.user : styles.assistant]}
              >
                <Text style={message.role === 'user' ? styles.userText : styles.assistantText}>
                  {message.content}
                </Text>
              </View>
            ))
          )}
          {loading ? <ActivityIndicator color={COLORS.primary} /> : null}
        </ScrollView>
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="How much did I spend on groceries this month?"
            multiline
          />
          <PrimaryButton title="Send" loading={loading} onPress={send} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  flex: { flex: 1, padding: SIZES.padding },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text },
  disclaimer: { color: COLORS.textLight, fontSize: 12, marginBottom: 12 },
  thread: { paddingBottom: 16, gap: 10 },
  empty: { color: COLORS.textLight, marginTop: 24 },
  bubble: { borderRadius: 16, padding: 12, maxWidth: '90%' },
  user: { alignSelf: 'flex-end', backgroundColor: COLORS.primary },
  assistant: { alignSelf: 'flex-start', backgroundColor: COLORS.surface },
  userText: { color: '#fff' },
  assistantText: { color: COLORS.text },
  composer: { gap: 10, paddingBottom: 12 },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    minHeight: 48,
  },
});
