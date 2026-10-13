import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../types/navigation';
import { useFocusEffect } from '@react-navigation/native';
import { adminService } from '../services/adminService';
import { AdminMember } from '../types/admin';
import { Loading } from '../components/Loading';
import { ErrorMessage } from '../components/ErrorMessage';

type AdminMembersNavigationProp = NativeStackNavigationProp<AdminStackParamList, 'AdminMembers'>;

interface Props {
  navigation: AdminMembersNavigationProp;
}

export const AdminMembersScreen: React.FC<Props> = ({ navigation }) => {
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const isInitialMount = useRef(true);
  const latestQueryRef = useRef('');

  const fetchMembers = async (query = '', showFullLoader = false) => {
    latestQueryRef.current = query;
    try {
      if (showFullLoader) {
        setLoading(true);
      } else {
        setIsSearching(true);
      }
      setError('');
      const data = await adminService.getMembers(query);
      if (latestQueryRef.current === query) {
        setMembers(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      if (latestQueryRef.current === query) {
        setError(err.message || 'Failed to fetch members');
      }
    } finally {
      if (latestQueryRef.current === query) {
        setLoading(false);
        setIsSearching(false);
        setRefreshing(false);
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMembers(searchQuery, members.length === 0);
    }, [])
  );

  // Debounced server search when typing name/email/ID
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timer = setTimeout(() => {
      fetchMembers(searchQuery, false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMembers(searchQuery, false);
  };

  const handleSearch = () => {
    fetchMembers(searchQuery, false);
  };

  const handleClear = () => {
    setSearchQuery('');
    fetchMembers('', false);
  };

  // Instant 0ms local client filtering over currently loaded members
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const query = searchQuery.toLowerCase().trim();
    return members.filter((item) => {
      const name = (item.fullName || `${item.firstName || ''} ${item.lastName || ''}`.trim() || (item as any).name || '').toLowerCase();
      const email = (item.email || '').toLowerCase();
      const userId = (item.userId || '').toLowerCase();
      const phone = (item.phoneNumber || '').toLowerCase();
      const city = (item.city || '').toLowerCase();
      const state = (item.state || '').toLowerCase();
      return (
        name.includes(query) ||
        email.includes(query) ||
        userId.includes(query) ||
        phone.includes(query) ||
        city.includes(query) ||
        state.includes(query)
      );
    });
  }, [members, searchQuery]);

  const renderItem = ({ item }: { item: AdminMember }) => (
    <View style={styles.cardNeu}>
      <Text style={styles.cardTitle}>
        {item.fullName || `${item.firstName || ''} ${item.lastName || ''}`.trim() || (item as any).name || 'Unknown Name'}
      </Text>
      
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
        <Text style={styles.infoValue}>{item.phoneNumber || 'N/A'}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Status:</Text>
        <Text style={[styles.infoValue, { color: item.status === 'ACTIVE' ? '#2ECC71' : '#E74C3C' }]}>
          {item.status}
        </Text>
      </View>
      
      {(!!item.city || !!item.state) && (
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

        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#7F8C8D" style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { outlineStyle: 'none' } as any]}
            placeholder="Search by name, email, user ID..."
            placeholderTextColor="#95A5A6"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {isSearching && (
            <ActivityIndicator size="small" color="#4D8BFF" style={styles.searchIndicator} />
          )}
          {searchQuery.length > 0 && !isSearching && (
            <TouchableOpacity onPress={handleClear} style={styles.clearBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={18} color="#95A5A6" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.waveConnectorDark}>
         <View style={styles.waveConnectorLightCutout} />
      </View>

      <View style={styles.bottomLightSection}>
        {loading && members.length === 0 ? (
           <Loading />
        ) : (
           <>
             <ErrorMessage message={error} />
             <FlatList
               data={filteredMembers}
               keyExtractor={(item) => String(item.id)}
               renderItem={renderItem}
               refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
               contentContainerStyle={styles.listContainer}
               ListEmptyComponent={
                 <View style={styles.emptyContainer}>
                   <Ionicons name="search-outline" size={44} color="#BDC3C7" style={{ marginBottom: 12 }} />
                   <Text style={styles.emptyText}>
                     {searchQuery ? `No members found matching "${searchQuery}"` : 'No members found'}
                   </Text>
                 </View>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#1A1B2F',
    fontSize: 15,
    fontWeight: '500',
  },
  searchIndicator: {
    marginLeft: 8,
  },
  clearBtn: {
    padding: 4,
    marginLeft: 8,
  },
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
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  emptyText: { textAlign: 'center', fontSize: 16, color: '#7F8C8D', fontWeight: '600' }
});
