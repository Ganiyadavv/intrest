import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { MainStackParamList } from '../types/navigation';
import { userService } from '../services/userService';
import { authService } from '../services/authService';
import { User } from '../types/user';
import { Loading } from '../components/Loading';
import { ErrorMessage } from '../components/ErrorMessage';
import { ProfileImage } from '../components/ProfileImage';

type ProfileScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Profile'>;

interface Props {
  navigation: ProfileScreenNavigationProp;
}

export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await userService.getProfile();
      setUser(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchProfile();
    });
    return unsubscribe;
  }, [navigation]);

  const handleLogoutPress = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await authService.logoutUser();
    navigation.getParent()?.reset({
      index: 0,
      routes: [{ name: 'Auth', params: { screen: 'PublicHome' } }],
    });
  };

  const handleCopyUserId = () => {
    if (!user?.userId) return;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(user.userId);
    }
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const formattedAddress = () => {
    if (!user) return 'Not provided';
    const parts = [user.address, user.city, user.state].filter(Boolean);
    if (parts.length === 0) return 'Not provided';
    let res = parts.join(', ');
    if (user.pincode) {
      res += ` - ${user.pincode}`;
    }
    return res;
  };

  const displayName = user
    ? user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User'
    : 'User';

  if (loading && !user) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.topAppBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.appBarTitle}>My Profile</Text>
          <View style={{ width: 38 }} />
        </View>
        <Loading fullScreen message="Loading Profile..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* 1. TOP APP BAR */}
      <View style={styles.topAppBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerIconBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.brandCenter}>
          <View style={styles.brandLogoCircle}>
            <Text style={styles.brandRupeeText}>₹</Text>
            <Ionicons name="leaf" size={10} color="#4ADE80" style={styles.brandLeafIcon} />
          </View>
          <View style={styles.brandTextCol}>
            <Text style={styles.brandTitleText}>DhanaMitra</Text>
            <Text style={styles.brandSubtitleText}>My Profile</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('EditProfile')}
          style={styles.headerIconBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. HERO PROFILE HEADER */}
        <View style={styles.heroSection}>
          <TouchableOpacity
            style={styles.avatarTouchable}
            onPress={() => navigation.navigate('EditProfile')}
            activeOpacity={0.85}
          >
            <ProfileImage
              uri={user?.profileImage}
              size={98}
              name={displayName}
              showCameraBadge={true}
              onEdit={() => navigation.navigate('EditProfile')}
              borderWidth={3.5}
              borderColor="#FFFFFF"
            />
          </TouchableOpacity>

          <Text style={styles.heroName}>{displayName}</Text>

          <View style={styles.heroBadgesRow}>
            <View style={styles.roleBadge}>
              <Ionicons name="shield-checkmark" size={13} color="#056B38" style={{ marginRight: 4 }} />
              <Text style={styles.roleBadgeText}>{user?.role || 'MEMBER'}</Text>
            </View>

            <View style={[styles.statusBadge, user?.status === 'ACTIVE' ? styles.statusBadgeActive : styles.statusBadgeInactive]}>
              <View style={[styles.statusDot, user?.status === 'ACTIVE' ? styles.statusDotActive : styles.statusDotInactive]} />
              <Text style={[styles.statusBadgeText, user?.status === 'ACTIVE' ? styles.statusTextActive : styles.statusTextInactive]}>
                {user?.status || 'ACTIVE'}
              </Text>
            </View>
          </View>

          {/* USER ID CARD */}
          <TouchableOpacity
            style={styles.userIdCard}
            onPress={handleCopyUserId}
            activeOpacity={0.8}
          >
            <View style={styles.userIdLeft}>
              <View style={styles.userIdIconBox}>
                <Ionicons name="finger-print" size={18} color="#056B38" />
              </View>
              <View>
                <Text style={styles.userIdLabel}>User ID</Text>
                <Text style={styles.userIdValue}>{user?.userId || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.copyBtnBadge}>
              <Ionicons
                name={copiedId ? 'checkmark-circle' : 'copy-outline'}
                size={14}
                color={copiedId ? '#15803D' : '#056B38'}
              />
              <Text style={[styles.copyBtnText, copiedId && { color: '#15803D' }]}>
                {copiedId ? 'Copied' : 'Copy'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {error ? <ErrorMessage message={error} /> : null}

        {/* 3. PERSONAL INFORMATION CARD */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderIconBox}>
              <Ionicons name="person" size={16} color="#056B38" />
            </View>
            <Text style={styles.cardHeaderTitle}>Personal Information</Text>
          </View>

          {/* Email */}
          <View style={styles.infoRow}>
            <View style={[styles.infoIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="mail-outline" size={18} color="#2563EB" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email Address</Text>
              <Text style={styles.infoValue}>{user?.email || 'Not provided'}</Text>
            </View>
          </View>

          {/* Phone Number */}
          <View style={styles.infoRow}>
            <View style={[styles.infoIconBox, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="call-outline" size={18} color="#056B38" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone Number</Text>
              <Text style={styles.infoValue}>{user?.phoneNumber || 'Not provided'}</Text>
            </View>
          </View>

          {/* Status */}
          <View style={styles.infoRow}>
            <View style={[styles.infoIconBox, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#16A34A" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Account Status</Text>
              <View style={styles.activePillSmall}>
                <View style={styles.statusDotActive} />
                <Text style={styles.activePillText}>{user?.status || 'ACTIVE'}</Text>
              </View>
            </View>
          </View>

          {/* Address */}
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <View style={[styles.infoIconBox, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="location-outline" size={18} color="#D97706" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>{formattedAddress()}</Text>
            </View>
          </View>
        </View>

        {/* 4. ACTIONS & SECURITY */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderIconBox}>
              <Ionicons name="settings-sharp" size={16} color="#056B38" />
            </View>
            <Text style={styles.cardHeaderTitle}>Account & Settings</Text>
          </View>

          {/* Edit Profile */}
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation.navigate('EditProfile')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="pencil" size={18} color="#056B38" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Edit Profile</Text>
              <Text style={styles.actionSubtext}>Update your personal info, photo & address</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          {/* Change Password */}
          <TouchableOpacity
            style={[styles.actionItem, { borderBottomWidth: 0 }]}
            onPress={() => navigation.navigate('ChangePassword')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="lock-closed" size={18} color="#D97706" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Change Password</Text>
              <Text style={styles.actionSubtext}>Update and secure your account password</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* 5. LOGOUT BUTTON */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogoutPress}
          activeOpacity={0.8}
        >
          <View style={styles.logoutIconBox}>
            <Ionicons name="log-out-outline" size={18} color="#DC2626" />
          </View>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>

        {/* 6. APP VERSION FOOTER */}
        <View style={styles.footerNote}>
          <View style={styles.footerBrandRow}>
            <Text style={styles.footerLeaf}>🌱</Text>
            <Text style={styles.footerBrand}>DhanaMitra</Text>
          </View>
          <Text style={styles.footerVersion}>Version 1.0.0 • Secure Money Tracking</Text>
        </View>
      </ScrollView>

      {/* 7. LOGOUT CONFIRMATION MODAL */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconBox}>
              <Ionicons name="log-out-outline" size={28} color="#DC2626" />
            </View>

            <Text style={styles.modalTitle}>Log Out of DhanaMitra?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to log out? You will need to sign in again to access your lending and borrowing records.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowLogoutModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={confirmLogout}
                activeOpacity={0.8}
              >
                <Text style={styles.modalConfirmBtnText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#056B38',
  },
  topAppBar: {
    backgroundColor: '#056B38',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  appBarTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  brandCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogoCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: '#4ADE80',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    position: 'relative',
  },
  brandRupeeText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  brandLeafIcon: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  brandTextCol: {
    alignItems: 'flex-start',
  },
  brandTitleText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  brandSubtitleText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    backgroundColor: '#056B38',
    paddingTop: 12,
    paddingBottom: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarTouchable: {
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    color: '#056B38',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeActive: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgeInactive: {
    backgroundColor: '#FEE2E2',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusDotActive: {
    backgroundColor: '#16A34A',
  },
  statusDotInactive: {
    backgroundColor: '#DC2626',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusTextActive: {
    color: '#15803D',
  },
  statusTextInactive: {
    color: '#DC2626',
  },
  userIdCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  userIdLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userIdIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  userIdLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userIdValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  copyBtnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  copyBtnText: {
    fontSize: 12,
    color: '#056B38',
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardHeaderIconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
  },
  activePillSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  activePillText: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '700',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  actionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  actionSubtext: {
    fontSize: 11,
    color: '#64748B',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutIconBox: {
    marginRight: 8,
  },
  logoutButtonText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },
  footerNote: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  footerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  footerLeaf: {
    fontSize: 14,
    marginRight: 4,
  },
  footerBrand: {
    fontSize: 13,
    fontWeight: '700',
    color: '#056B38',
  },
  footerVersion: {
    fontSize: 11,
    color: '#94A3B8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  modalConfirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
