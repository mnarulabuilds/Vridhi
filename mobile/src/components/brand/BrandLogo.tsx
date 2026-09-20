import React from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

const LOGO_SOURCE = require('@/assets/images/vridhi_icon.jpg');

type BrandLogoProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
};

export default function BrandLogo({ size = 88, style, imageStyle }: BrandLogoProps) {
  const radius = Math.round(size * 0.22);

  return (
    <View
      style={[
        styles.frame,
        { width: size, height: size, borderRadius: radius },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel="Vridhi"
    >
      <Image
        source={LOGO_SOURCE}
        style={[{ width: size, height: size, borderRadius: radius }, imageStyle]}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
});
