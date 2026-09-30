import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Platform, Modal } from 'react-native';
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
import { COLORS } from '../constants/colors';
import { formatCurrency } from '../utils/currency';
import { getUser } from '../storage/storage';
import { User } from '../types/user';

type LenderRecordDetailsNavigationProp = NativeStackNavigationProp<MainStackParamList, 'LenderRecordDetails'>;
type LenderRecordDetailsRouteProp = RouteProp<MainStackParamList, 'LenderRecordDetails'>;

interface Props {
  navigation: LenderRecordDetailsNavigationProp;
  route: LenderRecordDetailsRouteProp;
}

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
    confirmColor: '#2ECC71'
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
      confirmColor: '#E74C3C',
      onConfirm: executeDelete
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
      title: 'Complete Record',
      message: 'Are you sure you want to mark this record as complete?',
      confirmText: 'Complete',
      confirmColor: '#2ECC71',
      onConfirm: executeStatusUpdate
    });
    setModalVisible(true);
  };

  const handleAccept = async () => {
    setProcessing(true);
    try {
      await lenderRecordService.acceptLenderRecord(id);
      Alert.alert('Success', 'Request accepted successfully');
      fetchPerson();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to accept request');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = () => {
    setModalConfig({
      title: 'Reject Request',
      message: 'Are you sure you want to reject this request?',
      confirmText: 'Reject',
      confirmColor: '#E74C3C',
      onConfirm: async () => {
        setModalVisible(false);
        setProcessing(true);
        try {
          await lenderRecordService.rejectLenderRecord(id);
          Alert.alert('Success', 'Request rejected');
          fetchPerson();
        } catch (err: any) {
          Alert.alert('Error', err.response?.data?.message || 'Failed to reject request');
        } finally {
          setProcessing(false);
        }
      }
    });
    setModalVisible(true);
  };

  const calculateInterest = () => {
    if (!person) return { totalMonths: 0, interest: 0, total: 0 };
    
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
    
    const totalMonths = (years * 12) + months + (days / 30);
    const principal = Number(person.amount) || 0;
    const rate = Number(person.interestRate) || 0;
    
    const interest = (principal * rate * totalMonths) / 100;
    
    return {
      years: Math.max(0, years),
      months: Math.max(0, months),
      days: Math.max(0, days),
      totalMonths: Math.max(0, totalMonths),
      interest: Math.max(0, interest),
      total: Math.max(0, principal + interest)
    };
  };

  const calcResult = calculateInterest();
  const hasAddress = person?.village || person?.mandal || person?.district || person?.state || person?.country || person?.pincode;

  const isRecipient = person?.ownerId !== currentUser?.id;
  const needsAcceptance = isRecipient && person?.status === 'PENDING';

  if (loading) return <SafeAreaView style={styles.container}><Loading /></SafeAreaView>;
  if (error || !person) return <SafeAreaView style={styles.container}><ErrorMessage message={error} /></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topDarkSection}>
        <View style={styles.customHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lender Details</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.headerProfileInfo}>
          <Text style={styles.nameDark}>{person.name}</Text>
          <View style={[styles.badgeDark, { backgroundColor: person.status === 'PENDING' ? '#F39C12' : person.status === 'ACCEPTED' ? '#3498DB' : person.status === 'COMPLETED' ? '#2ECC71' : '#E74C3C' }]}>
            <Text style={styles.badgeTextDark}>{person.status}</Text>
          </View>
        </View>
        <Text style={styles.userIdDark}>User ID: {person.targetUserId || 'N/A'}</Text>
      </View>

      <View style={styles.waveConnectorDark}>
         <View style={styles.waveConnectorLightCutout} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        
        <View style={styles.cardNeu}>
          <Text style={styles.cardTitleNeu}>Loan Details</Text>
          <View style={styles.infoListNeu}>
            <View style={styles.infoListItemNeu}>
              <View style={[styles.infoIconContainerNeu, { backgroundColor: 'rgba(46, 204, 113, 0.1)' }]}><Ionicons name="wallet" size={20} color="#2ECC71" /></View>
              <View style={styles.infoTextContainerNeu}>
                <Text style={styles.infoListLabelNeu}>Amount Received</Text>
                <Text style={[styles.infoListValueNeu, { color: '#2ECC71', fontSize: 20 }]}>{formatCurrency(person.amount)}</Text>
              </View>
            </View>

            <View style={styles.infoListItemNeu}>
              <View style={[styles.infoIconContainerNeu, { backgroundColor: 'rgba(142, 68, 173, 0.1)' }]}><Ionicons name="pie-chart" size={20} color="#8E44AD" /></View>
              <View style={styles.infoTextContainerNeu}>
                <Text style={styles.infoListLabelNeu}>Interest Rate</Text>
                <Text style={styles.infoListValueNeu}>{person.interestRate}%</Text>
              </View>
            </View>

            <View style={styles.infoListItemNeu}>
              <View style={[styles.infoIconContainerNeu, { backgroundColor: 'rgba(52, 152, 219, 0.1)' }]}><Ionicons name="calendar" size={20} color="#3498DB" /></View>
              <View style={styles.infoTextContainerNeu}>
                <Text style={styles.infoListLabelNeu}>Received Date</Text>
                <Text style={styles.infoListValueNeu}>{new Date(person.receivedDate).toLocaleDateString('en-GB')}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.cardNeu}>
          <Text style={styles.cardTitleNeu}>Personal Details</Text>
          <View style={styles.infoListNeu}>
            <View style={styles.infoListItemNeu}>
              <View style={[styles.infoIconContainerNeu, { backgroundColor: 'rgba(230, 126, 34, 0.1)' }]}><Ionicons name="call" size={20} color="#E67E22" /></View>
              <View style={styles.infoTextContainerNeu}>
                <Text style={styles.infoListLabelNeu}>Phone Number</Text>
                <Text style={styles.infoListValueNeu}>{person.phoneNumber}</Text>
              </View>
            </View>

            <View style={styles.infoListItemNeu}>
              <View style={[styles.infoIconContainerNeu, { backgroundColor: 'rgba(52, 73, 94, 0.1)' }]}><Ionicons name="person" size={20} color="#34495E" /></View>
              <View style={styles.infoTextContainerNeu}>
                <Text style={styles.infoListLabelNeu}>Father's Name</Text>
                <Text style={styles.infoListValueNeu}>{person.fatherName || 'Not provided'}</Text>
              </View>
            </View>

            {hasAddress && (
              <View style={styles.infoListItemNeu}>
                <View style={[styles.infoIconContainerNeu, { backgroundColor: 'rgba(231, 76, 60, 0.1)' }]}><Ionicons name="location" size={20} color="#E74C3C" /></View>
                <View style={styles.infoTextContainerNeu}>
                  <Text style={styles.infoListLabelNeu}>Address</Text>
                  <Text style={styles.infoListValueNeu}>
                    {[person.village, person.mandal, person.district, person.state, person.country, person.pincode].filter(Boolean).join(', ')}
                  </Text>
                </View>
              </View>
            )}
            
            {!!person.notes && (
              <View style={styles.infoListItemNeu}>
                <View style={[styles.infoIconContainerNeu, { backgroundColor: 'rgba(149, 165, 166, 0.1)' }]}><Ionicons name="document-text" size={20} color="#95A5A6" /></View>
                <View style={styles.infoTextContainerNeu}>
                  <Text style={styles.infoListLabelNeu}>Notes</Text>
                  <Text style={styles.infoListValueNeu}>{person.notes}</Text>
                </View>
              </View>
            )}
          </View>
        </View>
        
        {!!person.paymentScreenshot && (
          <View style={styles.cardNeu}>
            <Text style={styles.cardTitleNeu}>Payment Screenshot</Text>
            <Image source={{ uri: person.paymentScreenshot }} style={styles.screenshot} />
          </View>
        )}

        {needsAcceptance ? (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.btn, { backgroundColor: '#2ECC71', opacity: processing ? 0.7 : 1 }]} 
              onPress={handleAccept}
              disabled={processing}
            >
              <Text style={styles.btnText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.btn, { backgroundColor: '#E74C3C', opacity: processing ? 0.7 : 1 }]} 
              onPress={handleReject}
              disabled={processing}
            >
              <Text style={styles.btnText}>Reject</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TouchableOpacity 
              style={styles.actionBtnNeuPurple} 
              onPress={() => navigation.navigate('InterestCalculator', {
                principal: person.amount.toString(),
                rate: person.interestRate.toString(),
                years: calcResult.years.toString(),
                months: calcResult.months.toString(),
                days: calcResult.days.toString(),
                givenDate: person.receivedDate
              })}
            >
              <Ionicons name="calculator-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.actionBtnTextNeuPrimary}>Interest Calculator</Text>
            </TouchableOpacity>

            {!isRecipient && person.status !== 'COMPLETED' && (
              <TouchableOpacity 
                style={styles.actionBtnNeuGreen} 
                onPress={handleUpdateStatus}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.actionBtnTextNeuPrimary}>Mark as Complete</Text>
              </TouchableOpacity>
            )}

            {!isRecipient && (
              <View style={styles.actionsContainerNeu}>
                {person.status !== 'COMPLETED' && person.status !== 'ACCEPTED' && (
                  <TouchableOpacity style={styles.actionBtnNeuBlue} onPress={() => navigation.navigate('EditLenderRecord', { id: person.id || (person as any)._id })}>
                    <Ionicons name="pencil" size={20} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.actionBtnTextNeuPrimary}>Edit Lender</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.actionBtnNeuDanger} onPress={handleDelete}>
                  <Ionicons name="trash" size={20} color="#E74C3C" style={{ marginRight: 8 }} />
                  <Text style={styles.actionBtnTextNeuDanger}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        <Text style={[styles.dateInfo, { marginTop: 20 }]}>Created: {new Date(person.createdAt).toLocaleString()}</Text>
        <Text style={styles.dateInfo}>Updated: {new Date(person.updatedAt).toLocaleString()}</Text>

      </ScrollView>

      {/* CUSTOM CONFIRMATION MODAL */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="warning" size={32} color="#F39C12" />
            </View>
            <Text style={styles.modalTitle}>{modalConfig.title}</Text>
            <Text style={styles.modalMessage}>{modalConfig.message}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalConfirmBtn, { backgroundColor: modalConfig.confirmColor }]} onPress={modalConfig.onConfirm}>
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
  container: { flex: 1, backgroundColor: '#E9EFF5' },
  topDarkSection: { backgroundColor: '#1A1B2F', paddingTop: 20, paddingHorizontal: 20, paddingBottom: 30, borderBottomRightRadius: 80, zIndex: 10 },
  customHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  headerProfileInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  nameDark: { fontSize: 28, fontWeight: 'bold', color: '#FFF' },
  badgeDark: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeTextDark: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  userIdDark: { fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  waveConnectorDark: { height: 60, backgroundColor: '#1A1B2F', marginTop: -1, zIndex: 1 },
  waveConnectorLightCutout: { flex: 1, backgroundColor: '#E9EFF5', borderTopLeftRadius: 80 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 16, zIndex: 20 },
  cardNeu: { backgroundColor: '#E9EFF5', borderRadius: 24, padding: 24, marginBottom: 24, shadowColor: '#FFFFFF', shadowOffset: { width: -6, height: -6 }, shadowOpacity: 0.9, shadowRadius: 8, elevation: 5, borderWidth: 1, borderColor: '#FFF' },
  cardTitleNeu: { fontSize: 18, fontWeight: '800', color: '#2C3E50', marginBottom: 20 },
  infoListNeu: { gap: 16 },
  infoListItemNeu: { flexDirection: 'row', alignItems: 'center' },
  infoIconContainerNeu: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  infoTextContainerNeu: { flex: 1, justifyContent: 'center' },
  infoListLabelNeu: { fontSize: 12, color: '#6B7A93', marginBottom: 2, fontWeight: '600' },
  infoListValueNeu: { fontSize: 15, color: '#2C3E50', fontWeight: '700' },
  screenshot: { width: '100%', height: 250, borderRadius: 16, resizeMode: 'cover' },
  dateInfo: { fontSize: 12, color: '#BDC3C7', textAlign: 'center', marginBottom: 4 },
  actionsContainerNeu: { gap: 16, marginTop: 12, marginBottom: 20 },
  actionBtnNeuPurple: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#8E44AD', paddingVertical: 18, borderRadius: 16, shadowColor: '#8E44AD', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8, marginTop: 12, marginBottom: 20 },
  actionBtnNeuGreen: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2ECC71', paddingVertical: 18, borderRadius: 16, shadowColor: '#2ECC71', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8, marginBottom: 20 },
  actionBtnNeuBlue: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3498DB', paddingVertical: 18, borderRadius: 16, shadowColor: '#3498DB', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  actionBtnTextNeuPrimary: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  actionBtnNeuDanger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E9EFF5', paddingVertical: 18, borderRadius: 16, borderWidth: 1, borderColor: '#FFF', shadowColor: '#FFFFFF', shadowOffset: { width: -4, height: -4 }, shadowOpacity: 0.9, shadowRadius: 6, elevation: 5 },
  actionBtnTextNeuDanger: { color: '#E74C3C', fontSize: 16, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContainer: { width: '85%', backgroundColor: '#FFF', borderRadius: 20, padding: 24, alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10 },
  modalIconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(243, 156, 18, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#2C3E50', marginBottom: 8, textAlign: 'center' },
  modalMessage: { fontSize: 15, color: '#7F8C8D', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#F8F9FA', alignItems: 'center', marginRight: 8, borderWidth: 1, borderColor: '#ECF0F1' },
  modalCancelText: { color: '#7F8C8D', fontSize: 16, fontWeight: 'bold' },
  modalConfirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginLeft: 8 },
  modalConfirmText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  actionButtons: { marginTop: 20, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between' },
  btn: { flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginHorizontal: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 5 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '800' }
});
