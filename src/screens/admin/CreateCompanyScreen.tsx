import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { AppHeader } from '../../components/common/AppHeader';
import {
  CityIcon,
  PhoneIcon,
  MapPinIcon,
  CheckIcon,
} from '../../components/icons/SvgIcons';
import { createCompany } from '../../api/companyApi';
import { colors, fontSizes, fontWeights, spacing, borderRadius, shadows } from '../../theme';

interface CreateCompanyScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, any>;
}

export const CreateCompanyScreen: React.FC<CreateCompanyScreenProps> = ({ navigation }) => {
  const [submitting, setSubmitting] = useState(false);

  // Exact 4 form fields matching web frontend (CreateCompany.jsx)
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const handleSubmit = async () => {
    if (!companyName.trim()) {
      Alert.alert('Required', 'Please enter a valid Company Name.');
      return;
    }

    try {
      setSubmitting(true);
      const res: any = await createCompany({
        company_name: companyName.trim(),
        description: description ? description.trim() : '',
        phone: phone ? phone.trim() : '',
        address: address ? address.trim() : '',
        status: 'ACTIVE',
      });

      if (res?.success || res?.data || res?.id || res?.company) {
        Alert.alert(
          'Success',
          `Company "${companyName.trim()}" created successfully!`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Notice', res?.message || 'Company created successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err: any) {
      console.error('Create company error:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to create company.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AppHeader
        title="Create Company"
        showBack
        rightAction
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Form Card ── */}
        <View style={[styles.card, shadows.sm]}>
          <View style={styles.formBody}>
            {/* 1. Company Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Company Name <Text style={styles.star}>*</Text>
              </Text>
              <View style={styles.inputWithIcon}>
                <CityIcon size={16} color={colors.textMuted} />
                <TextInput
                  style={styles.iconInput}
                  placeholder="e.g. Epoxy House"
                  placeholderTextColor={colors.textLight}
                  value={companyName}
                  onChangeText={setCompanyName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* 2. Company Description */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Company Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Brief overview of company..."
                placeholderTextColor={colors.textLight}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* 3. Mobile Number */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Mobile Number</Text>
              <View style={styles.inputWithIcon}>
                <PhoneIcon size={16} color={colors.textMuted} />
                <TextInput
                  style={styles.iconInput}
                  placeholder=""
                  placeholderTextColor={colors.textLight}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* 4. Address */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Address</Text>
              <View style={styles.textAreaWithIconWrap}>
                <View style={styles.textAreaIconTop}>
                  <MapPinIcon size={16} color={colors.textMuted} />
                </View>
                <TextInput
                  style={[styles.input, styles.textAreaWithIcon]}
                  placeholder="Full office or registered address..."
                  placeholderTextColor={colors.textLight}
                  value={address}
                  onChangeText={setAddress}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>

          {/* ── Action Buttons ── */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => navigation.goBack()}
              disabled={submitting}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={styles.submitBtnText}>Creating Company...</Text>
                </>
              ) : (
                <>
                  <CheckIcon size={16} color="#ffffff" />
                  <Text style={styles.submitBtnText}>Create Company</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 48,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: spacing.md,
  },
  cardHeaderIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.extrabold,
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  formBody: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  formGroup: {
    gap: 6,
  },
  label: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.extrabold,
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  star: {
    color: '#f43f5e',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 46,
    gap: spacing.sm,
  },
  iconInput: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 10,
  },
  textAreaWithIconWrap: {
    position: 'relative',
  },
  textAreaIconTop: {
    position: 'absolute',
    left: 14,
    top: 12,
    zIndex: 2,
  },
  textAreaWithIcon: {
    paddingLeft: 40,
    minHeight: 80,
    paddingTop: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: spacing.md,
  },
  cancelBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  cancelBtnText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: '#475569',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    borderRadius: borderRadius.lg,
    backgroundColor: '#ED1C28',
    gap: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: '#ffffff',
  },
});
