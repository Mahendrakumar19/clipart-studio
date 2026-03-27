import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useImageStore } from '../src/hooks/useImageStore';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = width - 48;

const STYLES = [
  {
    id: 'cartoon',
    label: 'Cartoon',
    description: 'Bold outlines, vibrant flat colors',
    emoji: '🎨',
    color: '#FF6B6B',
    bg: 'rgba(255,107,107,0.1)',
  },
  {
    id: 'anime',
    label: 'Anime',
    description: 'Studio Ghibli soft illustration',
    emoji: '✨',
    color: '#A78BFA',
    bg: 'rgba(167,139,250,0.1)',
  },
  {
    id: 'pixel',
    label: 'Pixel Art',
    description: '8-bit retro game character',
    emoji: '🕹️',
    color: '#34D399',
    bg: 'rgba(52,211,153,0.1)',
  },
  {
    id: 'sketch',
    label: 'Sketch',
    description: 'Pencil line art, minimal shading',
    emoji: '✏️',
    color: '#60A5FA',
    bg: 'rgba(96,165,250,0.1)',
  },
  {
    id: 'flat',
    label: 'Flat Art',
    description: 'Clean vector illustration style',
    emoji: '🎭',
    color: '#FBBF24',
    bg: 'rgba(251,191,36,0.1)',
  },
];

const INTENSITY_LABELS = ['More Artistic', 'Balanced', 'More Faithful'];

export default function PreviewScreen() {
  const { image, customPrompt, intensity, setCustomPrompt, setIntensity } = useImageStore();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const imageScale = useSharedValue(0.8);
  const imageOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    imageScale.value = withSpring(1, { damping: 20, stiffness: 200 });
    imageOpacity.value = withTiming(1, { duration: 400 });
    contentOpacity.value = withDelay(200, withTiming(1, { duration: 500 }));
  }, []);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: imageScale.value }],
    opacity: imageOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const handleGenerate = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/generating');
  };

  const handleBack = () => {
    router.back();
  };

  useEffect(() => {
    if (!image) {
      router.replace('/');
    }
  }, [image]);

  if (!image) return null;

  const intensityPercent = Math.round(intensity * 100);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={20} color="#9CA3AF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preview</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Image preview */}
        <Animated.View style={[styles.imageContainer, imageStyle]}>
          <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
          <View style={styles.imageOverlay}>
            <BlurView intensity={20} style={styles.imageTag}>
              <Text style={styles.imageTagText}>Your Photo</Text>
            </BlurView>
          </View>
        </Animated.View>

        <Animated.View style={contentStyle}>
          {/* Section label */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Will be transformed into</Text>
            <View style={styles.allBadge}>
              <Text style={styles.allBadgeText}>ALL 5</Text>
            </View>
          </View>

          {/* Style list */}
          <View style={styles.stylesList}>
            {STYLES.map((style) => (
              <Animated.View
                key={style.id}
                style={styles.styleRow}
              >
                <View style={[styles.styleIcon, { backgroundColor: style.bg }]}>
                  <Text style={styles.styleEmoji}>{style.emoji}</Text>
                </View>
                <View style={styles.styleInfo}>
                  <Text style={[styles.styleName, { color: style.color }]}>
                    {style.label}
                  </Text>
                  <Text style={styles.styleDesc}>{style.description}</Text>
                </View>
                <Ionicons name="checkmark-circle" size={18} color={style.color} />
              </Animated.View>
            ))}
          </View>

          {/* Advanced Options Toggle */}
          <TouchableOpacity
            style={styles.advancedToggle}
            onPress={() => {
              setShowAdvanced(!showAdvanced);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Ionicons name="options-outline" size={16} color="#7C3AED" />
            <Text style={styles.advancedToggleText}>
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </Text>
            <Ionicons
              name={showAdvanced ? 'chevron-up' : 'chevron-down'}
              size={14}
              color="#7C3AED"
            />
          </TouchableOpacity>

          {/* Advanced Options Panel */}
          {showAdvanced && (
            <View style={styles.advancedPanel}>
              {/* Prompt Editor */}
              <View style={styles.optionSection}>
                <View style={styles.optionHeader}>
                  <Ionicons name="create-outline" size={15} color="#A78BFA" />
                  <Text style={styles.optionLabel}>Custom Prompt</Text>
                </View>
                <Text style={styles.optionHint}>
                  Add keywords like "vibrant", "dark theme", "watercolor" to guide the AI
                </Text>
                <TextInput
                  style={styles.promptInput}
                  placeholder="e.g. vibrant colors, dramatic lighting..."
                  placeholderTextColor="#4B5563"
                  value={customPrompt}
                  onChangeText={setCustomPrompt}
                  maxLength={200}
                  multiline
                  numberOfLines={2}
                  returnKeyType="done"
                  blurOnSubmit
                />
                <Text style={styles.charCount}>
                  {customPrompt.length}/200
                </Text>
              </View>

              {/* Intensity Slider */}
              <View style={styles.optionSection}>
                <View style={styles.optionHeader}>
                  <Ionicons name="pulse-outline" size={15} color="#A78BFA" />
                  <Text style={styles.optionLabel}>Style Intensity</Text>
                  <View style={styles.intensityBadge}>
                    <Text style={styles.intensityBadgeText}>{intensityPercent}%</Text>
                  </View>
                </View>
                <Text style={styles.optionHint}>
                  Lower = more artistic freedom · Higher = closer to original
                </Text>

                {/* Custom slider track */}
                <View style={styles.sliderContainer}>
                  <View style={styles.sliderTrack}>
                    <View
                      style={[styles.sliderFill, { width: `${intensityPercent}%` }]}
                    />
                  </View>

                  {/* Slider buttons */}
                  <View style={styles.sliderButtons}>
                    {[0, 0.25, 0.5, 0.75, 1].map((val) => (
                      <TouchableOpacity
                        key={val}
                        style={[
                          styles.sliderDot,
                          Math.abs(intensity - val) < 0.05 && styles.sliderDotActive,
                        ]}
                        onPress={() => {
                          setIntensity(val);
                          Haptics.selectionAsync();
                        }}
                        hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
                      />
                    ))}
                  </View>
                </View>

                {/* Labels */}
                <View style={styles.sliderLabels}>
                  {INTENSITY_LABELS.map((label) => (
                    <Text key={label} style={styles.sliderLabelText}>
                      {label}
                    </Text>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Info bar */}
          <View style={styles.infoBar}>
            <Ionicons name="flash-outline" size={14} color="#7C3AED" />
            <Text style={styles.infoText}>
              All 5 styles generated simultaneously in ~30 seconds
            </Text>
          </View>

          {/* Generate CTA */}
          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleGenerate}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#7C3AED', '#4F46E5', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.generateGradient}
            >
              <Ionicons name="sparkles-outline" size={20} color="#fff" />
              <Text style={styles.generateText}>Generate All Styles</Text>
              <View style={styles.arrow}>
                <Ionicons name="arrow-forward" size={16} color="#7C3AED" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Retake */}
          <TouchableOpacity style={styles.retakeButton} onPress={handleBack}>
            <Text style={styles.retakeText}>Use a different photo</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  imageContainer: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE * 0.75,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
  },
  imageTag: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    overflow: 'hidden',
  },
  imageTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  allBadge: {
    backgroundColor: 'rgba(124,58,237,0.2)',
    borderColor: 'rgba(124,58,237,0.4)',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  allBadgeText: {
    color: '#A78BFA',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  stylesList: {
    gap: 10,
    marginBottom: 16,
  },
  styleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  styleIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  styleEmoji: {
    fontSize: 22,
  },
  styleInfo: {
    flex: 1,
  },
  styleName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  styleDesc: {
    fontSize: 12,
    color: '#6B7280',
  },
  // Advanced Options
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    backgroundColor: 'rgba(124,58,237,0.08)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.2)',
  },
  advancedToggleText: {
    color: '#A78BFA',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  advancedPanel: {
    gap: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  optionSection: {
    gap: 8,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionLabel: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  optionHint: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 16,
  },
  promptInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.2)',
    padding: 12,
    color: '#E5E7EB',
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  charCount: {
    color: '#4B5563',
    fontSize: 11,
    textAlign: 'right',
  },
  intensityBadge: {
    backgroundColor: 'rgba(124,58,237,0.2)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  intensityBadgeText: {
    color: '#A78BFA',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  sliderContainer: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  sliderTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 2,
  },
  sliderButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
    paddingHorizontal: 0,
  },
  sliderDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1F2937',
    borderWidth: 2,
    borderColor: '#374151',
  },
  sliderDotActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#A78BFA',
    width: 20,
    height: 20,
    borderRadius: 10,
    marginTop: -2,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  sliderLabelText: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '500',
  },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(124,58,237,0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.2)',
  },
  infoText: {
    color: '#A78BFA',
    fontSize: 13,
    flex: 1,
  },
  generateButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  generateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  generateText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  arrow: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retakeButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  retakeText: {
    color: '#6B7280',
    fontSize: 15,
    textDecorationLine: 'underline',
  },
});
