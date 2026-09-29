import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../types/navigation';
import { useFocusEffect } from '@react-navigation/native';
import { adminService } from '../services/adminService';
import { AdminMember } from '../types/admin';
import { Loading } from '../components/Loading';
import { ErrorMessage } from '../components/ErrorMessage';
import { AppInput } from '../components/AppInput';

type AdminMembersNavigationProp = NativeStackNavigationProp<AdminStackParamList, 'AdminMembers'>;

interface Props {
  navigation: AdminMembersNavigationProp;
}

export const AdminMembersScreen: React.FC<Props> = ({ navigation }) => {
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMembers = async (query = '') => {
    try {
      setError('');
      const data = await adminService.getMembers(query);
      setMembers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch members');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMembers();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMembers(searchQuery);
  };

  const handleSearch = () => {
    setLoading(true);
    fetchMembers(searchQuery);
  };

  const renderItem = ({ item }: { item: AdminMember }) => (
    <View style={styles.cardNeu}>
      <Text style={styles.cardTitle}>{item.firstName} {item.lastName}</Text>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>User ID:</Text>
        <Text style={styles.infoValue}>{item.userId}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Email:</Text>
        <Text style={styles.infoValue}>{item.email}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Phone:</Text>
        <Text style={styles.infoValue}>{item.phoneNumber}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Status:</Text>
        <Text style={[styles.infoValue, { color: item.status === 'ACTIVE' ? '#2ECC71' : '#E74C3C' }]}>
          {item.status}
        </Text>
      </View>
      
      {(item.city || item.state) && (
        <View style={styles.infoRow}>
           <Text style={styles.infoLabel}>Location:</Text>
           <Text style={styles.infoValue}>{[item.city, item.state].filter(Boolean).join(', ')}</Text>
        </View>
      )}

      <TouchableOpacity 
        style={styles.detailsBtn} 
        onPress={() => navigation.navigate('AdminMemberDetails', { id: item.id })}
      >
        <Text style={styles.detailsBtnText}>View Details</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topDarkSection}>
        <View style={styles.customHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Members</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.searchContainer}>
          <AppInput
            label=""
            placeholder="Search members..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
      </View>

      <View style={styles.waveConnectorDark}>
         <View style={styles.waveConnectorLightCutout} />
      </View>

      <View style={styles.bottomLightSection}>
        {loading ? (
           <Loading />
        ) : (
           <>
             <ErrorMessage message={error} />
             <FlatList
               data={members}
               keyExtractor={(item) => String(item.id)}
               renderItem={renderItem}
               refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
               contentContainerStyle={styles.listContainer}
               ListEmptyComponent={
                 <Text style={styles.emptyText}>No members found</Text>
               }
             />
           </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E9EFF5' },
  topDarkSection: { backgroundColor: '#1A1B2F', paddingTop: 20, paddingHorizontal: 24, paddingBottom: 20, borderBottomRightRadius: 80, zIndex: 10 },
  customHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  backButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  searchContainer: { marginTop: 8 },
  waveConnectorDark: { height: 40, backgroundColor: '#1A1B2F', marginTop: -1, zIndex: 1 },
  waveConnectorLightCutout: { flex: 1, backgroundColor: '#E9EFF5', borderTopLeftRadius: 80 },
  bottomLightSection: { backgroundColor: '#E9EFF5', flex: 1, marginTop: -1, paddingHorizontal: 16 },
  listContainer: { paddingBottom: 40, paddingTop: 10 },
  cardNeu: { backgroundColor: '#E9EFF5', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#FFF', shadowOffset: { width: -6, height: -6 }, shadowOpacity: 0.9, shadowRadius: 8, elevation: 5, borderWidth: 1, borderColor: '#FFF' },
  cardTitle: { fontSize: 20, fontWeight: '800', color: '#2C3E50', marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  infoLabel: { fontSize: 14, color: '#7F8C8D', fontWeight: '600' },
  infoValue: { fontSize: 14, color: '#2C3E50', fontWeight: '700' },
  detailsBtn: { marginTop: 16, paddingVertical: 12, backgroundColor: '#4D8BFF', borderRadius: 12, alignItems: 'center' },
  detailsBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 16, color: '#7F8C8D' }
});
