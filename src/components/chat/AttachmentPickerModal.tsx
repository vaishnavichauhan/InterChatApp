import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { pick, types } from '@react-native-documents/picker';
import { colors, fontSizes, fontWeights, spacing, borderRadius } from '../../theme';
import {
  ColorfulCameraIcon,
  ColorfulPhotoIcon,
  ColorfulDocumentIcon,
  XMarkIcon,
} from '../icons/SvgIcons';
import { FileUploadAsset } from '../../api/chatApi';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AttachmentPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectFile: (file: FileUploadAsset) => void;
  canCamera?: boolean;
  canUpload?: boolean;
}

const requestCameraPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true;
  }
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Camera Permission',
        message: 'InterChat needs access to your camera to capture photos and videos.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'Allow',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn('Camera permission request error:', err);
    return false;
  }
};

export const AttachmentPickerModal: React.FC<AttachmentPickerModalProps> = ({
  visible,
  onClose,
  onSelectFile,
  canCamera = true,
  canUpload = true,
}) => {
  const insets = useSafeAreaInsets();
  const handleLaunchCamera = async () => {
    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        Alert.alert(
          'Camera Permission Required',
          'Please enable camera permissions in your device settings to take photos or record videos.'
        );
        return;
      }

      const result = await launchCamera({
        mediaType: 'mixed',
        quality: 0.8,
        saveToPhotos: false,
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        Alert.alert('Camera Notice', result.errorMessage || result.errorCode);
        return;
      }

      if (result.assets && result.assets[0]?.uri) {
        const asset = result.assets[0];
        const uri = asset.uri!;
        const isVideo = asset.type?.includes('video');
        onSelectFile({
          uri,
          name: asset.fileName || `capture_${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`,
          type: asset.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
        });
        onClose();
      }
    } catch (err: any) {
      console.warn('Camera capture cancelled or failed', err);
      Alert.alert('Error', err?.message || 'Unable to open camera.');
    }
  };

  const handleLaunchGallery = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'mixed',
        quality: 0.8,
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        Alert.alert('Gallery Notice', result.errorMessage || result.errorCode);
        return;
      }

      if (result.assets && result.assets[0]?.uri) {
        const asset = result.assets[0];
        const uri = asset.uri!;
        const isVideo = asset.type?.includes('video');
        onSelectFile({
          uri,
          name: asset.fileName || `photo_${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`,
          type: asset.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
        });
        onClose();
      }
    } catch (err: any) {
      console.warn('Gallery pick cancelled or failed', err);
      Alert.alert('Error', err?.message || 'Unable to open gallery.');
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
            <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) + spacing.md }]}>
              {/* Drag Handle Indicator */}
              <View style={styles.handleBar} />

              <View style={styles.header}>
                <Text style={styles.title}>Select Media or File</Text>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <XMarkIcon size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.optionsGrid}>
                <TouchableOpacity
                  style={[styles.optionItem, !canCamera && styles.optionItemDisabled]}
                  onPress={handleLaunchCamera}
                  activeOpacity={0.7}
                  disabled={!canCamera}
                >
                  <View style={styles.iconWrap}>
                    <ColorfulCameraIcon size={52} />
                  </View>
                  <Text style={styles.optionLabel}>Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.optionItem, !canUpload && styles.optionItemDisabled]}
                  onPress={handleLaunchGallery}
                  activeOpacity={0.7}
                  disabled={!canUpload}
                >
                  <View style={styles.iconWrap}>
                    <ColorfulPhotoIcon size={52} />
                  </View>
                  <Text style={styles.optionLabel}>Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.optionItem, !canUpload && styles.optionItemDisabled]}
                  onPress={handlePickDocument}
                  activeOpacity={0.7}
                  disabled={!canUpload}
                >
                  <View style={styles.iconWrap}>
                    <ColorfulDocumentIcon size={52} />
                  </View>
                  <Text style={styles.optionLabel}>Document</Text>
                </TouchableOpacity>
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  handleBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingHorizontal: 2,
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  optionItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    backgroundColor: 'transparent',
  },
  optionItemDisabled: {
    opacity: 0.3,
  },
  iconWrap: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs + 2,
    backgroundColor: 'transparent',
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  optionDesc: {
    fontSize: 11,
    lineHeight: 14,
    color: colors.textMuted,
    textAlign: 'center',
    minHeight: 28,
  },
});
