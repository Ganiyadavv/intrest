import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../types/navigation';
import { useFocusEffect } from '@react-navigation/native';
import { getUser, clearStorage } from '../storage/storage';
import { User } from '../types/user';
import { PersonRecord } from '../types/personRecord';
import { LenderRecord } from '../types/lenderRecord';
import { personRecordService } from '../services/personRecordService';
import { lenderRecordService } from '../services/lenderRecordService';
import { notificationService } from '../services/notificationService';
import { requestService } from '../services/requestService';
import { formatCurrency } from '../utils/currency';
import { useLanguage } from '../contexts/LanguageContext';

type DashboardScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Dashboard'>;

interface Props {
  navigation: DashboardScreenNavigationProp;
}

interface TransactionItem {
  id: string;
  name: string;
  role: 'Lender' | 'Borrower';
  type: 'Lender' | 'Borrower';
  amount: number;
  rate: string;
  status: 'Active' | 'Pending' | 'Completed' | 'Rejected';
  initials: string;
  color: string;
  date?: number;
  targetScreen?: 'PersonDetails' | 'LenderRecordDetails';
  targetId?: string;
}

export const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [personRecords, setPersonRecords] = useState<PersonRecord[]>([]);
  const [lenderRecords, setLenderRecords] = useState<LenderRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [menuModalVisible, setMenuModalVisible] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const loadData = async () => {
    try {
      const storedUser = await getUser();
      setUser(storedUser);

      const [borrowers, lenders, notifications, incoming] = await Promise.all([
        personRecordService.getPersonRecords().catch(() => []),
        lenderRecordService.getLenderRecords().catch(() => []),
        notificationService.getNotifications().catch(() => []),
        requestService.getIncomingRequests().catch(() => []),
      ]);

      const filterDashboardRecords = (list: any[]) => {
        if (!Array.isArray(list)) return [];
        return list.filter((r: any) => {
          // Never display rejected records on the dashboard
          if (r.status === 'REJECTED') {
            return false;
          }
          // Only show records created/owned by this user
          if (r.ownerId != null && storedUser?.id != null && String(r.ownerId) !== String(storedUser.id)) {
            return false;
          }
          // Do not display incoming requests where this user is the recipient
          const isTargetMe =
            storedUser?.userId &&
            (r.targetUserId === storedUser.userId || r.targetUser?.userId === storedUser.userId);
          if (isTargetMe) {
            return false;
          }
          return true;
        });
      };

      setPersonRecords(filterDashboardRecords(borrowers));
      setLenderRecords(filterDashboardRecords(lenders));

      const unread = Array.isArray(notifications)
        ? notifications.filter((n: any) => n.isRead === false || n.status === 'UNREAD').length
        : 0;
      setUnreadCount(unread);

      const pendingIncoming = Array.isArray(incoming)
        ? incoming.filter((r: any) => r.status === 'PENDING').length
        : 0;
      setPendingRequestsCount(pendingIncoming);
    } catch (error) {
      console.log('Error loading dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleLogout = async () => {
    setMenuModalVisible(false);
    await clearStorage();
    navigation.getParent()?.reset({
      index: 0,
      routes: [{ name: 'Auth', params: { screen: 'PublicHome' } }],
    });
  };

  // Build 100% Real User Transactions List (Zero Dummy Data)
  const realTransactions: TransactionItem[] = [];

  personRecords.forEach((r) => {
    if ((r.status as string) === 'REJECTED') return;
    if (r.ownerId != null && user?.id != null && String(r.ownerId) !== String(user.id)) return;
    const isTargetMe =
      user?.userId &&
      (r.targetUserId === user.userId || (r as any).targetUser?.userId === user.userId);
    if (isTargetMe) return;

    const rawName = (r.name || 'Borrower').trim();
    const parts = rawName.split(' ');
    const initials =
      parts.length > 1
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : rawName.slice(0, 2).toUpperCase();

    realTransactions.push({
      id: `p-${r.id || r._id || Math.random()}`,
      name: rawName,
      role: 'Borrower',
      type: 'Borrower',
      amount: Number(r.amount) || 0,
      rate: r.interestRate ? `${r.interestRate}% / mo` : '0%',
      status:
        r.status === 'COMPLETED'
          ? 'Completed'
          : r.status === 'ACCEPTED'
          ? 'Active'
          : 'Pending',
      initials,
      color: '#F59E0B',
      date: r.givenDate ? new Date(r.givenDate).getTime() : 0,
      targetScreen: 'PersonDetails',
      targetId: r.id || r._id,
    });
  });

  lenderRecords.forEach((r) => {
    if ((r.status as string) === 'REJECTED') return;
    if (r.ownerId != null && user?.id != null && String(r.ownerId) !== String(user.id)) return;
    const isTargetMe =
      user?.userId &&
      (r.targetUserId === user.userId || (r as any).targetUser?.userId === user.userId);
    if (isTargetMe) return;

    const rawName = (r.name || 'Lender').trim();
    const parts = rawName.split(' ');
    const initials =
      parts.length > 1
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : rawName.slice(0, 2).toUpperCase();

    realTransactions.push({
      id: `l-${r.id || (r as any)._id || Math.random()}`,
      name: rawName,
      role: 'Lender',
      type: 'Lender',
      amount: Number(r.amount) || 0,
      rate: r.interestRate ? `${r.interestRate}% / mo` : '0%',
      status:
        r.status === 'COMPLETED'
          ? 'Completed'
          : r.status === 'ACCEPTED'
          ? 'Active'
          : 'Pending',
      initials,
      color: '#10B981',
      date: r.receivedDate ? new Date(r.receivedDate).getTime() : 0,
      targetScreen: 'LenderRecordDetails',
      targetId: r.id || (r as any)._id,
    });
  });

  // Sort by newest first
  realTransactions.sort((a, b) => (b.date || 0) - (a.date || 0));

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      {/* 1. TOP APP BAR */}
      <View style={styles.topAppBar}>
        {/* Menu Icon */}
        <TouchableOpacity
          style={styles.menuIconBtn}
          onPress={() => setMenuModalVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="menu-outline" size={26} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Brand Header */}
        <View style={styles.brandCenter}>
          <View style={styles.brandLogoCircle}>
            <Text style={styles.brandRupeeText}>₹</Text>
            <Ionicons
              name="leaf"
              size={10}
              color="#4ADE80"
              style={styles.brandLeafIcon}
            />
          </View>
          <View style={styles.brandTextCol}>
            <Text style={styles.brandTitleText}>DhanaMitra</Text>
          </View>
        </View>

        {/* Right Action Icons: Notification Bell & Profile Avatar */}
        <View style={styles.topRightIcons}>
          <TouchableOpacity
            style={styles.iconCircleBtn}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileAvatarCircle}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.7}
          >
            <Ionicons name="person-outline" size={18} color="#0A4224" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.mainWrapper}>
          {/* 2. GREETING BANNER CARD */}
          <View style={styles.welcomeBannerCard}>
            <View style={styles.greetingTextGroup}>
              <View style={styles.welcomeTitleRow}>
                <Text style={styles.welcomeText}>{t('dashboard.welcomeBack')}</Text>
                <Text style={styles.handWave}> 👋</Text>
              </View>
              <Text style={styles.userNameText} numberOfLines={1}>
                {user?.fullName || user?.firstName || 'Ganesh Bobbali'}
              </Text>
              <Text style={styles.welcomeSubText}>
                {t('dashboard.greetingSubtitle')}
              </Text>
            </View>
            <Image
              source={require('../../assets/dashboard-growth-coins.png')}
              style={styles.bannerIllustration}
              resizeMode="contain"
            />
          </View>

          {/* 2.1 PENDING INCOMING REQUESTS NOTIFICATION BANNER */}
          {pendingRequestsCount > 0 && (
            <TouchableOpacity
              style={styles.pendingIncomingBanner}
              onPress={() => navigation.navigate('IncomingRequests')}
              activeOpacity={0.85}
            >
              <View style={styles.pendingIncomingLeft}>
                <View style={styles.pendingIncomingIconBox}>
                  <Ionicons name="mail-unread" size={20} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pendingIncomingTitle}>
                    {pendingRequestsCount === 1 ? '1 Pending Incoming Request' : `${pendingRequestsCount} Pending Incoming Requests`}
                  </Text>
                  <Text style={styles.pendingIncomingSubtitle}>
                    Review loan requests waiting for your approval
                  </Text>
                </View>
              </View>
              <View style={styles.pendingIncomingAction}>
                <Text style={styles.pendingIncomingActionText}>Review</Text>
                <Ionicons name="arrow-forward" size={13} color="#056B38" />
              </View>
            </TouchableOpacity>
          )}

          {/* 3. QUICK TOOLS SECTION */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>{t('dashboard.quickTools')}</Text>
          </View>

          <View style={styles.toolsRow}>
            {/* Tool 1: Simple Interest */}
            <TouchableOpacity
              style={styles.toolCard}
              onPress={() => navigation.navigate('InterestCalculator')}
              activeOpacity={0.7}
            >
              <View style={[styles.toolIconCircle, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="sunny" size={22} color="#F97316" />
              </View>
              <Text style={styles.toolLabel} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.85}>
                {t('tools.simpleInterest')}
              </Text>
            </TouchableOpacity>

            {/* Tool 2: Compound Interest */}
            <TouchableOpacity
              style={styles.toolCard}
              onPress={() => navigation.navigate('CompoundInterest')}
              activeOpacity={0.7}
            >
              <View style={[styles.toolIconCircle, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="trending-up" size={22} color="#10B981" />
              </View>
              <Text style={styles.toolLabel} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.85}>
                {t('tools.compoundInterest')}
              </Text>
            </TouchableOpacity>

            {/* Tool 3: EMI Calculator */}
            <TouchableOpacity
              style={styles.toolCard}
              onPress={() => navigation.navigate('EMICalculator')}
              activeOpacity={0.7}
            >
              <View style={[styles.toolIconCircle, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="calculator" size={22} color="#2563EB" />
              </View>
              <Text style={styles.toolLabel} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.85}>
                {t('tools.emiCalculator')}
              </Text>
            </TouchableOpacity>

            {/* Tool 4: Rate Calculator */}
            <TouchableOpacity
              style={styles.toolCard}
              onPress={() => navigation.navigate('RateCalculator')}
              activeOpacity={0.7}
            >
              <View style={[styles.toolIconCircle, { backgroundColor: '#F5F3FF' }]}>
                <Ionicons name="pie-chart" size={21} color="#7C3AED" />
              </View>
              <Text style={styles.toolLabel} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.85}>
                {t('tools.rateCalculator')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 4. RECENT TRANSACTIONS TABLE */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>{t('dashboard.recentTransactions')}</Text>
            {realTransactions.length > 0 && (
              <TouchableOpacity onPress={() => navigation.navigate('PersonRecords')} activeOpacity={0.7}>
                <Text style={styles.sectionLink}>{t('dashboard.viewAll')}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.transactionCardContainer}>
            {realTransactions.length > 0 ? (
              <>
                {/* Table Header Row */}
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.tableColHeader, { flex: 2.2 }]}>{t('table.name')}</Text>
                  <Text style={[styles.tableColHeader, { flex: 1.4 }]}>{t('table.type')}</Text>
                  <Text style={[styles.tableColHeader, { flex: 1.6, textAlign: 'right' }]}>{t('table.amount')}</Text>
                  <Text style={[styles.tableColHeader, { flex: 1.6, textAlign: 'center' }]}>{t('table.rate')}</Text>
                  <Text style={[styles.tableColHeader, { flex: 1.4, textAlign: 'right' }]}>{t('table.status')}</Text>
                </View>

                {/* Real Transaction Rows */}
                {realTransactions.slice(0, 5).map((tx, idx) => (
                  <TouchableOpacity
                    key={tx.id || idx}
                    style={[
                      styles.txRow,
                      idx === Math.min(realTransactions.length, 5) - 1 && { borderBottomWidth: 0 },
                    ]}
                    onPress={() => {
                      if (tx.targetScreen && tx.targetId) {
                        navigation.navigate(tx.targetScreen as any, { id: tx.targetId });
                      } else if (tx.role === 'Lender') {
                        navigation.navigate('LenderRecords');
                      } else {
                        navigation.navigate('PersonRecords');
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    {/* Name + Initials */}
                    <View style={[styles.txColName, { flex: 2.2 }]}>
                      <View
                        style={[
                          styles.txAvatar,
                          {
                            backgroundColor:
                              tx.color === '#10B981' ? '#DCFCE7' : '#FEF3C7',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.txAvatarText,
                            {
                              color:
                                tx.color === '#10B981' ? '#15803D' : '#B45309',
                            },
                          ]}
                        >
                          {tx.initials}
                        </Text>
                      </View>
                      <View style={styles.txNameTextGroup}>
                        <Text style={styles.txName} numberOfLines={1}>{tx.name}</Text>
                        <Text style={styles.txRole}>{tx.role === 'Lender' ? t('table.lender') : t('table.borrower')}</Text>
                      </View>
                    </View>

                    {/* Type Badge */}
                    <View style={{ flex: 1.4, justifyContent: 'center' }}>
                      <Text
                        style={[
                          styles.txTypeBadge,
                          { color: tx.type === 'Lender' ? '#16A34A' : '#EA580C' },
                        ]}
                      >
                        {tx.type === 'Lender' ? `↗ ${t('table.lender')}` : `↘ ${t('table.borrower')}`}
                      </Text>
                    </View>

                    {/* Amount */}
                    <View style={{ flex: 1.6, justifyContent: 'center', alignItems: 'flex-end' }}>
                      <Text style={styles.txAmount} numberOfLines={1}>
                        {formatCurrency(tx.amount)}
                      </Text>
                    </View>

                    {/* Rate */}
                    <View style={{ flex: 1.6, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={styles.txRate} numberOfLines={1}>
                        {tx.rate}
                      </Text>
                    </View>

                    {/* Status Pill */}
                    <View style={{ flex: 1.4, justifyContent: 'center', alignItems: 'flex-end' }}>
                      <View
                        style={[
                          styles.statusPill,
                          {
                            backgroundColor:
                              tx.status === 'Active'
                                ? '#DCFCE7'
                                : tx.status === 'Pending'
                                ? '#FEF3C7'
                                : tx.status === 'Completed'
                                ? '#DBEAFE'
                                : tx.status === 'Rejected'
                                ? '#FEE2E2'
                                : '#E2E8F0',
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor:
                                tx.status === 'Active'
                                  ? '#16A34A'
                                  : tx.status === 'Pending'
                                  ? '#D97706'
                                  : tx.status === 'Completed'
                                  ? '#1D4ED8'
                                  : tx.status === 'Rejected'
                                  ? '#DC2626'
                                  : '#64748B',
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.statusText,
                            {
                              color:
                                tx.status === 'Active'
                                  ? '#15803D'
                                  : tx.status === 'Pending'
                                  ? '#B45309'
                                  : tx.status === 'Completed'
                                  ? '#1E40AF'
                                  : tx.status === 'Rejected'
                                  ? '#DC2626'
                                  : '#475569',
                            },
                          ]}
                        >
                          {tx.status === 'Active'
                            ? t('table.active')
                            : tx.status === 'Pending'
                            ? t('table.pending')
                            : tx.status === 'Completed'
                            ? t('table.completed')
                            : tx.status === 'Rejected'
                            ? t('table.rejected')
                            : tx.status}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={36} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>{t('dashboard.noTransactions')}</Text>
                <Text style={styles.emptySubtitle}>
                  {t('dashboard.noTransactionsSub')}
                </Text>
                <TouchableOpacity
                  style={styles.emptyAddBtn}
                  onPress={() => setAddModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add-circle" size={18} color="#056B38" style={{ marginRight: 6 }} />
                  <Text style={styles.emptyAddBtnText}>{t('modal.addNewRecord')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* 5. BANNER / CTA CARD: Track. Manage. Grow. */}
          <View style={styles.ctaBannerCard}>
            <View style={styles.ctaLeftGroup}>
              <View style={styles.ctaIconContainer}>
                <Ionicons name="shield-checkmark" size={24} color="#16A34A" />
              </View>
              <View style={styles.ctaTextGroup}>
                <Text style={styles.ctaTitle}>Track. Manage. Grow.</Text>
                <Text style={styles.ctaSubtitle}>
                  Manage your loans, track repayments and grow your financial clarity.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.ctaActionBtn}
              onPress={() => setAddModalVisible(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaActionBtnText}>Add New Record &gt;</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* 6. BOTTOM NAVIGATION BAR */}
      <View style={styles.bottomNavBar}>
        {/* Tab 1: Dashboard (Active) */}
        <TouchableOpacity style={styles.navTabItem} activeOpacity={0.8}>
          <Ionicons name="home" size={22} color="#056B38" />
          <Text style={styles.navTabLabelActive}>{t('nav.dashboard')}</Text>
        </TouchableOpacity>

        {/* Tab 2: Lenders */}
        <TouchableOpacity
          style={styles.navTabItem}
          onPress={() => navigation.navigate('LenderRecords')}
          activeOpacity={0.8}
        >
          <Ionicons name="people-outline" size={22} color="#64748B" />
          <Text style={styles.navTabLabel}>{t('nav.lenders')}</Text>
        </TouchableOpacity>

        {/* Center Floating + Button */}
        <View style={styles.centerFabAnchor}>
          <TouchableOpacity
            style={styles.centerFabBtn}
            onPress={() => setAddModalVisible(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={32} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Tab 4: Borrowers */}
        <TouchableOpacity
          style={styles.navTabItem}
          onPress={() => navigation.navigate('PersonRecords')}
          activeOpacity={0.8}
        >
          <Ionicons name="bar-chart-outline" size={22} color="#64748B" />
          <Text style={styles.navTabLabel}>{t('nav.borrowers')}</Text>
        </TouchableOpacity>

        {/* Tab 5: More */}
        <TouchableOpacity
          style={styles.navTabItem}
          onPress={() => setMenuModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="grid-outline" size={22} color="#64748B" />
          <Text style={styles.navTabLabel}>{t('nav.more')}</Text>
        </TouchableOpacity>
      </View>

      {/* QUICK ADD RECORD MODAL */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setAddModalVisible(false)}
        >
          <View style={styles.modalContentCard}>
            <View style={styles.modalDragHandle} />
            <Text style={styles.modalHeaderTitle}>{t('modal.addNewRecord')}</Text>
            <Text style={styles.modalHeaderSubtitle}>{t('modal.addSubtitle')}</Text>

            <TouchableOpacity
              style={styles.modalChoiceBtn}
              onPress={() => {
                setAddModalVisible(false);
                navigation.navigate('AddPerson');
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.modalChoiceIconCircle, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="person-add" size={22} color="#16A34A" />
              </View>
              <View style={styles.modalChoiceTextGroup}>
                <Text style={styles.modalChoiceTitle}>{t('modal.addBorrower')}</Text>
                <Text style={styles.modalChoiceDesc}>{t('modal.addBorrowerDesc')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalChoiceBtn}
              onPress={() => {
                setAddModalVisible(false);
                navigation.navigate('AddLenderRecord');
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.modalChoiceIconCircle, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="wallet" size={22} color="#2563EB" />
              </View>
              <View style={styles.modalChoiceTextGroup}>
                <Text style={styles.modalChoiceTitle}>{t('modal.addLender')}</Text>
                <Text style={styles.modalChoiceDesc}>{t('modal.addLenderDesc')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setAddModalVisible(false)}
            >
              <Text style={styles.modalCancelBtnText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* QUICK MENU MODAL */}
      <Modal
        visible={menuModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuModalVisible(false)}
        >
          <View style={styles.modalContentCard}>
            <View style={styles.modalDragHandle} />
            <Text style={styles.modalHeaderTitle}>{t('menu.moreOptions')}</Text>

            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => {
                setMenuModalVisible(false);
                navigation.navigate('Profile');
              }}
            >
              <Ionicons name="person-circle-outline" size={22} color="#056B38" />
              <Text style={styles.menuItemText}>{t('menu.myProfile')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => {
                setMenuModalVisible(false);
                navigation.navigate('IncomingRequests');
              }}
            >
              <Ionicons name="mail-unread-outline" size={22} color="#056B38" />
              <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.menuItemText}>Incoming Requests</Text>
                {pendingRequestsCount > 0 && (
                  <View style={{ backgroundColor: '#DC2626', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>{pendingRequestsCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => {
                setMenuModalVisible(false);
                navigation.navigate('SearchUser');
              }}
            >
              <Ionicons name="search-outline" size={22} color="#056B38" />
              <Text style={styles.menuItemText}>{t('menu.searchUsers')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => {
                setLanguage(language === 'en' ? 'te' : 'en');
                setMenuModalVisible(false);
              }}
            >
              <Ionicons name="language-outline" size={22} color="#056B38" />
              <Text style={styles.menuItemText}>
                {t('menu.language')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItemRow, { borderBottomWidth: 0 }]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={22} color="#DC2626" />
              <Text style={[styles.menuItemText, { color: '#DC2626', fontWeight: '700' }]}>
                {t('menu.logout')}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#0A4224',
  },
  topAppBar: {
    backgroundColor: '#0A4224',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  menuIconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#4ADE80',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    position: 'relative',
  },
  brandRupeeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  brandLeafIcon: {
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
  brandTextCol: {
    justifyContent: 'center',
  },
  brandTitleText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  brandSubtitleText: {
    color: '#4ADE80',
    fontSize: 12,
    fontWeight: '700',
    marginTop: -2,
  },
  topRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingHorizontal: 4,
    height: 16,
    minWidth: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  profileAvatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#F8FAF8',
    paddingBottom: 90,
  },
  mainWrapper: {
    paddingHorizontal: 16,
    paddingTop: 16,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  welcomeBannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        backgroundImage: 'linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 55%, #F0FDF4 100%)',
        boxShadow: '0 3px 12px rgba(5, 107, 56, 0.06)',
      },
    }),
  },
  pendingIncomingBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#FDE68A',
    ...Platform.select({
      ios: {
        shadowColor: '#D97706',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(217, 119, 6, 0.1)',
      },
    }),
  },
  pendingIncomingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
    gap: 10,
  },
  pendingIncomingIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#D97706',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingIncomingTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  pendingIncomingSubtitle: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
  },
  pendingIncomingAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingIncomingActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#056B38',
  },
  greetingTextGroup: {
    flex: 1,
    paddingRight: 8,
    justifyContent: 'center',
  },
  welcomeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  welcomeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#056B38',
  },
  handWave: {
    fontSize: 15,
  },
  userNameText: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  welcomeSubText: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 16,
  },
  bannerIllustration: {
    width: 116,
    height: 90,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#056B38',
  },
  toolsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 20,
  },
  toolCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 104,
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
  toolIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  toolLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 14,
  },
  transactionCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    marginBottom: 20,
    ...Platform.select({
      web: { boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
    }),
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableColHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  txColName: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  txAvatarText: {
    fontSize: 11,
    fontWeight: '800',
  },
  txNameTextGroup: {
    flex: 1,
  },
  txName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  txRole: {
    fontSize: 10,
    color: '#64748B',
  },
  txTypeBadge: {
    fontSize: 11,
    fontWeight: '700',
  },
  txAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  txRate: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginTop: 10,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 16,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  emptyAddBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#056B38',
  },
  ctaBannerCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ctaLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  ctaIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  ctaTextGroup: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#14532D',
  },
  ctaSubtitle: {
    fontSize: 10,
    color: '#166534',
    marginTop: 2,
    lineHeight: 14,
  },
  ctaActionBtn: {
    backgroundColor: '#0A4224',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ctaActionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  bottomNavBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 99,
    ...Platform.select({
      web: { boxShadow: '0 -2px 10px rgba(0,0,0,0.06)' },
    }),
  },
  navTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTabLabelActive: {
    fontSize: 10,
    fontWeight: '700',
    color: '#056B38',
    marginTop: 2,
  },
  navTabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  centerFabAnchor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerFabBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0A4224',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -22,
    shadowColor: '#0A4224',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContentCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
  },
  modalDragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  modalHeaderSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 18,
  },
  modalChoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    marginBottom: 12,
  },
  modalChoiceIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  modalChoiceTextGroup: {
    flex: 1,
  },
  modalChoiceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalChoiceDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalCancelBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    marginTop: 6,
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
});
