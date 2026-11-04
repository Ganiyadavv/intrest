import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Keyboard,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ProfileImage } from '../components/ProfileImage';
import * as Clipboard from 'expo-clipboard';
import { userService } from '../services/userService';
import { User } from '../types/user';
import { Loading } from '../components/Loading';

export const SearchUserScreen: React.FC = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchedUsers, setSearchedUsers] = useState<User[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

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
        if (!users || (Array.isArray(users) && users.length === 0)) {
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

  const handleCopyUserId = async (id: string) => {
    try {
      await Clipboard.setStringAsync(id);
    } catch {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(id);
      }
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      {/* 1. TOP APP BAR (DhanaMitra Green) */}
      <View style={styles.topAppBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerIconBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.brandCenter}>
          <View style={styles.brandLogoCircle}>
            <Text style={styles.brandRupeeText}>₹</Text>
            <Ionicons name="leaf" size={10} color="#4ADE80" style={styles.brandLeafIcon} />
          </View>
          <View style={styles.brandTextCol}>
            <Text style={styles.brandTitleText}>Search User</Text>
            <Text style={styles.brandSubtitleText}>Find registered members</Text>
          </View>
        </View>

        {searchQuery.length > 0 || searchedUsers.length > 0 ? (
          <TouchableOpacity onPress={handleClear} style={styles.headerIconBtn} activeOpacity={0.7}>
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 38 }} />
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* 2. SEARCH INPUT CARD */}
        <View style={styles.searchCard}>
          <Text style={styles.searchCardTitle}>Search by Name or User ID</Text>
          <Text style={styles.searchCardSubtitle}>
            Enter member name or exact User ID (e.g. USR-XXXX) to locate their profile.
          </Text>

          <View style={[styles.inputContainer, isInputFocused && styles.inputContainerFocused]}>
            <TouchableOpacity
              onPress={() => inputRef.current?.focus()}
              activeOpacity={0.7}
              style={styles.inputIconTouch}
            >
              <Ionicons
                name="search-outline"
                size={20}
                color={isInputFocused ? '#056B38' : '#94A3B8'}
                style={styles.inputIcon}
              />
            </TouchableOpacity>
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              placeholder="e.g. Ganesh or USR-7K4M9X2Q"
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              onChangeText={(text) => {
                setSearchQuery(text);
                if (error) setError('');
              }}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  if (error) setError('');
                }}
                style={styles.clearInputBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* ERROR ALERT */}
          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#DC2626" style={{ marginRight: 8 }} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* SEARCH BUTTON */}
          <TouchableOpacity
            style={[styles.searchButton, loading && styles.searchButtonDisabled]}
            onPress={handleSearch}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.searchButtonText}>Searching...</Text>
            ) : (
              <>
                <Ionicons name="search" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.searchButtonText}>Search User</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* 3. SEARCH RESULTS */}
        {searchedUsers.length > 0 ? (
          <View style={styles.resultsContainer}>
            <View style={styles.resultsHeaderRow}>
              <View style={styles.resultsBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#056B38" style={{ marginRight: 6 }} />
                <Text style={styles.resultsBadgeText}>
                  {searchedUsers.length === 1 ? '1 User Found' : `${searchedUsers.length} Users Found`}
                </Text>
              </View>
            </View>

            {searchedUsers.map((searchedUser, index) => {
              const userName =
                searchedUser.fullName ||
                `${searchedUser.firstName || ''} ${searchedUser.lastName || ''}`.trim() ||
                'User';
              const isCopied = copiedId === searchedUser.userId;

              return (
                <View key={searchedUser.id || index} style={styles.userCard}>
                  {/* Card Top: Avatar, Name & Status */}
                  <View style={styles.userCardTop}>
                    <ProfileImage
                      uri={searchedUser.profileImage}
                      size={64}
                      name={userName}
                      borderWidth={2.5}
                      borderColor="#056B38"
                    />

                    <View style={styles.userMainInfo}>
                      <Text style={styles.userNameText} numberOfLines={1}>
                        {userName}
                      </Text>

                      <View style={styles.badgeRow}>
                        <View style={styles.rolePill}>
                          <Text style={styles.rolePillText}>{searchedUser.role || 'MEMBER'}</Text>
                        </View>

                        <View
                          style={[
                            styles.statusPill,
                            searchedUser.status === 'ACTIVE'
                              ? styles.statusPillActive
                              : styles.statusPillInactive,
                          ]}
                        >
                          <View
                            style={[
                              styles.statusDot,
                              searchedUser.status === 'ACTIVE'
                                ? styles.statusDotActive
                                : styles.statusDotInactive,
                            ]}
                          />
                          <Text
                            style={[
                              styles.statusPillText,
                              searchedUser.status === 'ACTIVE'
                                ? styles.statusTextActive
                                : styles.statusTextInactive,
                            ]}
                          >
                            {searchedUser.status || 'ACTIVE'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Divider */}
                  <View style={styles.cardDivider} />

                  {/* User Details Rows */}
                  <View style={styles.detailsList}>
                    {/* User ID Row with Copy */}
                    <View style={styles.detailRow}>
                      <View style={[styles.detailIconBox, { backgroundColor: '#EFF6FF' }]}>
                        <Ionicons name="id-card" size={16} color="#2563EB" />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>User ID</Text>
                        <Text style={styles.detailValueBold}>{searchedUser.userId}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.copyPillBtn}
                        onPress={() => handleCopyUserId(searchedUser.userId)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={isCopied ? 'checkmark-circle' : 'copy-outline'}
                          size={14}
                          color={isCopied ? '#15803D' : '#056B38'}
                        />
                        <Text style={[styles.copyPillText, isCopied && { color: '#15803D' }]}>
                          {isCopied ? 'Copied' : 'Copy'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Email Row */}
                    <View style={styles.detailRow}>
                      <View style={[styles.detailIconBox, { backgroundColor: '#F0FDF4' }]}>
                        <Ionicons name="mail" size={16} color="#056B38" />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Email Address</Text>
                        <Text style={styles.detailValue}>{searchedUser.email}</Text>
                      </View>
                    </View>

                    {/* Phone Number if available */}
                    {searchedUser.phoneNumber ? (
                      <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                        <View style={[styles.detailIconBox, { backgroundColor: '#FFFBEB' }]}>
                          <Ionicons name="call" size={16} color="#D97706" />
                        </View>
                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>Phone Number</Text>
                          <Text style={styles.detailValue}>{searchedUser.phoneNumber}</Text>
                        </View>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })}

            {/* Clear Button */}
            <TouchableOpacity
              style={styles.clearResultsBtn}
              onPress={handleClear}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle-outline" size={18} color="#DC2626" style={{ marginRight: 6 }} />
              <Text style={styles.clearResultsBtnText}>Clear Search Results</Text>
            </TouchableOpacity>
          </View>
        ) : !loading && !error ? (
          /* 4. GUIDANCE / EMPTY STATE */
          <View style={styles.emptyStateCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="people-outline" size={36} color="#056B38" />
            </View>
            <Text style={styles.emptyTitle}>Find DhanaMitra Members</Text>
            <Text style={styles.emptySubtext}>
              Search for friends, lenders, or borrowers by typing their registered name or exact User ID above.
            </Text>

            <View style={styles.tipBox}>
              <Ionicons name="bulb-outline" size={16} color="#056B38" style={{ marginRight: 8 }} />
              <Text style={styles.tipText}>
                User IDs start with <Text style={{ fontWeight: '700' }}>USR-</Text> followed by 8 characters.
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#056B38',
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
  brandCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogoCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
    fontSize: 17,
    fontWeight: '800',
  },
  brandLeafIcon: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  brandTextCol: {
    alignItems: 'flex-start',
  },
  brandTitleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  brandSubtitleText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  searchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  searchCardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
    lineHeight: 17,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
    marginBottom: 12,
  },
  inputContainerFocused: {
    borderColor: '#056B38',
  },
  inputIconTouch: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    height: '100%',
  },
  inputIcon: {
    marginRight: 0,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
    height: '100%',
    paddingVertical: 0,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
        borderWidth: 0,
      } as any,
    }),
  },
  clearInputBtn: {
    padding: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
    lineHeight: 16,
  },
  searchButton: {
    backgroundColor: '#056B38',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#056B38',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  searchButtonDisabled: {
    opacity: 0.65,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  resultsContainer: {
    marginTop: 4,
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  resultsBadgeText: {
    color: '#056B38',
    fontSize: 13,
    fontWeight: '700',
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  userCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userMainInfo: {
    flex: 1,
    marginLeft: 14,
  },
  userNameText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rolePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  rolePillText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '700',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusPillActive: {
    backgroundColor: '#DCFCE7',
  },
  statusPillInactive: {
    backgroundColor: '#FEE2E2',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusDotActive: {
    backgroundColor: '#16A34A',
  },
  statusDotInactive: {
    backgroundColor: '#DC2626',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextActive: {
    color: '#15803D',
  },
  statusTextInactive: {
    color: '#DC2626',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  detailsList: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 1,
  },
  detailValue: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '600',
  },
  detailValueBold: {
    fontSize: 13,
    color: '#056B38',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  copyPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  copyPillText: {
    fontSize: 11,
    color: '#056B38',
    fontWeight: '700',
  },
  clearResultsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: 8,
    marginBottom: 16,
  },
  clearResultsBtnText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAF8',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
  },
  tipText: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
  },
});
