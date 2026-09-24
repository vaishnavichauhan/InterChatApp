import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, fontSizes, fontWeights, spacing, borderRadius } from '../../theme';
import { AppHeader } from '../../components/common/AppHeader';
import { AppAvatar } from '../../components/common/AppAvatar';
import { SearchIcon, ArrowRightIcon } from '../../components/icons/SvgIcons';
import { searchCoworkers, startDirectChat } from '../../api/chatApi';
import { useChatStore } from '../../store/chatStore';

interface NewChatScreenProps {
  navigation: any;
}

export const NewChatScreen: React.FC<NewChatScreenProps> = ({ navigation }) => {
  const selectConversation = useChatStore((state) => state.selectConversation);
  const loadConversations = useChatStore((state) => state.loadConversations);

  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await searchCoworkers(query);
        if (isMounted) {
          const list = res?.coworkers || res?.data || (Array.isArray(res) ? res : []);
          setUsers(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        console.warn('Coworker search failed:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const timer = setTimeout(fetchUsers, 250);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [query]);

  const handleStartChat = async (colleague: any) => {
    try {
      setStartingChat(true);
      const res = await startDirectChat(colleague.id);
      const newConv = res.data;
      await loadConversations(false);
      await selectConversation(newConv);
      navigation.replace('ChatDetail', { conversationId: newConv.id });
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to start direct chat.');
    } finally {
      setStartingChat(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="New Direct Chat"
        subtitle="Start 1-on-1 team discussion"
        showBack
        onBack={() => navigation.goBack()}
      />

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <SearchIcon size={18} color={colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Type name, email, or mobile number..."
            placeholderTextColor={colors.textLight}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
        </View>
        <Text style={styles.hintText}>
          💡 Find coworkers across any organizational department.
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Searching coworkers...</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.userRow}
              onPress={() => !startingChat && handleStartChat(item)}
              activeOpacity={0.7}
            >
              <AppAvatar name={item.name || item.username} size={42} />

              <View style={styles.userMeta}>
                <View style={styles.userNameRow}>
                  <Text style={styles.userName}>{item.name || item.username}</Text>
                  {item.department_names && (
                    <View style={styles.deptBadge}>
                      <Text style={styles.deptBadgeText}>🏢 {item.department_names}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.userEmail} numberOfLines={1}>
                  {item.email} {item.mobile_number ? `• ${item.mobile_number}` : ''}
                </Text>
              </View>

              <ArrowRightIcon size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No coworkers found</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchSection: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  searchBar: {
    height: 44,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    padding: 0,
  },
  hintText: {
    fontSize: fontSizes.tiny,
    color: colors.textMuted,
    marginTop: 2,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  userMeta: {
    flex: 1,
    marginLeft: spacing.md,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  userName: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  deptBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    backgroundColor: colors.primarySubtle,
    borderRadius: borderRadius.xs,
  },
  deptBadgeText: {
    fontSize: 9,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  userEmail: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
  emptyContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
});
