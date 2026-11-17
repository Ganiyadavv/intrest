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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { MainStackParamList } from '../types/navigation';
import { PersonalRecord } from '../types/personalRecord';
import { personalRecordService } from '../services/personalRecordService';
import { formatCurrency } from '../utils/currency';
import { useLanguage } from '../contexts/LanguageContext';

type PersonalRecordsScreenNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'PersonalRecords'
>;

interface Props {
  navigation: PersonalRecordsScreenNavigationProp;
}

const AVATAR_COLORS = [
  { bg: '#DCFCE7', text: '#15803D' }, // Emerald
  { bg: '#DBEAFE', text: '#1D4ED8' }, // Blue
  { bg: '#FEF3C7', text: '#B45309' }, // Amber
  { bg: '#FCE7F3', text: '#BE185D' }, // Pink
  { bg: '#EDE9FE', text: '#6D28D9' }, // Purple
  { bg: '#CCFBF1', text: '#0F766E' }, // Teal
];

const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

export const PersonalRecordsScreen: React.FC<Props> = ({ navigation }) => {
  const { language } = useLanguage();

  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'PARTIALLY_RETURNED' | 'FULLY_RETURNED' | 'GIFT'>('ALL');

  const fetchRecords = async () => {
    try {
      setError('');
      const data = await personalRecordService.getPersonalRecords();
      setRecords(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError('Unable to fetch Friend & Family records.');
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

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const day = d.getDate().toString().padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  // Filter records by search query & status filter
  const filteredRecords = records.filter((rec) => {
    // Status filter
    if (filter === 'PENDING' && rec.status !== 'PENDING') return false;
    if (filter === 'PARTIALLY_RETURNED' && rec.status !== 'PARTIALLY_RETURNED') return false;
    if (filter === 'FULLY_RETURNED' && rec.status !== 'FULLY_RETURNED') return false;
    if (filter === 'GIFT' && rec.recordType !== 'GIFT') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (rec.name || '').toLowerCase().includes(q);
      const matchRel = (rec.relationship || '').toLowerCase().includes(q);
      const matchPhone = (rec.phoneNumber || '').toLowerCase().includes(q);
      const matchNotes = (rec.notes || '').toLowerCase().includes(q);
      return matchName || matchRel || matchPhone || matchNotes;
    }
    return true;
  });

  // Calculate totals
  const totalGiven = records.reduce((sum, r) => sum + parseFloat(String(r.amount || 0)), 0);
  const totalReturned = records.reduce((sum, r) => sum + parseFloat(String(r.totalReturned || 0)), 0);
  const totalRemaining = records
    .filter((r) => r.recordType !== 'GIFT')
    .reduce((sum, r) => sum + parseFloat(String(r.remainingAmount || 0)), 0);

  const renderItem = ({ item }: { item: PersonalRecord }) => {
    const isGift = item.recordType === 'GIFT';
    const principal = parseFloat(String(item.amount)) || 0;
    const returned = parseFloat(String(item.totalReturned)) || 0;
    const remaining = parseFloat(String(item.remainingAmount)) || 0;
    const pct = principal > 0 ? Math.min(100, Math.round((returned / principal) * 100)) : 0;
    const avatar = getAvatarColor(item.name || 'P');
    const initial = (item.name || 'P').charAt(0).toUpperCase();

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('PersonalRecordDetails', { id: String(item.id) })}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.cardAvatar, { backgroundColor: avatar.bg }]}>
            <Text style={[styles.cardAvatarText, { color: avatar.text }]}>{initial}</Text>
          </View>

          <View style={styles.cardHeaderInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.cardName} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={[styles.relBadge]}>
                <Text style={styles.relBadgeText}>{item.relationship || 'Friend'}</Text>
              </View>
            </View>

            <Text style={styles.cardDate}>
              Given on {formatDate(item.givenDate)}
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </View>

        {/* Amounts & Status */}
        <View style={styles.cardAmountsRow}>
          <View style={styles.amountCol}>
            <Text style={styles.amountSub}>Given</Text>
            <Text style={styles.amountMain}>{formatCurrency(principal)}</Text>
          </View>

          {!isGift ? (
            <>
              <View style={styles.amountCol}>
                <Text style={styles.amountSub}>Returned</Text>
                <Text style={[styles.amountMain, { color: '#16A34A' }]}>{formatCurrency(returned)}</Text>
              </View>

              <View style={styles.amountCol}>
                <Text style={styles.amountSub}>Remaining</Text>
                <Text style={[styles.amountMain, { color: '#EA580C' }]}>{formatCurrency(remaining)}</Text>
              </View>
            </>
          ) : (
            <View style={styles.amountCol}>
              <Text style={styles.amountSub}>Type</Text>
              <Text style={[styles.amountMain, { color: '#7E22CE' }]}>Gift / Help</Text>
            </View>
          )}
        </View>

        {/* Progress Bar (if interest-free) */}
        {!isGift && (
          <View style={styles.cardProgressRow}>
            <View style={styles.cardProgressBarTrack}>
              <View style={[styles.cardProgressBarFill, { width: `${pct}%` }]} />
            </View>
            <Text style={styles.cardProgressText}>{pct}%</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />

      {/* TOP APP BAR */}
      <View style={styles.topAppBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>
            {language === 'te' ? 'స్నేహితులు & కుటుంబం' : 'Friend & Family'}
          </Text>
          <Text style={styles.headerSubtitle}>Interest-free records & gifts</Text>
        </View>

        <TouchableOpacity
          style={styles.addTopBtn}
          onPress={() => navigation.navigate('AddPersonalRecord')}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.mainContainer}>
        {/* SUMMARY STATS BAR */}
        <View style={styles.summaryBar}>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Total Given</Text>
            <Text style={styles.summaryValuePrincipal}>{formatCurrency(totalGiven)}</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Returned</Text>
            <Text style={styles.summaryValueReturned}>{formatCurrency(totalReturned)}</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Remaining</Text>
            <Text style={styles.summaryValueRemaining}>{formatCurrency(totalRemaining)}</Text>
          </View>
        </View>

        {/* SEARCH BAR */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color="#64748B" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, relation, notes..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {!!searchQuery && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* FILTER CHIPS */}
        <View style={styles.chipsRow}>
          {(['ALL', 'PENDING', 'PARTIALLY_RETURNED', 'FULLY_RETURNED', 'GIFT'] as const).map((chip) => {
            const label =
              chip === 'ALL'
                ? 'All'
                : chip === 'PENDING'
                ? 'Pending'
                : chip === 'PARTIALLY_RETURNED'
                ? 'Partial'
                : chip === 'FULLY_RETURNED'
                ? 'Returned'
                : 'Gift';
            const active = filter === chip;
            return (
              <TouchableOpacity
                key={chip}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setFilter(chip)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* RECORDS LIST */}
        {loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#056B38" />
            <Text style={styles.loadingTextDark}>Loading records...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredRecords}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#056B38']} />
            }
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Ionicons name="people-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No Friend & Family records found</Text>
                <Text style={styles.emptySubtitle}>
                  Track interest-free money lent to friends, relatives, or financial gifts.
                </Text>
                <TouchableOpacity
                  style={styles.emptyAddBtn}
                  onPress={() => navigation.navigate('AddPersonalRecord')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.emptyAddBtnText}>Add Personal Record</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}

        {/* FLOATING ACTION BUTTON */}
        <TouchableOpacity
          style={styles.fabBtn}
          onPress={() => navigation.navigate('AddPersonalRecord')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#044E28',
  },
  topAppBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#044E28',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  addTopBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerTitleCol: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#A7F3D0',
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 2,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    alignItems: 'center',
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E2E8F0',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 3,
  },
  summaryValuePrincipal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  summaryValueReturned: {
    fontSize: 14,
    fontWeight: '800',
    color: '#16A34A',
  },
  summaryValueRemaining: {
    fontSize: 14,
    fontWeight: '800',
    color: '#EA580C',
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#0F172A',
  },
  chipsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#056B38',
    borderColor: '#056B38',
  },
  chipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 90,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardAvatarText: {
    fontSize: 18,
    fontWeight: '800',
  },
  cardHeaderInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  cardName: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
    marginRight: 8,
  },
  relBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  relBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
  },
  cardDate: {
    fontSize: 11.5,
    color: '#64748B',
  },
  cardAmountsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
  },
  amountCol: {
    alignItems: 'center',
  },
  amountSub: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  amountMain: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  cardProgressBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  cardProgressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  cardProgressText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#056B38',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13.5,
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingTextDark: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
  },
  fabBtn: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#056B38',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#056B38',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0 4px 14px rgba(5, 107, 56, 0.35)',
      },
    }),
  },
});
