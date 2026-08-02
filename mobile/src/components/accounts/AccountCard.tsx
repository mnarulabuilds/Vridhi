import { List } from 'react-native-paper';

import { Account } from '@/src/api/accounts.api';

interface Props {
  account: Account;
  onPress: () => void;
}

export default function AccountCard({
  account,
  onPress,
}: Props) {
  return (
    <List.Item
      title={account.name}
      description={account.type}
      onPress={onPress}
      left={(props) => (
        <List.Icon
          {...props}
          icon={account.icon ?? 'bank'}
        />
      )}
      right={() => (
        <List.Subheader>
          ₹{Number(account.openingBalance).toLocaleString()}
        </List.Subheader>
      )}
    />
  );
}