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
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MainStackParamList } from '../types/navigation';
import { LenderRecord } from '../types/lenderRecord';
import { lenderRecordService } from '../services/lenderRecordService';
import { Loading } from '../components/Loading';
import { ErrorMessage } from '../components/ErrorMessage';
import { CustomAlertModal, AlertType } from '../components/CustomAlertModal';
import { formatCurrency } from '../utils/currency';
import { sharePaymentScreenshot } from '../utils/shareUtils';
import { getUser } from '../storage/storage';
import { User } from '../types/user';

type LenderRecordDetailsNavigationProp = NativeStackNavigationProp<MainStackParamList, 'LenderRecordDetails'>;
type LenderRecordDetailsRouteProp = RouteProp<MainStackParamList, 'LenderRecordDetails'>;

interface Props {
  navigation: LenderRecordDetailsNavigationProp;
  route: LenderRecordDetailsRouteProp;
}

const cleanNotes = (notes?: string) => {
  if (!notes) return '';
  return notes.replace(/_{1,2}SENDER_{1,2}=[^_\n]+_{1,2}\n?/g, '').trim();
};

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

  // Partial Return Modal state
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [returnAmount, setReturnAmount] = useState('');
  const [returnDate, setReturnDate] = useState<Date>(new Date());
  const [showReturnDatePicker, setShowReturnDatePicker] = useState(false);
  const [returnNotes, setReturnNotes] = useState('');
  const [returnProof, setReturnProof] = useState<string | null>(null);
  const [submittingReturn, setSubmittingReturn] = useState(false);

  // Full Image Proof Viewer Modal
  const [fullImageUri, setFullImageUri] = useState<string | null>(null);

  // In-app Alert Modal
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    type: AlertType;
    title: string;
    message: string;
    onClose?: () => void;
  }>({
    type: 'info',
    title: '',
    message: '',
  });

  const showAlert = (config: {
    type?: AlertType;
    title: string;
    message: string;
    onClose?: () => void;
  }) => {
    setAlertConfig({
      type: config.type || 'info',
      title: config.title,
      message: config.message,
      onClose: config.onClose,
    });
    setAlertModalVisible(true);
  };

  const toISODate = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatRepaymentDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const pickProofImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setReturnProof(result.assets[0].uri);
      }
    } catch {
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Unable to pick screenshot.',
      });
    }
  };

  const fetchPerson = async () => {
    try {
      setError('');
      const [data, user] = await Promise.all([
        lenderRecordService.getLenderRecordById(id),
        getUser(),
      ]);
      setPerson(data);
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
      showAlert({
        type: 'error',
        title: 'Delete Failed',
        message: err.response?.data?.message || 'Failed to delete record.',
      });
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
      showAlert({
        type: 'error',
        title: 'Update Failed',
        message: err.response?.data?.message || 'Failed to update record.',
      });
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
      showAlert({
        type: 'success',
        title: 'Accepted',
        message: 'Request accepted successfully',
      });
      fetchPerson();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to accept request';
      showAlert({
        type: 'error',
        title: 'Error',
        message: msg,
      });
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
          showAlert({
            type: 'info',
            title: 'Rejected',
            message: 'Request rejected',
          });
          fetchPerson();
        } catch (err: any) {
          const msg = err.response?.data?.message || 'Failed to reject request';
          showAlert({
            type: 'error',
            title: 'Error',
            message: msg,
          });
        } finally {
          setProcessing(false);
        }
      },
    });
    setModalVisible(true);
  };

  const handleDeleteRepayment = (repaymentId: number | string) => {
    setModalConfig({
      title: 'Delete Return Entry',
      message: 'Are you sure you want to remove this partial repayment entry?',
      confirmText: 'Delete',
      confirmColor: '#DC2626',
      onConfirm: async () => {
        setModalVisible(false);
        try {
          await lenderRecordService.deleteRepayment(id, repaymentId);
          await fetchPerson();
          showAlert({
            type: 'success',
            title: 'Entry Removed',
            message: 'Repayment entry deleted successfully.',
          });
        } catch (err: any) {
          showAlert({
            type: 'error',
            title: 'Delete Failed',
            message: err.response?.data?.message || 'Failed to delete return entry.',
          });
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

  const isSender =
    (currentUser?.id != null && person?.ownerId != null && String(currentUser.id) === String(person.ownerId)) ||
    (currentUser?.userId && (person as any)?.owner?.userId && currentUser.userId.trim().toUpperCase() === (person as any).owner.userId.trim().toUpperCase());

  const isTargetUser =
    Boolean(currentUser?.userId &&
    ((person?.targetUserId && currentUser.userId.trim().toUpperCase() === person.targetUserId.trim().toUpperCase()) ||
     ((person as any)?.targetUser?.userId && currentUser.userId.trim().toUpperCase() === (person as any).targetUser.userId.trim().toUpperCase())));

  const isRecipient = isTargetUser || !isSender;
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
  const totalReturnedFromHistory = (person.repayments || []).reduce(
    (sum, r) => sum + Number(r.amount || 0),
    0
  );
  const paidAmount = isCompleted
    ? Math.max(totalReturnedFromHistory, calcResult.total)
    : totalReturnedFromHistory;
  const remainingAmount = isCompleted
    ? 0
    : Math.max(0, calcResult.total - paidAmount);
  const progressPercent = isCompleted
    ? 100
    : calcResult.total > 0
    ? Math.min(100, Math.round((paidAmount / calcResult.total) * 100))
    : 0;

  const handleRecordReturn = async () => {
    const amt = parseFloat(returnAmount);
    if (!returnAmount || isNaN(amt) || amt <= 0) {
      showAlert({
        type: 'warning',
        title: 'Invalid Amount',
        message: 'Please enter a valid return amount greater than 0.',
      });
      return;
    }

    if (amt > remainingAmount + 0.01) {
      showAlert({
        type: 'warning',
        title: 'Amount Exceeds Balance',
        message: `Return amount cannot exceed remaining balance of ${formatCurrency(remainingAmount)}.`,
      });
      return;
    }

    try {
      setSubmittingReturn(true);
      const formData = new FormData();
      formData.append('amount', returnAmount.trim());
      formData.append('returnDate', toISODate(returnDate));
      if (returnNotes.trim()) {
        formData.append('notes', returnNotes.trim());
      }

      if (returnProof) {
        if (Platform.OS === 'web') {
          const response = await fetch(returnProof);
          const blob = await response.blob();
          formData.append('paymentScreenshot', blob, 'lender_return_proof.jpg');
        } else {
          const filename = returnProof.split('/').pop() || 'lender_return_proof.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          formData.append('paymentScreenshot', {
            uri: returnProof,
            name: filename,
            type,
          } as any);
        }
      }

      await lenderRecordService.addRepayment(id, formData);
      setReturnModalVisible(false);
      setReturnAmount('');
      setReturnNotes('');
      setReturnProof(null);
      await fetchPerson();
      showAlert({
        type: 'success',
        title: 'Return Recorded',
        message: 'Partial return payment stored successfully!',
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to record return payment.';
      showAlert({
        type: 'error',
        title: 'Error',
        message: msg,
      });
    } finally {
      setSubmittingReturn(false);
    }
  };

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
              {person.status === 'ACCEPTED' ? 'Accepted' : person.status}
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

        {/* 4. CARD: PERSONAL DETAILS */}
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

          {!!cleanNotes(person.notes) && (
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.infoRowLabel}>Notes</Text>
              <Text style={[styles.infoRowValue, { flex: 1, textAlign: 'right' }]}>{cleanNotes(person.notes)}</Text>
            </View>
          )}
        </View>

        {/* 5. CARD: PAYMENT SCREENSHOT (if available) */}
        {!!person.paymentScreenshot && (
          <View style={styles.infoCard}>
            <View style={styles.screenshotHeaderRow}>
              <Text style={[styles.cardHeaderTitle, { marginBottom: 0 }]}>Payment Screenshot</Text>
              <TouchableOpacity
                style={styles.shareScreenshotBtn}
                onPress={() => sharePaymentScreenshot(person.paymentScreenshot!, person.name)}
                activeOpacity={0.7}
              >
                <Ionicons name="share-social-outline" size={15} color="#056B38" style={{ marginRight: 4 }} />
                <Text style={styles.shareScreenshotBtnText}>Share</Text>
              </TouchableOpacity>
            </View>
            <Image source={{ uri: person.paymentScreenshot }} style={styles.screenshotImage} />
            <TouchableOpacity
              style={styles.shareScreenshotFullBtn}
              onPress={() => sharePaymentScreenshot(person.paymentScreenshot!, person.name)}
              activeOpacity={0.8}
            >
              <Ionicons name="share-social" size={16} color="#056B38" style={{ marginRight: 6 }} />
              <Text style={styles.shareScreenshotFullBtnText}>Share Screenshot</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 6. INTEREST CALCULATOR TILE */}
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

        {/* 7. CARD: PAYMENT SUMMARY */}
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

          {/* Record Partial Return Button (Owner only, when balance remains) */}
          {!isRecipient && !isCompleted && person.status !== 'REJECTED' && remainingAmount > 0 && (
            <TouchableOpacity
              style={styles.recordReturnBtn}
              onPress={() => {
                setReturnAmount('');
                setReturnDate(new Date());
                setReturnNotes('');
                setReturnProof(null);
                setReturnModalVisible(true);
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle" size={19} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.recordReturnBtnText}>Record Partial Return</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 8. CARD: RETURN HISTORY */}
        <View style={styles.infoCard}>
          <View style={styles.returnHistoryHeaderRow}>
            <Text style={[styles.cardHeaderTitle, { marginBottom: 0 }]}>Return History</Text>
            {person.repayments && person.repayments.length > 0 && (
              <View style={styles.returnCountBadge}>
                <Text style={styles.returnCountBadgeText}>
                  {person.repayments.length} {person.repayments.length === 1 ? 'payment' : 'payments'}
                </Text>
              </View>
            )}
          </View>

          {person.repayments && person.repayments.length > 0 ? (
            person.repayments.map((rep, idx) => (
              <View
                key={String(rep.id)}
                style={[
                  styles.repaymentRow,
                  idx === (person.repayments?.length || 1) - 1 && { borderBottomWidth: 0, paddingBottom: 2 },
                ]}
              >
                <View style={styles.repIconCircle}>
                  <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                </View>

                <View style={styles.repDetailsCol}>
                  <Text style={styles.repAmountText}>{formatCurrency(Number(rep.amount))}</Text>
                  <View style={styles.repDateRow}>
                    <Ionicons name="calendar-outline" size={12} color="#64748B" style={{ marginRight: 4 }} />
                    <Text style={styles.repDateText}>{formatRepaymentDate(rep.returnDate)}</Text>
                  </View>
                  {!!rep.notes && <Text style={styles.repNotesText}>{rep.notes}</Text>}
                </View>

                {!!rep.paymentScreenshot && (
                  <TouchableOpacity
                    style={styles.repProofBtn}
                    onPress={() => setFullImageUri(rep.paymentScreenshot || null)}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="image-outline" size={16} color="#056B38" />
                    <Text style={styles.repProofBtnText}>Proof</Text>
                  </TouchableOpacity>
                )}

                {!isRecipient && (
                  <TouchableOpacity
                    style={styles.repDeleteBtn}
                    onPress={() => handleDeleteRepayment(rep.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={17} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyRepaymentsBox}>
              <Ionicons name="receipt-outline" size={26} color="#CBD5E1" />
              <Text style={styles.emptyRepaymentsText}>No partial returns recorded yet.</Text>
            </View>
          )}
        </View>
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
        ) : person.status === 'REJECTED' ? (
          <View style={styles.rejectedBadgeBtn}>
            <Ionicons name="close-circle" size={18} color="#DC2626" style={{ marginRight: 6 }} />
            <Text style={styles.rejectedBadgeBtnText}>Rejected</Text>
          </View>
        ) : person.status === 'COMPLETED' ? (
          <View style={styles.completedBadgeBtn}>
            <Ionicons name="checkmark-circle" size={18} color="#15803D" style={{ marginRight: 6 }} />
            <Text style={styles.completedBadgeBtnText}>Completed</Text>
          </View>
        ) : person.status === 'ACCEPTED' ? (
          !isRecipient ? (
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
              <Text style={styles.completedBadgeBtnText}>Accepted</Text>
            </View>
          )
        ) : (
          !isRecipient ? (
            <>
              <TouchableOpacity
                style={styles.primaryActionBtn}
                onPress={handleUpdateStatus}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryActionBtnText}>Mark Complete</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionBtn}
                onPress={() => navigation.navigate('EditLenderRecord', { id: person.id || (person as any)._id || '' })}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryActionBtnText}>Edit</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.completedBadgeBtn}>
              <Ionicons name="checkmark-circle" size={18} color="#15803D" style={{ marginRight: 6 }} />
              <Text style={styles.completedBadgeBtnText}>Accepted</Text>
            </View>
          )
        )}
      </View>

      {/* RECORD PARTIAL RETURN MODAL */}
      <Modal
        visible={returnModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReturnModalVisible(false)}
      >
        <View style={styles.returnModalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setReturnModalVisible(false)}
          />
          <View style={styles.returnModalCard}>
            <View style={styles.returnModalHandle} />
            <Text style={styles.returnModalTitle}>Record Partial Return</Text>
            <Text style={styles.returnModalSubtitle}>
              Remaining balance: {formatCurrency(remainingAmount)}
            </Text>

            {/* Return Amount Input */}
            <View style={styles.returnInputGroup}>
              <Text style={styles.returnFieldLabel}>Return Amount (₹) *</Text>
              <View style={styles.returnInputBox}>
                <Text style={styles.rupeePrefix}>₹</Text>
                <TextInput
                  style={styles.returnTextInput}
                  placeholder={`Max ${remainingAmount.toFixed(2)}`}
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={returnAmount}
                  onChangeText={setReturnAmount}
                />
              </View>
            </View>

            {/* Return Date */}
            <View style={styles.returnInputGroup}>
              <Text style={styles.returnFieldLabel}>Return Date *</Text>
              {Platform.OS === 'web' ? (
                React.createElement('input', {
                  type: 'date',
                  value: toISODate(returnDate),
                  max: toISODate(new Date()),
                  onChange: (e: any) => {
                    if (e.target.value) {
                      const parts = e.target.value.split('-');
                      if (parts.length === 3) {
                        const newDate = new Date(
                          parseInt(parts[0], 10),
                          parseInt(parts[1], 10) - 1,
                          parseInt(parts[2], 10)
                        );
                        if (!isNaN(newDate.getTime())) setReturnDate(newDate);
                      }
                    }
                  },
                  style: {
                    height: 48,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderStyle: 'solid',
                    borderColor: '#E2E8F0',
                    backgroundColor: '#F8FAFC',
                    paddingLeft: 12,
                    paddingRight: 12,
                    fontSize: 14,
                    fontWeight: '600',
                    color: '#0F172A',
                    outlineStyle: 'none',
                    width: '100%',
                    boxSizing: 'border-box',
                  },
                })
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.returnDateBtn}
                    onPress={() => setShowReturnDatePicker(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="calendar-outline" size={18} color="#056B38" style={{ marginRight: 8 }} />
                    <Text style={styles.returnDateText}>{formatRepaymentDate(toISODate(returnDate))}</Text>
                  </TouchableOpacity>
                  {showReturnDatePicker && (
                    <DateTimePicker
                      value={returnDate}
                      mode="date"
                      display="default"
                      maximumDate={new Date()}
                      onChange={(_, selDate) => {
                        setShowReturnDatePicker(Platform.OS === 'ios');
                        if (selDate) setReturnDate(selDate);
                      }}
                    />
                  )}
                </>
              )}
            </View>

            {/* Notes (Optional) */}
            <View style={styles.returnInputGroup}>
              <Text style={styles.returnFieldLabel}>Notes (Optional)</Text>
              <View style={[styles.returnInputBox, { height: 64, alignItems: 'flex-start', paddingVertical: 8 }]}>
                <TextInput
                  style={[styles.returnTextInput, { textAlignVertical: 'top' }]}
                  placeholder="GPay, PhonePe, cash, etc."
                  placeholderTextColor="#94A3B8"
                  multiline
                  value={returnNotes}
                  onChangeText={setReturnNotes}
                />
              </View>
            </View>

            {/* Payment Screenshot Proof */}
            <View style={styles.returnInputGroup}>
              <Text style={styles.returnFieldLabel}>Payment Screenshot Proof</Text>
              {returnProof ? (
                <View style={styles.proofThumbRow}>
                  <Image source={{ uri: returnProof }} style={styles.proofThumb} />
                  <View style={styles.proofThumbActions}>
                    <TouchableOpacity style={styles.proofChangeBtn} onPress={pickProofImage} activeOpacity={0.75}>
                      <Ionicons name="camera-outline" size={14} color="#056B38" style={{ marginRight: 4 }} />
                      <Text style={styles.proofChangeBtnText}>Change</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.proofRemoveBtn}
                      onPress={() => setReturnProof(null)}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="trash-outline" size={14} color="#DC2626" style={{ marginRight: 4 }} />
                      <Text style={styles.proofRemoveBtnText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={styles.returnAttachBtn} onPress={pickProofImage} activeOpacity={0.75}>
                  <Ionicons name="camera-outline" size={18} color="#056B38" style={{ marginRight: 6 }} />
                  <Text style={styles.returnAttachText}>Attach Receipt / UPI Screenshot</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.returnModalActions}>
              <TouchableOpacity
                style={styles.returnModalCancelBtn}
                onPress={() => setReturnModalVisible(false)}
                activeOpacity={0.75}
              >
                <Text style={styles.returnModalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.returnModalSubmitBtn, submittingReturn && { opacity: 0.6 }]}
                onPress={handleRecordReturn}
                disabled={submittingReturn}
                activeOpacity={0.85}
              >
                {submittingReturn ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.returnModalSubmitText}>Save Return</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* FULL IMAGE PROOF VIEWER MODAL */}
      <Modal visible={!!fullImageUri} transparent animationType="fade" onRequestClose={() => setFullImageUri(null)}>
        <View style={styles.fullImageModal}>
          <TouchableOpacity style={styles.fullImageCloseBtn} onPress={() => setFullImageUri(null)}>
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </TouchableOpacity>
          {!!fullImageUri && (
            <>
              <Image source={{ uri: fullImageUri }} style={styles.fullImageView} resizeMode="contain" />
              <TouchableOpacity
                style={styles.fullImageShareBtn}
                onPress={() => sharePaymentScreenshot(fullImageUri, `${person.name}_return`)}
                activeOpacity={0.85}
              >
                <Ionicons name="share-social" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.fullImageShareBtnText}>Share Screenshot</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>

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

      {/* IN-APP ALERT MODAL */}
      <CustomAlertModal
        visible={alertModalVisible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => {
          setAlertModalVisible(false);
          if (alertConfig.onClose) {
            alertConfig.onClose();
          }
        }}
      />
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
  recordReturnBtn: {
    marginTop: 14,
    backgroundColor: '#056B38',
    borderRadius: 12,
    height: 44,
    flexDirection: 'row',
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
        elevation: 2,
      },
      web: {
        boxShadow: '0 3px 10px rgba(5, 107, 56, 0.2)',
        cursor: 'pointer',
      },
    }),
  },
  recordReturnBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  returnHistoryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  returnCountBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  returnCountBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#056B38',
  },
  repaymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  repIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  repDetailsCol: {
    flex: 1,
  },
  repAmountText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  repDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  repDateText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  repNotesText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 3,
  },
  repProofBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  repProofBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#056B38',
  },
  repDeleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyRepaymentsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  emptyRepaymentsText: {
    fontSize: 12.5,
    color: '#94A3B8',
    fontWeight: '500',
  },
  returnModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  returnModalCard: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 20,
    ...Platform.select({
      web: { boxShadow: '0 -8px 30px rgba(0,0,0,0.18)' },
    }),
  },
  returnModalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 14,
  },
  returnModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  returnModalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  returnInputGroup: {
    marginBottom: 14,
  },
  returnFieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  returnInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    height: 48,
  },
  rupeePrefix: {
    fontSize: 16,
    fontWeight: '800',
    color: '#056B38',
    marginRight: 8,
  },
  returnTextInput: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '600',
    color: '#0F172A',
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },
  returnDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    height: 48,
  },
  returnDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  returnAttachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#056B38',
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  returnAttachText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#056B38',
  },
  proofThumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 8,
  },
  proofThumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  proofThumbActions: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  proofChangeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    paddingVertical: 8,
  },
  proofChangeBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#056B38',
  },
  proofRemoveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    paddingVertical: 8,
  },
  proofRemoveBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#DC2626',
  },
  returnModalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  returnModalCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  returnModalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  returnModalSubmitBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#056B38',
    justifyContent: 'center',
    alignItems: 'center',
  },
  returnModalSubmitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fullImageModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullImageCloseBtn: {
    position: 'absolute',
    top: 44,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  fullImageView: {
    width: '100%',
    height: '75%',
  },
  fullImageShareBtn: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#056B38',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  fullImageShareBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  screenshotHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  shareScreenshotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  shareScreenshotBtnText: {
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
  shareScreenshotFullBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 10,
  },
  shareScreenshotFullBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#056B38',
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
  rejectedBadgeBtn: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectedBadgeBtnText: {
    color: '#DC2626',
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
