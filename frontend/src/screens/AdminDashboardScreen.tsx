import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../types/navigation';
import { useFocusEffect } from '@react-navigation/native';
import { adminService } from '../services/adminService';
import { AdminDashboard } from '../types/admin';
import { Loading } from '../components/Loading';
import { ErrorMessage } from '../components/ErrorMessage';
import { authService } from '../services/authService';

const { width } = Dimensions.get('window');

type AdminDashboardNavigationProp = NativeStackNavigationProp<AdminStackParamList, 'AdminDashboard'>;

interface Props {
  navigation: AdminDashboardNavigationProp;
}

export const AdminDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      setError('');
      const response = await adminService.getAdminDashboard();
      setData(response);
    } catch (err: any) {
      setError(err.message || 'Failed to load admin dashboard');
      if (err.statusCode === 401) {
         handleLogout();
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const handleLogout = async () => {
    await authService.logoutUser();
    navigation.getParent()?.reset({
      index: 0,
      routes: [{ name: 'Auth' }],
    });
  };



  const stats = data?.statistics || {
    totalMembers: 0, totalRecords: 0, pendingRecords: 0, 
    acceptedRecords: 0, rejectedRecords: 0, completedRecords: 0
  };

  const StatCard = ({ title, value, color }: { title: string, value: number, color: string }) => (
    <View style={styles.statCard}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topDarkSection}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Administrator</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
             <Ionicons name="log-out-outline" size={20} color="#FFF" />
             <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.pageTitle}>Admin Dashboard</Text>
      </View>

      <View style={styles.waveConnectorDark}>
         <View style={styles.waveConnectorLightCutout} />
      </View>

      <ScrollView 
         contentContainerStyle={styles.scrollContent}
         refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
         bounces={false}
      >
        <ErrorMessage message={error} />
        
        <View style={styles.statsGrid}>
          <StatCard title="Total Members" value={stats.totalMembers} color="#4D8BFF" />
          <StatCard title="Total Records" value={stats.totalRecords} color="#9B59B6" />
          <StatCard title="Pending" value={stats.pendingRecords} color="#F39C12" />
          <StatCard title="Accepted" value={stats.acceptedRecords} color="#3498DB" />
          <StatCard title="Rejected" value={stats.rejectedRecords} color="#E74C3C" />
          <StatCard title="Completed" value={stats.completedRecords} color="#2ECC71" />
        </View>

        <TouchableOpacity 
          style={styles.membersBtn} 
          onPress={() => navigation.navigate('AdminMembers')}
        >
          <Ionicons name="people" size={24} color="#FFF" style={{marginRight: 10}}/>
          <Text style={styles.membersBtnText}>Manage Members</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E9EFF5' },
  topDarkSection: { backgroundColor: '#1A1B2F', paddingTop: 20, paddingHorizontal: 24, paddingBottom: 40, borderBottomRightRadius: 80, zIndex: 10 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  logoutText: { color: '#FFF', fontSize: 14, fontWeight: 'bold', marginLeft: 4 },
  pageTitle: { color: '#FFF', fontSize: 32, fontWeight: '900', letterSpacing: 0.5 },
  waveConnectorDark: { height: 80, backgroundColor: '#1A1B2F', marginTop: -1, zIndex: 1 },
  waveConnectorLightCutout: { flex: 1, backgroundColor: '#E9EFF5', borderTopLeftRadius: 80 },
  scrollContent: { padding: 24, paddingBottom: 60, marginTop: -40 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { width: (width - 48 - 16) / 2, backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, alignItems: 'center' },
  statTitle: { fontSize: 14, color: '#7F8C8D', fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  statValue: { fontSize: 32, fontWeight: '900' },
  membersBtn: { flexDirection: 'row', backgroundColor: '#2C3E50', padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 16, shadowColor: '#2C3E50', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  membersBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800' }
});
