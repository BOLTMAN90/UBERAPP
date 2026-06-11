import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { uploadProfilePhoto } from '@/services/profile';

interface ProfilePhotoSectionProps {
  userId: string;
  displayName: string;
  email?: string;
  photoURL?: string | null;
  onUpdated: (photoURL: string) => void;
}

export function ProfilePhotoSection({
  userId,
  displayName,
  email,
  photoURL,
  onUpdated,
}: ProfilePhotoSectionProps) {
  const { colors } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [localUri, setLocalUri] = useState<string | null>(null);

  const imageSource = localUri ?? photoURL ?? null;

  const pickImage = async (fromCamera: boolean) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow camera or photo library access to set your profile picture.');
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        })
      : await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

    if (result.canceled || !result.assets[0]?.uri) {
      return;
    }

    const asset = result.assets[0];
    const uri = asset.uri;
    setLocalUri(uri);
    setUploading(true);

    try {
      const url = await uploadProfilePhoto(userId, uri, asset.mimeType);
      onUpdated(url);
      Alert.alert('Profile updated', 'Your photo was saved.');
    } catch (error) {
      setLocalUri(null);
      const message = error instanceof Error ? error.message : 'Could not upload photo.';
      Alert.alert('Upload failed', message);
    } finally {
      setUploading(false);
    }
  };

  const showPicker = () => {
    Alert.alert('Profile photo', 'Choose how to add your picture', [
      { text: 'Take photo', onPress: () => void pickImage(true) },
      { text: 'Choose from gallery', onPress: () => void pickImage(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surface }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Change profile photo"
        onPress={showPicker}
        disabled={uploading}
        style={styles.avatarPress}>
        {imageSource ? (
          <Image source={{ uri: imageSource }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: Colors.primary }]}>
            <Text style={styles.initials}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          {uploading ? (
            <ActivityIndicator size="small" color={Colors.black} />
          ) : (
            <FontAwesome name="camera" size={16} color={Colors.black} />
          )}
        </View>
      </Pressable>

      <Text style={[styles.name, { color: colors.text }]}>{displayName}</Text>
      {email ? <Text style={{ color: colors.textSecondary }}>{email}</Text> : null}
      <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: Spacing.xs }}>
        Tap the photo to upload from camera or gallery
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    gap: Spacing.xs,
  },
  avatarPress: {
    position: 'relative',
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 40,
    fontWeight: '800',
    color: Colors.black,
  },
  badge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
});
