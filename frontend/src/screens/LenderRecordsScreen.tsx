import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { MainStackParamList } from '../types/navigation';
import { LenderRecord } from '../types/lenderRecord';
import { lenderRecordService } from '../services/lenderRecordService';
import { Loading } from '../components/Loading';
import { ErrorMessage } from '../components/ErrorMessage';
import { formatCurrency } from '../utils/currency';
import { getUser } from '../storage/storage';

type LenderRecordsScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'LenderRecords'>;

interface Props {
  navigation: LenderRecordsScreenNavigationProp;
}

const AVATAR_COLORS = [
  { bg: '#FEF3C7', text: '#B45309' }, // Warm amber
  { bg: '#DBEAFE', text: '#1D4ED8' }, // Soft blue
  { bg: '#DCFCE7', text: '#15803D' }, // Soft green
  { bg: '#FCE7F3', text: '#BE185D' }, // Soft pink
  { bg: '#EDE9FE', text: '#6D28D9' }, // Soft purple
  { bg: '#CCFBF1', text: '#0F766E' }, // Soft teal
];

const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

export const LenderRecordsScreen: React.FC<Props> = ({ navigation }) => {
  const [records, setRecords] = useState<LenderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'COMPLETED'>('ALL');
  const [showFilterPills, setShowFilterPills] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRecords = async () => {
    try {
      setError('');
      const [data, currentUser] = await Promise.all([
        lenderRecordService.getLenderRecords(),
        getUser(),
      ]);

      const list = Array.isArray(data) ? data : [];
      // Do not display incoming requests that are pending in the recipient's records
      const filtered = list.filter((r: any) => {
        const isTargetMe =
          currentUser?.userId &&
          (r.targetUserId === currentUser.userId || r.targetUser?.userId === currentUser.userId);
        if (isTargetMe && (r.status === 'PENDING' || r.status === 'REJECTED')) {
          return false;
        }
        return true;
      });

      setRecords(filtered);
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
    let label = 'Pending';
    let bg = '#FEF3C7';
    let color = '#D97706';

    if (status === 'ACCEPTED') {
      label = 'Active';
      bg = '#DCFCE7';
      color = '#16A34A';
    } else if (status === 'COMPLETED') {
      label = 'Completed';
      bg = '#DCFCE7';
      color = '#15803D';
    } else if (status === 'REJECTED') {
      label = 'Rejected';
      bg = '#FEE2E2';
      color = '#DC2626';
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor: bg }]}>
        <Text style={[styles.statusBadgeText, { color }]}>{label}</Text>
      </View>
    );
  };

  const filteredRecords = records.filter((r) => {
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesSearch =
      (r.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.phoneNumber || '').includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const renderItem = ({ item }: { item: LenderRecord }) => {
    const rawName = (item.name || 'Lender').trim();
    const parts = rawName.split(' ');
    const initials =
      parts.length > 1
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : rawName.slice(0, 2).toUpperCase();
    const avatarColor = getAvatarColor(rawName);

    const rateText =
      item.interestRate && Number(item.interestRate) > 0
        ? `${item.interestRate}% / month`
        : '0% (No Interest)';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('LenderRecordDetails', { id: item.id || (item as any)._id })}
      >
        {/* Left Section: Avatar + Name + Interest Rate */}
        <View style={styles.cardLeft}>
          <View style={[styles.avatarCircle, { backgroundColor: avatarColor.bg }]}>
            <Text style={[styles.avatarText, { color: avatarColor.text }]}>{initials}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.nameText} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.rateText} numberOfLines={1}>
              {rateText}
            </Text>
          </View>
        </View>

        {/* Right Section: Amount + Status Pill */}
        <View style={styles.cardRight}>
          <Text style={styles.amountText} numberOfLines={1}>
            {formatCurrency(item.amount)}
          </Text>
          {renderStatusBadge(item.status)}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      {/* 1. TOP HEADER BAR */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lender Records</Text>
        <TouchableOpacity
          style={styles.incomingShortcutBtn}
          onPress={() => navigation.navigate('IncomingRequests')}
          activeOpacity={0.7}
        >
          <Ionicons name="mail-unread-outline" size={16} color="#056B38" style={{ marginRight: 4 }} />
          <Text style={styles.incomingShortcutText}>Requests</Text>
        </TouchableOpacity>
      </View>

      {/* 2. MAIN CONTENT AREA */}
      <View style={styles.contentContainer}>
        {/* Search & Filter Row */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { outlineStyle: 'none' } as any]}
              placeholder="Search lenders..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.filterButton,
              (showFilterPills || statusFilter !== 'ALL') && styles.filterButtonActive,
            ]}
            onPress={() => setShowFilterPills(!showFilterPills)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="funnel-outline"
              size={18}
              color={showFilterPills || statusFilter !== 'ALL' ? '#056B38' : '#64748B'}
            />
          </TouchableOpacity>
        </View>

        {/* Status Filter Pills (Toggleable) */}
        {showFilterPills && (
          <View style={styles.filterPillsRow}>
            {(['ALL', 'PENDING', 'ACCEPTED', 'COMPLETED'] as const).map((status) => {
              const label =
                status === 'ALL'
                  ? 'All'
                  : status === 'PENDING'
                  ? 'Pending'
                  : status === 'ACCEPTED'
                  ? 'Active'
                  : 'Completed';
              const isActive = statusFilter === status;
              return (
                <TouchableOpacity
                  key={status}
                  style={[styles.filterPill, isActive && styles.filterPillActive]}
                  onPress={() => setStatusFilter(status)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Error message */}
        {error ? <ErrorMessage message={error} /> : null}

        {/* 3. LENDERS LIST */}
        {loading ? (
          <Loading />
        ) : (
          <FlatList
            data={filteredRecords}
            keyExtractor={(item) => item.id || (item as any)._id || String(Math.random())}
            renderItem={renderItem}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconCircle}>
                    <Ionicons name="wallet-outline" size={40} color="#94A3B8" />
                  </View>
                  <Text style={styles.emptyTitle}>No lenders found</Text>
                  <Text style={styles.emptySubtitle}>
                    {searchQuery.length > 0 || statusFilter !== 'ALL'
                      ? 'Try clearing your search or status filter.'
                      : 'Tap "+ Add Lender" below to create your first lender record.'}
                  </Text>
                </View>
              ) : null
            }
          />
        )}
      </View>

      {/* 4. PINNED BOTTOM ACTION BUTTON */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.addLenderBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('AddLenderRecord')}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.addLenderBtnText}>Add Lender</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  incomingShortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  incomingShortcutText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#056B38',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#F8FAF8',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 46,
    ...Platform.select({
      web: { boxShadow: '0 1px 2px rgba(0,0,0,0.03)' },
    }),
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
        borderWidth: 0,
      } as any,
    }),
  },
  filterButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 1px 2px rgba(0,0,0,0.03)' },
    }),
  },
  filterButtonActive: {
    borderColor: '#056B38',
    backgroundColor: '#F0FDF4',
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      },
    }),
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
  },
  cardInfo: {
    flex: 1,
  },
  nameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  rateText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  cardRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amountText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 16 : 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  addLenderBtn: {
    backgroundColor: '#056B38',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#056B38',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 12px rgba(5, 107, 56, 0.25)',
      },
    }),
  },
  addLenderBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
