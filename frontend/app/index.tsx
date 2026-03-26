import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useImageStore } from '../src/hooks/useImageStore';
import { compressImage } from '../src/utils/imageUtils';

const { width, height } = Dimensions.get('window');

// Floating orb component for background ambiance
const FloatingOrb = ({ delay, size, x, y, color }: any) => {
  const opacity = useSharedValue(0.3);
  const translateY = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(withTiming(0.7, { duration: 3000 + delay }), -1, true)
    );
    translateY.value = withDelay(
      delay,
      withRepeat(withTiming(-20, { duration: 4000 + delay }), -1, true)
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.orb,
        style,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          left: x,
          top: y,
        },
      ]}
    />
  );
};

export default function UploadScreen() {
  const { setImage } = useImageStore();
  const buttonScale = useSharedValue(1);
  const headerOpacity = useSharedValue(0);
  const headerTranslate = useSharedValue(30);
  const subtitleOpacity = useSharedValue(0);
  const cardsOpacity = useSharedValue(0);

  useEffect(() => {
    // Staggered entrance animations
    headerOpacity.value = withDelay(100, withTiming(1, { duration: 600 }));
    headerTranslate.value = withDelay(100, withSpring(0, { damping: 20 }));
    subtitleOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
    cardsOpacity.value = withDelay(500, withTiming(1, { duration: 600 }));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslate.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const cardsStyle = useAnimatedStyle(() => ({
    opacity: cardsOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.96);
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1);
  };

  const requestPermissions = async () => {
    const { status: cameraStatus } =
      await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    return cameraStatus === 'granted' && mediaStatus === 'granted';
  };

  const pickFromGallery = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to pick an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]) {
      const compressed = await compressImage(result.assets[0].uri);
      setImage(compressed);
      router.push('/preview');
    }
  };

  const pickFromCamera = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow camera access to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]) {
      const compressed = await compressImage(result.assets[0].uri);
      setImage(compressed);
      router.push('/preview');
    }
  };

  const STYLE_PREVIEWS = [
    { label: 'Cartoon', emoji: '🎨', color: '#FF6B6B' },
    { label: 'Anime', emoji: '✨', color: '#A78BFA' },
    { label: 'Pixel', emoji: '🕹️', color: '#34D399' },
    { label: 'Sketch', emoji: '✏️', color: '#60A5FA' },
    { label: 'Flat', emoji: '🎭', color: '#FBBF24' },
  ];

  return (
    <View style={styles.container}>
      {/* Background orbs */}
      <FloatingOrb delay={0} size={300} x={-80} y={-50} color="rgba(139,92,246,0.12)" />
      <FloatingOrb delay={1000} size={200} x={width - 100} y={height * 0.3} color="rgba(59,130,246,0.1)" />
      <FloatingOrb delay={2000} size={250} x={-30} y={height * 0.6} color="rgba(236,72,153,0.08)" />

      {/* Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>AI POWERED</Text>
        </View>
        <Text style={styles.title}>
          <Text style={styles.titleAccent}>Clipart</Text>
          {'\n'}Studio
        </Text>
      </Animated.View>

      {/* Subtitle */}
      <Animated.Text style={[styles.subtitle, subtitleStyle]}>
        Transform your photo into 5 unique art styles — instantly.
      </Animated.Text>

      {/* Style preview chips */}
      <Animated.View style={[styles.stylesRow, cardsStyle]}>
        {STYLE_PREVIEWS.map((style, i) => (
          <View
            key={style.label}
            style={[styles.styleChip, { borderColor: style.color + '40' }]}
          >
            <Text style={styles.styleEmoji}>{style.emoji}</Text>
            <Text style={[styles.styleLabel, { color: style.color }]}>
              {style.label}
            </Text>
          </View>
        ))}
      </Animated.View>

      {/* Upload area */}
      <Animated.View style={[styles.uploadSection, cardsStyle]}>
        {/* Gallery button */}
        <Animated.View style={buttonStyle}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={pickFromGallery}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
          >
            <LinearGradient
              colors={['#7C3AED', '#4F46E5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryGradient}
            >
              <Ionicons name="images-outline" size={22} color="#fff" />
              <Text style={styles.primaryButtonText}>Choose from Gallery</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Camera button */}
        <TouchableOpacity style={styles.secondaryButton} onPress={pickFromCamera}>
          <Ionicons name="camera-outline" size={20} color="#A78BFA" />
          <Text style={styles.secondaryButtonText}>Take a Photo</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          Best results with a clear, well-lit face photo
        </Text>
      </Animated.View>

      {/* Bottom indicator */}
      <Animated.View style={[styles.bottomDots, cardsStyle]}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 40,
  },
  orb: {
    position: 'absolute',
    filter: 'blur(60px)',
  },
  header: {
    marginBottom: 16,
  },
  badge: {
    backgroundColor: 'rgba(124,58,237,0.2)',
    borderColor: 'rgba(124,58,237,0.4)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  badgeText: {
    color: '#A78BFA',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  title: {
    fontSize: 52,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 56,
    letterSpacing: -1,
  },
  titleAccent: {
    color: '#7C3AED',
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    lineHeight: 24,
    marginBottom: 28,
    maxWidth: '85%',
  },
  stylesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 40,
  },
  styleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  styleEmoji: {
    fontSize: 14,
  },
  styleLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  uploadSection: {
    flex: 1,
    justifyContent: 'center',
    gap: 12,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  primaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.3)',
    backgroundColor: 'rgba(124,58,237,0.08)',
  },
  secondaryButtonText: {
    color: '#A78BFA',
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    textAlign: 'center',
    color: '#4B5563',
    fontSize: 13,
    marginTop: 8,
  },
  bottomDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 24,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1F2937',
  },
  dotActive: {
    width: 20,
    backgroundColor: '#7C3AED',
  },
});
