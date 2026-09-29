import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { MainStackParamList } from '../types/navigation';
import { notificationService } from '../services/notificationService';
import { Loading } from '../components/Loading';
import { ErrorMessage } from '../components/ErrorMessage';

type NotificationsNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Notifications'>;

interface Props {
  navigation: NotificationsNavigationProp;
}

export const NotificationsScreen: React.FC<Props> = ({ navigation }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchNotifications = async () => {
    try {
      setError('');
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (err: any) {
      setError('Failed to fetch notifications.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleNotificationPress = async (item: any) => {
    const isUnread = item.isRead === false || item.status === 'UNREAD';
    
    // Optimistic UI update
    if (isUnread) {
      setNotifications(prev => 
        prev.map(n => n.id === item.id ? { ...n, isRead: true, status: 'READ' } : n)
      );
      // Call API in background
      try {
        await notificationService.markNotificationAsRead(item.id);
      } catch (err) {
        console.log('Failed to mark as read', err);
        // Optionally revert if strict consistency is needed
      }
    }
    
    // Navigate (assuming personRecordId is available or we navigate to details)
    navigation.navigate('NotificationDetails', { id: item.id });
  };

  const renderItem = ({ item }: { item: any }) => {
    const isUnread = item.isRead === false || item.status === 'UNREAD';

    return (
      <TouchableOpacity 
        style={[styles.card, isUnread && styles.unreadCard]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          {isUnread && <View style={styles.unreadDot} />}
          <View style={styles.iconContainer}>
            <Ionicons name="notifications" size={24} color={isUnread ? '#3498DB' : '#7F8C8D'} />
          </View>
          <View style={styles.contentContainer}>
            <Text style={[styles.title, isUnread ? styles.unreadText : styles.readText]}>
              {item.title || 'Notification'}
            </Text>
            <Text style={styles.message}>{item.message || 'You have a new notification.'}</Text>
            <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleString()}</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <Text style={styles.actionText}>View Details</Text>
          <Ionicons name="chevron-forward" size={16} color="#3498DB" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.topDarkSection}>
        <View style={styles.customHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      {/* WAVE */}
      <View style={styles.waveConnectorDark}>
        <View style={styles.waveConnectorLightCutout} />
      </View>

      <View style={styles.bottomLightSection}>
        {loading ? (
          <Loading />
        ) : (
          <>
            {error ? <ErrorMessage message={error} /> : null}
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={
                !loading ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="notifications-off-outline" size={64} color="#BDC3C7" />
                    <Text style={styles.emptyText}>No notifications</Text>
                    <Text style={styles.emptySubText}>You're all caught up!</Text>
                  </View>
                ) : null
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
  topDarkSection: { backgroundColor: '#1A1B2F', paddingTop: 80, paddingHorizontal: 24, paddingBottom: 40, borderBottomRightRadius: 80, zIndex: 10 },
  waveConnectorDark: { height: 80, backgroundColor: '#1A1B2F', marginTop: -1, zIndex: 1 },
  waveConnectorLightCutout: { flex: 1, backgroundColor: '#E9EFF5', borderTopLeftRadius: 80 },
  bottomLightSection: { backgroundColor: '#E9EFF5', flex: 1, paddingHorizontal: 16, marginTop: -1 },
  customHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backButton: { padding: 8 },
  headerTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  listContainer: { paddingBottom: 40, paddingTop: 10 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 },
  unreadCard: { backgroundColor: '#F4FAFF' },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3498DB', marginTop: 10, marginRight: 8 },
  iconContainer: { marginRight: 12, marginTop: 2 },
  contentContainer: { flex: 1 },
  title: { fontSize: 18, marginBottom: 4 },
  unreadText: { color: '#2C3E50', fontWeight: 'bold' },
  readText: { color: '#7F8C8D', fontWeight: '600' },
  message: { fontSize: 14, color: '#7F8C8D', marginBottom: 8, lineHeight: 20 },
  dateText: { fontSize: 12, color: '#BDC3C7' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 12, borderTopWidth: 1, borderTopColor: '#ECF0F1', paddingTop: 12 },
  actionText: { fontSize: 14, fontWeight: 'bold', color: '#3498DB', marginRight: 4 }
});
