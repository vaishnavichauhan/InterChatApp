import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { colors, fontSizes, fontWeights, spacing, borderRadius } from '../../theme';
import { AppHeader } from '../../components/common/AppHeader';
import { ConversationItem } from '../../components/chat/ConversationItem';
import { EmptyState } from '../../components/common/EmptyState';
import { SearchIcon, UsersIcon } from '../../components/icons/SvgIcons';
import { useChatStore, Conversation } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';

interface ChatListScreenProps {
  navigation: any;
}

export const ChatListScreen: React.FC<ChatListScreenProps> = ({ navigation }) => {
  const {
    conversations,
    isLoadingConversations,
    loadConversations,
    selectConversation,
    onlineUserIds,
    setupSocketListeners,
    cleanupSocketListeners,
  } = useChatStore();

  const permissions = useAuthStore((state) => state.permissions);

  const [activeTab, setActiveTab] = useState<'all' | 'groups' | 'direct'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadConversations();
    setupSocketListeners();
    return () => {
      cleanupSocketListeners();
    };
  }, [loadConversations, setupSocketListeners, cleanupSocketListeners]);

  const filteredConversations = useMemo(() => {
    let list = conversations;

    if (activeTab === 'groups') {
      list = list.filter((c) => (c.type || '').toLowerCase() === 'group');
    } else if (activeTab === 'direct') {
      list = list.filter((c) => (c.type || '').toLowerCase() === 'direct');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((c) => {
        const titleMatch = (c.displayTitle || c.title || '').toLowerCase().includes(q);
        const snippetMatch = (c.last_message || c.last_message_text || '').toLowerCase().includes(q);
        const deptMatch = (c.department_name || '').toLowerCase().includes(q);
        return titleMatch || snippetMatch || deptMatch;
      });
    }

    return list;
  }, [conversations, activeTab, searchQuery]);

  const handleSelect = async (conv: Conversation) => {
    await selectConversation(conv);
    navigation.navigate('ChatDetail', { conversationId: conv.id });
  };

  return (
    <View style={styles.container}>
      <AppHeader
        rightAction={
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('NewChat')}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.actionBtnText}>+ Direct</Text>
            </TouchableOpacity>

            {permissions.canGroup && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnGroup]}
                onPress={() => navigation.navigate('CreateGroup')}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <UsersIcon size={14} color="#ffffff" />
                <Text style={styles.actionBtnGroupText}>Group</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Search & Filter Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <SearchIcon size={16} color={colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search channels, people, messages..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Channel Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'all' && styles.tabItemActive]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
              All Channels
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'groups' && styles.tabItemActive]}
            onPress={() => setActiveTab('groups')}
          >
            <Text style={[styles.tabText, activeTab === 'groups' && styles.tabTextActive]}>
              Groups
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'direct' && styles.tabItemActive]}
            onPress={() => setActiveTab('direct')}
          >
            <Text style={[styles.tabText, activeTab === 'direct' && styles.tabTextActive]}>
              Direct
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Conversations List */}
      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => {
          const isOnline = item.partnerId ? onlineUserIds.includes(String(item.partnerId)) : false;
          return (
            <ConversationItem
              conversation={item}
              onPress={() => handleSelect(item)}
              isOnline={isOnline}
            />
          );
        }}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingConversations}
            onRefresh={() => loadConversations(false)}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          isLoadingConversations ? (
            <View />
          ) : (
            <EmptyState
              title="No Conversations Found"
              description={
                searchQuery
                  ? 'No matching results for your query.'
                  : 'Start a direct chat or join a group channel to begin collaborating.'
              }
            />
          )
        }
        contentContainerStyle={
          filteredConversations.length === 0 ? styles.emptyListContainer : undefined
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  actionBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    gap: 3,
  },
  actionBtnGroupText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: '#ffffff',
  },
  searchSection: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  searchBar: {
    height: 40,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    marginLeft: spacing.xs,
    padding: 0,
  },
  tabRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  tabItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceSubtle,
  },
  tabItemActive: {
    backgroundColor: colors.primarySubtle,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
  },
  tabText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primary,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});
