import { View } from 'react-native';

import {
  Button,
  Text,
} from 'react-native-paper';

interface Props {
  onCreate: () => void;
}

export default function EmptyAccounts({
  onCreate,
}: Props) {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
      }}
    >
      <Text
        variant="headlineSmall"
        style={{
          marginBottom: 12,
        }}
      >
        No Accounts Yet
      </Text>

      <Text
        style={{
          textAlign: 'center',
          marginBottom: 24,
        }}
      >
        Create your first account to
        start tracking your finances.
      </Text>

      <Button
        mode="contained"
        onPress={onCreate}
      >
        Create Account
      </Button>
    </View>
  );
}