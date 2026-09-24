import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSizes, fontWeights, spacing } from '../../theme';
import { TypingUser } from '../../store/chatStore';

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
  conversationId: number;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  typingUsers,
  conversationId,
}) => {
  const activeTypers = typingUsers.filter((t) => t.conversationId === conversationId);

  if (activeTypers.length === 0) return null;

  const names = activeTypers.map((t) => t.userName).join(', ');
  const text = activeTypers.length === 1 ? `${names} is typing...` : `${names} are typing...`;

  return (
    <View style={styles.container}>
      <View style={styles.dot} />
      <Text style={styles.typingText}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    backgroundColor: 'transparent',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: spacing.xs,
  },
  typingText: {
    fontSize: fontSizes.tiny,
    color: colors.textMuted,
    fontStyle: 'italic',
    fontWeight: fontWeights.medium,
  },
});
