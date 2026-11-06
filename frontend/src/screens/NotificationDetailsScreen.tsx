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
import { personRecordService } from '../services/personRecordService';
import { lenderRecordService } from '../services/lenderRecordService';
import { Loading } from '../components/Loading';
import { ErrorMessage } from '../components/ErrorMessage';
import { formatCurrency } from '../utils/currency';

type NotificationDetailsNavigationProp = NativeStackNavigationProp<MainStackParamList, 'NotificationDetails'>;
type NotificationDetailsRouteProp = RouteProp<MainStackParamList, 'NotificationDetails'>;

interface Props {
  navigation: NotificationDetailsNavigationProp;
  route: NotificationDetailsRouteProp;
}

const cleanNotes = (notes?: string) => {
  if (!notes) return '';
  return notes.replace(/_{1,2}SENDER_{1,2}=[^_\n]+_{1,2}\n?/g, '').trim();
};

export const NotificationDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { id } = route.params;
  const [record, setRecord] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    confirmText: string;
    confirmColor: string;
    onConfirm: () => void;
  }>({
    title: '',
    message: '',
    confirmText: '',
    confirmColor: '#DC2626',
    onConfirm: () => {},
  });

  const fetchNotificationDetails = async () => {
    try {
      setError('');
      const data = await notificationService.getNotificationDetails(id);
      setRecord(data);
    } catch (err: any) {
      setError('Failed to fetch notification details');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotificationDetails();
    }, [id])
  );

  const handleAccept = async (recordId: string | number) => {
    if (!recordId) return;
    setProcessing(true);
    try {
      if (record?.recordType === 'LENDER_RECORD') {
        await lenderRecordService.acceptLenderRecord(String(recordId));
      } else {
        await personRecordService.acceptPersonRecord(String(recordId));
      }
      if (Platform.OS === 'web') {
        window.alert('Request accepted successfully');
        navigation.goBack();
      } else {
        Alert.alert('Success', 'Request accepted successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to accept request';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = (recordId: string | number) => {
    if (!recordId) return;
    setModalConfig({
      title: 'Reject Request',
      message: 'Are you sure you want to reject this request?',
      confirmText: 'Reject',
      confirmColor: '#DC2626',
      onConfirm: async () => {
        setModalVisible(false);
        setProcessing(true);
        try {
          if (record?.recordType === 'LENDER_RECORD') {
            await lenderRecordService.rejectLenderRecord(String(recordId));
          } else {
            await personRecordService.rejectPersonRecord(String(recordId));
          }
          if (Platform.OS === 'web') {
            window.alert('Request rejected');
            navigation.goBack();
          } else {
            Alert.alert('Success', 'Request rejected', [
              { text: 'OK', onPress: () => navigation.goBack() },
            ]);
          }
        } catch (err: any) {
          const msg = err.response?.data?.message || 'Failed to reject request';
          if (Platform.OS === 'web') {
            window.alert(msg);
          } else {
            Alert.alert('Error', msg);
          }
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
          <Text style={styles.appBarTitle}>Notification Details</Text>
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
          <Text style={styles.appBarTitle}>Notification Details</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ErrorMessage message={error || 'Record details not available'} />
        </View>
      </SafeAreaView>
    );
  }

  let rawName = (record.sender?.name || record.name || 'User').trim();
  let senderUserId = record.sender?.userId;

  // Extract from notes if available
  if (record.notes && typeof record.notes === 'string') {
    const senderTagMatch = record.notes.match(/_{1,2}SENDER_{1,2}=\s*([^|\n]+?)\s*\|\s*([^_\s\n]+)\s*_{1,2}/);
    if (senderTagMatch) {
      if (senderTagMatch[1]) rawName = senderTagMatch[1].trim();
      if (senderTagMatch[2]) senderUserId = senderTagMatch[2].trim();
    }
  }

  const initials = rawName.substring(0, 2).toUpperCase();

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

        <Text style={styles.appBarTitle}>Request Details</Text>

        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. USER CARD */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{rawName}</Text>
            {senderUserId ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Ionicons name="finger-print" size={11} color="#056B38" style={{ marginRight: 3 }} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#056B38' }}>{senderUserId}</Text>
              </View>
            ) : null}
            <Text style={styles.userRole}>
              {record.recordType === 'PERSON_RECORD' ? 'Lender Request (Received)' : 'Borrower Request (Given)'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
            <Text style={[styles.statusText, { color: statusInfo.text }]}>{statusInfo.label}</Text>
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
            <Text style={styles.value}>Monthly</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>
              {new Date(
                record.recordType === 'LENDER_RECORD' ? record.receivedDate : record.givenDate
              ).toLocaleDateString('en-GB')}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Phone Number</Text>
            <Text style={styles.value}>{record.phoneNumber || 'N/A'}</Text>
          </View>

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

        {/* 5. ACTION BUTTONS (IF PENDING) */}
        {record.status === 'PENDING' && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.acceptBtn, processing && { opacity: 0.6 }]}
              onPress={() => handleAccept(record.id || record._id)}
              disabled={processing}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.acceptBtnText}>Accept Request</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.rejectBtn, processing && { opacity: 0.6 }]}
              onPress={() => handleReject(record.id || record._id)}
              disabled={processing}
              activeOpacity={0.85}
            >
              <Ionicons name="close-circle" size={20} color="#DC2626" style={{ marginRight: 6 }} />
              <Text style={styles.rejectBtnText}>Reject Request</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* CONFIRMATION MODAL */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
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
  userCard: {
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#056B38',
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  userRole: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
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
