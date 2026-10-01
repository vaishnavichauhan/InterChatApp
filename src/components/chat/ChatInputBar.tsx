import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Keyboard,
} from 'react-native';
import { colors, fontSizes, fontWeights, spacing, borderRadius } from '../../theme';
import { SendIcon, PaperclipIcon, XMarkIcon, LockIcon } from '../icons/SvgIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChatMessage } from '../../store/chatStore';
import { FileUploadAsset } from '../../api/chatApi';

interface ChatInputBarProps {
  onSend: (text: string, file: FileUploadAsset | null) => Promise<void>;
  onOpenAttachmentModal: () => void;
  replyingTo: ChatMessage | null;
  onCancelReply: () => void;
  selectedFile: FileUploadAsset | null;
  onRemoveFile: () => void;
  isUploading?: boolean;
  hasWriteAccess?: boolean;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  onSend,
  onOpenAttachmentModal,
  replyingTo,
  onCancelReply,
  selectedFile,
  onRemoveFile,
  isUploading = false,
  hasWriteAccess = true,
  onTypingStart,
  onTypingStop,
}) => {
  const [text, setText] = useState('');
  const [typingTimeout, setTypingTimeout] = useState<any>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleTextChange = (val: string) => {
    setText(val);

    if (onTypingStart) {
      onTypingStart();
      if (typingTimeout) clearTimeout(typingTimeout);
      const timeout = setTimeout(() => {
        if (onTypingStop) onTypingStop();
      }, 2000);
      setTypingTimeout(timeout);
    }
  };

  const handleSendPress = async () => {
    if (!text.trim() && !selectedFile) return;
    const msg = text.trim();
    const file = selectedFile;
    setText('');
    await onSend(msg, file);
  };

  if (!hasWriteAccess) {
    return (
      <View style={styles.restrictedContainer}>
        <LockIcon size={16} color={colors.textMuted} />
        <Text style={styles.restrictedText}>
          Only group administrators can send messages in this channel
        </Text>
      </View>
    );
  }

  const bottomInset = isKeyboardVisible ? 4 : Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 0);
  const canSubmit = (Boolean(text.trim()) || Boolean(selectedFile)) && !isUploading;

  return (
    <View style={[styles.container, { paddingBottom: Math.max(bottomInset, spacing.sm) }]}>
      {/* Replying Banner */}
      {replyingTo && (
        <View style={styles.replyBanner}>
          <View style={styles.replyLeft}>
            <Text style={styles.replyTitle}>
              Replying to {replyingTo.sender_name || replyingTo.sender_username || 'Colleague'}
            </Text>
            <Text style={styles.replySnippet} numberOfLines={1}>
              {replyingTo.message_text || replyingTo.original_name || 'Attachment'}
            </Text>
          </View>
          <TouchableOpacity onPress={onCancelReply} style={styles.cancelReplyBtn}>
            <XMarkIcon size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      {/* Selected File Chip */}
      {selectedFile && (
        <View style={styles.fileChip}>
          <Text style={styles.fileName} numberOfLines={1}>
            📎 {selectedFile.name}
          </Text>
          <TouchableOpacity onPress={onRemoveFile} style={styles.removeFileBtn}>
            <XMarkIcon size={14} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      {/* Main Input Bar */}
      <View style={styles.inputRow}>
        <TouchableOpacity
          style={styles.attachButton}
          onPress={onOpenAttachmentModal}
          activeOpacity={0.7}
        >
          <PaperclipIcon size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Type a message here..."
          placeholderTextColor={colors.textLight}
          value={text}
          onChangeText={handleTextChange}
          multiline
          maxLength={1000}
        />

        <TouchableOpacity
          style={[styles.sendButton, canSubmit ? styles.sendButtonActive : styles.sendButtonDisabled]}
          onPress={handleSendPress}
          disabled={!canSubmit}
          activeOpacity={0.8}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <SendIcon size={16} color="#ffffff" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  restrictedContainer: {
    padding: spacing.md,
    backgroundColor: colors.surfaceSubtle,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  restrictedText: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontWeight: fontWeights.medium,
  },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  replyLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  replyTitle: {
    fontSize: fontSizes.tiny,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  replySnippet: {
    fontSize: fontSizes.tiny,
    color: colors.textMuted,
  },
  cancelReplyBtn: {
    padding: 2,
  },
  fileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primarySubtle,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  fileName: {
    flex: 1,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.primary,
    marginRight: spacing.sm,
  },
  removeFileBtn: {
    padding: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    minHeight: 52,
  },
  attachButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    fontWeight: fontWeights.medium,
    paddingHorizontal: spacing.sm,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: colors.primary,
  },
  sendButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
});
