import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { COLORS } from '../constants/colors';
import { API_BASE_URL } from '../config/apiConfig';

interface ProfileImageProps {
  uri?: string | null;
  size?: number;
  onEdit?: () => void;
}

export const ProfileImage: React.FC<ProfileImageProps> = ({ 
  uri, 
  size = 100,
  onEdit 
}) => {
  const imageSource = uri 
    ? { uri: uri.match(/^(http|https|data|blob|file):/i) ? uri : `${API_BASE_URL.replace('/api', '')}/uploads/${uri}` }
    : require('../../assets/favicon.png'); // fallback to some local image

  return (
    <View style={styles.container}>
      <View style={[styles.imageContainer, { width: size, height: size, borderRadius: size / 2 }]}>
        <Image 
          source={imageSource} 
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]} 
        />
      </View>
      {onEdit && (
        <TouchableOpacity style={styles.editButton} onPress={onEdit}>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
  },
  imageContainer: {
    backgroundColor: COLORS.SURFACE,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    backgroundColor: COLORS.BORDER,
  },
  editButton: {
    marginTop: -16,
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.SURFACE,
  },
  editText: {
    color: COLORS.SURFACE,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
