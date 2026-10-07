import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, fontSizes, fontWeights, spacing } from '../../theme';
import { formatTimestamp } from '../../utils/formatters';
import { AppAvatar } from '../common/AppAvatar';
import { AppBadge } from '../common/AppBadge';
import { Conversation } from '../../store/chatStore';

interface ConversationItemProps {
  conversation: Conversation;
  onPress: () => void;
  isOnline?: boolean;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  onPress,
  isOnline = false,
}) => {
  const isGroup = (conversation.type || '').toLowerCase() === 'group';
  const isActivity = Boolean(conversation.is_activity) || conversation.title === '#activity';
  const isMaster = Boolean(conversation.is_master) && !isActivity;
  const isAnnouncement = Boolean(conversation.is_announcement);

  const title = isActivity
    ? 'activity'
    : conversation.displayTitle || conversation.title || (isGroup ? 'Group Channel' : 'Direct Message');

  const unreadCount = Number(conversation.unread_count) || 0;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <AppAvatar
        name={title}
        size={44}
        isActivity={isActivity}
        isBroadcast={isMaster || isAnnouncement}
        isGroup={isGroup}
        isOnline={isOnline}
        showPresence={!isGroup}
      />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.titleRow}>
            {isActivity && <Text style={styles.hashPrefix}>#</Text>}
            <Text style={styles.titleText} numberOfLines={2} ellipsizeMode="tail">
              {title}
            </Text>

            {isActivity && <AppBadge label="DEFAULT" variant="activity" style={styles.badge} />}
            {(isMaster || isAnnouncement) && (
              <AppBadge label="BROADCAST" variant="broadcast" style={styles.badge} />
            )}
            {conversation.department_name && !isActivity && (
              <AppBadge label={`🏢 ${conversation.department_name}`} variant="department" style={styles.badge} />
            )}
          </View>

          <Text style={styles.timeText} numberOfLines={1}>
            {formatTimestamp(conversation.last_message_at || conversation.created_at)}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          {(() => {
            const rawSnippet = (conversation.last_message || conversation.last_message_text || '').trim();
            let displaySnippet = rawSnippet;
            if (rawSnippet.startsWith('{"type":"call_log"')) {
              try {
                const parsed = JSON.parse(rawSnippet);
                displaySnippet = parsed.text || 'Call';
              } catch {}
            }

            return (
              <Text
                style={[
                  styles.messageSnippet,
                  unreadCount > 0 && styles.messageSnippetUnread,
                ]}
                numberOfLines={1}
              >
                {displaySnippet || (
                  <Text style={styles.emptySnippet}>
                    {isActivity ? 'Company activity & updates' : 'No messages yet'}
                  </Text>
                )}
              </Text>
            );
          })()}

          {unreadCount > 0 && (
            <View style={[styles.unreadBadge, isActivity && styles.unreadBadgeActivity]}>
              <Text style={styles.unreadText}>{unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
    minWidth: 0,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
    minWidth: 0,
  },
  hashPrefix: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.black,
    color: '#d97706',
    marginRight: 2,
    flexShrink: 0,
  },
  titleText: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  badge: {
    marginLeft: spacing.xs,
    flexShrink: 0,
  },
  timeText: {
    fontSize: fontSizes.tiny,
    color: colors.textMuted,
    fontWeight: fontWeights.medium,
    flexShrink: 0,
    marginLeft: spacing.xs,
    textAlign: 'right',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messageSnippet: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginRight: spacing.sm,
  },
  messageSnippetUnread: {
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  emptySnippet: {
    fontStyle: 'italic',
    color: colors.textLight,
  },
  unreadBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadBadgeActivity: {
    backgroundColor: '#d97706',
  },
  unreadText: {
    fontSize: 10,
    fontWeight: fontWeights.extrabold,
    color: '#ffffff',
  },
});
