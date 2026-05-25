import { Image, type ImageStyle, StyleSheet, View, type ViewStyle } from 'react-native';

const logoSource = require('@/assets/images/boltride-logo.png');

interface AppLogoProps {
  /** Display width in dp (height scales to keep aspect ratio). */
  width?: number;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
}

export function AppLogo({ width = 280, style, imageStyle }: AppLogoProps) {
  const aspectRatio = 4 / 3;

  return (
    <View style={[styles.wrap, style]}>
      <Image
        accessibilityLabel="BoltRide logo"
        source={logoSource}
        resizeMode="contain"
        style={[{ width, height: width / aspectRatio }, imageStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
});
