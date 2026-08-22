import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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

const SUGGESTIONS = [
  'How much did I spend this month?',
  "What's my net worth?",
  'What bills repeat?',
  'Is anything unusual this month?',
  'Account balances',
];

const MODE_LABEL: Record<string, string> = {
  template: 'Answered from your books',
  llm: 'Answered with a language model over your books',
  fallback: 'No language model configured — structured questions still work',
};

export default function AskScreen() {
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<string[]>([]);
  const [mode, setMode] = useState<string>();
  const [threads, setThreads] = useState<Array<{ id: string; title: string | null }>>([]);
  const [disclaimer, setDisclaimer] = useState(
    'Vridhi explains recorded finances. It does not provide professional financial, investment, tax, or legal advice.',
  );

  const loadThreads = useCallback(async () => {
    try {
      const list = await AiApi.listConversations();
      setThreads(list.map((item) => ({ id: item.id, title: item.title })));
    } catch {
      setThreads([]);
    }
  }, []);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  async function openThread(id: string) {
    try {
      const conversation = await AiApi.getConversation(id);
      setConversationId(id);
      setMessages(
        conversation.messages.map((message) => ({
          role: message.role === 'USER' ? 'user' : 'assistant',
          content: message.content,
        })),
      );
      setSources([]);
      setMode(undefined);
    } catch {
      setMessages([{ role: 'assistant', content: 'Could not load that conversation.' }]);
    }
  }

  function newChat() {
    setConversationId(undefined);
    setMessages([]);
    setSources([]);
    setMode(undefined);
  }

  async function sendText(content: string) {
    const trimmed = content.trim();
    if (!trimmed || loading) return;
    const next = [...messages, { role: 'user' as const, content: trimmed }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const result = await AiApi.chat({ conversationId, messages: next });
      setConversationId(result.conversationId);
      setDisclaimer(result.disclaimer);
      setSources(result.sources ?? []);
      setMode(result.mode);
      setMessages([...next, result.message]);
      void loadThreads();
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setMessages([
        ...next,
        {
          role: 'assistant',
          content:
            message ??
            'I could not answer that right now. Common questions still work from your books. For open chat, use a small Ollama model (`ollama pull llama3.2`) or set OPENAI_API_KEY.',
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Pressable style={styles.chip} onPress={newChat}>
            <Text style={styles.chipText}>New chat</Text>
          </Pressable>
          {threads.map((thread) => (
            <Pressable
              key={thread.id}
              style={[styles.chip, conversationId === thread.id && styles.chipOn]}
              onPress={() => openThread(thread.id)}
            >
              <Text style={styles.chipText} numberOfLines={1}>
                {thread.title || 'Conversation'}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <ScrollView contentContainerStyle={styles.thread}>
          {messages.length === 0 ? (
            <View style={styles.emptyBlock}>
              <Text style={styles.empty}>
                Spending, net worth, budgets, balances, and recurring bills are answered from your ledger. Open chat needs a small Ollama model (`ollama pull llama3.2`) or an API key.
              </Text>
              <View style={styles.suggestions}>
                {SUGGESTIONS.map((suggestion) => (
                  <Pressable
                    key={suggestion}
                    style={styles.suggestion}
                    onPress={() => sendText(suggestion)}
                  >
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
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
          {mode ? <Text style={styles.sources}>{MODE_LABEL[mode] ?? mode}</Text> : null}
          {sources.length > 0 ? (
            <Text style={styles.sources}>From your data: {sources.join(', ').replace(/_/g, ' ')}</Text>
          ) : null}
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
          <PrimaryButton title="Send" loading={loading} onPress={() => sendText(input)} />
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
  chips: { gap: 8, paddingBottom: 12 },
  chip: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    maxWidth: 180,
  },
  chipOn: { backgroundColor: COLORS.primaryLight },
  chipText: { color: COLORS.text, fontWeight: '600', fontSize: 12 },
  thread: { paddingBottom: 16, gap: 10 },
  emptyBlock: { marginTop: 12, gap: 12 },
  empty: { color: COLORS.textLight },
  suggestions: { gap: 8 },
  suggestion: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  suggestionText: { color: COLORS.primary, fontWeight: '600' },
  bubble: { borderRadius: 16, padding: 12, maxWidth: '90%' },
  user: { alignSelf: 'flex-end', backgroundColor: COLORS.primary },
  assistant: { alignSelf: 'flex-start', backgroundColor: COLORS.surface },
  userText: { color: '#fff' },
  assistantText: { color: COLORS.text },
  sources: { color: COLORS.textLight, fontSize: 11 },
  composer: { gap: 10, paddingBottom: 12 },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    minHeight: 48,
  },
});
