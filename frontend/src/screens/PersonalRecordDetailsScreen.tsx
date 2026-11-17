import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Share,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MainStackParamList } from '../types/navigation';
import { personalRecordService } from '../services/personalRecordService';
import { PersonalRecord, PersonalRecordRepayment } from '../types/personalRecord';
import { formatCurrency } from '../utils/currency';
import { CustomAlertModal, AlertType } from '../components/CustomAlertModal';

type PersonalRecordDetailsNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'PersonalRecordDetails'
>;
type PersonalRecordDetailsRouteProp = RouteProp<MainStackParamList, 'PersonalRecordDetails'>;

interface Props {
  navigation: PersonalRecordDetailsNavigationProp;
  route: PersonalRecordDetailsRouteProp;
}

export const PersonalRecordDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { id } = route.params;

  const [record, setRecord] = useState<PersonalRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 3-dots Menu modal
  const [menuVisible, setMenuVisible] = useState(false);

  // Return Repayment modal
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [returnAmount, setReturnAmount] = useState('');
  const [returnDate, setReturnDate] = useState<Date>(new Date());
  const [showReturnDatePicker, setShowReturnDatePicker] = useState(false);
  const [returnNotes, setReturnNotes] = useState('');
  const [returnProof, setReturnProof] = useState<string | null>(null);
  const [submittingReturn, setSubmittingReturn] = useState(false);

  // Full Image Modal
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

  // In-app Confirmation Modal
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    title: string;
    message: string;
    confirmText: string;
    confirmColor: string;
    onConfirm: () => void;
  }>({
    title: 'Delete Record',
    message: 'Are you sure you want to delete this personal record? All return history will be removed.',
    confirmText: 'Delete',
    confirmColor: '#DC2626',
    onConfirm: () => {},
  });

  const fetchRecordDetails = useCallback(async () => {
    try {
      setError('');
      const data = await personalRecordService.getPersonalRecordById(id);
      setRecord(data);
    } catch (err: any) {
      setError('Unable to load personal record details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRecordDetails();
  }, [fetchRecordDetails]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const day = d.getDate().toString().padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  const toISODate = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
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

    const remaining = parseFloat(String(record?.remainingAmount || 0));
    if (amt > remaining) {
      showAlert({
        type: 'warning',
        title: 'Amount Exceeds Balance',
        message: `Return amount cannot exceed remaining balance of ${formatCurrency(remaining)}.`,
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
          formData.append('paymentScreenshot', blob, 'return_proof.jpg');
        } else {
          const filename = returnProof.split('/').pop() || 'return_proof.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          formData.append('paymentScreenshot', {
            uri: returnProof,
            name: filename,
            type,
          } as any);
        }
      }

      await personalRecordService.addRepayment(id, formData);
      setReturnModalVisible(false);
      setReturnAmount('');
      setReturnNotes('');
      setReturnProof(null);
      await fetchRecordDetails();
      showAlert({
        type: 'success',
        title: 'Return Recorded',
        message: 'Return payment recorded successfully!',
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to record return.';
      showAlert({
        type: 'error',
        title: 'Error',
        message: msg,
      });
    } finally {
      setSubmittingReturn(false);
    }
  };

  const executeDeleteRecord = async () => {
    try {
      setDeleting(true);
      await personalRecordService.deletePersonalRecord(id);
      setConfirmModalVisible(false);
      navigation.goBack();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete record.';
      showAlert({
        type: 'error',
        title: 'Delete Failed',
        message: msg,
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteRecord = () => {
    setMenuVisible(false);
    setConfirmModalConfig({
      title: 'Delete Record',
      message: 'Are you sure you want to delete this personal record? All return history will be removed.',
      confirmText: 'Delete',
      confirmColor: '#DC2626',
      onConfirm: executeDeleteRecord,
    });
    setConfirmModalVisible(true);
  };

  const handleDeleteRepayment = (repaymentId: string | number) => {
    const executeDeleteRep = async () => {
      try {
        setDeleting(true);
        await personalRecordService.deleteRepayment(id, repaymentId);
        setConfirmModalVisible(false);
        fetchRecordDetails();
      } catch (err: any) {
        const msg = err.response?.data?.message || 'Failed to delete return entry.';
        showAlert({
          type: 'error',
          title: 'Delete Failed',
          message: msg,
        });
      } finally {
        setDeleting(false);
      }
    };

    setConfirmModalConfig({
      title: 'Delete Return Entry',
      message: 'Are you sure you want to remove this repayment entry?',
      confirmText: 'Delete',
      confirmColor: '#DC2626',
      onConfirm: executeDeleteRep,
    });
    setConfirmModalVisible(true);
  };

  const handleShareDetails = async () => {
    if (!record) return;
    try {
      const message = `DhanaMitra Personal Record:
Name: ${record.name} (${record.relationship})
Amount Given: ${formatCurrency(Number(record.amount))}
Date: ${formatDate(record.givenDate)}
${record.recordType === 'INTEREST_FREE' ? `Total Returned: ${formatCurrency(Number(record.totalReturned))}\nRemaining: ${formatCurrency(Number(record.remainingAmount))}\nStatus: ${record.status}` : 'Type: Gift / Financial Help'}
Tracked securely on DhanaMitra.`;
      await Share.share({ message });
    } catch {
      // share cancelled
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
        <StatusBar style="light" />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading record details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !record) {
    return (
      <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
        <StatusBar style="light" />
        <View style={styles.topAppBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Personal Record</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerBox}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error || 'Record not found'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchRecordDetails}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isGift = record.recordType === 'GIFT';
  const principal = parseFloat(String(record.amount)) || 0;
  const returned = parseFloat(String(record.totalReturned)) || 0;
  const remaining = parseFloat(String(record.remainingAmount)) || 0;
  const percentReturned = principal > 0 ? Math.min(100, Math.round((returned / principal) * 100)) : 0;

  const initialLetter = (record.name || 'P').charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />

      {/* TOP APP BAR */}
      <View style={styles.topAppBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>Personal Record Details</Text>
          <Text style={styles.headerSubtitle}>మన లెక్క</Text>
        </View>

        <TouchableOpacity
          style={styles.menuDotsBtn}
          onPress={() => setMenuVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-vertical" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. PERSON HERO CARD */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarLetter}>{initialLetter}</Text>
            </View>

            <View style={styles.heroDetailsCol}>
              <View style={styles.nameBadgeRow}>
                <Text style={styles.personNameText} numberOfLines={1}>
                  {record.name}
                </Text>
                <View
                  style={[
                    styles.typeBadge,
                    isGift ? styles.typeBadgeGift : styles.typeBadgeLoan,
                  ]}
                >
                  <Text
                    style={[
                      styles.typeBadgeText,
                      isGift ? styles.typeBadgeTextGift : styles.typeBadgeTextLoan,
                    ]}
                  >
                    {isGift ? 'Gift / Help' : 'Interest-Free'}
                  </Text>
                </View>
              </View>

              <View style={styles.relRow}>
                <Ionicons name="people-outline" size={14} color="#64748B" style={{ marginRight: 4 }} />
                <Text style={styles.relText}>{record.relationship || 'Friend'}</Text>
              </View>

              <View style={styles.dateGivenRow}>
                <Ionicons name="calendar-outline" size={13} color="#64748B" style={{ marginRight: 4 }} />
                <Text style={styles.dateGivenText}>Given on {formatDate(record.givenDate)}</Text>
              </View>

              {!!record.phoneNumber && (
                <TouchableOpacity
                  style={styles.phoneActionRow}
                  onPress={() => Linking.openURL(`tel:${record.phoneNumber}`)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="call" size={12} color="#056B38" style={{ marginRight: 4 }} />
                  <Text style={styles.phoneActionText}>{record.phoneNumber}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Payment Proof Preview Button if screenshot was uploaded */}
          {!!record.paymentScreenshot && (
            <TouchableOpacity
              style={styles.proofPillBtn}
              onPress={() => setFullImageUri(record.paymentScreenshot || null)}
              activeOpacity={0.8}
            >
              <Ionicons name="receipt-outline" size={16} color="#056B38" style={{ marginRight: 6 }} />
              <Text style={styles.proofPillText}>View Payment Proof Screenshot</Text>
              <Ionicons name="chevron-forward" size={14} color="#056B38" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          )}

          {!!record.notes && (
            <View style={styles.notesBox}>
              <Ionicons name="document-text-outline" size={14} color="#64748B" style={{ marginRight: 6 }} />
              <Text style={styles.notesText}>{record.notes}</Text>
            </View>
          )}
        </View>

        {/* 2. STATS & REPAYMENTS (for Interest-Free Loans) */}
        {!isGift ? (
          <>
            {/* 3-Column Amount Card */}
            <View style={styles.statsCard}>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Amount Given</Text>
                <Text style={styles.statValuePrincipal}>{formatCurrency(principal)}</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Returned</Text>
                <Text style={styles.statValueReturned}>{formatCurrency(returned)}</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Remaining</Text>
                <Text style={styles.statValueRemaining}>{formatCurrency(remaining)}</Text>
              </View>
            </View>

            {/* Progress Bar Card */}
            <View style={styles.progressCard}>
              <View style={styles.progressHeaderRow}>
                <Text style={styles.progressHeaderText}>Returned {percentReturned}%</Text>
                <Text style={styles.progressPercentText}>{percentReturned}%</Text>
              </View>

              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${percentReturned}%` }]} />
              </View>
            </View>

            {/* Status Row Card */}
            <View style={styles.statusRowCard}>
              <Text style={styles.statusRowLabel}>Status</Text>
              <View
                style={[
                  styles.statusBadge,
                  record.status === 'FULLY_RETURNED'
                    ? styles.statusBadgeFull
                    : record.status === 'PARTIALLY_RETURNED'
                    ? styles.statusBadgePartial
                    : styles.statusBadgePending,
                ]}
              >
                <Ionicons
                  name={
                    record.status === 'FULLY_RETURNED'
                      ? 'checkmark-circle'
                      : 'time-outline'
                  }
                  size={14}
                  color={
                    record.status === 'FULLY_RETURNED'
                      ? '#15803D'
                      : record.status === 'PARTIALLY_RETURNED'
                      ? '#056B38'
                      : '#B45309'
                  }
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    record.status === 'FULLY_RETURNED'
                      ? styles.statusBadgeTextFull
                      : record.status === 'PARTIALLY_RETURNED'
                      ? styles.statusBadgeTextPartial
                      : styles.statusBadgeTextPending,
                  ]}
                >
                  {record.status === 'FULLY_RETURNED'
                    ? 'Fully Returned'
                    : record.status === 'PARTIALLY_RETURNED'
                    ? 'Partially Returned'
                    : 'Pending'}
                </Text>
              </View>
            </View>

            {/* RECORD RETURN BUTTON (Only when remaining > 0) */}
            {remaining > 0 && (
              <TouchableOpacity
                style={styles.recordReturnBtn}
                onPress={() => setReturnModalVisible(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="add-circle" size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.recordReturnBtnText}>+ Record Return</Text>
              </TouchableOpacity>
            )}

            {/* RETURN HISTORY LIST */}
            <View style={styles.historySection}>
              <Text style={styles.sectionHeading}>Return History</Text>

              {record.repayments && record.repayments.length > 0 ? (
                record.repayments.map((rep) => (
                  <View key={rep.id} style={styles.repaymentCard}>
                    <View style={styles.repIconCircle}>
                      <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                    </View>

                    <View style={styles.repDetailsCol}>
                      <Text style={styles.repAmountText}>{formatCurrency(Number(rep.amount))}</Text>
                      <Text style={styles.repDateText}>{formatDate(rep.returnDate)}</Text>
                      {!!rep.notes && <Text style={styles.repNotesText}>{rep.notes}</Text>}
                    </View>

                    {!!rep.paymentScreenshot && (
                      <TouchableOpacity
                        style={styles.repProofBtn}
                        onPress={() => setFullImageUri(rep.paymentScreenshot || null)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="image-outline" size={18} color="#056B38" />
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.repDeleteBtn}
                      onPress={() => handleDeleteRepayment(rep.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View style={styles.emptyRepaymentsBox}>
                  <Ionicons name="receipt-outline" size={32} color="#CBD5E1" />
                  <Text style={styles.emptyRepaymentsText}>No repayments recorded yet.</Text>
                </View>
              )}
            </View>

            {/* Bottom Info Pill */}
            <View style={styles.bottomInfoPill}>
              <Ionicons name="shield-checkmark" size={18} color="#056B38" style={{ marginRight: 8 }} />
              <Text style={styles.bottomInfoText}>
                This is an interest-free personal record. No interest is calculated on this amount.
              </Text>
            </View>
          </>
        ) : (
          /* GIFT DETAILS */
          <View style={styles.giftCard}>
            <View style={styles.giftHeaderRow}>
              <Ionicons name="gift" size={28} color="#7C3AED" style={{ marginRight: 10 }} />
              <View>
                <Text style={styles.giftTitle}>Gift / Financial Help</Text>
                <Text style={styles.giftDesc}>Given freely with no return expected.</Text>
              </View>
            </View>

            <View style={styles.giftAmountBox}>
              <Text style={styles.giftAmountLabel}>Amount</Text>
              <Text style={styles.giftAmountValue}>{formatCurrency(principal)}</Text>
            </View>

            <View style={styles.bottomInfoPill}>
              <Ionicons name="heart" size={18} color="#056B38" style={{ marginRight: 8 }} />
              <Text style={styles.bottomInfoText}>
                This amount was given as financial assistance or a gift to {record.name}. It does not calculate interest or require repayment.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 3-DOTS OPTIONS MODAL */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setMenuVisible(false)}
          />
          <View style={styles.menuModalCard}>
            <TouchableOpacity
              style={styles.menuModalRow}
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate('EditPersonalRecord', { id: String(id) });
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={20} color="#056B38" style={{ marginRight: 12 }} />
              <Text style={styles.menuModalText}>Edit Record</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuModalRow}
              onPress={() => {
                setMenuVisible(false);
                handleShareDetails();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="share-social-outline" size={20} color="#056B38" style={{ marginRight: 12 }} />
              <Text style={styles.menuModalText}>Share Record</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuModalRow, { borderBottomWidth: 0 }]}
              onPress={handleDeleteRecord}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={20} color="#DC2626" style={{ marginRight: 12 }} />
              <Text style={[styles.menuModalText, { color: '#DC2626' }]}>Delete Record</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* RECORD RETURN MODAL */}
      <Modal
        visible={returnModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReturnModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setReturnModalVisible(false)}
          />
          <View style={styles.returnModalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.returnModalTitle}>Record Return Payment</Text>
            <Text style={styles.returnModalSubtitle}>
              Remaining balance: {formatCurrency(remaining)}
            </Text>

            {/* Return Amount Input */}
            <View style={styles.modalInputGroup}>
              <Text style={styles.modalFieldLabel}>Return Amount (₹)</Text>
              <View style={styles.modalInputBox}>
                <Text style={styles.rupeePrefix}>₹</Text>
                <TextInput
                  style={[styles.modalTextInput, { outlineStyle: 'none' } as any]}
                  placeholder={`Max ${remaining}`}
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={returnAmount}
                  onChangeText={setReturnAmount}
                />
              </View>
            </View>

            {/* Return Date */}
            <View style={styles.modalInputGroup}>
              <Text style={styles.modalFieldLabel}>Return Date</Text>
              {Platform.OS === 'web' ? (
                React.createElement('input', {
                  type: 'date',
                  value: toISODate(returnDate),
                  max: toISODate(new Date()),
                  onChange: (e: any) => {
                    if (e.target.value) {
                      const parts = e.target.value.split('-');
                      if (parts.length === 3) {
                        const newDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                        if (!isNaN(newDate.getTime())) setReturnDate(newDate);
                      }
                    }
                  },
                  style: {
                    height: 48,
                    borderRadius: 12,
                    borderWidth: 1.5,
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
                    style={styles.modalDateBtn}
                    onPress={() => setShowReturnDatePicker(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="calendar-outline" size={18} color="#056B38" style={{ marginRight: 8 }} />
                    <Text style={styles.modalDateText}>{formatDate(toISODate(returnDate))}</Text>
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

            {/* Notes */}
            <View style={styles.modalInputGroup}>
              <Text style={styles.modalFieldLabel}>Notes (Optional)</Text>
              <View style={[styles.modalInputBox, { height: 65, alignItems: 'flex-start', paddingVertical: 6 }]}>
                <TextInput
                  style={[styles.modalTextInput, { textAlignVertical: 'top', outlineStyle: 'none' } as any]}
                  placeholder="GPay, PhonePe, cash, etc."
                  placeholderTextColor="#94A3B8"
                  value={returnNotes}
                  onChangeText={setReturnNotes}
                />
              </View>
            </View>

            {/* Optional Proof Screenshot */}
            <View style={styles.modalInputGroup}>
              <Text style={styles.modalFieldLabel}>Proof Screenshot (Optional)</Text>
              {returnProof ? (
                <View style={styles.proofThumbRow}>
                  <Image source={{ uri: returnProof }} style={styles.proofThumb} />
                  <TouchableOpacity onPress={() => setReturnProof(null)} style={{ padding: 4 }}>
                    <Ionicons name="close-circle" size={20} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.modalAttachBtn} onPress={pickProofImage} activeOpacity={0.7}>
                  <Ionicons name="camera-outline" size={18} color="#056B38" style={{ marginRight: 6 }} />
                  <Text style={styles.modalAttachText}>Attach Receipt / UPI Screenshot</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setReturnModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, submittingReturn && { opacity: 0.6 }]}
                onPress={handleRecordReturn}
                disabled={submittingReturn}
                activeOpacity={0.85}
              >
                {submittingReturn ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Confirm Return</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* FULL IMAGE PROOF MODAL */}
      <Modal visible={!!fullImageUri} transparent animationType="fade" onRequestClose={() => setFullImageUri(null)}>
        <View style={styles.fullImageModal}>
          <TouchableOpacity style={styles.fullImageCloseBtn} onPress={() => setFullImageUri(null)}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          {!!fullImageUri && (
            <Image source={{ uri: fullImageUri }} style={styles.fullImageView} resizeMode="contain" />
          )}
        </View>
      </Modal>

      {/* IN-APP CONFIRMATION MODAL */}
      <Modal
        visible={confirmModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !deleting && setConfirmModalVisible(false)}
      >
        <View style={styles.confirmModalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => !deleting && setConfirmModalVisible(false)}
          />
          <View style={styles.confirmModalCard}>
            <View style={[styles.confirmModalIconBox, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="trash" size={28} color={confirmModalConfig.confirmColor} />
            </View>
            <Text style={styles.confirmModalTitle}>{confirmModalConfig.title}</Text>
            <Text style={styles.confirmModalMessage}>{confirmModalConfig.message}</Text>
            <View style={styles.confirmModalActions}>
              <TouchableOpacity
                style={styles.confirmModalCancelBtn}
                onPress={() => setConfirmModalVisible(false)}
                disabled={deleting}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmModalConfirmBtn,
                  { backgroundColor: confirmModalConfig.confirmColor },
                  deleting && { opacity: 0.6 },
                ]}
                onPress={confirmModalConfig.onConfirm}
                disabled={deleting}
                activeOpacity={0.85}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmModalConfirmText}>
                    {confirmModalConfig.confirmText}
                  </Text>
                )}
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
    backgroundColor: '#044E28',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#056B38',
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  topAppBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#044E28',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  menuDotsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerTitleCol: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#A7F3D0',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#056B38',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarLetter: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroDetailsCol: {
    flex: 1,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  personNameText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeBadgeLoan: {
    backgroundColor: '#DCFCE7',
  },
  typeBadgeGift: {
    backgroundColor: '#F3E8FF',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  typeBadgeTextLoan: {
    color: '#15803D',
  },
  typeBadgeTextGift: {
    color: '#7E22CE',
  },
  relRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  relText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },
  dateGivenRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateGivenText: {
    fontSize: 12,
    color: '#64748B',
  },
  phoneActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  phoneActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#056B38',
  },
  proofPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  proofPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#056B38',
  },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
  },
  notesText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    alignItems: 'center',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 34,
    backgroundColor: '#E2E8F0',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  statValuePrincipal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  statValueReturned: {
    fontSize: 15,
    fontWeight: '800',
    color: '#16A34A',
  },
  statValueRemaining: {
    fontSize: 15,
    fontWeight: '800',
    color: '#EA580C',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressHeaderText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#15803D',
  },
  progressPercentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  statusRowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  statusRowLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeFull: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgePartial: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgePending: {
    backgroundColor: '#F1F5F9',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadgeTextFull: {
    color: '#15803D',
  },
  statusBadgeTextPartial: {
    color: '#B45309',
  },
  statusBadgeTextPending: {
    color: '#475569',
  },
  recordReturnBtn: {
    backgroundColor: '#056B38',
    borderRadius: 16,
    height: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#056B38',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 12px rgba(5, 107, 56, 0.25)',
      },
    }),
  },
  recordReturnBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  historySection: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  repaymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  repIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  repDetailsCol: {
    flex: 1,
  },
  repAmountText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  repDateText: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  repNotesText: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
    fontStyle: 'italic',
  },
  repProofBtn: {
    padding: 6,
    marginRight: 6,
  },
  repDeleteBtn: {
    padding: 6,
  },
  emptyRepaymentsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyRepaymentsText: {
    fontSize: 12.5,
    color: '#94A3B8',
    marginTop: 6,
  },
  bottomInfoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginTop: 6,
  },
  bottomInfoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D',
    lineHeight: 16,
  },
  giftCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  giftHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  giftTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  giftDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  giftAmountBox: {
    backgroundColor: '#F5F3FF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  giftAmountLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C3AED',
    marginBottom: 4,
  },
  giftAmountValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#6D28D9',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  menuModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 30,
  },
  menuModalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuModalText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  returnModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  returnModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  returnModalSubtitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#056B38',
    textAlign: 'center',
    marginTop: 3,
    marginBottom: 16,
  },
  modalInputGroup: {
    marginBottom: 14,
  },
  modalFieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  modalInputBox: {
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
    marginRight: 6,
  },
  modalTextInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    height: '100%',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
        borderWidth: 0,
      } as any,
    }),
  },
  modalDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    height: 48,
  },
  modalDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  modalAttachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#056B38',
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    paddingVertical: 10,
  },
  modalAttachText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#056B38',
  },
  proofThumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proofThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  modalCancelBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#475569',
  },
  modalSubmitBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#056B38',
  },
  modalSubmitBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  fullImageModal: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImageCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  fullImageView: {
    width: '100%',
    height: '80%',
  },
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
      },
    }),
  },
  confirmModalIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmModalMessage: {
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 22,
    lineHeight: 19,
  },
  confirmModalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmModalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmModalCancelText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
  confirmModalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmModalConfirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
