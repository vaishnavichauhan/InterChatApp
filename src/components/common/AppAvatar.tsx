import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontWeights, borderRadius } from '../../theme';
import { getInitials } from '../../utils/formatters';
import { BullhornIcon, UsersIcon } from '../icons/SvgIcons';

interface AppAvatarProps {
  name?: string | null;
  size?: number;
  isActivity?: boolean;
  isBroadcast?: boolean;
  isGroup?: boolean;
  isOnline?: boolean;
  showPresence?: boolean;
}

export const AppAvatar: React.FC<AppAvatarProps> = ({
  name,
  size = 42,
  isActivity = false,
  isBroadcast = false,
  isGroup = false,
  isOnline = false,
  showPresence = false,
}) => {
  let bgColor = colors.primary;

  if (isActivity) {
    bgColor = '#f59e0b';
  } else if (isBroadcast) {
    bgColor = '#7c3aed';
  } else if (isGroup) {
    bgColor = '#4f46e5';
  }

  const initials = getInitials(name);
  const iconSize = Math.floor(size * 0.45);

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      <View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius: borderRadius.md,
            backgroundColor: bgColor,
          },
        ]}
      >
        {isActivity ? (
          <Text style={[styles.symbolText, { fontSize: Math.floor(size * 0.5) }]}>#</Text>
        ) : isBroadcast ? (
          <BullhornIcon size={iconSize} color="#ffffff" />
        ) : isGroup ? (
          <UsersIcon size={iconSize} color="#ffffff" />
        ) : (
          <Text style={[styles.initialsText, { fontSize: Math.floor(size * 0.38) }]}>
            {initials}
          </Text>
        )}
      </View>

      {showPresence && !isGroup && (
        <View
          style={[
            styles.presenceDot,
            {
              backgroundColor: isOnline ? colors.success : '#cbd5e1',
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: '#ffffff',
    fontWeight: fontWeights.extrabold,
    letterSpacing: -0.5,
  },
  symbolText: {
    color: '#ffffff',
    fontWeight: fontWeights.black,
  },
  presenceDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
});
