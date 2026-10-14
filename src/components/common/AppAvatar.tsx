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
  let bgColor = '#333842';
  let textColor = '#ffffff';
  let iconColor = '#ffffff';

  if (isActivity) {
    bgColor = '#2D333B';
    textColor = '#E53E3E';
  } else if (isBroadcast) {
    bgColor = '#2D2A3E';
    iconColor = '#f59e0b';
  } else if (isGroup) {
    bgColor = '#374151';
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
            borderWidth: 1,
            borderColor: isActivity ? 'rgba(229, 62, 62, 0.25)' : isBroadcast ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255,255,255,0.08)',
          },
        ]}
      >
        {isActivity ? (
          <Text style={[styles.symbolText, { fontSize: Math.floor(size * 0.5), color: textColor }]}>#</Text>
        ) : isBroadcast ? (
          <BullhornIcon size={iconSize} color={iconColor} />
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
