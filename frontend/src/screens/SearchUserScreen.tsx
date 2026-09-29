import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Keyboard, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AppInput } from '../components/AppInput';
import { AppButton } from '../components/AppButton';
import { ErrorMessage } from '../components/ErrorMessage';
import { ProfileImage } from '../components/ProfileImage';
import { userService } from '../services/userService';
import { User } from '../types/user';
import { COLORS } from '../constants/colors';

export const SearchUserScreen: React.FC = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchedUsers, setSearchedUsers] = useState<User[]>([]);

  const validateUserId = (id: string) => {
    const regex = /^USR-[A-Z0-9]{8}$/;
    return regex.test(id);
  };

  const toTitleCase = (str: string) => {
    return str.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  };

  const handleSearch = async () => {
    Keyboard.dismiss();
    setError('');
    setSearchedUsers([]);

    const trimmedInput = searchQuery.trim();
    setSearchQuery(trimmedInput);

    if (!trimmedInput) {
      setError('Please enter a name or User ID.');
      return;
    }

    setLoading(true);

    try {
      if (trimmedInput.toUpperCase().startsWith('USR-')) {
        if (!validateUserId(trimmedInput.toUpperCase())) {
          setError('Please enter a valid User ID.\nExample: USR-7K4M9X2Q');
          setLoading(false);
          return;
        }
        const user = await userService.searchUserByUserId(trimmedInput.toUpperCase());
        setSearchedUsers(user ? [user] : []);
      } else {
        const formattedName = toTitleCase(trimmedInput);
        const users = await userService.searchUsersByName(formattedName);
        setSearchedUsers(Array.isArray(users) ? users : users ? [users] : []);
        if ((!users || (Array.isArray(users) && users.length === 0))) {
           setError('No users found with that name.');
        }
      }
    } catch (err: any) {
      if (err.statusCode === 400) {
        setError('Invalid search format.');
      } else if (err.statusCode === 404) {
        setError('User not found.');
      } else if (err.message && err.message.toLowerCase().includes('network error')) {
        setError('Unable to connect to server. Please check your internet connection.');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setSearchedUsers([]);
    setError('');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.topDarkSection}>
        <View style={styles.customHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Search User</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerSubtitle}>Find registered users by name or unique ID</Text>
      </View>

      {/* WAVE */}
      <View style={styles.waveConnectorDark}>
         <View style={styles.waveConnectorLightCutout} />
      </View>

      <ScrollView style={styles.bottomLightSection} contentContainerStyle={styles.content} bounces={false}>

        
        <View style={styles.cardNeu}>
          <AppInput
            label="Name or User ID"
            placeholder="e.g., Gani or USR-7K4M9X2Q"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (error) setError('');
            }}
          />

          <ErrorMessage message={error} />

          <AppButton
            title={loading ? "Searching..." : "Search User"}
            onPress={handleSearch}
            disabled={loading}
          />
        </View>

        {searchedUsers.length > 0 && (
          <View>
            {searchedUsers.map((searchedUser, index) => (
              <View key={searchedUser.id || index} style={styles.cardNeu}>
                <Text style={styles.cardTitleNeu}>User Found</Text>
                
                <View style={styles.profileImageContainer}>
                  <ProfileImage uri={searchedUser.profileImage} />
                </View>

                <View style={styles.infoListNeu}>
                  <View style={styles.infoListItemNeu}>
                    <View style={[styles.infoIconContainerNeu, { backgroundColor: 'rgba(74, 144, 226, 0.1)' }]}><Ionicons name="id-card" size={20} color="#4A90E2" /></View>
                    <View style={styles.infoTextContainerNeu}>
                      <Text style={styles.infoListLabelNeu}>User ID</Text>
                      <Text style={styles.infoListValueNeu}>{searchedUser.userId}</Text>
                    </View>
                  </View>

                  <View style={styles.infoListItemNeu}>
                    <View style={[styles.infoIconContainerNeu, { backgroundColor: 'rgba(46, 204, 113, 0.1)' }]}><Ionicons name="person" size={20} color="#2ECC71" /></View>
                    <View style={styles.infoTextContainerNeu}>
                      <Text style={styles.infoListLabelNeu}>Name</Text>
                      <Text style={styles.infoListValueNeu}>{searchedUser.firstName} {searchedUser.lastName}</Text>
                    </View>
                  </View>

                  <View style={styles.infoListItemNeu}>
                    <View style={[styles.infoIconContainerNeu, { backgroundColor: 'rgba(230, 126, 34, 0.1)' }]}><Ionicons name="mail" size={20} color="#E67E22" /></View>
                    <View style={styles.infoTextContainerNeu}>
                      <Text style={styles.infoListLabelNeu}>Email</Text>
                      <Text style={styles.infoListValueNeu}>{searchedUser.email}</Text>
                    </View>
                  </View>

                  <View style={styles.infoListItemNeu}>
                    <View style={[styles.infoIconContainerNeu, { backgroundColor: 'rgba(155, 89, 182, 0.1)' }]}><Ionicons name="call" size={20} color="#9B59B6" /></View>
                    <View style={styles.infoTextContainerNeu}>
                      <Text style={styles.infoListLabelNeu}>Phone</Text>
                      <Text style={styles.infoListValueNeu}>{searchedUser.phoneNumber}</Text>
                    </View>
                  </View>

                  <View style={styles.infoListItemNeu}>
                    <View style={[styles.infoIconContainerNeu, { backgroundColor: 'rgba(52, 73, 94, 0.1)' }]}><Ionicons name="star" size={20} color="#34495E" /></View>
                    <View style={styles.infoTextContainerNeu}>
                      <Text style={styles.infoListLabelNeu}>Status</Text>
                      <Text style={[styles.infoListValueNeu, { color: searchedUser.status === 'ACTIVE' ? COLORS.SUCCESS : COLORS.ERROR }]}>{searchedUser.status}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
            <TouchableOpacity style={[styles.actionBtnNeuDanger, { marginBottom: 24 }]} onPress={handleClear}>
              <Ionicons name="close-circle" size={20} color="#E74C3C" style={{ marginRight: 8 }} />
              <Text style={styles.actionBtnTextNeuDanger}>Clear Results</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E9EFF5' },
  topDarkSection: { backgroundColor: '#1A1B2F', paddingTop: 40, paddingHorizontal: 24, paddingBottom: 40, borderBottomRightRadius: 80, zIndex: 10 },
  customHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  headerSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 8, paddingHorizontal: 8 },
  waveConnectorDark: { height: 80, backgroundColor: '#1A1B2F', marginTop: -1, zIndex: 1 },
  waveConnectorLightCutout: { flex: 1, backgroundColor: '#E9EFF5', borderTopLeftRadius: 80 },
  bottomLightSection: { backgroundColor: '#E9EFF5', flex: 1, marginTop: -1, paddingHorizontal: 24 },
  content: { padding: 20, paddingBottom: 40 },
  cardNeu: { backgroundColor: '#E9EFF5', borderRadius: 24, padding: 24, marginBottom: 24, shadowColor: '#FFFFFF', shadowOffset: { width: -6, height: -6 }, shadowOpacity: 0.9, shadowRadius: 8, elevation: 5, borderWidth: 1, borderColor: '#FFF' },
  cardTitleNeu: { fontSize: 18, fontWeight: '800', color: '#2C3E50', marginBottom: 20 },
  profileImageContainer: { alignItems: 'center', marginBottom: 20 },
  infoListNeu: { gap: 16 },
  infoListItemNeu: { flexDirection: 'row', alignItems: 'center' },
  infoIconContainerNeu: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  infoTextContainerNeu: { flex: 1, justifyContent: 'center' },
  infoListLabelNeu: { fontSize: 12, color: '#6B7A93', marginBottom: 2, fontWeight: '600' },
  infoListValueNeu: { fontSize: 15, color: '#2C3E50', fontWeight: '700' },
  actionBtnNeuDanger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E9EFF5', paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: '#FFF', shadowColor: '#FFFFFF', shadowOffset: { width: -4, height: -4 }, shadowOpacity: 0.9, shadowRadius: 6, elevation: 5, marginTop: 24 },
  actionBtnTextNeuDanger: { color: '#E74C3C', fontSize: 16, fontWeight: '800' }
});
