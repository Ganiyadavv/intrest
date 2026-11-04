import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MainStackParamList } from '../types/navigation';
import { LenderRecord } from '../types/lenderRecord';
import { lenderRecordService } from '../services/lenderRecordService';
import { Loading } from '../components/Loading';
import { ErrorMessage } from '../components/ErrorMessage';
import { formatCurrency } from '../utils/currency';
import { getUser } from '../storage/storage';
import { User } from '../types/user';

type LenderRecordDetailsNavigationProp = NativeStackNavigationProp<MainStackParamList, 'LenderRecordDetails'>;
type LenderRecordDetailsRouteProp = RouteProp<MainStackParamList, 'LenderRecordDetails'>;

interface Props {
  navigation: LenderRecordDetailsNavigationProp;
  route: LenderRecordDetailsRouteProp;
}

const AVATAR_COLORS = [
  { bg: '#FEF3C7', text: '#B45309' }, // Warm amber
  { bg: '#DBEAFE', text: '#1D4ED8' }, // Soft blue
  { bg: '#DCFCE7', text: '#15803D' }, // Soft green
  { bg: '#FCE7F3', text: '#BE185D' }, // Soft pink
  { bg: '#EDE9FE', text: '#6D28D9' }, // Soft purple
  { bg: '#CCFBF1', text: '#0F766E' }, // Soft teal
];

const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

export const LenderRecordDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { id } = route.params;
  const [person, setPerson] = useState<LenderRecord | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: '',
    confirmColor: '#056B38',
  });

  const fetchPerson = async () => {
    try {
      setError('');
      const data = await lenderRecordService.getLenderRecordById(id);
      setPerson(data);
      const user = await getUser();
      setCurrentUser(user);
    } catch (err: any) {
      setError('Failed to fetch details');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPerson();
    }, [id])
  );

  const executeDelete = async () => {
    setModalVisible(false);
    try {
      await lenderRecordService.deleteLenderRecord(id);
      navigation.goBack();
    } catch (err: any) {
      if (Platform.OS === 'web') window.alert('Failed to delete record');
      else Alert.alert('Error', 'Failed to delete record');
    }
  };

  const handleDelete = () => {
    setModalConfig({
      title: 'Delete Record',
      message: 'Are you sure you want to delete this lender record?',
      confirmText: 'Delete',
      confirmColor: '#DC2626',
      onConfirm: executeDelete,
    });
    setModalVisible(true);
  };

  const executeStatusUpdate = async () => {
    setModalVisible(false);
    try {
      await lenderRecordService.completeLenderRecord(id);
      fetchPerson();
    } catch (err: any) {
      if (Platform.OS === 'web') window.alert('Failed to update record');
      else Alert.alert('Error', 'Failed to update record');
    }
  };

  const handleUpdateStatus = () => {
    setModalConfig({
      title: 'Mark Complete',
      message: 'Are you sure you want to mark this lender record as COMPLETED?',
      confirmText: 'Mark Complete',
      confirmColor: '#056B38',
      onConfirm: executeStatusUpdate,
    });
    setModalVisible(true);
  };

  const handleAccept = async () => {
    setProcessing(true);
    try {
      await lenderRecordService.acceptLenderRecord(id);
      if (Platform.OS === 'web') window.alert('Request accepted successfully');
      else Alert.alert('Success', 'Request accepted successfully');
      fetchPerson();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to accept request';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = () => {
    setModalConfig({
      title: 'Reject Request',
      message: 'Are you sure you want to reject this request?',
      confirmText: 'Reject',
      confirmColor: '#DC2626',
      onConfirm: async () => {
        setModalVisible(false);
        setProcessing(true);
        try {
          await lenderRecordService.rejectLenderRecord(id);
          if (Platform.OS === 'web') window.alert('Request rejected');
          else Alert.alert('Success', 'Request rejected');
          fetchPerson();
        } catch (err: any) {
          const msg = err.response?.data?.message || 'Failed to reject request';
          if (Platform.OS === 'web') window.alert(msg);
          else Alert.alert('Error', msg);
        } finally {
          setProcessing(false);
        }
      },
    });
    setModalVisible(true);
  };

  const calculateInterest = () => {
    if (!person) return { years: 0, months: 0, days: 0, totalMonths: 0, interest: 0, total: 0 };

    const d1 = new Date(person.receivedDate);
    const d2 = new Date();

    let years = d2.getFullYear() - d1.getFullYear();
    let months = d2.getMonth() - d1.getMonth();
    let days = d2.getDate() - d1.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(d2.getFullYear(), d2.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    const totalMonths = years * 12 + months + days / 30;
    const principal = Number(person.amount) || 0;
    const rate = Number(person.interestRate) || 0;

    const interest = (principal * rate * totalMonths) / 100;

    return {
      years: Math.max(0, years),
      months: Math.max(0, months),
      days: Math.max(0, days),
      totalMonths: Math.max(0, totalMonths),
      interest: Math.max(0, interest),
      total: Math.max(0, principal + interest),
    };
  };

  const calcResult = calculateInterest();
  const hasAddress =
    person?.village ||
    person?.mandal ||
    person?.district ||
    person?.state ||
    person?.country ||
    person?.pincode;

  const isRecipient = person?.ownerId !== currentUser?.id;
  const needsAcceptance = isRecipient && person?.status === 'PENDING';

  if (loading)
    return (
      <SafeAreaView style={styles.safeContainer}>
        <Loading />
      </SafeAreaView>
    );

  if (error || !person)
    return (
      <SafeAreaView style={styles.safeContainer}>
        <ErrorMessage message={error || 'Lender record not found'} />
      </SafeAreaView>
    );

  const rawName = (person.name || 'Lender').trim();
  const parts = rawName.split(' ');
  const initials =
    parts.length > 1
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : rawName.slice(0, 2).toUpperCase();
  const avatarStyle = getAvatarColor(rawName);

  const isCompleted = person.status === 'COMPLETED';
  const progressPercent = isCompleted ? 100 : 0;
  const paidAmount = isCompleted ? calcResult.total : 0;
  const remainingAmount = isCompleted ? 0 : calcResult.total;

  const formattedReceivedDate = person.receivedDate
    ? new Date(person.receivedDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A';

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      {/* 1. TOP HEADER */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lender Details</Text>
        {!isRecipient ? (
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.headerBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={20} color="#DC2626" />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerBtn} />
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* 2. LENDER PROFILE SUMMARY */}
        <View style={styles.profileSummaryCard}>
          <View style={[styles.avatarCircle, { backgroundColor: avatarStyle.bg }]}>
            <Text style={[styles.avatarText, { color: avatarStyle.text }]}>{initials}</Text>
          </View>
          <View style={styles.profileTextCol}>
            <Text style={styles.profileName} numberOfLines={1}>{person.name}</Text>
            <Text style={styles.profilePhone}>{person.phoneNumber}</Text>
            {person.targetUserId && (
              <Text style={styles.profileUserId}>User ID: {person.targetUserId}</Text>
            )}
          </View>
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor:
                  person.status === 'COMPLETED'
                    ? '#DCFCE7'
                    : person.status === 'ACCEPTED'
                    ? '#DCFCE7'
                    : person.status === 'PENDING'
                    ? '#FEF3C7'
                    : '#FEE2E2',
              },
            ]}
          >
            <Text
              style={[
                styles.statusPillText,
                {
                  color:
                    person.status === 'COMPLETED'
                      ? '#15803D'
                      : person.status === 'ACCEPTED'
                      ? '#16A34A'
                      : person.status === 'PENDING'
                      ? '#D97706'
                      : '#DC2626',
                },
              ]}
            >
              {person.status === 'ACCEPTED' ? 'Active' : person.status}
            </Text>
          </View>
        </View>

        {/* 3. CARD: LOAN INFORMATION */}
        <View style={styles.infoCard}>
          <Text style={styles.cardHeaderTitle}>Loan Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoRowLabel}>Amount Received</Text>
            <Text style={styles.infoRowValue}>{formatCurrency(person.amount)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoRowLabel}>Interest Rate</Text>
            <Text style={styles.infoRowValue}>{person.interestRate}% / month</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoRowLabel}>Received Date</Text>
            <Text style={styles.infoRowValue}>{formattedReceivedDate}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoRowLabel}>Repayment Type</Text>
            <Text style={styles.infoRowValue}>Monthly</Text>
          </View>

          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoRowLabel}>Total Payable</Text>
            <Text style={[styles.infoRowValue, { color: '#056B38', fontWeight: '800' }]}>
              {formatCurrency(calcResult.total)}
            </Text>
          </View>
        </View>

        {/* 4. CARD: PAYMENT SUMMARY */}
        <View style={styles.infoCard}>
          <Text style={styles.cardHeaderTitle}>Payment Summary</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoRowLabel}>Paid Amount</Text>
            <Text style={styles.infoRowValue}>{formatCurrency(paidAmount)}</Text>
          </View>

          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoRowLabel}>Remaining Amount</Text>
            <Text style={[styles.infoRowValue, { color: isCompleted ? '#16A34A' : '#D97706' }]}>
              {formatCurrency(remainingAmount)}
            </Text>
          </View>

          {/* Progress Bar & Percentage */}
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.progressText}>{progressPercent}%</Text>
          </View>
        </View>

        {/* 5. CARD: PERSONAL DETAILS */}
        <View style={styles.infoCard}>
          <Text style={styles.cardHeaderTitle}>Personal Details</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoRowLabel}>Father's Name</Text>
            <Text style={styles.infoRowValue}>{person.fatherName || 'Not provided'}</Text>
          </View>

          {hasAddress && (
            <View style={styles.infoRow}>
              <Text style={styles.infoRowLabel}>Address</Text>
              <Text style={[styles.infoRowValue, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>
                {[
                  person.village,
                  person.mandal,
                  person.district,
                  person.state,
                  person.country,
                  person.pincode,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </Text>
            </View>
          )}

          {!!person.notes && (
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.infoRowLabel}>Notes</Text>
              <Text style={[styles.infoRowValue, { flex: 1, textAlign: 'right' }]}>{person.notes}</Text>
            </View>
          )}
        </View>

        {/* 6. CARD: PAYMENT SCREENSHOT (if available) */}
        {!!person.paymentScreenshot && (
          <View style={styles.infoCard}>
            <Text style={styles.cardHeaderTitle}>Payment Screenshot</Text>
            <Image source={{ uri: person.paymentScreenshot }} style={styles.screenshotImage} />
          </View>
        )}

        {/* 7. INTEREST CALCULATOR TILE */}
        <TouchableOpacity
          style={styles.calcTileBtn}
          onPress={() =>
            navigation.navigate('InterestCalculator', {
              principal: person.amount.toString(),
              rate: person.interestRate.toString(),
              years: (calcResult.years ?? 0).toString(),
              months: (calcResult.months ?? 0).toString(),
              days: (calcResult.days ?? 0).toString(),
              givenDate: person.receivedDate,
              personName: person.name,
            })
          }
          activeOpacity={0.8}
        >
          <View style={styles.calcTileIconCircle}>
            <Ionicons name="calculator-outline" size={20} color="#7C3AED" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.calcTileTitle}>Open in Interest Calculator</Text>
            <Text style={styles.calcTileSubtitle}>
              {calcResult.years > 0 ? `${calcResult.years}y ` : ''}
              {calcResult.months}m {calcResult.days}d duration ({formatCurrency(calcResult.interest)} interest)
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>
      </ScrollView>

      {/* 8. BOTTOM PINNED BUTTONS */}
      <View style={styles.bottomBar}>
        {needsAcceptance ? (
          <>
            <TouchableOpacity
              style={[styles.primaryActionBtn, { opacity: processing ? 0.7 : 1 }]}
              onPress={handleAccept}
              disabled={processing}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryActionBtnText}>
                {processing ? 'Processing...' : 'Accept Request'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryActionBtn, { borderColor: '#DC2626', opacity: processing ? 0.7 : 1 }]}
              onPress={handleReject}
              disabled={processing}
              activeOpacity={0.85}
            >
              <Text style={[styles.secondaryActionBtnText, { color: '#DC2626' }]}>Reject</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {!isRecipient && person.status !== 'COMPLETED' ? (
              <TouchableOpacity
                style={styles.primaryActionBtn}
                onPress={handleUpdateStatus}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryActionBtnText}>Mark Complete</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.completedBadgeBtn}>
                <Ionicons name="checkmark-circle" size={18} color="#15803D" style={{ marginRight: 6 }} />
                <Text style={styles.completedBadgeBtnText}>Completed</Text>
              </View>
            )}

            {!isRecipient && person.status !== 'COMPLETED' && person.status !== 'ACCEPTED' && (
              <TouchableOpacity
                style={styles.secondaryActionBtn}
                onPress={() => navigation.navigate('EditLenderRecord', { id: person.id || (person as any)._id || '' })}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryActionBtnText}>Edit</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* CONFIRMATION MODAL */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="warning" size={32} color={modalConfig.confirmColor} />
            </View>
            <Text style={styles.modalTitle}>{modalConfig.title}</Text>
            <Text style={styles.modalMessage}>{modalConfig.message}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: modalConfig.confirmColor }]}
                onPress={modalConfig.onConfirm}
                activeOpacity={0.85}
              >
                <Text style={styles.modalConfirmText}>{modalConfig.confirmText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  profileSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
    }),
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
  },
  profileTextCol: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
  },
  profilePhone: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  profileUserId: {
    fontSize: 11,
    color: '#056B38',
    fontWeight: '600',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: { boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
    }),
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  infoRowLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  infoRowValue: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '700',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#056B38',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#056B38',
  },
  screenshotImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    resizeMode: 'contain',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
  },
  calcTileBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  calcTileIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calcTileTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  calcTileSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  primaryActionBtn: {
    flex: 1,
    backgroundColor: '#056B38',
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#056B38',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 3px 10px rgba(5, 107, 56, 0.2)',
      },
    }),
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  completedBadgeBtn: {
    flex: 1,
    backgroundColor: '#DCFCE7',
    borderRadius: 14,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedBadgeBtnText: {
    color: '#15803D',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#056B38',
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryActionBtnText: {
    color: '#056B38',
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
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
      web: { boxShadow: '0 8px 30px rgba(0,0,0,0.12)' },
    }),
  },
  modalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
