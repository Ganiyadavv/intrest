import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
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
import { MainStackParamList } from '../types/navigation';
import { notificationService } from '../services/notificationService';
import { requestService, resolveSenderInfo } from '../services/requestService';
import { Loading } from '../components/Loading';
import { ErrorMessage } from '../components/ErrorMessage';
import { formatCurrency } from '../utils/currency';
import { getUser } from '../storage/storage';

type IncomingRequestDetailsNavProp = NativeStackNavigationProp<MainStackParamList, 'IncomingRequestDetails'>;
type IncomingRequestDetailsRouteProp = RouteProp<MainStackParamList, 'IncomingRequestDetails'>;

interface Props {
  navigation: IncomingRequestDetailsNavProp;
  route: IncomingRequestDetailsRouteProp;
}

const formatInitials = (name?: string) => {
  if (!name) return 'SE';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.trim().substring(0, 2).toUpperCase();
};

const cleanNotes = (notes?: string) => {
  if (!notes) return '';
  return notes.replace(/_{1,2}SENDER_{1,2}=[^_\n]+_{1,2}\n?/g, '').trim();
};

export const IncomingRequestDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const {
    id,
    requestId,
    recordType,
    senderName: paramSenderName,
    senderUserId: paramSenderUserId,
  } = route.params || {};

  const [record, setRecord] = useState<any | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [resolvedSender, setResolvedSender] = useState<{ name: string; userId?: string }>({
    name: paramSenderName || '',
    userId: paramSenderUserId,
  });
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
    iconColor: '#15803D',
    iconBg: '#DCFCE7',
    showCancel: false,
    onConfirm: () => {},
  });

  const fetchDetails = async () => {
    try {
      setError('');
      const user = await getUser();
      setCurrentUser(user);

      let fetchedRecord: any = null;
      let notifObj: any = null;

      if (id) {
        // Fetched by notification ID
        fetchedRecord = await notificationService.getNotificationDetails(String(id));

        // Also fetch notification list to extract metadata if needed
        try {
          const notifs = await notificationService.getNotifications();
          if (Array.isArray(notifs)) {
            notifObj = notifs.find(
              (n: any) =>
                String(n.id) === String(id) ||
                (n.lenderRecordId && String(n.lenderRecordId) === String(fetchedRecord?.id)) ||
                (n.personRecordId && String(n.personRecordId) === String(fetchedRecord?.id))
            );
          }
        } catch (e) {
          console.log('Error fetching notification metadata', e);
        }
      } else if (recordType && requestId) {
        // Fetched by record type and request ID
        fetchedRecord = await requestService.getRequestDetails(recordType, requestId);
      } else {
        setError('Request parameters not provided');
        setLoading(false);
        return;
      }

      setRecord(fetchedRecord);

      // Resolve the actual sender name and user ID
      const senderInfo = await resolveSenderInfo(
        fetchedRecord,
        notifObj,
        user
      );

      // Prioritize explicit non-generic sender name
      const finalName =
        paramSenderName &&
        paramSenderName.toLowerCase() !== 'sender' &&
        paramSenderName.toLowerCase() !== 'user'
          ? paramSenderName
          : senderInfo.name && senderInfo.name.toLowerCase() !== 'sender'
          ? senderInfo.name
          : paramSenderName || senderInfo.name || 'Sender';

      const finalUserId = paramSenderUserId || senderInfo.userId;

      setResolvedSender({
        name: finalName,
        userId: finalUserId,
      });

    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch request details');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDetails();
    }, [id, requestId, recordType])
  );

  const senderName =
    resolvedSender.name ||
    paramSenderName ||
    record?.sender?.name ||
    record?.sender?.fullName ||
    record?.owner?.fullName ||
    'Sender';

  const senderUserId =
    resolvedSender.userId ||
    paramSenderUserId ||
    record?.sender?.userId ||
    record?.owner?.userId;

  const handleAccept = () => {
    const targetRecordId = record?.id || record?._id || requestId;
    const type = record?.recordType || recordType;
    if (!targetRecordId || !type) return;

    setModalConfig({
      title: 'Accept Request',
      message: `Are you sure you want to accept this request from ${senderName}?`,
      confirmText: 'Accept',
      confirmColor: '#056B38',
      iconName: 'checkmark-circle',
      iconColor: '#056B38',
      iconBg: '#DCFCE7',
      showCancel: true,
      onConfirm: async () => {
        setProcessing(true);
        try {
          await requestService.acceptRequest(type, targetRecordId);
          setModalConfig({
            title: 'Request Accepted!',
            message: 'Request accepted successfully!',
            confirmText: 'OK',
            confirmColor: '#056B38',
            iconName: 'checkmark-circle',
            iconColor: '#15803D',
            iconBg: '#DCFCE7',
            showCancel: false,
            onConfirm: () => {
              setModalVisible(false);
              fetchDetails();
            },
          });
          setModalVisible(true);
        } catch (err: any) {
          const msg = err.response?.data?.message || 'Failed to accept request';
          setModalConfig({
            title: 'Error',
            message: msg,
            confirmText: 'OK',
            confirmColor: '#DC2626',
            iconName: 'close-circle',
            iconColor: '#DC2626',
            iconBg: '#FEE2E2',
            showCancel: false,
            onConfirm: () => setModalVisible(false),
          });
          setModalVisible(true);
        } finally {
          setProcessing(false);
        }
      },
    });
    setModalVisible(true);
  };

  const handleReject = () => {
    const targetRecordId = record?.id || record?._id || requestId;
    const type = record?.recordType || recordType;
    if (!targetRecordId || !type) return;

    setModalConfig({
      title: 'Reject Request',
      message: 'Are you sure you want to reject this request? It will be archived in request history.',
      confirmText: 'Reject',
      confirmColor: '#DC2626',
      iconName: 'warning',
      iconColor: '#DC2626',
      iconBg: '#FEE2E2',
      showCancel: true,
      onConfirm: async () => {
        setProcessing(true);
        try {
          await requestService.rejectRequest(type, targetRecordId);
          setModalConfig({
            title: 'Request Rejected',
            message: 'The request has been rejected and archived.',
            confirmText: 'OK',
            confirmColor: '#64748B',
            iconName: 'close-circle',
            iconColor: '#DC2626',
            iconBg: '#FEE2E2',
            showCancel: false,
            onConfirm: () => {
              setModalVisible(false);
              fetchDetails();
            },
          });
          setModalVisible(true);
        } catch (err: any) {
          const msg = err.response?.data?.message || 'Failed to reject request';
          setModalConfig({
            title: 'Error',
            message: msg,
            confirmText: 'OK',
            confirmColor: '#DC2626',
            iconName: 'close-circle',
            iconColor: '#DC2626',
            iconBg: '#FEE2E2',
            showCancel: false,
            onConfirm: () => setModalVisible(false),
          });
          setModalVisible(true);
        } finally {
          setProcessing(false);
        }
      },
    });
    setModalVisible(true);
  };

  const handleMarkComplete = () => {
    const targetRecordId = record?.id || record?._id || requestId;
    const type = record?.recordType || recordType;
    if (!targetRecordId || !type) return;

    setModalConfig({
      title: 'Mark Complete',
      message: 'Are you sure you want to mark this request as COMPLETED?',
      confirmText: 'Mark Complete',
      confirmColor: '#056B38',
      iconName: 'checkmark-circle',
      iconColor: '#056B38',
      iconBg: '#DCFCE7',
      showCancel: true,
      onConfirm: async () => {
        setProcessing(true);
        try {
          await requestService.completeRequest(type, targetRecordId);
          setModalConfig({
            title: 'Request Completed',
            message: 'This request has been marked as completed.',
            confirmText: 'OK',
            confirmColor: '#056B38',
            iconName: 'checkmark-circle',
            iconColor: '#15803D',
            iconBg: '#DCFCE7',
            showCancel: false,
            onConfirm: () => {
              setModalVisible(false);
              fetchDetails();
            },
          });
          setModalVisible(true);
        } catch (err: any) {
          const msg = err.response?.data?.message || 'Failed to complete request';
          setModalConfig({
            title: 'Error',
            message: msg,
            confirmText: 'OK',
            confirmColor: '#DC2626',
            iconName: 'close-circle',
            iconColor: '#DC2626',
            iconBg: '#FEE2E2',
            showCancel: false,
            onConfirm: () => setModalVisible(false),
          });
          setModalVisible(true);
        } finally {
          setProcessing(false);
        }
      },
    });
    setModalVisible(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
        <StatusBar style="light" />
        <View style={styles.topAppBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.appBarTitle}>Incoming Request</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Loading />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !record) {
    return (
      <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
        <StatusBar style="light" />
        <View style={styles.topAppBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.appBarTitle}>Incoming Request</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ErrorMessage message={error || 'Request details not available'} />
        </View>
      </SafeAreaView>
    );
  }

  const initials = formatInitials(senderName);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
      case 'COMPLETED':
        return { bg: '#DCFCE7', text: '#15803D', label: status };
      case 'PENDING':
        return { bg: '#FEF3C7', text: '#D97706', label: 'PENDING' };
      case 'REJECTED':
        return { bg: '#FEE2E2', text: '#DC2626', label: 'REJECTED' };
      default:
        return { bg: '#F1F5F9', text: '#64748B', label: status || 'PENDING' };
    }
  };

  const statusInfo = getStatusStyle(record.status);
  const isSender =
    (currentUser?.id != null && record?.ownerId != null && String(currentUser.id) === String(record.ownerId)) ||
    (currentUser?.userId && record?.owner?.userId && currentUser.userId.trim().toUpperCase() === record.owner.userId.trim().toUpperCase());

  // Inverted role for receiver:
  // If sender created PERSON_RECORD (Borrower for sender), receiver received money -> Lender Record
  // If sender created LENDER_RECORD (Lender for sender), receiver gave money -> Borrower Record
  const isLenderForReceiver = record.recordType === 'PERSON_RECORD';

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB');
    } catch {
      return dateStr;
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      {/* 1. TOP APP BAR */}
      <View style={styles.topAppBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerIconBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.appBarTitle}>Incoming Request Details</Text>

        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. SENDER INFORMATION CARD */}
        <View style={styles.senderCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.senderHeaderRow}>
              <Text style={styles.senderName}>{senderName}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                <Text style={[styles.statusText, { color: statusInfo.text }]}>{statusInfo.label}</Text>
              </View>
            </View>

            {senderUserId ? (
              <View style={styles.userIdBadge}>
                <Ionicons name="finger-print" size={13} color="#056B38" style={{ marginRight: 4 }} />
                <Text style={styles.userIdText}>{senderUserId}</Text>
              </View>
            ) : null}

            <View style={styles.roleTag}>
              <Text style={styles.roleTagText}>
                {isLenderForReceiver ? '↗ Lender Request (Payment Received)' : '↘ Borrower Request (Payment Given)'}
              </Text>
            </View>
          </View>
        </View>

        {/* 3. LOAN DETAILS CARD */}
        <View style={styles.detailsCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="cash-outline" size={18} color="#056B38" style={{ marginRight: 8 }} />
            <Text style={styles.cardHeaderTitle}>Loan Information</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Amount</Text>
            <Text style={styles.amountValue}>{formatCurrency(record.amount)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Interest Rate</Text>
            <Text style={styles.value}>{record.interestRate}% / month</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Interest Frequency</Text>
            <Text style={styles.value}>{record.interestFrequency || 'Monthly'}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Record Type</Text>
            <Text style={styles.value}>{isLenderForReceiver ? 'Lender Record' : 'Borrower Record'}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>
              {formatDate(record.receivedDate || record.givenDate)}
            </Text>
          </View>

          {record.requestDate || record.createdAt ? (
            <View style={styles.row}>
              <Text style={styles.label}>Request Received</Text>
              <Text style={styles.value}>{formatDate(record.requestDate || record.createdAt)}</Text>
            </View>
          ) : null}

          {record.phoneNumber ? (
            <View style={styles.row}>
              <Text style={styles.label}>Phone Number</Text>
              <Text style={styles.value}>{record.phoneNumber}</Text>
            </View>
          ) : null}

          {cleanNotes(record.notes) ? (
            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <Text style={styles.label}>Notes</Text>
              <Text style={styles.value}>{cleanNotes(record.notes)}</Text>
            </View>
          ) : null}
        </View>

        {/* 4. PAYMENT SCREENSHOT (IF ANY) */}
        {record.paymentScreenshot && (
          <View style={styles.detailsCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="image-outline" size={18} color="#056B38" style={{ marginRight: 8 }} />
              <Text style={styles.cardHeaderTitle}>Payment Screenshot</Text>
            </View>
            <Image source={{ uri: record.paymentScreenshot }} style={styles.screenshotImage} />
          </View>
        )}

        {/* 5. ACTION BUTTONS */}
        {record.status === 'PENDING' ? (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.acceptBtn, processing && { opacity: 0.6 }]}
              onPress={handleAccept}
              disabled={processing}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.acceptBtnText}>
                {processing ? 'Processing...' : 'Accept Request'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.rejectBtn, processing && { opacity: 0.6 }]}
              onPress={handleReject}
              disabled={processing}
              activeOpacity={0.85}
            >
              <Ionicons name="close-circle" size={20} color="#DC2626" style={{ marginRight: 6 }} />
              <Text style={styles.rejectBtnText}>Reject Request</Text>
            </TouchableOpacity>
          </View>
        ) : record.status === 'ACCEPTED' ? (
          isSender ? (
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[styles.markCompleteBtn, processing && { opacity: 0.6 }]}
                onPress={handleMarkComplete}
                disabled={processing}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.markCompleteBtnText}>
                  {processing ? 'Processing...' : 'Mark Complete'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.statusDisplayBadgeGreen}>
              <Ionicons name="checkmark-circle" size={20} color="#15803D" style={{ marginRight: 6 }} />
              <Text style={styles.statusDisplayBadgeTextGreen}>Active</Text>
            </View>
          )
        ) : record.status === 'COMPLETED' ? (
          <View style={styles.statusDisplayBadgeGreen}>
            <Ionicons name="checkmark-circle" size={20} color="#15803D" style={{ marginRight: 6 }} />
            <Text style={styles.statusDisplayBadgeTextGreen}>Completed</Text>
          </View>
        ) : record.status === 'REJECTED' ? (
          <View style={styles.statusDisplayBadgeRed}>
            <Ionicons name="close-circle" size={20} color="#DC2626" style={{ marginRight: 6 }} />
            <Text style={styles.statusDisplayBadgeTextRed}>Rejected</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* CONFIRMATION / ALERT MODAL */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={[styles.modalIconContainer, { backgroundColor: modalConfig.iconBg || '#F8FAFC' }]}>
              <Ionicons
                name={modalConfig.iconName || 'warning'}
                size={32}
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
                ]}
                onPress={modalConfig.onConfirm}
                disabled={processing}
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
    backgroundColor: '#056B38',
  },
  topAppBar: {
    backgroundColor: '#056B38',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
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
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
    flexGrow: 1,
    backgroundColor: '#F8FAF8',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAF8',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  senderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      },
    }),
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#056B38',
  },
  senderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  userIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  userIdText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#056B38',
  },
  roleTag: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  roleTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  label: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#056B38',
  },
  screenshotImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    resizeMode: 'cover',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionsContainer: {
    gap: 10,
    marginTop: 8,
  },
  acceptBtn: {
    backgroundColor: '#056B38',
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#056B38',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 3px 8px rgba(5, 107, 56, 0.2)',
      },
    }),
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  rejectBtn: {
    backgroundColor: '#FFFFFF',
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectBtnText: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '700',
  },
  markCompleteBtn: {
    backgroundColor: '#056B38',
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#056B38',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 3px 8px rgba(5, 107, 56, 0.2)',
      },
    }),
  },
  markCompleteBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  statusDisplayBadgeGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginTop: 10,
    marginBottom: 20,
  },
  statusDisplayBadgeTextGreen: {
    fontSize: 15,
    fontWeight: '700',
    color: '#15803D',
  },
  statusDisplayBadgeRed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginTop: 10,
    marginBottom: 20,
  },
  statusDisplayBadgeTextRed: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
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

