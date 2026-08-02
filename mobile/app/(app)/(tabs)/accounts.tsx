import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  View,
} from 'react-native';

import { FAB, Text } from 'react-native-paper';

import { useRouter } from 'expo-router';

import { useAccounts } from '@/src/hooks/useAccounts';

import AccountCard from '@/src/components/accounts/AccountCard';
import EmptyAccounts from '@/src/components/accounts/EmptyAccounts';

export default function AccountsScreen() {
  const router = useRouter();

  const {
    data: accounts = [],
    isLoading,
    isError,
    refetch,
  } = useAccounts();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text>Unable to load accounts.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {accounts.length === 0 ? (
        <EmptyAccounts
          onCreate={() =>
            router.push('/accounts/create')
          }
        />
      ) : (
        <FlatList
          data={accounts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AccountCard
              account={item}
              onPress={() => {}}
            />
          )}
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() =>
          router.push('/accounts/create')
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
  },
});