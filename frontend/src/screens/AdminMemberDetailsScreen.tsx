import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AdminStackParamList } from '../types/navigation';
import { AdminMember } from '../types/admin';
import { adminService } from '../services/adminService';
import { Loading } from '../components/Loading';
import { ErrorMessage } from '../components/ErrorMessage';
import { ProfileImage } from '../components/ProfileImage';

type AdminMemberDetailsNavigationProp = NativeStackNavigationProp<AdminStackParamList, 'AdminMemberDetails'>;
type AdminMemberDetailsRouteProp = RouteProp<AdminStackParamList, 'AdminMemberDetails'>;

interface Props {
  navigation: AdminMemberDetailsNavigationProp;
  route: AdminMemberDetailsRouteProp;
}

export const AdminMemberDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { id } = route.params;
  const [member, setMember] = useState<AdminMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    confirmText: string;
    confirmColor: string;
    iconName?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    iconBg?: string;
    showCancel?: boolean;
    onConfirm: () => void;
  }>({
    title: '',
    message: '',
    confirmText: 'OK',
    confirmColor: '#056B38',
    iconName: 'checkmark-circle',
    iconColor: '#056B38',
    iconBg: '#ECFDF5',
    showCancel: false,
    onConfirm: () => {},
  });

  const fetchMemberDetails = async () => {
    try {
      setError('');
      const data = await adminService.getMemberById(id);
      setMember(data);
    } catch (err: any) {
      setError('Failed to fetch member details');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMemberDetails();
    }, [id])
  );

  const toggleStatus = () => {
    if (!member) return;

    const isCurrentlyActive = (member.status || '').toUpperCase() === 'ACTIVE';
    const newStatus = isCurrentlyActive ? 'INACTIVE' : 'ACTIVE';
    const actionText = isCurrentlyActive ? 'suspend' : 'activate';

    const executeStatusUpdate = async () => {
      setProcessing(true);
      try {
        await adminService.updateMemberStatus(id, newStatus);
        setModalConfig({
          title: 'Success',
          message: `Member ${isCurrentlyActive ? 'suspended' : 'activated'} successfully.`,
          confirmText: 'OK',
          confirmColor: '#056B38',
          iconName: 'checkmark-circle',
          iconColor: '#056B38',
          iconBg: '#ECFDF5',
          showCancel: false,
          onConfirm: () => {
            setModalVisible(false);
            fetchMemberDetails();
          },
        });
        setModalVisible(true);
      } catch (err: any) {
        const msg = err.response?.data?.message || 'Failed to update status';
        setModalConfig({
          title: 'Error',
          message: msg,
          confirmText: 'Close',
          confirmColor: '#DC2626',
          iconName: 'alert-circle',
          iconColor: '#DC2626',
          iconBg: '#FEE2E2',
          showCancel: false,
          onConfirm: () => {
            setModalVisible(false);
          },
        });
        setModalVisible(true);
      } finally {
        setProcessing(false);
      }
    };

    setModalConfig({
      title: isCurrentlyActive ? 'Suspend Member' : 'Activate Member',
      message: `Are you sure you want to ${actionText} this member?`,
      confirmText: isCurrentlyActive ? 'Suspend' : 'Activate',
      confirmColor: isCurrentlyActive ? '#EF4444' : '#059669',
      iconName: isCurrentlyActive ? 'person-remove-outline' : 'checkmark-circle-outline',
      iconColor: isCurrentlyActive ? '#EF4444' : '#059669',
      iconBg: isCurrentlyActive ? '#FEE2E2' : '#ECFDF5',
      showCancel: true,
      onConfirm: () => {
        executeStatusUpdate();
      },
    });
    setModalVisible(true);
  };

  // Helper to format date with time e.g. "12 Aug 2024, 10:30 AM"
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = d.getDate();
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      let hours = d.getHours();
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
    } catch {
      return dateStr;
    }
  };

  // Helper to extract initials
  const getInitials = (name?: string, email?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'MB';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Loading />
      </SafeAreaView>
    );
  }

  if (error || !member) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorMessage message={error || 'Member details not available'} />
      </SafeAreaView>
    );
  }

  const displayName =
    member.fullName ||
    `${member.firstName || ''} ${member.lastName || ''}`.trim() ||
    (member as any).name ||
    'Member';
  const isActive = (member.status || '').toUpperCase() === 'ACTIVE';
  const initials = getInitials(displayName, member.email);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />

      {/* 1. TOP GREEN APP BAR */}
      <View style={styles.topDarkSection}>
        <View style={styles.customHeader}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Member Details</Text>
          <View style={{ width: 38 }} />
        </View>
      </View>

      {/* 2. WAVE CONNECTOR (Matching curved design) */}
      <View style={styles.waveConnectorDark}>
        <View style={styles.waveConnectorLightCutout} />
      </View>

      {/* 3. SCROLLABLE CONTENT */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Main Profile Hero Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeroRow}>
            <View style={styles.avatarBorderCircle}>
              {member.profileImage ? (
                <ProfileImage uri={member.profileImage} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarFallbackText}>{initials}</Text>
                </View>
              )}
            </View>

            <View style={styles.profileMetaCol}>
              <Text style={styles.displayName} numberOfLines={1}>
                {displayName}
              </Text>
              <View style={styles.userIdChip}>
                <Ionicons name="finger-print-outline" size={13} color="#64748B" style={{ marginRight: 4 }} />
                <Text style={styles.userIdText}>{member.userId}</Text>
              </View>
              <View
                style={[
                  styles.statusBadgePill,
                  isActive ? styles.statusActivePill : styles.statusSuspendedPill,
                ]}
              >
                <View style={[styles.statusDot, { backgroundColor: isActive ? '#10B981' : '#EF4444' }]} />
                <Text
                  style={[
                    styles.statusBadgePillText,
                    isActive ? styles.statusActivePillText : styles.statusSuspendedPillText,
                  ]}
                >
                  {isActive ? 'Active Member' : member.status || 'Suspended'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Contact & Activity Card */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionHeaderTitle}>Contact & Activity</Text>

          {/* Row 1: Email */}
          <View style={styles.infoItemRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="mail-outline" size={18} color="#059669" />
            </View>
            <View style={styles.infoTextCol}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{member.email || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.infoDivider} />

          {/* Row 2: Phone */}
          <View style={styles.infoItemRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="call-outline" size={18} color="#059669" />
            </View>
            <View style={styles.infoTextCol}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{member.phoneNumber || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.infoDivider} />

          {/* Row 3: Joined On */}
          <View style={styles.infoItemRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="calendar-outline" size={18} color="#059669" />
            </View>
            <View style={styles.infoTextCol}>
              <Text style={styles.infoLabel}>Joined On</Text>
              <Text style={styles.infoValue}>{formatDateTime(member.createdAt)}</Text>
            </View>
          </View>

          <View style={styles.infoDivider} />

          {/* Row 4: Last Active */}
          <View style={styles.infoItemRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="time-outline" size={18} color="#059669" />
            </View>
            <View style={styles.infoTextCol}>
              <Text style={styles.infoLabel}>Last Active</Text>
              <Text style={styles.infoValue}>{formatDateTime(member.updatedAt)}</Text>
            </View>
          </View>

          {/* Optional Location Row */}
          {(!!member.city || !!member.state || !!member.address) && (
            <>
              <View style={styles.infoDivider} />
              <View style={styles.infoItemRow}>
                <View style={styles.infoIconBox}>
                  <Ionicons name="location-outline" size={18} color="#059669" />
                </View>
                <View style={styles.infoTextCol}>
                  <Text style={styles.infoLabel}>Location</Text>
                  <Text style={styles.infoValue}>
                    {[member.address, member.city, member.state, member.pincode].filter(Boolean).join(', ')}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Role & Security Status Card */}
        <View style={styles.securityCard}>
          <Text style={styles.sectionHeaderTitle}>Account & Permissions</Text>

          <View style={styles.securityRow}>
            <View style={styles.securityItem}>
              <Text style={styles.securityLabel}>User Role</Text>
              <Text style={styles.securityVal}>{member.role || 'MEMBER'}</Text>
            </View>
            <View style={styles.securityDividerV} />
            <View style={styles.securityItem}>
              <Text style={styles.securityLabel}>Access Tier</Text>
              <Text style={[styles.securityVal, { color: isActive ? '#059669' : '#EF4444' }]}>
                {isActive ? 'Full Access' : 'Restricted'}
              </Text>
            </View>
            <View style={styles.securityDividerV} />
            <View style={styles.securityItem}>
              <Text style={styles.securityLabel}>Verification</Text>
              <Text style={styles.securityVal}>Verified</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {/* Button 1: View Records */}
        <TouchableOpacity
          style={styles.viewRecordsBtn}
          onPress={() => {
            setModalConfig({
              title: 'Records Overview',
              message: `Viewing records overview for ${displayName}.`,
              confirmText: 'OK',
              confirmColor: '#056B38',
              iconName: 'swap-horizontal',
              iconColor: '#056B38',
              iconBg: '#ECFDF5',
              showCancel: false,
              onConfirm: () => setModalVisible(false),
            });
            setModalVisible(true);
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="swap-horizontal" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.viewRecordsBtnText}>View Records</Text>
        </TouchableOpacity>

        {/* Button 2: Suspend / Activate Member */}
        <TouchableOpacity
          style={[
            styles.actionToggleBtn,
            isActive ? styles.suspendBtnBorder : styles.activateBtnBorder,
          ]}
          onPress={toggleStatus}
          disabled={processing}
          activeOpacity={0.85}
        >
          <Ionicons
            name={isActive ? 'person-remove-outline' : 'checkmark-circle-outline'}
            size={18}
            color={isActive ? '#EF4444' : '#059669'}
            style={{ marginRight: 8 }}
          />
          <Text
            style={[
              styles.actionToggleBtnText,
              isActive ? styles.suspendBtnText : styles.activateBtnText,
            ]}
          >
            {processing ? 'Updating...' : isActive ? 'Suspend Member' : 'Activate Member'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* CUSTOM CONFIRMATION & ALERT MODAL */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          if (!processing) setModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={[styles.modalIconContainer, { backgroundColor: modalConfig.iconBg || '#F8FAFC' }]}>
              <Ionicons
                name={modalConfig.iconName || 'warning'}
                size={30}
                color={modalConfig.iconColor || modalConfig.confirmColor}
              />
            </View>
            <Text style={styles.modalTitle}>{modalConfig.title}</Text>
            <Text style={styles.modalMessage}>{modalConfig.message}</Text>
            <View style={styles.modalActions}>
              {modalConfig.showCancel && (
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setModalVisible(false)}
                  disabled={processing}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  { backgroundColor: modalConfig.confirmColor },
                  !modalConfig.showCancel && { flex: 1, minWidth: 160 },
                  processing && { opacity: 0.7 },
                ]}
                onPress={modalConfig.onConfirm}
                disabled={processing}
                activeOpacity={0.85}
              >
                <Text style={styles.modalConfirmText}>
                  {processing ? 'Updating...' : modalConfig.confirmText}
                </Text>
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
    backgroundColor: '#044E28',
  },
  topDarkSection: {
    backgroundColor: '#044E28',
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomRightRadius: 70,
    zIndex: 10,
  },
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  waveConnectorDark: {
    height: 45,
    backgroundColor: '#044E28',
    marginTop: -1,
    zIndex: 1,
  },
  waveConnectorLightCutout: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 65,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 48,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 3px 12px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  profileHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBorderCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2.5,
    borderColor: '#10B981',
    overflow: 'hidden',
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
  },
  avatarFallbackText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#056B38',
  },
  profileMetaCol: {
    flex: 1,
    paddingLeft: 16,
    justifyContent: 'center',
  },
  displayName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.2,
  },
  userIdChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  userIdText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  statusBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 6,
    gap: 5,
  },
  statusActivePill: {
    backgroundColor: '#ECFDF5',
  },
  statusSuspendedPill: {
    backgroundColor: '#FEE2E2',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgePillText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  statusActivePillText: {
    color: '#059669',
  },
  statusSuspendedPillText: {
    color: '#DC2626',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 3px 10px rgba(0, 0, 0, 0.04)',
      },
    }),
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  infoItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  infoIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTextCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  securityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
      },
    }),
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  securityItem: {
    flex: 1,
    alignItems: 'center',
  },
  securityLabel: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
  },
  securityVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
  },
  securityDividerV: {
    width: 1,
    height: 28,
    backgroundColor: '#F1F5F9',
  },
  viewRecordsBtn: {
    backgroundColor: '#056B38',
    borderRadius: 18,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#056B38',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 3px 10px rgba(5, 107, 56, 0.25)',
      },
    }),
  },
  viewRecordsBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  actionToggleBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1.5,
  },
  suspendBtnBorder: {
    borderColor: '#EF4444',
  },
  activateBtnBorder: {
    borderColor: '#059669',
  },
  actionToggleBtnText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  suspendBtnText: {
    color: '#EF4444',
  },
  activateBtnText: {
    color: '#059669',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 12px 36px rgba(0,0,0,0.18)',
      },
    }),
  },
  modalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 22,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '700',
  },
  modalConfirmBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
