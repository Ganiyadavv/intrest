import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, Platform, Modal } from 'react-native';
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
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);

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

  const handleDeleteNotification = (id: string) => {
    setNotificationToDelete(id);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!notificationToDelete) return;
    const id = notificationToDelete;
    
    // Optimistic UI update
    setNotifications(prev => prev.filter(n => n.id !== id));
    setDeleteModalVisible(false);
    setNotificationToDelete(null);
    
    try {
      await notificationService.deleteNotification(id);
    } catch (err) {
      console.log('Failed to delete notification', err);
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setNotificationToDelete(null);
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
          <TouchableOpacity 
            onPress={() => handleDeleteNotification(item.id)}
            style={styles.deleteAction}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={20} color="#E74C3C" />
          </TouchableOpacity>
          <View style={styles.viewDetailsAction}>
            <Text style={styles.actionText}>View Details</Text>
            <Ionicons name="chevron-forward" size={16} color="#3498DB" />
          </View>
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

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={cancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="trash-outline" size={32} color="#E74C3C" />
            </View>
            <Text style={styles.modalTitle}>Delete Notification</Text>
            <Text style={styles.modalText}>Are you sure you want to delete this notification? This action cannot be undone.</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={cancelDelete}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmDeleteButton} onPress={confirmDelete}>
                <Text style={styles.confirmDeleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, borderTopWidth: 1, borderTopColor: '#ECF0F1', paddingTop: 12 },
  deleteAction: { padding: 4 },
  viewDetailsAction: { flexDirection: 'row', alignItems: 'center' },
  actionText: { fontSize: 14, fontWeight: 'bold', color: '#3498DB', marginRight: 4 },
  
  /* Modal Styles */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modalContent: { width: '85%', backgroundColor: '#FFF', borderRadius: 20, padding: 24, alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  modalIconContainer: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FDEDEC', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#2C3E50', marginBottom: 8 },
  modalText: { fontSize: 15, color: '#7F8C8D', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  cancelButton: { flex: 1, paddingVertical: 12, marginRight: 8, borderRadius: 12, backgroundColor: '#F2F4F4', alignItems: 'center' },
  cancelButtonText: { color: '#7F8C8D', fontSize: 16, fontWeight: 'bold' },
  confirmDeleteButton: { flex: 1, paddingVertical: 12, marginLeft: 8, borderRadius: 12, backgroundColor: '#E74C3C', alignItems: 'center' },
  confirmDeleteButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});
