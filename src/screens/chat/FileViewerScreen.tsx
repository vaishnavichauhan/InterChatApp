import React from 'react';
import { View, Text, StyleSheet, Image, Alert } from 'react-native';
import { colors, fontSizes, fontWeights, spacing, borderRadius } from '../../theme';
import { AppHeader } from '../../components/common/AppHeader';
import { AppButton } from '../../components/common/AppButton';
import { FileIcon } from '../../components/icons/SvgIcons';
import { formatFileSize, getFileCategory } from '../../utils/formatters';
import { resolveFileUrl } from '../../config/api';
import { useAuthStore } from '../../store/authStore';

interface FileViewerScreenProps {
  route: any;
  navigation: any;
}

export const FileViewerScreen: React.FC<FileViewerScreenProps> = ({
  route,
  navigation,
}) => {
  const { file } = route.params || {};
  const token = useAuthStore((state) => state.token);
  const permissions = useAuthStore((state) => state.permissions);

  if (!file) {
    return (
      <View style={styles.container}>
        <AppHeader title="File Viewer" showBack onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <Text style={styles.errorText}>No file information provided.</Text>
        </View>
      </View>
    );
  }

  const fileName = file.original_name || file.name || 'Document';
  const fileId = file.id || file.attachmentId;
  const mimeType = file.mime_type || file.type || '';
  const fileSize = file.file_size || file.size || 0;
  const category = getFileCategory(fileName, mimeType);

  const viewUrl = resolveFileUrl(`/api/chat/files/${fileId}/view?token=${encodeURIComponent(token || '')}`);
  const isImage = category === 'image';

  return (
    <View style={styles.container}>
      <AppHeader
        title={fileName}
        subtitle={`${formatFileSize(fileSize)} • ${category.toUpperCase()}`}
        showBack
        onBack={() => navigation.goBack()}
      />

      <View style={styles.content}>
        {isImage ? (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: viewUrl }}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        ) : (
          <View style={styles.docPlaceholder}>
            <View style={styles.docIconCircle}>
              <FileIcon size={48} color={colors.primary} />
            </View>
            <Text style={styles.docTitle} numberOfLines={2}>
              {fileName}
            </Text>
            <Text style={styles.docSize}>{formatFileSize(fileSize)}</Text>

            <View style={styles.securityPill}>
              <Text style={styles.securityText}>🛡️ Protected Enterprise Transmission</Text>
            </View>

            {permissions.canDownload ? (
              <AppButton
                title="Download Document"
                onPress={() => {
                  Alert.alert('Download Authorized', `Downloading ${fileName}...`);
                }}
                size="md"
                style={styles.downloadBtn}
              />
            ) : (
              <Text style={styles.restrictedText}>
                🔒 Local download restricted by administrator policy
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#ffffff',
    fontSize: fontSizes.base,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  docPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    padding: spacing.xxl,
    borderRadius: borderRadius.xxl,
    maxWidth: 320,
    width: '100%',
  },
  docIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  docTitle: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  docSize: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  securityPill: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    marginBottom: spacing.lg,
  },
  securityText: {
    fontSize: fontSizes.tiny,
    color: colors.textSecondary,
    fontWeight: fontWeights.semibold,
  },
  downloadBtn: {
    width: '100%',
  },
  restrictedText: {
    fontSize: fontSizes.tiny,
    color: colors.danger,
    textAlign: 'center',
  },
});
