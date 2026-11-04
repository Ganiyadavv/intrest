import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
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
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');
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

  // Helper to extract initials
  const getInitials = (name?: string, email?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'MB';
  };

  // Instant local client filtering by search query AND status pill
  const filteredMembers = useMemo(() => {
    let list = members;
    if (statusFilter === 'ACTIVE') {
      list = list.filter((m) => (m.status || '').toUpperCase() === 'ACTIVE');
    } else if (statusFilter === 'SUSPENDED') {
      list = list.filter((m) => (m.status || '').toUpperCase() !== 'ACTIVE');
    }

    if (!searchQuery.trim()) return list;
    const query = searchQuery.toLowerCase().trim();
    return list.filter((item) => {
      const name = (
        item.fullName ||
        `${item.firstName || ''} ${item.lastName || ''}`.trim() ||
        (item as any).name ||
        ''
      ).toLowerCase();
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
  }, [members, searchQuery, statusFilter]);

  const renderItem = ({ item }: { item: AdminMember }) => {
    const displayName =
      item.fullName ||
      `${item.firstName || ''} ${item.lastName || ''}`.trim() ||
      (item as any).name ||
      'Member';
    const initials = getInitials(displayName, item.email);
    const isActive = (item.status || '').toUpperCase() === 'ACTIVE';

    return (
      <View style={styles.memberCard}>
        {/* Left: Initials Avatar Circle */}
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        {/* Center: Member Info */}
        <View style={styles.memberInfoCol}>
          <Text style={styles.memberName} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.memberEmail} numberOfLines={1}>
            {item.email}
          </Text>
          <Text style={styles.memberUserId} numberOfLines={1}>
            {item.userId}
          </Text>
        </View>

        {/* Right: Status Pill & View Details Button */}
        <View style={styles.memberActionCol}>
          <View
            style={[
              styles.statusBadge,
              isActive ? styles.statusActiveBadge : styles.statusSuspendedBadge,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                isActive ? styles.statusActiveText : styles.statusSuspendedText,
              ]}
            >
              {isActive ? 'Active' : item.status || 'Suspended'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.viewDetailsBtn}
            onPress={() => navigation.navigate('AdminMemberDetails', { id: item.id })}
            activeOpacity={0.75}
          >
            <Text style={styles.viewDetailsBtnText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />

      {/* 1. TOP GREEN APP BAR */}
      <View style={styles.topDarkSection}>
        {/* Top Header Bar */}
        <View style={styles.customHeader}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Members</Text>
          <TouchableOpacity
            style={styles.headerAddBtn}
            onPress={onRefresh}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={19} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { outlineStyle: 'none' } as any]}
            placeholder="Search name, email, user ID..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {isSearching && (
            <ActivityIndicator size="small" color="#056B38" style={styles.searchIndicator} />
          )}
          {searchQuery.length > 0 && !isSearching && (
            <TouchableOpacity
              onPress={handleClear}
              style={styles.clearBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 2. WAVE CONNECTOR (Matching curved design) */}
      <View style={styles.waveConnectorDark}>
        <View style={styles.waveConnectorLightCutout} />
      </View>

      {/* 3. BODY CONTENT */}
      <View style={styles.bottomLightSection}>
        {/* Status Filter Chips: All, Active, Suspended */}
        <View style={styles.filterPillsRow}>
          <TouchableOpacity
            style={[styles.filterPill, statusFilter === 'ALL' && styles.filterPillActive]}
            onPress={() => setStatusFilter('ALL')}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.filterPillText,
                statusFilter === 'ALL' && styles.filterPillTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, statusFilter === 'ACTIVE' && styles.filterPillActive]}
            onPress={() => setStatusFilter('ACTIVE')}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.filterPillText,
                statusFilter === 'ACTIVE' && styles.filterPillTextActive,
              ]}
            >
              Active
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, statusFilter === 'SUSPENDED' && styles.filterPillActive]}
            onPress={() => setStatusFilter('SUSPENDED')}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.filterPillText,
                statusFilter === 'SUSPENDED' && styles.filterPillTextActive,
              ]}
            >
              Suspended
            </Text>
          </TouchableOpacity>
        </View>

        {loading && members.length === 0 ? (
          <Loading />
        ) : (
          <>
            <ErrorMessage message={error} />
            <FlatList
              data={filteredMembers}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderItem}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#056B38']} />
              }
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={44} color="#CBD5E1" style={{ marginBottom: 12 }} />
                  <Text style={styles.emptyText}>
                    {searchQuery
                      ? `No members found matching "${searchQuery}"`
                      : 'No members found'}
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
  container: {
    flex: 1,
    backgroundColor: '#044E28',
  },
  topDarkSection: {
    backgroundColor: '#044E28',
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 18,
    borderBottomRightRadius: 70,
    zIndex: 10,
  },
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  headerAddBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 46,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
      },
    }),
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '500',
  },
  searchIndicator: {
    marginLeft: 8,
  },
  clearBtn: {
    padding: 4,
    marginLeft: 8,
  },
  waveConnectorDark: {
    height: 40,
    backgroundColor: '#044E28',
    marginTop: -1,
    zIndex: 1,
  },
  waveConnectorLightCutout: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 65,
  },
  bottomLightSection: {
    backgroundColor: '#F8FAFC',
    flex: 1,
    marginTop: -1,
    paddingHorizontal: 16,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 12,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#056B38',
    borderColor: '#056B38',
  },
  filterPillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContainer: {
    paddingBottom: 40,
    paddingTop: 4,
  },
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 3px 10px rgba(0, 0, 0, 0.04)',
      },
    }),
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#056B38',
  },
  memberInfoCol: {
    flex: 1,
    paddingRight: 8,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  memberEmail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  memberUserId: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 3,
    fontWeight: '600',
  },
  memberActionCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusActiveBadge: {
    backgroundColor: '#ECFDF5',
  },
  statusSuspendedBadge: {
    backgroundColor: '#F1F5F9',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusActiveText: {
    color: '#059669',
  },
  statusSuspendedText: {
    color: '#64748B',
  },
  viewDetailsBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 5.5,
    marginTop: 8,
  },
  viewDetailsBtnText: {
    color: '#056B38',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 48,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 15,
    color: '#64748B',
    fontWeight: '600',
  },
});
