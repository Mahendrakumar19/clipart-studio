import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import { router } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useImageStore } from '../src/hooks/useImageStore';
import { BeforeAfterSlider } from '../src/components/BeforeAfterSlider';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 48 - 12) / 2;

const STYLES = [
  { id: 'cartoon', label: 'Cartoon', emoji: '🎨', color: '#FF6B6B' },
  { id: 'anime', label: 'Anime', emoji: '✨', color: '#A78BFA' },
  { id: 'pixel', label: 'Pixel Art', emoji: '🕹️', color: '#34D399' },
  { id: 'sketch', label: 'Sketch', emoji: '✏️', color: '#60A5FA' },
  { id: 'flat', label: 'Flat Art', emoji: '🎭', color: '#FBBF24' },
];

// Animated result card with download + share
const ResultCard = ({
  style,
  imageUri,
  index,
  onDownload,
  onShare,
  onExpand,
}: {
  style: (typeof STYLES)[0];
  imageUri: string;
  index: number;
  onDownload: () => void;
  onShare: () => void;
  onExpand: () => void;
}) => {
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(index * 80, withSpring(1, { damping: 18 }));
    opacity.value = withDelay(index * 80, withTiming(1, { duration: 400 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        style={[styles.resultCard, { borderColor: style.color + '30' }]}
        onPress={onExpand}
        activeOpacity={0.9}
      >
        <Image source={{ uri: imageUri }} style={styles.resultImage} resizeMode="cover" />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.cardGradient}
        >
          <View style={styles.cardMeta}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardEmoji}>{style.emoji}</Text>
              <Text style={[styles.cardLabel, { color: style.color }]}>{style.label}</Text>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
                onPress={onShare}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="share-outline" size={13} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: style.color }]}
                onPress={onDownload}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="arrow-down" size={13} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function ResultsScreen() {
  const { image, results, clearAll } = useImageStore();
  const availableResults = STYLES.filter(s => results[s.id]);

  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const headerOpacity = useSharedValue(0);
  const saveBtnScale = useSharedValue(1);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 500 });
    if (!selectedStyle && availableResults.length > 0) {
      setSelectedStyle(availableResults[0].id);
      
      // Guide the user with a subtle pulse on the Save All button
      saveBtnScale.value = withRepeat(
        withSequence(
          withTiming(1.03, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
    }
  }, [availableResults.length]);

  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));
  const saveBtnStyle = useAnimatedStyle(() => ({ transform: [{ scale: saveBtnScale.value }] }));

  const downloadImage = async (uri: string, label: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync(true);
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Allow photo library access to save images.');
        return;
      }
      
      const filename = `clipart_${label.toLowerCase()}_${Date.now()}.png`;
      let localUri = uri;
      
      if (uri.startsWith('http')) {
        const dest = `${FileSystem.cacheDirectory}${filename}`;
        const downloadResult = await FileSystem.downloadAsync(uri, dest);
        localUri = downloadResult.uri;
      }

      await MediaLibrary.saveToLibraryAsync(localUri);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved!', `${label} clipart saved to your photos.`);
    } catch (e) {
      console.error('Save error:', e);
      Alert.alert('Error', 'Could not save image.');
    }
  };

  const saveAllToPhotos = async () => {
    if (isProcessingAll) return;
    setIsProcessingAll(true);
    saveBtnScale.value = withSpring(1); // Stop pulsing
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { status } = await MediaLibrary.requestPermissionsAsync(true);
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Allow photo library access to save images.');
      setIsProcessingAll(false);
      return;
    }
    
    try {
      let saved = 0;
      for (const style of STYLES) {
        const uri = results[style.id];
        if (uri) {
          let localUri = uri;
          if (uri.startsWith('http')) {
            const filename = `clipart_${style.id}_${Date.now()}.png`;
            const dest = `${FileSystem.cacheDirectory}${filename}`;
            const downloadResult = await FileSystem.downloadAsync(uri, dest);
            localUri = downloadResult.uri;
          }
          await MediaLibrary.saveToLibraryAsync(localUri);
          saved++;
        }
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('All Saved!', `${saved} cliparts saved successfully.`);
    } catch (e) {
      Alert.alert('Error', 'Some images could not be saved.');
    }
    setIsProcessingAll(false);
  };

  const shareImage = async (uri: string, label: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (await Sharing.isAvailableAsync()) {
        let shareUri = uri;
        if (uri.startsWith('http')) {
          const localPath = `${FileSystem.cacheDirectory}share_${label}_${Date.now()}.png`;
          const dl = await FileSystem.downloadAsync(uri, localPath);
          shareUri = dl.uri;
        }
        await Sharing.shareAsync(shareUri, {
          mimeType: 'image/png',
          dialogTitle: `Share ${label} clipart`,
        });
      } else {
        await Share.share({ message: `Check out my ${label} clipart!`, url: uri });
      }
    } catch (e) {
      console.error('Share error:', e);
    }
  };

  const shareAll = async () => {
    if (isProcessingAll) return;
    setIsProcessingAll(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Not available', 'Sharing is not supported on this device.');
        setIsProcessingAll(false);
        return;
      }

      // Android/iOS support multiple sharing but usually via sequential sheets 
      // or passing an array of URIs if the specific platform bridge supports it.
      // For cross-platform reliability, we'll share them one by one or warn.
      if (availableResults.length > 1) {
        Alert.alert(
          'Share All', 
          `Share your ${availableResults.length} cliparts one by one?`,
          [
            { text: 'Cancel', onPress: () => setIsProcessingAll(false), style: 'cancel' },
            { 
              text: 'OK', 
              onPress: async () => {
                for (const style of availableResults) {
                  const uri = results[style.id]!;
                  await shareImage(uri, style.label);
                }
                setIsProcessingAll(false);
              }
            }
          ]
        );
      } else if (availableResults.length === 1) {
        const style = availableResults[0];
        await shareImage(results[style.id]!, style.label);
        setIsProcessingAll(false);
      }
    } catch (e) {
      console.error('Share all error:', e);
      setIsProcessingAll(false);
    }
  };

  const handleNew = () => {
    clearAll();
    router.replace('/');
  };

  const selectedResult = selectedStyle ? results[selectedStyle] : null;
  const selectedStyleInfo = STYLES.find(s => s.id === selectedStyle);

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <View>
          <Text style={styles.headerTitle}>Your Cliparts ✨</Text>
          <Text style={styles.headerSub}>{availableResults.length} styles generated</Text>
        </View>
        <TouchableOpacity style={styles.newButton} onPress={handleNew}>
          <Ionicons name="add" size={18} color="#A78BFA" />
          <Text style={styles.newButtonText}>New</Text>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Before/After Toggle */}
        {image && availableResults.length > 0 && (
          <TouchableOpacity
            style={styles.beforeAfterToggle}
            onPress={() => {
              setShowBeforeAfter(!showBeforeAfter);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Ionicons name="git-compare-outline" size={16} color="#7C3AED" />
            <Text style={styles.beforeAfterText}>
              {showBeforeAfter ? 'Hide' : 'Show'} Before / After
            </Text>
            <Ionicons
              name={showBeforeAfter ? 'chevron-up' : 'chevron-down'}
              size={14}
              color="#7C3AED"
            />
          </TouchableOpacity>
        )}

        {/* Before/After View */}
        {showBeforeAfter && image && selectedResult && (
          <View style={styles.comparisonContainer}>
            <BeforeAfterSlider
              beforeUri={image}
              afterUri={selectedResult}
              styleName={selectedStyleInfo?.label ?? 'Style'}
              styleColor={selectedStyleInfo?.color ?? '#7C3AED'}
            />
            
            {/* Horizontal Picker */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.styleSelector}
            >
              {STYLES.filter(s => results[s.id]).map(style => (
                <TouchableOpacity
                  key={style.id}
                  style={[
                    styles.stylePill,
                    selectedStyle === style.id && {
                      backgroundColor: style.color + '20',
                      borderColor: style.color,
                    },
                  ]}
                  onPress={() => {
                    setSelectedStyle(style.id);
                    Haptics.selectionAsync();
                  }}
                >
                  <Text style={styles.pillEmoji}>{style.emoji}</Text>
                  <Text style={[styles.pillLabel, { color: selectedStyle === style.id ? style.color : '#9CA3AF' }]}>
                    {style.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Grid View */}
        <View style={styles.grid}>
          {STYLES.map((style, index) => {
            const uri = results[style.id];
            if (!uri) return null;
            return (
              <ResultCard
                key={style.id}
                style={style}
                imageUri={uri}
                index={index}
                onDownload={() => downloadImage(uri, style.label)}
                onShare={() => shareImage(uri, style.label)}
                onExpand={() => {
                  setSelectedStyle(style.id);
                  setShowBeforeAfter(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              />
            );
          })}
        </View>

        {/* Primary Actions */}
        <View style={styles.actions}>
          <Animated.View style={saveBtnStyle}>
            <TouchableOpacity 
              style={styles.downloadAllBtn} 
              onPress={saveAllToPhotos}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#7C3AED', '#4F46E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.downloadAllGradient}
              >
                <Ionicons name="download-outline" size={18} color="#fff" />
                <Text style={styles.downloadAllText}>
                  {isProcessingAll ? 'Processing...' : 'Save All to Photos'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.secondaryActions}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={shareAll}
            >
              <Ionicons name="share-social-outline" size={16} color="#A78BFA" />
              <Text style={styles.secondaryBtnText}>Share All</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => router.replace('/preview')}
            >
              <Ionicons name="options-outline" size={16} color="#A78BFA" />
              <Text style={styles.secondaryBtnText}>Edit Options</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.regenerateBtn}
            onPress={() => router.replace('/generating')}
          >
            <Ionicons name="refresh-outline" size={14} color="#6B7280" />
            <Text style={styles.regenerateText}>Regenerate All Styles</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
  },
  headerSub: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 2,
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(124,58,237,0.15)',
    borderColor: 'rgba(124,58,237,0.3)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  newButtonText: {
    color: '#A78BFA',
    fontSize: 14,
    fontWeight: '600',
  },
  beforeAfterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 24,
    marginBottom: 12,
    backgroundColor: 'rgba(124,58,237,0.08)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.2)',
  },
  beforeAfterText: {
    color: '#A78BFA',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  comparisonContainer: {
    marginBottom: 16,
  },
  styleSelector: {
    paddingHorizontal: 24,
    gap: 8,
    marginTop: 12,
    paddingBottom: 4,
  },
  stylePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  pillEmoji: {
    fontSize: 14,
  },
  pillLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  resultCard: {
    width: CARD_SIZE,
    height: CARD_SIZE + 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  resultImage: {
    width: '100%',
    height: '100%',
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%',
    justifyContent: 'flex-end',
    padding: 10,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  cardEmoji: {
    fontSize: 14,
    marginBottom: 2,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 12,
  },
  downloadAllBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  downloadAllGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 17,
  },
  downloadAllText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.3)',
    backgroundColor: 'rgba(124,58,237,0.08)',
  },
  secondaryBtnText: {
    color: '#A78BFA',
    fontSize: 14,
    fontWeight: '600',
  },
  regenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  regenerateText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
  },
});
