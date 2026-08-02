import {
  Alert,
  Platform,
} from 'react-native';

export async function confirmAlert(
  title: string,
  message: string,
): Promise<boolean> {
  if (Platform.OS === 'web') {
    return window.confirm(`${title}\n\n${message}`);
  }

  return new Promise(resolve => {
    Alert.alert(
      title,
      message,
      [
        {
          text: 'Cancel',
          onPress: () => resolve(false),
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: () => resolve(true),
        },
      ],
    );
  });
}