import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '@/src/components/navigation/ScreenHeader';
import PrimaryButton from '@/src/components/form/PrimaryButton';
import FilterChips from '@/src/components/common/FilterChips';
import { COLORS, SIZES } from '@/src/theme';
import { KycApi, type KycStatus } from '@/src/api/kyc.api';

const DOC_TYPES = [
  { label: 'Passport', value: 'passport' },
  { label: 'Aadhaar', value: 'aadhaar' },
  { label: 'Driving license', value: 'driving_license' },
];

export default function KycScreen() {
  const [status, setStatus] = useState<KycStatus>('NOT_STARTED');
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fullLegalName, setFullLegalName] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('1990-01-15');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [addressPostalCode, setAddressPostalCode] = useState('');
  const [documentType, setDocumentType] = useState<'passport' | 'aadhaar' | 'driving_license'>('passport');
  const [documentReference, setDocumentReference] = useState('');

  useEffect(() => {
    void KycApi.status()
      .then((data) => {
        setStatus(data.status);
        setRejectionReason(data.rejectionReason);
        if (data.fullLegalName) setFullLegalName(data.fullLegalName);
      })
      .catch(() => undefined);
  }, []);

  async function submit() {
    setLoading(true);
    try {
      const result = await KycApi.submit({
        fullLegalName,
        panNumber,
        dateOfBirth,
        addressLine1,
        addressCity,
        addressState,
        addressPostalCode,
        documentType,
        documentReference,
      });
      setStatus(result.status);
      setRejectionReason(result.rejectionReason ?? null);
      Alert.alert(
        result.status === 'VERIFIED' ? 'Verified' : 'Could not verify',
        result.status === 'VERIFIED'
          ? 'You can link bank accounts and use full sync features.'
          : result.rejectionReason ?? 'Check your details and try again.',
      );
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      Alert.alert('Error', message ?? 'Submission failed');
    } finally {
      setLoading(false);
    }
  }

  if (status === 'VERIFIED') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centered}>
          <ScreenHeader title="Identity verified" breadcrumbs={[{ label: 'KYC' }]} />
          <Text style={styles.success}>
            Your profile passed automated checks. Bank linking and premium sync are available.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <ScreenHeader
          title="Verify identity"
          breadcrumbs={[
            { label: 'Settings', href: '/settings' },
            { label: 'KYC' },
          ]}
        />
        <Text style={styles.lead}>
          Automated verification—no manual review. Details are checked instantly against format and consistency rules.
        </Text>
        {rejectionReason ? <Text style={styles.error}>{rejectionReason}</Text> : null}

        <Field label="Full legal name" value={fullLegalName} onChangeText={setFullLegalName} />
        <Field label="PAN (e.g. ABCDE1234F)" value={panNumber} onChangeText={setPanNumber} autoCapitalize="characters" />
        <Field label="Date of birth (YYYY-MM-DD)" value={dateOfBirth} onChangeText={setDateOfBirth} />
        <Field label="Address line" value={addressLine1} onChangeText={setAddressLine1} />
        <Field label="City" value={addressCity} onChangeText={setAddressCity} />
        <Field label="State" value={addressState} onChangeText={setAddressState} />
        <Field label="Postal code" value={addressPostalCode} onChangeText={setAddressPostalCode} />

        <Text style={styles.label}>ID document</Text>
        <FilterChips
          value={documentType}
          options={DOC_TYPES}
          onChange={(value) => setDocumentType(value as typeof documentType)}
        />
        <Field
          label="Document number / reference"
          value={documentReference}
          onChangeText={setDocumentReference}
          placeholder="As printed on your ID"
        />

        <PrimaryButton title="Submit for verification" loading={loading} onPress={submit} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  autoCapitalize?: 'none' | 'characters' | 'sentences' | 'words';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        autoCapitalize={autoCapitalize ?? 'sentences'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: SIZES.padding, paddingBottom: 40 },
  centered: { flex: 1, padding: SIZES.padding },
  lead: { color: COLORS.textLight, marginBottom: 16, lineHeight: 20 },
  success: { color: COLORS.success, fontSize: 16, lineHeight: 24, marginTop: 16 },
  error: { color: COLORS.danger, marginBottom: 12 },
  field: { marginBottom: 14 },
  label: { fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
