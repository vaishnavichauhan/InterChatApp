import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, fontSizes, fontWeights, spacing, borderRadius, shadows } from '../../theme';
import { AppHeader } from '../../components/common/AppHeader';
import { ConversationItem } from '../../components/chat/ConversationItem';
import { EmptyState } from '../../components/common/EmptyState';
import {
  SearchIcon,
  UsersIcon,
  BullhornIcon,
  PinIcon,
  MessagesSquareIcon,
  XMarkIcon,
} from '../../components/icons/SvgIcons';
import { useChatStore, Conversation } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';

interface ChatListScreenProps {
  navigation: any;
}

type FilterTab = 'all' | 'broadcasts' | 'groups' | 'direct';

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

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Initial mount: load conversations and attach socket listeners
  useEffect(() => {
    if (permissions.canChat) {
      loadConversations();
      setupSocketListeners();
    }
    return () => {
      cleanupSocketListeners();
    };
  }, [loadConversations, setupSocketListeners, cleanupSocketListeners, permissions.canChat]);

  // Screen focus: refresh conversations whenever user comes to or navigates back to this screen
  useFocusEffect(
    useCallback(() => {
      if (permissions.canChat) {
        loadConversations(false);
      }
    }, [loadConversations, permissions.canChat])
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Separate 4 channels matching web frontend:
  // 1. #activity channel (pinned company activity)
  // 2. Company-wise broadcast channels
  // 3. Custom Groups & Teams
  // 4. Direct Messages
  // ─────────────────────────────────────────────────────────────────────────

  const isCompanyBroadcastConv = (c: Conversation) => Boolean(
    c.is_company_broadcast ||
    (c.is_announcement && c.company_id && !c.is_activity) ||
    (c.title && c.title.toLowerCase().includes('broadcast'))
  );

  const activityGroup = useMemo(() => {
    return conversations.find(
      (c) => Boolean(c.is_activity) || c.title === '#activity' || c.title === '# activity'
    );
  }, [conversations]);

  const allGroupConvs = useMemo(() => {
    return conversations.filter(
      (c) =>
        (c.type || '').toLowerCase() === 'group' &&
        !(Boolean(c.is_activity) || c.title === '#activity' || c.title === '# activity')
    );
  }, [conversations]);

  const companyBroadcasts = useMemo(() => {
    return allGroupConvs.filter(isCompanyBroadcastConv);
  }, [allGroupConvs]);

  const customGroups = useMemo(() => {
    return allGroupConvs.filter((c) => !isCompanyBroadcastConv(c));
  }, [allGroupConvs]);

  const allDirect = useMemo(() => {
    return conversations.filter((c) => (c.type || '').toLowerCase() === 'direct');
  }, [conversations]);

  // Filter list by search query
  const filterList = (list: Conversation[]) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter((c) => {
      const titleMatch = (c.displayTitle || c.title || '').toLowerCase().includes(q);
      const snippetMatch = (c.last_message || c.last_message_text || '').toLowerCase().includes(q);
      const deptMatch = (c.department_name || '').toLowerCase().includes(q);
      const compMatch = (c.company_name || '').toLowerCase().includes(q);
      return titleMatch || snippetMatch || deptMatch || compMatch;
    });
  };

  const isActivityMatchingSearch = useMemo(() => {
    if (!activityGroup) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (activityGroup.displayTitle || activityGroup.title || '').toLowerCase().includes(q) ||
      (activityGroup.last_message || activityGroup.last_message_text || '').toLowerCase().includes(q)
    );
  }, [activityGroup, searchQuery]);

  const filteredCompanyBroadcasts = useMemo(() => filterList(companyBroadcasts), [companyBroadcasts, searchQuery]);
  const filteredCustomGroups = useMemo(() => filterList(customGroups), [customGroups, searchQuery]);
  const filteredDirect = useMemo(() => filterList(allDirect), [allDirect, searchQuery]);

  const handleSelect = async (conv: Conversation) => {
    await selectConversation(conv);
    navigation.navigate('ChatDetail', { conversationId: conv.id });
  };

  const hasAnyMatches =
    isActivityMatchingSearch ||
    filteredCompanyBroadcasts.length > 0 ||
    filteredCustomGroups.length > 0 ||
    filteredDirect.length > 0;

  return (
    <View style={styles.container}>
      <AppHeader showLogo rightAction />

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
          {searchQuery ? (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <XMarkIcon size={16} color={colors.textLight} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* 4 Category Navigation Chips matching web: All, Broadcast, Teams, Direct */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'all' && styles.tabButtonActive]}
            onPress={() => setActiveTab('all')}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.tabButtonText, activeTab === 'all' && styles.tabButtonTextActive]}
              numberOfLines={1}
            >
              All ({conversations.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'broadcasts' && styles.tabButtonActive]}
            onPress={() => setActiveTab('broadcasts')}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.tabButtonText, activeTab === 'broadcasts' && styles.tabButtonTextActive]}
              numberOfLines={1}
            >
              Broadcast ({companyBroadcasts.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'groups' && styles.tabButtonActive]}
            onPress={() => setActiveTab('groups')}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.tabButtonText, activeTab === 'groups' && styles.tabButtonTextActive]}
              numberOfLines={1}
            >
              Teams ({customGroups.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'direct' && styles.tabButtonActive]}
            onPress={() => setActiveTab('direct')}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.tabButtonText, activeTab === 'direct' && styles.tabButtonTextActive]}
              numberOfLines={1}
            >
              Direct ({allDirect.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Categorized Conversation List */}
      <ScrollView
        style={styles.scrollList}
        contentContainerStyle={!hasAnyMatches ? styles.emptyScrollContainer : styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingConversations}
            onRefresh={() => loadConversations(false)}
            tintColor={colors.primary}
          />
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!permissions.canChat ? (
          <EmptyState
            title="Access Denied"
            description="You do not have permission to access the chat."
          />
        ) : isLoadingConversations && conversations.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading conversations...</Text>
          </View>
        ) : !hasAnyMatches ? (
          <EmptyState
            title="No Conversations Found"
            description={
              searchQuery
                ? 'No matching results for your query. Try typing a coworker name or channel title.'
                : 'Start a direct chat or join a group channel to begin collaborating.'
            }
          />
        ) : (
          <>
            {/* ── 1. COMPANY ACTIVITY CHANNEL ── */}
            {(activeTab === 'all' || activeTab === 'groups') && isActivityMatchingSearch && activityGroup && (
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderWrap}>
                  <View style={styles.sectionHeaderLeft}>
                    <PinIcon size={12} color="#b45309" />
                    <Text style={styles.activitySectionTitle}>COMPANY ACTIVITY CHANNEL</Text>
                  </View>
                  <View style={styles.defaultForAllBadge}>
                    <Text style={styles.defaultForAllText}>Default For All</Text>
                  </View>
                </View>

                <ConversationItem
                  conversation={activityGroup}
                  onPress={() => handleSelect(activityGroup)}
                  isOnline={false}
                />
              </View>
            )}

            {/* Divider */}
            {activeTab === 'all' && isActivityMatchingSearch && activityGroup && (
              <View style={styles.sectionDivider} />
            )}

            {/* ── 2. COMPANY BROADCASTS ── */}
            {(activeTab === 'all' || activeTab === 'broadcasts') && (
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderWrap}>
                  <View style={styles.sectionHeaderLeft}>
                    <BullhornIcon size={13} color="#b45309" />
                    <Text style={styles.broadcastSectionTitle}>COMPANY BROADCASTS</Text>
                    <View style={styles.broadcastCountBadge}>
                      <Text style={styles.broadcastCountText}>{filteredCompanyBroadcasts.length}</Text>
                    </View>
                  </View>
                </View>

                {filteredCompanyBroadcasts.length === 0 ? (
                  <Text style={styles.emptySectionText}>No company broadcasts available</Text>
                ) : (
                  filteredCompanyBroadcasts.map((b) => (
                    <ConversationItem
                      key={b.id}
                      conversation={b}
                      onPress={() => handleSelect(b)}
                      isOnline={false}
                    />
                  ))
                )}
              </View>
            )}

            {/* Divider */}
            {activeTab === 'all' && (
              <View style={styles.sectionDivider} />
            )}

            {/* ── 3. CUSTOM GROUPS & TEAMS ── */}
            {(activeTab === 'all' || activeTab === 'groups') && (
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderWrap}>
                  <View style={styles.sectionHeaderLeft}>
                    <UsersIcon size={13} color="#475569" />
                    <Text style={styles.groupsSectionTitle}>CUSTOM GROUPS & TEAMS</Text>
                    <View style={styles.groupsCountBadge}>
                      <Text style={styles.groupsCountText}>{filteredCustomGroups.length}</Text>
                    </View>
                  </View>

                  {permissions.canGroup && (
                    <TouchableOpacity
                      style={styles.newActionBtn}
                      onPress={() => navigation.navigate('CreateGroup')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.newActionBtnText}>+ New</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {filteredCustomGroups.length === 0 ? (
                  <Text style={styles.emptySectionText}>No custom group channels created yet</Text>
                ) : (
                  filteredCustomGroups.map((g) => (
                    <ConversationItem
                      key={g.id}
                      conversation={g}
                      onPress={() => handleSelect(g)}
                      isOnline={false}
                    />
                  ))
                )}
              </View>
            )}

            {/* Divider */}
            {activeTab === 'all' && (
              <View style={styles.sectionDivider} />
            )}

            {/* ── 4. DIRECT MESSAGES ── */}
            {(activeTab === 'all' || activeTab === 'direct') && (
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderWrap}>
                  <View style={styles.sectionHeaderLeft}>
                    <MessagesSquareIcon size={13} color="#475569" />
                    <Text style={styles.directSectionTitle}>DIRECT MESSAGES</Text>
                    <View style={styles.directCountBadge}>
                      <Text style={styles.directCountText}>{filteredDirect.length}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.newActionBtn}
                    onPress={() => navigation.navigate('NewChat')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.newActionBtnText}>+ New</Text>
                  </TouchableOpacity>
                </View>

                {filteredDirect.length === 0 ? (
                  <Text style={styles.emptySectionText}>No direct conversations yet</Text>
                ) : (
                  filteredDirect.map((d) => {
                    const pId = (d as any).partnerId || (d as any).other_user_id || (d as any).partner_id;
                    const isOnline = pId ? onlineUserIds.some((id) => String(id) === String(pId)) : false;
                    return (
                      <ConversationItem
                        key={d.id}
                        conversation={d}
                        onPress={() => handleSelect(d)}
                        isOnline={isOnline}
                      />
                    );
                  })
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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

  /* ── Search & Filter Section ── */
  searchSection: {
    backgroundColor: '#ffffff',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchBar: {
    height: 38,
    backgroundColor: '#f8fafc',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    marginBottom: spacing.xs + 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    color: colors.textPrimary,
    marginLeft: spacing.xs,
    padding: 0,
  },

  /* ── Tab Filter Row matching web: All, Broadcast, Teams, Direct ── */
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: borderRadius.lg,
    padding: 2.5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 5,
    borderRadius: borderRadius.md - 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#ffffff',
    ...shadows.sm,
  },
  tabButtonText: {
    fontSize: 10.5,
    fontWeight: fontWeights.medium,
    color: '#64748b',
  },
  tabButtonTextActive: {
    fontWeight: fontWeights.bold,
    color: '#0f172a',
  },

  /* ── Scrollable Conversation List ── */
  scrollList: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl * 2,
  },
  emptyScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  /* ── Categorized Sections ── */
  sectionBlock: {
    marginBottom: 4,
  },
  sectionHeaderWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: 8,
    paddingBottom: 4,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  /* Section Titles & Badges */
  activitySectionTitle: {
    fontSize: 10,
    fontWeight: fontWeights.extrabold,
    color: '#92400e',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  defaultForAllBadge: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  defaultForAllText: {
    fontSize: 9,
    fontWeight: fontWeights.bold,
    color: '#b45309',
  },

  broadcastSectionTitle: {
    fontSize: 10,
    fontWeight: fontWeights.extrabold,
    color: '#92400e',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  broadcastCountBadge: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 10,
  },
  broadcastCountText: {
    fontSize: 9,
    fontWeight: fontWeights.bold,
    color: '#b45309',
  },

  groupsSectionTitle: {
    fontSize: 10,
    fontWeight: fontWeights.extrabold,
    color: '#475569',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  groupsCountBadge: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 10,
  },
  groupsCountText: {
    fontSize: 9,
    fontWeight: fontWeights.bold,
    color: '#475569',
  },

  directSectionTitle: {
    fontSize: 10,
    fontWeight: fontWeights.extrabold,
    color: '#475569',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  directCountBadge: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 10,
  },
  directCountText: {
    fontSize: 9,
    fontWeight: fontWeights.bold,
    color: '#475569',
  },

  newActionBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newActionBtnText: {
    fontSize: 10.5,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },

  emptySectionText: {
    fontSize: 11,
    color: colors.textLight,
    fontStyle: 'italic',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  sectionDivider: {
    marginHorizontal: spacing.md,
    marginVertical: 4,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  loadingContainer: {
    paddingVertical: spacing.xxl * 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    fontWeight: fontWeights.medium,
  },
});
