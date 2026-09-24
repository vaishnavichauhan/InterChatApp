import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { pick, types } from '@react-native-documents/picker';
import { colors, fontSizes, fontWeights, spacing, borderRadius } from '../../theme';
import { CameraIcon, FileIcon, XMarkIcon } from '../icons/SvgIcons';
import { FileUploadAsset } from '../../api/chatApi';

interface AttachmentPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectFile: (file: FileUploadAsset) => void;
  canCamera?: boolean;
  canUpload?: boolean;
}

export const AttachmentPickerModal: React.FC<AttachmentPickerModalProps> = ({
  visible,
  onClose,
  onSelectFile,
  canCamera = true,
  canUpload = true,
}) => {
  const handleLaunchCamera = async () => {
    try {
      const result = await launchCamera({
        mediaType: 'mixed',
        quality: 0.8,
        saveToPhotos: false,
      });

      if (result.assets && result.assets[0]?.uri) {
        const asset = result.assets[0];
        const uri = asset.uri!;
        onSelectFile({
          uri,
          name: asset.fileName || `capture_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
        });
        onClose();
      }
    } catch (err) {
      console.warn('Camera capture cancelled or failed', err);
    }
  };

  const handleLaunchGallery = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'mixed',
        quality: 0.8,
      });

      if (result.assets && result.assets[0]?.uri) {
        const asset = result.assets[0];
        const uri = asset.uri!;
        onSelectFile({
          uri,
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
        });
        onClose();
      }
    } catch (err) {
      console.warn('Gallery pick cancelled or failed', err);
    }
  };

  const handlePickDocument = async () => {
    try {
      const [res] = await pick({
        type: [types.allFiles],
      });

      if (res && res.uri) {
        onSelectFile({
          uri: res.uri,
          name: res.name || `doc_${Date.now()}`,
          type: res.type || 'application/octet-stream',
        });
        onClose();
      }
    } catch (err) {
      console.warn('Document pick cancelled or failed', err);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <View style={styles.header}>
                <Text style={styles.title}>Share Media or File</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <XMarkIcon size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.optionsGrid}>
                {canCamera && (
                  <TouchableOpacity
                    style={styles.optionItem}
                    onPress={handleLaunchCamera}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.iconWrap, { backgroundColor: '#e0efff' }]}>
                      <CameraIcon size={24} color={colors.primary} />
                    </View>
                    <Text style={styles.optionLabel}>Camera</Text>
                    <Text style={styles.optionDesc}>Capture photo/video</Text>
                  </TouchableOpacity>
                )}

                {canUpload && (
                  <TouchableOpacity
                    style={styles.optionItem}
                    onPress={handleLaunchGallery}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.iconWrap, { backgroundColor: '#f0fdf4' }]}>
                      <CameraIcon size={24} color={colors.success} />
                    </View>
                    <Text style={styles.optionLabel}>Photo Library</Text>
                    <Text style={styles.optionDesc}>Choose from photos</Text>
                  </TouchableOpacity>
                )}

                {canUpload && (
                  <TouchableOpacity
                    style={styles.optionItem}
                    onPress={handlePickDocument}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.iconWrap, { backgroundColor: '#faf5ff' }]}>
                      <FileIcon size={24} color="#7c3aed" />
                    </View>
                    <Text style={styles.optionLabel}>Document</Text>
                    <Text style={styles.optionDesc}>PDF, Excel, Word</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.backdrop,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  optionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.md,
  },
  optionItem: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  optionLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: fontSizes.tiny,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
