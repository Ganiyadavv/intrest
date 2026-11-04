import React, { useState } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config/apiConfig';

interface ProfileImageProps {
  uri?: string | null;
  size?: number;
  name?: string;
  onEdit?: () => void;
  showCameraBadge?: boolean;
  borderWidth?: number;
  borderColor?: string;
}

export const ProfileImage: React.FC<ProfileImageProps> = ({
  uri,
  size = 96,
  name,
  onEdit,
  showCameraBadge = false,
  borderWidth = 3,
  borderColor = '#FFFFFF',
}) => {
  const [imageError, setImageError] = useState(false);

  // Compute initials if name is provided
  const getInitials = (str?: string) => {
    if (!str) return '';
    const parts = str.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(name);

  // Image source resolution
  const resolvedUri = uri
    ? uri.match(/^(http|https|data|blob|file):/i)
      ? uri
      : `${API_BASE_URL.replace('/api', '')}/uploads/${uri}`
    : null;

  const hasValidImage = Boolean(resolvedUri) && !imageError;

  const badgeSize = Math.max(26, Math.round(size * 0.3));
  const badgeRadius = badgeSize / 2;
  const iconSize = Math.max(14, Math.round(badgeSize * 0.52));

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      {/* Circle Container with White Ring and Shadow */}
      <View
        style={[
          styles.circleBox,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: borderWidth,
            borderColor: borderColor,
          },
        ]}
      >
        {hasValidImage ? (
          <Image
            source={{ uri: resolvedUri! }}
            style={[
              styles.image,
              {
                width: size - borderWidth * 2,
                height: size - borderWidth * 2,
                borderRadius: (size - borderWidth * 2) / 2,
              },
            ]}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : initials ? (
          <View
            style={[
              styles.fallbackInitialsBox,
              {
                width: size - borderWidth * 2,
                height: size - borderWidth * 2,
                borderRadius: (size - borderWidth * 2) / 2,
              },
            ]}
          >
            <Text style={[styles.initialsText, { fontSize: Math.round(size * 0.36) }]}>
              {initials}
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.fallbackIconBox,
              {
                width: size - borderWidth * 2,
                height: size - borderWidth * 2,
                borderRadius: (size - borderWidth * 2) / 2,
              },
            ]}
          >
            <Ionicons name="person" size={Math.round(size * 0.5)} color="#056B38" />
          </View>
        )}
      </View>

      {/* Optional Floating Camera / Edit Badge */}
      {(showCameraBadge || onEdit) && (
        <TouchableOpacity
          style={[
            styles.cameraBadge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeRadius,
              right: 0,
              bottom: 0,
            },
          ]}
          onPress={onEdit}
          activeOpacity={0.8}
          disabled={!onEdit}
        >
          <Ionicons name="camera" size={iconSize} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBox: {
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 6,
  },
  image: {
    backgroundColor: '#F1F5F9',
  },
  fallbackInitialsBox: {
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#056B38',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  fallbackIconBox: {
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    backgroundColor: '#056B38',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
});
