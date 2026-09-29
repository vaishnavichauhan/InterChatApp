import React, { useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import Svg, { Text as SvgText, G } from 'react-native-svg';
import { useAuthStore } from '../../store/authStore';

export interface WatermarkOverlayProps {
  /**
   * If true, forces the watermark to display even if evaluated outside root.
   */
  force?: boolean;
}

export const WatermarkOverlay: React.FC<WatermarkOverlayProps> = ({ force = false }) => {
  const { width, height } = useWindowDimensions();
  const { isAuthenticated, user, deviceId } = useAuthStore();

  const watermarkText = useMemo(() => {
    if (!isAuthenticated && !force) return '';

    const username = user?.username || user?.name || 'admin';
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const dateStr = `${dd}/${mm}/${yyyy}`;

    const rawModel = (Platform.constants as any)?.Model;
    const brand = (Platform.constants as any)?.Brand;
    let deviceName = '';
    if (rawModel) {
      deviceName =
        brand && !rawModel.toLowerCase().startsWith(brand.toLowerCase())
          ? `${brand} ${rawModel}`
          : rawModel;
    } else if (deviceId) {
      deviceName = deviceId;
    } else {
      deviceName = Platform.OS === 'ios' ? 'iPhone' : 'Android';
    }

    return `${username}-${dateStr}-${deviceName}`;
  }, [isAuthenticated, force, user, deviceId]);

  // Compute repeated grid points covering screen plus padding for rotation
  const items = useMemo(() => {
    if (!watermarkText) return [];

    const cellW = 340;
    const cellH = 190;
    const cols = Math.ceil(width / cellW) + 2;
    const rows = Math.ceil(height / cellH) + 2;
    const list: { id: string; x: number; y: number }[] = [];

    for (let r = -1; r <= rows; r++) {
      for (let c = -1; c <= cols; c++) {
        // Stagger alternate rows for even diagonal distribution
        const offsetX = r % 2 === 0 ? 0 : cellW / 2;
        const x = c * cellW + offsetX;
        const y = r * cellH + cellH / 2;
        list.push({ id: `${r}_${c}`, x, y });
      }
    }
    return list;
  }, [width, height, watermarkText]);

  if (!watermarkText || (!isAuthenticated && !force)) {
    return null;
  }

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        {items.map((item) => (
          <G key={item.id} rotation="-25" origin={`${item.x}, ${item.y}`}>
            <SvgText
              x={item.x}
              y={item.y}
              fontSize="12"
              fontFamily={Platform.OS === 'ios' ? 'System' : 'sans-serif'}
              fontWeight="700"
              fill="rgba(239, 83, 80, 0.28)"
              textAnchor="middle"
            >
              {watermarkText}
            </SvgText>
          </G>
        ))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
    elevation: 99999,
  },
});
