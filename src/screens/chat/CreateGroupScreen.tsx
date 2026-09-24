import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSizes, fontWeights, spacing, borderRadius } from '../../theme';
import { AppHeader } from '../../components/common/AppHeader';
import { AppButton } from '../../components/common/AppButton';
import { AppAvatar } from '../../components/common/AppAvatar';
import { SearchIcon, CheckIcon } from '../../components/icons/SvgIcons';
import { createGroupChat, searchCoworkers } from '../../api/chatApi';
import { getDepartments } from '../../api/departmentApi';
import { useChatStore } from '../../store/chatStore';

interface CreateGroupScreenProps {
  navigation: any;
}

export const CreateGroupScreen: React.FC<CreateGroupScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const selectConversation = useChatStore((state) => state.selectConversation);
  const loadConversations = useChatStore((state) => state.loadConversations);

  const [title, setTitle] = useState('');
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [whoCanPost, setWhoCanPost] = useState<'ALL_MEMBERS' | 'ADMIN_ONLY'>('ALL_MEMBERS');
  const [, setDepartments] = useState<any[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);

  const [searchMemberQuery, setSearchMemberQuery] = useState('');
  const [coworkers, setCoworkers] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await getDepartments(false);
        const list = res?.departments || res?.data || (Array.isArray(res) ? res : []);
        setDepartments(Array.isArray(list) ? list : []);
        if (list.length > 0) {
          setSelectedDeptId(list[0].id);
        }
      } catch (err) {
        console.warn('Failed to load departments', err);
      }
    };
    fetchDepts();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchCoworkers = async () => {
      try {
        const res = await searchCoworkers(searchMemberQuery);
        if (isMounted) {
          const list = res?.coworkers || res?.data || (Array.isArray(res) ? res : []);
          setCoworkers(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        console.warn('Failed to search coworkers', err);
      }
    };
    const timer = setTimeout(fetchCoworkers, 250);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchMemberQuery]);

  const toggleMember = (colleague: any) => {
    if (selectedMembers.some((m) => m.id === colleague.id)) {
      setSelectedMembers(selectedMembers.filter((m) => m.id !== colleague.id));
    } else {
      setSelectedMembers([...selectedMembers, colleague]);
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a name for the channel.');
      return;
    }

    if (!isAnnouncement && selectedMembers.length === 0) {
      Alert.alert('Required', 'Please select at least one coworker to add to the group.');
      return;
    }

    try {
      setSubmitting(true);
      const memberIds = selectedMembers.map((m) => m.id);
      const res = await createGroupChat({
        title: title.trim(),
        memberIds,
        isAnnouncement,
        whoCanPost: isAnnouncement ? 'ADMIN_ONLY' : whoCanPost,
        departmentId: isAnnouncement ? null : selectedDeptId,
      });

      const newGroup = res.data;
      await loadConversations(false);
      await selectConversation(newGroup);
      navigation.replace('ChatDetail', { conversationId: newGroup.id });
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create group channel.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Create Team Channel"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: Math.max(insets.bottom, 24) },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Channel Name */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Channel Name</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Mobile Engineering or Product Team"
            placeholderTextColor={colors.textLight}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Announcement Toggle */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleMeta}>
            <Text style={styles.toggleLabel}>Announcement Channel</Text>
            <Text style={styles.toggleDesc}>Broadcast updates to all members</Text>
          </View>
          <Switch
            value={isAnnouncement}
            onValueChange={setIsAnnouncement}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        {/* Posting Privileges */}
        {!isAnnouncement && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Who can send messages?</Text>
            <View style={styles.radioRow}>
              <TouchableOpacity
                style={[styles.radioItem, whoCanPost === 'ALL_MEMBERS' && styles.radioItemActive]}
                onPress={() => setWhoCanPost('ALL_MEMBERS')}
              >
                <Text style={[styles.radioText, whoCanPost === 'ALL_MEMBERS' && styles.radioTextActive]}>
                  All Members
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.radioItem, whoCanPost === 'ADMIN_ONLY' && styles.radioItemActive]}
                onPress={() => setWhoCanPost('ADMIN_ONLY')}
              >
                <Text style={[styles.radioText, whoCanPost === 'ADMIN_ONLY' && styles.radioTextActive]}>
                  Admins Only
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Member Selector */}
        {!isAnnouncement && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Add Team Members</Text>
              <Text style={styles.selectedCountBadge}>
                {selectedMembers.length} selected
              </Text>
            </View>

            <View style={styles.memberSearchBar}>
              <SearchIcon size={16} color={colors.textLight} />
              <TextInput
                style={styles.memberSearchInput}
                placeholder="Search coworkers to invite..."
                placeholderTextColor={colors.textLight}
                value={searchMemberQuery}
                onChangeText={setSearchMemberQuery}
              />
            </View>

            <View style={styles.membersList}>
              {coworkers.map((colleague) => {
                const isSelected = selectedMembers.some((m) => m.id === colleague.id);
                return (
                  <TouchableOpacity
                    key={colleague.id}
                    style={[styles.memberRow, isSelected && styles.memberRowSelected]}
                    onPress={() => toggleMember(colleague)}
                    activeOpacity={0.7}
                  >
                    <AppAvatar name={colleague.name || colleague.username} size={36} />

                    <View style={styles.memberMeta}>
                      <Text style={styles.memberName}>{colleague.name || colleague.username}</Text>
                      <Text style={styles.memberEmail} numberOfLines={1}>
                        {colleague.email}
                      </Text>
                    </View>

                    <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                      {isSelected && <CheckIcon size={14} color="#ffffff" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Submit Button */}
        <View style={styles.submitSection}>
          <AppButton
            title="Create Channel"
            onPress={handleCreate}
            loading={submitting}
            size="md"
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  selectedCountBadge: {
    fontSize: fontSizes.tiny,
    fontWeight: fontWeights.extrabold,
    color: colors.primary,
  },
  textInput: {
    height: 46,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  toggleMeta: {
    flex: 1,
    marginRight: spacing.md,
  },
  toggleLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  toggleDesc: {
    fontSize: fontSizes.tiny,
    color: colors.textMuted,
    marginTop: 2,
  },
  radioRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  radioItem: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  radioItemActive: {
    backgroundColor: colors.primarySubtle,
    borderColor: colors.primary,
  },
  radioText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.textMuted,
  },
  radioTextActive: {
    color: colors.primary,
    fontWeight: fontWeights.bold,
  },
  memberSearchBar: {
    height: 40,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  memberSearchInput: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    marginLeft: spacing.xs,
    padding: 0,
  },
  membersList: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 220,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  memberRowSelected: {
    backgroundColor: colors.primarySubtle,
  },
  memberMeta: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  memberName: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  memberEmail: {
    fontSize: fontSizes.tiny,
    color: colors.textMuted,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  submitSection: {
    marginTop: spacing.md,
  },
});
