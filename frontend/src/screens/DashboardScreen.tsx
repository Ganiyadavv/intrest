import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../types/navigation';
import { AppHeader } from '../components/AppHeader';
import { Loading } from '../components/Loading';
import { useFocusEffect } from '@react-navigation/native';
import { getUser, clearStorage } from '../storage/storage';
import { User } from '../types/user';
import { PersonRecord } from '../types/personRecord';
import { personRecordService } from '../services/personRecordService';
import { formatCurrency } from '../utils/currency';
import { notificationService } from '../services/notificationService';

const { width } = Dimensions.get('window');

interface Props {
  navigation: DashboardScreenNavigationProp;
}

export const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [personRecords, setPersonRecords] = useState<PersonRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadData = async () => {
    try {
      const storedUser = await getUser();
      setUser(storedUser);
      const records = await personRecordService.getPersonRecords();
      setPersonRecords(records);
      const notifications = await notificationService.getNotifications();
      const count = notifications.filter((n: any) => n.isRead === false || n.status === 'UNREAD').length;
      setUnreadCount(count);
    } catch (error) {
      console.log('Error loading dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const handleLogout = async () => {
    await clearStorage();
    navigation.getParent()?.reset({
      index: 0,
      routes: [{ name: 'Auth' }],
    });
  };

  const renderNeumorphicButton = (
    title: string, 
    screen: keyof MainStackParamList, 
    iconName: keyof typeof Ionicons.glyphMap, 
    iconColor: string,
    badgeCount?: number
  ) => (
    <TouchableOpacity 
      style={styles.neuButtonWrapper}
      onPress={() => navigation.navigate(screen)}
      activeOpacity={0.6}
    >
      <View style={styles.neuButtonOuter}>
        <View style={styles.neuButtonInner}>
          <Ionicons name={iconName} size={28} color={iconColor} />
          {!!badgeCount && badgeCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {badgeCount > 99 ? '99+' : badgeCount}
              </Text>
            </View>
          )}
        </View>
      </View>
      <Text style={styles.neuButtonText}>{title}</Text>
    </TouchableOpacity>
  );



  // Calculate Aggregates
  let totalPrincipal = 0;
  let activeRecords = 0;
  let completedRecords = 0;

  const recordsList = Array.isArray(personRecords) ? personRecords : [];
  recordsList.forEach(person => {
    totalPrincipal += Number(person.amount) || 0;
    if (person.status === 'PENDING' || person.status === 'ACCEPTED') {
      activeRecords++;
    } else if (person.status === 'COMPLETED') {
      completedRecords++;
    }
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        <View style={styles.mainBackground}>
          
          {/* TOP DARK SECTION (Top half of the S curve) */}
          <View style={styles.topDarkSection}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.greetingText}>Good Morning,</Text>
                <Text style={styles.userName}>{user?.firstName || 'User'}!</Text>
              </View>
              <TouchableOpacity style={styles.profileAvatar} onPress={() => navigation.navigate('Profile')} activeOpacity={0.8}>
                <Text style={styles.avatarInitials}>{user?.firstName?.[0]?.toUpperCase() || 'U'}</Text>
              </TouchableOpacity>
            </View>

            {/* Neon Hero Card */}
            <View style={styles.neonCard}>
              <View style={styles.neonCardHeader}>
                <View style={styles.neonIconWrapper}>
                  <Ionicons name="albums" size={20} color="#FF6BE7" />
                </View>
                <Text style={styles.neonCardTitle}>Records Overview</Text>
              </View>

              <View style={styles.neonStatsRow}>
                <View style={styles.neonStatItem}>
                   <Text style={styles.neonStatValue}>{activeRecords}</Text>
                   <Text style={styles.neonStatLabel}>Active Loans</Text>
                </View>
                <View style={styles.neonStatItem}>
                   <Text style={styles.neonStatValue}>{completedRecords}</Text>
                   <Text style={styles.neonStatLabel}>Completed</Text>
                </View>
              </View>

              {/* Glowing Progress Bar Simulator */}
              <View style={styles.neonProgressTrack}>
                 <View style={styles.neonProgressFill} />
              </View>
              <Text style={styles.neonProgressText}>{formatCurrency(totalPrincipal)} Total Principal</Text>
            </View>
          </View>

          {/* THE WAVE CONNECTOR (Bottom half of the S curve) */}
          <View style={styles.waveConnectorDark}>
             <View style={styles.waveConnectorLightCutout} />
          </View>

          {/* BOTTOM LIGHT SECTION */}
          <View style={styles.bottomLightSection}>
            
            <View style={styles.neuGrid}>
              {renderNeumorphicButton('Borrower\nRecords', 'PersonRecords', 'people', '#10B981')}
              {renderNeumorphicButton('Interest\nCalculator', 'InterestCalculator', 'calculator', '#F5A623')}
              {renderNeumorphicButton('Rate\nCalculator', 'RateCalculator', 'pie-chart', '#FF6BE7')}
              {renderNeumorphicButton('Notifications', 'Notifications', 'notifications', '#FBBF24', unreadCount)}
              {renderNeumorphicButton('Search', 'SearchUser', 'search', '#50E3C2')}
              {renderNeumorphicButton('Profile', 'Profile', 'person', '#B865D6')}
              {renderNeumorphicButton('Logout', 'Auth', 'log-out', '#E74C3C')}
            </View>

          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E9EFF5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  mainBackground: {
    flex: 1,
    backgroundColor: '#E9EFF5',
  },
  topDarkSection: {
    backgroundColor: '#1A1B2F',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
    borderBottomRightRadius: 80,
    zIndex: 10, // Ensure shadow/border overlaps properly
  },
  waveConnectorDark: {
    height: 80,
    backgroundColor: '#1A1B2F',
    marginTop: -1, // Prevent subpixel rendering gap
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
    paddingHorizontal: 24,
    paddingBottom: 120, // space for FAB
    marginTop: -1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  greetingText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    marginBottom: 4,
  },
  userName: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#262845',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  avatarInitials: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
  },
  neonCard: {
    backgroundColor: 'rgba(38, 40, 69, 0.9)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 15,
  },
  neonCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  neonIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 231, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  neonCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  neonStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  neonStatItem: {
    flex: 1,
  },
  neonStatValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 4,
  },
  neonStatLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
  neonProgressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  neonProgressFill: {
    width: '60%',
    height: '100%',
    backgroundColor: '#4D8BFF',
    borderRadius: 3,
    shadowColor: '#4D8BFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  neonProgressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'right',
  },
  neuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingTop: 30,
    gap: 15,
  },
  neuButtonWrapper: {
    width: (width - 48 - 30) / 3, // 3 columns, minus padding and gaps
    alignItems: 'center',
    marginBottom: 24,
  },
  neuButtonOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E9EFF5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: -6, height: -6 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 12,
  },
  neuButtonInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E9EFF5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#A3B1C6',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  neuButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7A93',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1A1B2F',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1A1B2F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  notificationBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E74C3C',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  }
});
