import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../types/navigation';
import { userService } from '../services/userService';
import { authService } from '../services/authService';
import { User } from '../types/user';
import { COLORS } from '../constants/colors';
import { Loading } from '../components/Loading';
import { ErrorMessage } from '../components/ErrorMessage';
import { ProfileImage } from '../components/ProfileImage';
import { Ionicons } from '@expo/vector-icons';

type ProfileScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Profile'>;

interface Props {
  navigation: ProfileScreenNavigationProp;
}

export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await userService.getProfile();
      setUser(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchProfile();
    });
    return unsubscribe;
  }, [navigation]);

  const handleLogoutPress = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await authService.logoutUser();
    navigation.getParent()?.reset({
      index: 0,
      routes: [{ name: 'Auth' }],
    });
  };

  if (loading && !user) {
    return (
      <SafeAreaView style={styles.container}>
        <Loading fullScreen message="Loading Profile..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} bounces={false}>
        
        {/* TOP DARK SECTION */}
        <View style={styles.topDarkSection}>
          <View style={styles.customHeader}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <View style={styles.backButtonInner}>
                <Ionicons name="arrow-back" size={20} color="#FFF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Profile</Text>
            <View style={{ width: 40 }} />
          </View>

          <ErrorMessage message={error} />
          
          {user && (
            <>
              <View style={styles.profileHeaderNeu}>
                <View style={styles.avatarContainerNeu}>
                  <ProfileImage uri={user.profileImage} />
                </View>
                <Text style={styles.profileNameNeu}>{user.firstName} {user.lastName}</Text>
                <View style={styles.roleBadgeNeu}>
                  <Text style={styles.roleTextNeu}>{user.role}</Text>
                </View>
              </View>

              <View style={styles.neonFinancialCard}>
                <Text style={styles.readOnlyLabelNeu}>User ID</Text>
                <Text style={styles.readOnlyValueNeu}>{user.userId}</Text>
              </View>
            </>
          )}
        </View>

        {/* THE WAVE CONNECTOR */}
        <View style={styles.waveConnectorDark}>
           <View style={styles.waveConnectorLightCutout} />
        </View>

        {/* BOTTOM LIGHT SECTION */}
        <View style={styles.bottomLightSection}>
          <View style={styles.content}>
            
            {user && (
              <>
                {/* Details Card */}
                <View style={styles.cardNeu}>
                  <Text style={styles.cardTitleNeu}>Personal Information</Text>
                  
                  <View style={styles.infoListNeu}>
                    <View style={styles.infoListItemNeu}>
                      <View style={styles.infoIconContainerNeu}><Ionicons name="mail" size={20} color="#4A90E2" /></View>
                      <View style={styles.infoTextContainerNeu}>
                        <Text style={styles.infoListLabelNeu}>Email</Text>
                        <Text style={styles.infoListValueNeu}>{user.email}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.infoListItemNeu}>
                      <View style={styles.infoIconContainerNeu}><Ionicons name="call" size={20} color="#4A90E2" /></View>
                      <View style={styles.infoTextContainerNeu}>
                        <Text style={styles.infoListLabelNeu}>Phone</Text>
                        <Text style={styles.infoListValueNeu}>{user.phoneNumber}</Text>
                      </View>
                    </View>

                    <View style={styles.infoListItemNeu}>
                      <View style={styles.infoIconContainerNeu}><Ionicons name="information-circle" size={20} color="#4A90E2" /></View>
                      <View style={styles.infoTextContainerNeu}>
                        <Text style={styles.infoListLabelNeu}>Status</Text>
                        <Text style={[styles.infoListValueNeu, { color: user.status === 'ACTIVE' ? '#50E3C2' : '#E74C3C' }]}>{user.status}</Text>
                      </View>
                    </View>

                    <View style={styles.infoListItemNeu}>
                      <View style={styles.infoIconContainerNeu}><Ionicons name="location" size={20} color="#4A90E2" /></View>
                      <View style={styles.infoTextContainerNeu}>
                        <Text style={styles.infoListLabelNeu}>Address</Text>
                        <Text style={styles.infoListValueNeu}>
                          {user.address ? `${user.address}, ${user.city || ''}, ${user.state || ''} - ${user.pincode || ''}` : 'Not provided'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.actionsContainerNeu}>
                  <TouchableOpacity 
                    style={styles.actionBtnNeuPrimary} 
                    onPress={() => navigation.navigate('EditProfile')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="pencil" size={20} color="#FFF" style={{marginRight: 8}}/>
                    <Text style={styles.actionBtnTextNeuPrimary}>Edit Profile</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.actionBtnNeuPrimary, { backgroundColor: '#F39C12' }]} 
                    onPress={() => navigation.navigate('ChangePassword')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="lock-closed" size={20} color="#FFF" style={{marginRight: 8}}/>
                    <Text style={styles.actionBtnTextNeuPrimary}>Change Password</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.actionBtnNeuDanger} 
                    onPress={handleLogoutPress}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="log-out" size={20} color="#E74C3C" style={{marginRight: 8}}/>
                    <Text style={styles.actionBtnTextNeuDanger}>Logout</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

          </View>
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="log-out-outline" size={32} color="#E74C3C" />
              <Text style={styles.modalTitle}>Logout</Text>
            </View>
            <Text style={styles.modalMessage}>Are you sure you want to logout?</Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelBtn} 
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalConfirmBtn} 
                onPress={confirmLogout}
              >
                <Text style={styles.modalConfirmBtnText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E9EFF5',
  },
  topDarkSection: {
    backgroundColor: '#1A1B2F',
    paddingTop: 40,
    paddingHorizontal: 24,
    paddingBottom: 40,
    borderBottomRightRadius: 80,
    zIndex: 10,
  },
  waveConnectorDark: {
    height: 80,
    backgroundColor: '#1A1B2F',
    marginTop: -1, 
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
    marginTop: -1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#E9EFF5',
  },
  content: {
    paddingTop: 16,
    paddingBottom: 60,
  },
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  backButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  profileHeaderNeu: {
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarContainerNeu: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(77, 139, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#4D8BFF',
    shadowColor: '#4D8BFF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  profileNameNeu: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 8,
  },
  roleBadgeNeu: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  roleTextNeu: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E0E7FF',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  neonFinancialCard: {
    backgroundColor: 'rgba(38, 40, 69, 0.95)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 10,
    marginBottom: 24,
  },
  readOnlyLabelNeu: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginBottom: 4,
  },
  readOnlyValueNeu: {
    color: '#4D8BFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
  },
  cardNeu: {
    backgroundColor: '#E9EFF5',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: -6, height: -6 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  cardTitleNeu: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2C3E50',
    marginBottom: 20,
  },
  infoListNeu: {
    gap: 16,
  },
  infoListItemNeu: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIconContainerNeu: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#A3B1C6',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTextContainerNeu: {
    flex: 1,
    justifyContent: 'center',
  },
  infoListLabelNeu: {
    fontSize: 12,
    color: '#6B7A93',
    marginBottom: 2,
    fontWeight: '600',
  },
  infoListValueNeu: {
    fontSize: 15,
    color: '#2C3E50',
    fontWeight: '700',
  },
  actionsContainerNeu: {
    gap: 16,
    marginTop: 8,
  },
  actionBtnNeuPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  actionBtnTextNeuPrimary: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  actionBtnNeuDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9EFF5',
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: -4, height: -4 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 5,
  },
  actionBtnTextNeuDanger: {
    color: '#E74C3C',
    fontSize: 16,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2C3E50',
    marginTop: 12,
  },
  modalMessage: {
    fontSize: 15,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E6ED',
    alignItems: 'center',
  },
  modalCancelBtnText: {
    color: '#7F8C8D',
    fontSize: 15,
    fontWeight: '700',
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#E74C3C',
    alignItems: 'center',
  },
  modalConfirmBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
