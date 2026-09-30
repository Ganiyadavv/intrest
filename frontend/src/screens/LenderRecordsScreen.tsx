import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { MainStackParamList } from '../types/navigation';
import { LenderRecord } from '../types/lenderRecord';
import { lenderRecordService } from '../services/lenderRecordService';
import { Loading } from '../components/Loading';
import { ErrorMessage } from '../components/ErrorMessage';
import { COLORS } from '../constants/colors';
import { formatCurrency } from '../utils/currency';

type LenderRecordsScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'LenderRecords'>;

interface Props {
  navigation: LenderRecordsScreenNavigationProp;
}

export const LenderRecordsScreen: React.FC<Props> = ({ navigation }) => {
  const [records, setRecords] = useState<LenderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'PENDING' | 'ACCEPTED' | 'COMPLETED'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRecords = async () => {
    try {
      setError('');
      const data = await lenderRecordService.getLenderRecords();
      setRecords(data);
    } catch (err: any) {
      setError('Failed to fetch lender records.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRecords();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecords();
  };

  const renderStatusBadge = (status: string) => {
    let color = '#95A5A6';
    if (status === 'PENDING') color = '#F39C12';
    if (status === 'ACCEPTED') color = '#3498DB';
    if (status === 'REJECTED') color = '#E74C3C';
    if (status === 'COMPLETED') color = '#2ECC71';

    return (
      <View style={[styles.badge, { backgroundColor: color }]}>
        <Text style={styles.badgeText}>{status}</Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: LenderRecord }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('LenderRecordDetails', { id: item.id || (item as any)._id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.name}>{item.name}</Text>
        {renderStatusBadge(item.status)}
      </View>
      <View style={styles.cardBody}>
        <View style={styles.row}>
          <Ionicons name="call" size={16} color="#7F8C8D" />
          <Text style={styles.infoText}>{item.phoneNumber}</Text>
        </View>
        <Text style={styles.amountText}>Amount: {formatCurrency(item.amount)}</Text>
        <Text style={styles.interestText}>Interest: {item.interestRate}%</Text>
        <Text style={styles.dateText}>Received Date: {new Date(item.receivedDate).toLocaleDateString('en-GB').replace(/\//g, '-')}</Text>
        {item.targetUserId && (
          <Text style={styles.userIdText}>User ID: {item.targetUserId}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.topDarkSection}>
        <View style={styles.customHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View>
             <Text style={styles.headerTitle}>Lender Records</Text>
             <Text style={styles.headerSubTitle}>People who gave money to you</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </View>

      {/* WAVE */}
      <View style={styles.waveConnectorDark}>
        <View style={styles.waveConnectorLightCutout} />
      </View>

      <View style={styles.bottomLightSection}>
        {/* SEARCH BAR */}
        <View style={styles.searchContainerNeu}>
          <Ionicons name="search" size={20} color="#95A5A6" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name..."
            placeholderTextColor="#95A5A6"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#95A5A6" />
            </TouchableOpacity>
          )}
        </View>

        {/* TABS */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'PENDING' && styles.activeTab]}
            onPress={() => setActiveTab('PENDING')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'PENDING' && styles.activeTabText]}>Pending</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'ACCEPTED' && styles.activeTab]}
            onPress={() => setActiveTab('ACCEPTED')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'ACCEPTED' && styles.activeTabText]}>Accepted</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'COMPLETED' && styles.activeTab]}
            onPress={() => setActiveTab('COMPLETED')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'COMPLETED' && styles.activeTabText]}>Completed</Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <Loading />
        ) : (
          <>
            {error ? <ErrorMessage message={error} /> : null}
            <FlatList
              data={records.filter(r => {
                const matchesTab = r.status === activeTab;
                const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
                return matchesTab && matchesSearch;
              })}
              keyExtractor={(item) => item.id || (item as any)._id}
              renderItem={renderItem}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={
                !loading ? (
                  <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconContainerNeu}>
                      <Ionicons name="folder-open-outline" size={48} color="#95A5A6" />
                    </View>
                    <Text style={styles.emptyText}>No lender records found</Text>
                    <Text style={styles.emptySubText}>Add a lender record to keep track of money you received.</Text>
                  </View>
                ) : null
              }
            />
          </>
        )}
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('AddLenderRecord')}
      >
        <Ionicons name="add" size={32} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E9EFF5' },
  topDarkSection: {
    backgroundColor: '#1A1B2F',
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 40,
    borderBottomRightRadius: 80,
    zIndex: 10,
  },
  waveConnectorDark: {
    height: 80,
    backgroundColor: '#1A1B2F',
    marginTop: -1,
    zIndex: 1,
  },
  waveConnectorLightCutout: {
    flex: 1,
    backgroundColor: '#E9EFF5',
    borderTopLeftRadius: 80,
  },
  bottomLightSection: {
    backgroundColor: '#E9EFF5',
    flex: 1,
    paddingHorizontal: 16,
    marginTop: -1,
  },
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  headerSubTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'center', marginTop: 4 },
  searchContainerNeu: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E9EFF5', borderRadius: 16, paddingHorizontal: 16, marginBottom: 20, height: 50, shadowColor: '#FFFFFF', shadowOffset: { width: -4, height: -4 }, shadowOpacity: 0.9, shadowRadius: 6, elevation: 4, borderWidth: 1, borderColor: '#FFF' },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 16, color: '#2C3E50', fontWeight: '600' },
  listContainer: { paddingBottom: 40, paddingTop: 10 },
  card: {
    backgroundColor: '#E9EFF5',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: -6, height: -6 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  cardBody: { marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoText: { marginLeft: 8, fontSize: 15, color: '#7F8C8D', fontWeight: '600' },
  amountText: { fontSize: 24, color: '#2C3E50', fontWeight: '900', marginTop: 12, marginBottom: 4 },
  interestText: { fontSize: 14, color: '#3498DB', marginBottom: 4, fontWeight: '700' },
  dateText: { fontSize: 14, color: '#7F8C8D', marginBottom: 4, fontWeight: '500' },
  userIdText: { fontSize: 13, color: '#3498DB', marginTop: 8, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 20 },
  emptyIconContainerNeu: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#E9EFF5', justifyContent: 'center', alignItems: 'center', marginBottom: 24, shadowColor: '#FFFFFF', shadowOffset: { width: -6, height: -6 }, shadowOpacity: 0.9, shadowRadius: 8, elevation: 5, borderWidth: 1, borderColor: '#FFF' },
  emptyText: { fontSize: 18, color: '#2C3E50', fontWeight: '800', textAlign: 'center' },
  emptySubText: { fontSize: 15, color: '#95A5A6', marginTop: 8, fontWeight: '500', textAlign: 'center' },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1A1B2F',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1A1B2F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tabContainer: { flexDirection: 'row', backgroundColor: '#E9EFF5', borderRadius: 16, padding: 6, marginBottom: 20, shadowColor: '#FFFFFF', shadowOffset: { width: -4, height: -4 }, shadowOpacity: 0.9, shadowRadius: 6, elevation: 4, borderWidth: 1, borderColor: '#FFF' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  activeTab: { backgroundColor: '#4A90E2', shadowColor: '#4A90E2', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  tabText: { color: '#7F8C8D', fontSize: 15, fontWeight: '700' },
  activeTabText: { color: '#FFF', fontWeight: '800' }
});
