import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { MainStackParamList } from '../types/navigation';
import { RequestItem } from '../types/request';
import { requestService } from '../services/requestService';
import { Loading } from '../components/Loading';
import { formatCurrency } from '../utils/currency';

type IncomingRequestsNavProp = NativeStackNavigationProp<MainStackParamList, 'IncomingRequests'>;

interface Props {
  navigation: IncomingRequestsNavProp;
}

const AVATAR_COLORS = [
  { bg: '#FEF3C7', text: '#B45309' },
  { bg: '#DBEAFE', text: '#1D4ED8' },
  { bg: '#DCFCE7', text: '#15803D' },
  { bg: '#FCE7F3', text: '#BE185D' },
  { bg: '#EDE9FE', text: '#6D28D9' },
  { bg: '#CCFBF1', text: '#0F766E' },
];

const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

export const IncomingRequestsScreen: React.FC<Props> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'INCOMING' | 'SENT'>('INCOMING');
  const [incomingRequests, setIncomingRequests] = useState<RequestItem[]>([]);
  const [sentRequests, setSentRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    confirmText: string;
    confirmColor: string;
    iconName?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    iconBg?: string;
    showCancel?: boolean;
    onConfirm: () => void;
  }>({
    title: '',
    message: '',
    confirmText: 'OK',
    confirmColor: '#056B38',
    iconName: 'checkmark-circle',
    iconColor: '#15803D',
    iconBg: '#DCFCE7',
    showCancel: false,
    onConfirm: () => {},
  });

  const fetchData = async () => {
    try {
      setError('');
      const [incoming, sent] = await Promise.all([
        requestService.getIncomingRequests().catch(() => []),
        requestService.getSentRequests().catch(() => []),
      ]);
      setIncomingRequests(Array.isArray(incoming) ? incoming : []);
      setSentRequests(Array.isArray(sent) ? sent : []);
    } catch (err: any) {
      setError('Failed to load requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleQuickAccept = (item: RequestItem) => {
    const senderDisplay = item.sender?.name || item.name || 'User';
    setModalConfig({
      title: 'Accept Request',
      message: `Are you sure you want to accept this request from ${senderDisplay}? The record will be confirmed in your records.`,
      confirmText: 'Accept',
      confirmColor: '#056B38',
      iconName: 'checkmark-circle',
      iconColor: '#056B38',
      iconBg: '#DCFCE7',
      showCancel: true,
      onConfirm: async () => {
        setProcessingId(item.id);
        try {
          await requestService.acceptRequest(item.recordType, item.id);
          setModalConfig({
            title: 'Request Accepted!',
            message: 'Request accepted successfully! The record is now available in your records.',
            confirmText: 'OK',
            confirmColor: '#056B38',
            iconName: 'checkmark-circle',
            iconColor: '#15803D',
            iconBg: '#DCFCE7',
            showCancel: false,
            onConfirm: () => {
              setModalVisible(false);
              fetchData();
            },
          });
          setModalVisible(true);
        } catch (err: any) {
          const msg = err.response?.data?.message || 'Failed to accept request';
          setModalConfig({
            title: 'Error',
            message: msg,
            confirmText: 'OK',
            confirmColor: '#DC2626',
            iconName: 'close-circle',
            iconColor: '#DC2626',
            iconBg: '#FEE2E2',
            showCancel: false,
            onConfirm: () => setModalVisible(false),
          });
          setModalVisible(true);
        } finally {
          setProcessingId(null);
        }
      },
    });
    setModalVisible(true);
  };

  const handleQuickReject = (item: RequestItem) => {
    const senderDisplay = item.sender?.name || item.name || 'User';
    setModalConfig({
      title: 'Reject Request',
      message: `Are you sure you want to reject the request from ${senderDisplay}? It will be archived in request history.`,
      confirmText: 'Reject',
      confirmColor: '#DC2626',
      iconName: 'warning',
      iconColor: '#DC2626',
      iconBg: '#FEE2E2',
      showCancel: true,
      onConfirm: async () => {
        setProcessingId(item.id);
        try {
          await requestService.rejectRequest(item.recordType, item.id);
          setModalConfig({
            title: 'Request Rejected',
            message: 'The request has been rejected and archived.',
            confirmText: 'OK',
            confirmColor: '#64748B',
            iconName: 'close-circle',
            iconColor: '#DC2626',
            iconBg: '#FEE2E2',
            showCancel: false,
            onConfirm: () => {
              setModalVisible(false);
              fetchData();
            },
          });
          setModalVisible(true);
        } catch (err: any) {
          const msg = err.response?.data?.message || 'Failed to reject request';
          setModalConfig({
            title: 'Error',
            message: msg,
            confirmText: 'OK',
            confirmColor: '#DC2626',
            iconName: 'close-circle',
            iconColor: '#DC2626',
            iconBg: '#FEE2E2',
            showCancel: false,
            onConfirm: () => setModalVisible(false),
          });
          setModalVisible(true);
        } finally {
          setProcessingId(null);
        }
      },
    });
    setModalVisible(true);
  };

  const pendingIncomingCount = useMemo(() => {
    return incomingRequests.filter((r) => r.status === 'PENDING').length;
  }, [incomingRequests]);

  const rawList = activeTab === 'INCOMING' ? incomingRequests : sentRequests;

  const filteredRequests = useMemo(() => {
    return rawList.filter((item) => {
      // Status filter
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const sName = (item.sender?.name || item.name || '').toLowerCase();
        const rName = (item.recipient?.name || '').toLowerCase();
        const sId = (item.sender?.userId || '').toLowerCase();
        const rId = (item.recipient?.userId || '').toLowerCase();
        const phone = (item.phoneNumber || '').toLowerCase();
        const amt = String(item.amount);
        return sName.includes(q) || rName.includes(q) || sId.includes(q) || rId.includes(q) || phone.includes(q) || amt.includes(q);
      }
      return true;
    });
  }, [rawList, statusFilter, searchQuery]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
      case 'COMPLETED':
        return { bg: '#DCFCE7', text: '#15803D', label: status };
      case 'PENDING':
        return { bg: '#FEF3C7', text: '#D97706', label: 'PENDING' };
      case 'REJECTED':
        return { bg: '#FEE2E2', text: '#DC2626', label: 'REJECTED' };
      default:
        return { bg: '#F1F5F9', text: '#64748B', label: status || 'PENDING' };
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB');
    } catch {
      return dateStr;
    }
  };

  const renderRequestItem = ({ item }: { item: RequestItem }) => {
    const isIncoming = activeTab === 'INCOMING';
    const displayName = isIncoming ? (item.sender?.name || item.name || 'Sender') : (item.recipient?.name || item.name || 'Recipient');
    const displayUserId = isIncoming ? item.sender?.userId : item.recipient?.userId;
    const avatarColor = getAvatarColor(displayName);
    const initials = displayName.substring(0, 2).toUpperCase();
    const statusStyle = getStatusStyle(item.status);
    // Inverted role for receiver:
    // If sender created PERSON_RECORD (Borrower for sender), receiver received money -> Lender Request
    // If sender created LENDER_RECORD (Lender for sender), receiver gave money -> Borrower Request
    const displayAsLender = isIncoming
      ? item.recordType === 'PERSON_RECORD'
      : item.recordType === 'LENDER_RECORD';
    const isProcessing = processingId === item.id;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={() =>
          navigation.navigate('IncomingRequestDetails', {
            id: item.notificationId ? String(item.notificationId) : undefined,
            requestId: item.id,
            recordType: item.recordType,
            senderName: isIncoming ? displayName : undefined,
            senderUserId: isIncoming ? displayUserId : undefined,
          })
        }
      >
        {/* Top Header Row */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.userInfoRow}>
            <View style={[styles.avatarCircle, { backgroundColor: avatarColor.bg }]}>
              <Text style={[styles.avatarText, { color: avatarColor.text }]}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.personName} numberOfLines={1}>{displayName}</Text>
              {displayUserId ? (
                <View style={styles.idBadge}>
                  <Ionicons name="finger-print" size={11} color="#056B38" style={{ marginRight: 3 }} />
                  <Text style={styles.idBadgeText}>{displayUserId}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
          </View>
        </View>

        {/* Record Type Tag */}
        <View style={styles.typeBadgeRow}>
          <View style={[styles.typeBadge, displayAsLender ? styles.lenderTypeBadge : styles.borrowerTypeBadge]}>
            <Ionicons
              name={displayAsLender ? 'arrow-up-circle-outline' : 'arrow-down-circle-outline'}
              size={13}
              color={displayAsLender ? '#056B38' : '#D97706'}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.typeBadgeText, { color: displayAsLender ? '#056B38' : '#B45309' }]}>
              {displayAsLender ? 'Lender Request' : 'Borrower Request'}
            </Text>
          </View>
          <Text style={styles.dateLabel}>{formatDate(item.createdAt || item.date)}</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Financial Details Row */}
        <View style={styles.financialRow}>
          <View style={styles.finCol}>
            <Text style={styles.finLabel}>Amount</Text>
            <Text style={styles.finAmount}>{formatCurrency(item.amount)}</Text>
          </View>

          <View style={styles.finCol}>
            <Text style={styles.finLabel}>Interest Rate</Text>
            <Text style={styles.finValue}>{item.interestRate}% / mo</Text>
          </View>

          <View style={styles.finCol}>
            <Text style={styles.finLabel}>Frequency</Text>
            <Text style={styles.finValue}>{item.interestFrequency || 'Monthly'}</Text>
          </View>
        </View>

        {/* Action Buttons if Pending on Incoming Tab */}
        {isIncoming && item.status === 'PENDING' ? (
          <View style={styles.cardActionsRow}>
            <TouchableOpacity
              style={[styles.quickRejectBtn, isProcessing && { opacity: 0.6 }]}
              onPress={() => handleQuickReject(item)}
              disabled={isProcessing}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle-outline" size={17} color="#DC2626" style={{ marginRight: 4 }} />
              <Text style={styles.quickRejectText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAcceptBtn, isProcessing && { opacity: 0.6 }]}
              onPress={() => handleQuickAccept(item)}
              disabled={isProcessing}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle-outline" size={17} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.quickAcceptText}>Accept</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickDetailsBtn}
              onPress={() =>
                navigation.navigate('IncomingRequestDetails', {
                  id: item.notificationId ? String(item.notificationId) : undefined,
                  requestId: item.id,
                  recordType: item.recordType,
                  senderName: isIncoming ? displayName : undefined,
                  senderUserId: isIncoming ? displayUserId : undefined,
                })
              }
              activeOpacity={0.8}
            >
              <Text style={styles.quickDetailsText}>Details &gt;</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.viewDetailsRow}>
            <Text style={styles.viewDetailsText}>Tap to view complete details</Text>
            <Ionicons name="chevron-forward" size={16} color="#056B38" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      {/* 1. TOP APP BAR */}
      <View style={styles.topAppBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerIconBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.appBarTitle}>Requests</Text>

        <View style={{ width: 38 }} />
      </View>

      {/* BODY CONTENT CONTAINER (Full height, light background) */}
      <View style={styles.mainContent}>
        {/* 2. TAB SELECTOR (Incoming vs Sent) */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'INCOMING' && styles.tabButtonActive]}
            onPress={() => setActiveTab('INCOMING')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="arrow-down-circle"
              size={18}
              color={activeTab === 'INCOMING' ? '#056B38' : '#64748B'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabText, activeTab === 'INCOMING' && styles.tabTextActive]}>
              Incoming
            </Text>
            {pendingIncomingCount > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{pendingIncomingCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'SENT' && styles.tabButtonActive]}
            onPress={() => setActiveTab('SENT')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="arrow-up-circle"
              size={18}
              color={activeTab === 'SENT' ? '#056B38' : '#64748B'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabText, activeTab === 'SENT' && styles.tabTextActive]}>
              Sent Requests
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3. SEARCH & FILTER PILLS */}
        <View style={styles.filterSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder={activeTab === 'INCOMING' ? 'Search by sender name, ID...' : 'Search by recipient name, ID...'}
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.pillsRow}>
            {(['ALL', 'PENDING', 'ACCEPTED', 'REJECTED'] as const).map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[styles.pill, statusFilter === filter && styles.pillActive]}
                onPress={() => setStatusFilter(filter)}
                activeOpacity={0.7}
              >
                <Text style={[styles.pillText, statusFilter === filter && styles.pillTextActive]}>
                  {filter === 'ALL' ? 'All' : filter}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 4. LIST OF REQUESTS */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Loading />
          </View>
        ) : (
          <FlatList
            style={styles.flatList}
            data={filteredRequests}
            keyExtractor={(item) => `${item.recordType}-${item.id}`}
            renderItem={renderRequestItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#056B38']} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons
                    name={activeTab === 'INCOMING' ? 'mail-open-outline' : 'paper-plane-outline'}
                    size={36}
                    color="#94A3B8"
                  />
                </View>
                <Text style={styles.emptyTitle}>
                  {activeTab === 'INCOMING' ? 'No Incoming Requests' : 'No Sent Requests'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {activeTab === 'INCOMING'
                    ? 'When other members send you loan or lender requests, they will appear here.'
                    : 'Requests you send to other users will be tracked here.'}
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* CONFIRMATION / ALERT MODAL */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={[styles.modalIconContainer, { backgroundColor: modalConfig.iconBg || '#F8FAFC' }]}>
              <Ionicons
                name={modalConfig.iconName || 'warning'}
                size={32}
                color={modalConfig.iconColor || modalConfig.confirmColor}
              />
            </View>
            <Text style={styles.modalTitle}>{modalConfig.title}</Text>
            <Text style={styles.modalMessage}>{modalConfig.message}</Text>
            <View style={styles.modalActions}>
              {modalConfig.showCancel && (
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  { backgroundColor: modalConfig.confirmColor },
                  !modalConfig.showCancel && { flex: 1, minWidth: 160 },
                ]}
                onPress={modalConfig.onConfirm}
                disabled={processingId !== null}
                activeOpacity={0.85}
              >
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
  safeContainer: {
    flex: 1,
    backgroundColor: '#056B38',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  topAppBar: {
    backgroundColor: '#056B38',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  appBarTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 10,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabButtonActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#056B38',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#056B38',
    fontWeight: '800',
  },
  tabBadge: {
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 6,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 2,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      } as any,
    }),
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillActive: {
    backgroundColor: '#056B38',
    borderColor: '#056B38',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  flatList: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  listContent: {
    backgroundColor: '#F8FAF8',
    padding: 16,
    paddingBottom: 40,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAF8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      },
    }),
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    gap: 10,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
  },
  personName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  idBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 3,
    borderWidth: 0.8,
    borderColor: '#DCFCE7',
  },
  idBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#056B38',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  typeBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  lenderTypeBadge: {
    backgroundColor: '#F0FDF4',
  },
  borrowerTypeBadge: {
    backgroundColor: '#FEF3C7',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dateLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  finCol: {
    flex: 1,
  },
  finLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 3,
  },
  finAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#056B38',
  },
  finValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  quickRejectBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  quickRejectText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
  },
  quickAcceptBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 38,
    borderRadius: 10,
    backgroundColor: '#056B38',
  },
  quickAcceptText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  quickDetailsBtn: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  quickDetailsText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  viewDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#056B38',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
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
    maxWidth: 280,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 8px 30px rgba(0,0,0,0.12)' },
    }),
  },
  modalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

