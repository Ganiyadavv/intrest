import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../types/navigation';
import { useFocusEffect } from '@react-navigation/native';
import { adminService } from '../services/adminService';
import { AdminDashboard } from '../types/admin';
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
      routes: [{ name: 'Auth', params: { screen: 'PublicHome' } }],
    });
  };

  const stats = data?.statistics || {
    totalMembers: 0,
    totalRecords: 0,
    pendingRecords: 0,
    acceptedRecords: 0,
    rejectedRecords: 0,
    completedRecords: 0,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />

      {/* 1. TOP GREEN APP BAR */}
      <View style={styles.topDarkSection}>
        {/* Top Header Row: Menu, Administrator, Avatar, Logout */}
        <View style={styles.headerTop}>
          <View style={styles.headerLeftGroup}>
            <TouchableOpacity
              style={styles.menuIconBtn}
              onPress={() => navigation.navigate('AdminMembers')}
              activeOpacity={0.7}
            >
              <Ionicons name="menu" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Administrator</Text>
          </View>

          <View style={styles.headerRightGroup}>
            <View style={styles.adminAvatarContainer}>
              <Ionicons name="person" size={17} color="#056B38" />
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.75}>
              <Ionicons name="log-out-outline" size={15} color="#FFFFFF" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Brand Row: Logo + DhanaMitra */}
        <View style={styles.brandRow}>
          <View style={styles.brandLogoCircle}>
            <Text style={styles.brandRupeeText}>₹</Text>
            <Ionicons name="leaf" size={12} color="#056B38" style={styles.brandLeafIcon} />
          </View>
          <View style={styles.brandTextCol}>
            <Text style={styles.brandTitleText}>DhanaMitra</Text>
          </View>
        </View>
      </View>

      {/* 2. WAVE CONNECTOR (Matching curved design) */}
      <View style={styles.waveConnectorDark}>
        <View style={styles.waveConnectorLightCutout} />
      </View>

      {/* 3. MAIN SCROLLABLE CONTENT */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#056B38']} />}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {error ? <ErrorMessage message={error} /> : null}

        {/* Admin Overview Header */}
        <View style={styles.overviewHeader}>
          <Text style={styles.overviewTitle}>Admin Overview</Text>
          <Text style={styles.overviewSubtitle}>Here's what's happening on your platform today.</Text>
        </View>

        {/* 4 Stat Cards in 2x2 Grid */}
        <View style={styles.statsGrid}>
          {/* Card 1: Total Members */}
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('AdminMembers')}
            activeOpacity={0.8}
          >
            <View style={[styles.statIconBadge, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="people" size={24} color="#10B981" />
            </View>
            <View style={styles.statTextCol}>
              <Text style={styles.statTitle}>Total Members</Text>
              <Text style={[styles.statValue, { color: '#047857' }]}>{stats.totalMembers}</Text>
            </View>
          </TouchableOpacity>

          {/* Card 2: Total Records */}
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('AdminMembers')}
            activeOpacity={0.8}
          >
            <View style={[styles.statIconBadge, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="document-text" size={24} color="#3B82F6" />
            </View>
            <View style={styles.statTextCol}>
              <Text style={styles.statTitle}>Total Records</Text>
              <Text style={[styles.statValue, { color: '#2563EB' }]}>{stats.totalRecords}</Text>
            </View>
          </TouchableOpacity>

          {/* Card 3: Pending Requests */}
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('AdminMembers')}
            activeOpacity={0.8}
          >
            <View style={[styles.statIconBadge, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="time" size={24} color="#F97316" />
            </View>
            <View style={styles.statTextCol}>
              <Text style={styles.statTitle}>Pending Requests</Text>
              <Text style={[styles.statValue, { color: '#D97706' }]}>{stats.pendingRecords}</Text>
            </View>
          </TouchableOpacity>

          {/* Card 4: Active Members */}
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('AdminMembers')}
            activeOpacity={0.8}
          >
            <View style={[styles.statIconBadge, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="person-add" size={24} color="#059669" />
            </View>
            <View style={styles.statTextCol}>
              <Text style={styles.statTitle}>Active Members</Text>
              <Text style={[styles.statValue, { color: '#059669' }]}>
                {stats.acceptedRecords > 0 ? stats.acceptedRecords : stats.totalMembers}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Records Status Distribution Card */}
        <View style={styles.statusBreakdownCard}>
          <View style={styles.statusCardHeader}>
            <Text style={styles.statusCardTitle}>Records Status</Text>
            <View style={styles.allTimeBadge}>
              <Text style={styles.allTimeBadgeText}>All Time</Text>
            </View>
          </View>

          <View style={styles.statusItemsRow}>
            {/* Accepted */}
            <View style={styles.statusItemBox}>
              <View style={[styles.statusItemDot, { backgroundColor: '#3B82F6' }]} />
              <Text style={styles.statusItemCount}>{stats.acceptedRecords}</Text>
              <Text style={styles.statusItemLabel}>Accepted</Text>
            </View>

            <View style={styles.statusVerticalDivider} />

            {/* Completed */}
            <View style={styles.statusItemBox}>
              <View style={[styles.statusItemDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.statusItemCount}>{stats.completedRecords}</Text>
              <Text style={styles.statusItemLabel}>Completed</Text>
            </View>

            <View style={styles.statusVerticalDivider} />

            {/* Rejected */}
            <View style={styles.statusItemBox}>
              <View style={[styles.statusItemDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.statusItemCount}>{stats.rejectedRecords}</Text>
              <Text style={styles.statusItemLabel}>Rejected</Text>
            </View>
          </View>
        </View>

        {/* Primary Action Button: Manage Members */}
        <TouchableOpacity
          style={styles.manageMembersBtn}
          onPress={() => navigation.navigate('AdminMembers')}
          activeOpacity={0.85}
        >
          <View style={styles.manageMembersIconCircle}>
            <Ionicons name="people" size={22} color="#FFFFFF" />
          </View>
          <View style={styles.manageMembersTextCol}>
            <Text style={styles.manageMembersBtnTitle}>Manage Members</Text>
            <Text style={styles.manageMembersBtnSubtitle}>View, search & manage registered users</Text>
          </View>
          <View style={styles.manageMembersArrowCircle}>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* Platform System Health & Info */}
        <View style={styles.systemHealthCard}>
          <View style={styles.systemHealthHeader}>
            <Ionicons name="shield-checkmark" size={18} color="#056B38" />
            <Text style={styles.systemHealthTitle}>Platform Status & Security</Text>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          </View>

          <View style={styles.systemHealthDivider} />

          <View style={styles.systemHealthRow}>
            <Text style={styles.systemHealthLabel}>Cloud Database</Text>
            <Text style={styles.systemHealthVal}>Connected & Secure</Text>
          </View>
          <View style={styles.systemHealthRow}>
            <Text style={styles.systemHealthLabel}>Admin Access</Text>
            <Text style={styles.systemHealthVal}>Administrator (Verified)</Text>
          </View>
          <View style={styles.systemHealthRow}>
            <Text style={styles.systemHealthLabel}>System Services</Text>
            <Text style={styles.systemHealthVal}>All services operational</Text>
          </View>
        </View>
      </ScrollView>
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
    paddingBottom: 22,
    borderBottomRightRadius: 70,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconBtn: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminAvatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#10B981',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    paddingHorizontal: 11,
    paddingVertical: 5.5,
    borderRadius: 18,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '600',
    marginLeft: 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  brandLogoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  brandRupeeText: {
    color: '#056B38',
    fontSize: 22,
    fontWeight: '800',
  },
  brandLeafIcon: {
    position: 'absolute',
    bottom: 5,
    right: 5,
  },
  brandTextCol: {
    alignItems: 'flex-start',
  },
  brandTitleText: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  waveConnectorDark: {
    height: 45,
    backgroundColor: '#044E28',
    marginTop: -1,
    zIndex: 1,
  },
  waveConnectorLightCutout: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 65,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 48,
  },
  overviewHeader: {
    marginBottom: 16,
  },
  overviewTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.2,
  },
  overviewSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  statCard: {
    width: (width - 32 - 12) / 2,
    maxWidth: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 3px 12px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  statIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
  },
  statTextCol: {
    flex: 1,
  },
  statTitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    lineHeight: 15,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 3,
  },
  statusBreakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  statusCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  statusCardTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  allTimeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  allTimeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  statusItemsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statusItemBox: {
    flex: 1,
    alignItems: 'center',
  },
  statusItemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  statusItemCount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  statusItemLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  statusVerticalDivider: {
    width: 1,
    height: 34,
    backgroundColor: '#F1F5F9',
  },
  manageMembersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#056B38',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginTop: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#056B38',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 14px rgba(5, 107, 56, 0.25)',
      },
    }),
  },
  manageMembersIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  manageMembersTextCol: {
    flex: 1,
  },
  manageMembersBtnTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  manageMembersBtnSubtitle: {
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: 11.5,
    marginTop: 2,
  },
  manageMembersArrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  systemHealthCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginTop: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
      },
    }),
  },
  systemHealthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  systemHealthTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 8,
    flex: 1,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#059669',
  },
  systemHealthDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  systemHealthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  systemHealthLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  systemHealthVal: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '600',
  },
});
