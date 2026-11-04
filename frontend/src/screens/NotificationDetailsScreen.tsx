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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

export const NotificationDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { id } = route.params;
  const [record, setRecord] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

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

  const handleAccept = async (recordId: string) => {
    setProcessing(true);
    try {
      if (record?.recordType === 'LENDER_RECORD') {
        await lenderRecordService.acceptLenderRecord(recordId);
      } else {
        await personRecordService.acceptPersonRecord(recordId);
      }
      Alert.alert('Success', 'Request accepted successfully');
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to accept request');
      setProcessing(false);
    }
  };

  const handleReject = (recordId: string) => {
    Alert.alert('Reject Request', 'Are you sure you want to reject this request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          setProcessing(true);
          try {
            if (record?.recordType === 'LENDER_RECORD') {
              await lenderRecordService.rejectLenderRecord(recordId);
            } else {
              await personRecordService.rejectPersonRecord(recordId);
            }
            Alert.alert('Success', 'Request rejected');
            navigation.goBack();
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to reject request');
            setProcessing(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
        <View style={styles.topAppBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.appBarTitle}>Notification Details</Text>
          <View style={{ width: 38 }} />
        </View>
        <Loading />
      </SafeAreaView>
    );
  }

  if (error || !record) {
    return (
      <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
        <View style={styles.topAppBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.appBarTitle}>Notification Details</Text>
          <View style={{ width: 38 }} />
        </View>
        <ErrorMessage message={error || 'Record details not available'} />
      </SafeAreaView>
    );
  }

  const rawName = (record.name || 'User').trim();
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
            <Text style={styles.userRole}>
              {record.recordType === 'LENDER_RECORD' ? 'Lender Request' : 'Borrower Request'}
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

          {record.notes ? (
            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <Text style={styles.label}>Notes</Text>
              <Text style={styles.value}>{record.notes}</Text>
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
              onPress={() => handleAccept(record.id)}
              disabled={processing}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.acceptBtnText}>Accept Request</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.rejectBtn, processing && { opacity: 0.6 }]}
              onPress={() => handleReject(record.id)}
              disabled={processing}
              activeOpacity={0.85}
            >
              <Ionicons name="close-circle" size={20} color="#DC2626" style={{ marginRight: 6 }} />
              <Text style={styles.rejectBtnText}>Reject Request</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
});
