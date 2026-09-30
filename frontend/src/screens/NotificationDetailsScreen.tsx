import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MainStackParamList } from '../types/navigation';
import { Notification } from '../types/notification';
import { PersonRecord } from '../types/personRecord';
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
        }
      }
    ]);
  };

  if (loading) return <SafeAreaView style={styles.container}><Loading /></SafeAreaView>;
  if (error || !record) return <SafeAreaView style={styles.container}><ErrorMessage message={error || "Record details not available"} /></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.topDarkSection}>
        <View style={styles.customHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Record Details</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      {/* WAVE */}
      <View style={styles.waveConnectorDark}>
         <View style={styles.waveConnectorLightCutout} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} style={styles.bottomLightSection}>
        <View style={styles.cardNeu}>
          <View style={styles.cardHeader}>
            <Text style={styles.name}>{record.name}</Text>
          </View>

          <Text style={styles.messageText}>Please check these details.</Text>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.label}>Amount:</Text>
            <Text style={[styles.value, { color: '#2ECC71', fontWeight: 'bold' }]}>{formatCurrency(record.amount)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Interest Rate:</Text>
            <Text style={styles.value}>{record.interestRate}%</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Given Date:</Text>
            <Text style={styles.value}>
              {new Date(record.recordType === 'LENDER_RECORD' ? record.receivedDate : record.givenDate).toLocaleDateString('en-GB')}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{record.phoneNumber}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Notes:</Text>
            <Text style={styles.value}>{record.notes || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Status:</Text>
            <Text style={[styles.value, { 
              color: record.status === 'COMPLETED' ? '#2ECC71' : 
                     record.status === 'PENDING' ? '#F39C12' : 
                     record.status === 'REJECTED' ? '#E74C3C' : '#3498DB'
            }]}>
              {record.status}
            </Text>
          </View>

          {record.paymentScreenshot && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Payment Screenshot</Text>
              <Image source={{ uri: record.paymentScreenshot }} style={styles.screenshot} />
            </>
          )}
        </View>

        {record.status === 'PENDING' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.btn, { backgroundColor: '#2ECC71', opacity: processing ? 0.7 : 1 }]} 
              onPress={() => handleAccept(record.id)}
              disabled={processing}
            >
              <Text style={styles.btnText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.btn, { backgroundColor: '#E74C3C', opacity: processing ? 0.7 : 1 }]} 
              onPress={() => handleReject(record.id)}
              disabled={processing}
            >
              <Text style={styles.btnText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E9EFF5' },
  topDarkSection: { backgroundColor: '#1A1B2F', paddingTop: 80, paddingHorizontal: 24, paddingBottom: 60, borderBottomRightRadius: 80, zIndex: 10 },
  customHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  waveConnectorDark: { height: 80, backgroundColor: '#1A1B2F', marginTop: -1, zIndex: 1 },
  waveConnectorLightCutout: { flex: 1, backgroundColor: '#E9EFF5', borderTopLeftRadius: 80 },
  bottomLightSection: { backgroundColor: '#E9EFF5', flex: 1, marginTop: -1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  cardNeu: { backgroundColor: '#E9EFF5', borderRadius: 24, padding: 24, marginBottom: 24, shadowColor: '#FFFFFF', shadowOffset: { width: -6, height: -6 }, shadowOpacity: 0.9, shadowRadius: 8, elevation: 5, borderWidth: 1, borderColor: '#FFF' },
  cardHeader: { marginBottom: 12 },
  name: { fontSize: 22, fontWeight: '800', color: '#2C3E50', textAlign: 'center' },
  messageText: { fontSize: 15, color: '#7F8C8D', textAlign: 'center', marginBottom: 16, fontWeight: '600' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  label: { fontSize: 15, color: '#7F8C8D', fontWeight: '600' },
  value: { fontSize: 15, color: '#2C3E50', fontWeight: '800', maxWidth: '60%', textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#FFF', marginVertical: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#34495E', marginBottom: 12 },
  screenshot: { width: '100%', height: 250, borderRadius: 16, resizeMode: 'cover', borderWidth: 2, borderColor: '#FFF' },
  actionButtons: { marginTop: 24, flexDirection: 'row', justifyContent: 'space-between' },
  btn: { flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginHorizontal: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 5 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '800' }
});
