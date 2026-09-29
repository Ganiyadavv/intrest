import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    
    const newStatus = member.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const actionText = newStatus === 'ACTIVE' ? 'deactivate' : 'activate';

    Alert.alert(`Confirm Action`, `Are you sure you want to ${actionText} this member?`, [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Confirm', 
        style: newStatus === 'ACTIVE' ? 'default' : 'destructive',
        onPress: async () => {
          setProcessing(true);
          try {
            await adminService.updateMemberStatus(id, newStatus);
            Alert.alert('Success', 'Member status updated successfully.');
            fetchMemberDetails();
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to update status');
          } finally {
            setProcessing(false);
          }
        }
      }
    ]);
  };

  if (loading) return <SafeAreaView style={styles.container}><Loading /></SafeAreaView>;
  if (error || !member) return <SafeAreaView style={styles.container}><ErrorMessage message={error || "Member details not available"} /></SafeAreaView>;

  const DetailRow = ({ label, value }: { label: string, value: string | undefined | null }) => (
    <View style={styles.detailRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || 'N/A'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topDarkSection}>
        <View style={styles.customHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Member Details</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <View style={styles.waveConnectorDark}>
         <View style={styles.waveConnectorLightCutout} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} style={styles.bottomLightSection}>
        <View style={styles.cardNeu}>
          <View style={styles.profileHeader}>
            <View style={styles.profileImageContainer}>
               <ProfileImage uri={member.profileImage} />
            </View>
            <Text style={styles.name}>{member.firstName} {member.lastName}</Text>
          </View>

          <View style={styles.divider} />

          <DetailRow label="User ID" value={member.userId} />
          <DetailRow label="Email" value={member.email} />
          <DetailRow label="Phone" value={member.phoneNumber} />
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Status</Text>
            <Text style={[styles.value, { color: member.status === 'ACTIVE' ? '#2ECC71' : '#E74C3C' }]}>
              {member.status}
            </Text>
          </View>

          <DetailRow label="Address" value={member.address} />
          <DetailRow label="City" value={member.city} />
          <DetailRow label="State" value={member.state} />
          <DetailRow label="Pincode" value={member.pincode} />
          <DetailRow label="Created" value={new Date(member.createdAt).toLocaleDateString('en-GB')} />
          <DetailRow label="Updated" value={new Date(member.updatedAt).toLocaleDateString('en-GB')} />

        </View>

        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: member.status === 'ACTIVE' ? '#E74C3C' : '#2ECC71' }]} 
          onPress={toggleStatus}
          disabled={processing}
        >
          <Text style={styles.btnText}>
            {member.status === 'ACTIVE' ? 'Deactivate Member' : 'Activate Member'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E9EFF5' },
  topDarkSection: { backgroundColor: '#1A1B2F', paddingTop: 20, paddingHorizontal: 24, paddingBottom: 20, borderBottomRightRadius: 80, zIndex: 10 },
  customHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  waveConnectorDark: { height: 40, backgroundColor: '#1A1B2F', marginTop: -1, zIndex: 1 },
  waveConnectorLightCutout: { flex: 1, backgroundColor: '#E9EFF5', borderTopLeftRadius: 80 },
  bottomLightSection: { backgroundColor: '#E9EFF5', flex: 1, marginTop: -1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  cardNeu: { backgroundColor: '#E9EFF5', borderRadius: 24, padding: 24, marginBottom: 24, shadowColor: '#FFFFFF', shadowOffset: { width: -6, height: -6 }, shadowOpacity: 0.9, shadowRadius: 8, elevation: 5, borderWidth: 1, borderColor: '#FFF' },
  profileHeader: { alignItems: 'center', marginBottom: 16 },
  profileImageContainer: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden', marginBottom: 12, backgroundColor: '#1A1B2F' },
  name: { fontSize: 22, fontWeight: '800', color: '#2C3E50', textAlign: 'center' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  label: { fontSize: 15, color: '#7F8C8D', fontWeight: '600' },
  value: { fontSize: 15, color: '#2C3E50', fontWeight: '800', maxWidth: '60%', textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#FFF', marginVertical: 16 },
  btn: { paddingVertical: 16, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 5 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '800' }
});
