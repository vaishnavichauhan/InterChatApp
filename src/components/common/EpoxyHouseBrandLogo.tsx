import React from 'react';
import { View, Text, StyleSheet, Image, ViewStyle } from 'react-native';
import { colors, fontWeights } from '../../theme';

interface EpoxyHouseBrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
  showSubtitle?: boolean;
  style?: ViewStyle;
}

export const EpoxyHouseBrandLogo: React.FC<EpoxyHouseBrandLogoProps> = ({
  size = 'md',
  variant = 'dark',
  showSubtitle = false,
  style,
}) => {
  const isLight = variant === 'light';

  // Dimensions based on logo aspect ratio (362x80 = 4.525:1)
  const logoDimensions = {
    sm: { height: 24, width: 24 * 4.525 }, // ~108px
    md: { height: 32, width: 32 * 4.525 }, // ~145px
    lg: { height: 44, width: 44 * 4.525 }, // ~199px
  }[size];

  const dividerHeight = {
    sm: 20,
    md: 26,
    lg: 34,
  }[size];

  const titleFontSize = {
    sm: 16,
    md: 21,
    lg: 27,
  }[size];

  const logoSource = isLight
    ? require('../../assets/epoxy-logo-white.png')
    : require('../../assets/epoxy-logo.png');

  return (
    <View style={[styles.container, style]}>
      {/* ── Left: Official Epoxy House Brand Logo ── */}
      <Image
        source={logoSource}
        style={{
          width: logoDimensions.width,
          height: logoDimensions.height,
        }}
        resizeMode="contain"
      />

      {/* ── Center: Vertical Divider Line ── */}
      <View
        style={[
          styles.divider,
          {
            height: dividerHeight,
            marginHorizontal: size === 'sm' ? 8 : 12,
            backgroundColor: isLight ? 'rgba(255, 255, 255, 0.40)' : '#d1d5db',
          },
        ]}
      />

      {/* ── Right: "Chat" Vertically Centered ── */}
      <View style={styles.brandTextCol}>
        <Text
          style={[
            styles.chatTitle,
            {
              fontSize: titleFontSize,
              color: isLight ? '#ffffff' : colors.primary,
            },
          ]}
        >
          Inter Chat
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    width: 1.5,
    marginHorizontal: 12,
    borderRadius: 1,
  },
  brandTextCol: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatTitle: {
    fontWeight: fontWeights.black,
    letterSpacing: -0.2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

export default EpoxyHouseBrandLogo;
