import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSpring,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useImageStore } from '../src/hooks/useImageStore';
import { useGenerateCliparts } from '../src/hooks/useGenerateCliparts';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 48 - 12) / 2;

type StyleId = 'cartoon' | 'anime' | 'pixel' | 'sketch' | 'flat';
const STYLES: { id: StyleId; label: string; emoji: string; color: string }[] = [
  { id: 'cartoon', label: 'Cartoon', emoji: '🎨', color: '#FF6B6B' },
  { id: 'anime', label: 'Anime', emoji: '✨', color: '#A78BFA' },
  { id: 'pixel', label: 'Pixel Art', emoji: '🕹️', color: '#34D399' },
  { id: 'sketch', label: 'Sketch', emoji: '✏️', color: '#60A5FA' },
  { id: 'flat', label: 'Flat Art', emoji: '🎭', color: '#FBBF24' },
];

// Animated skeleton shimmer card
const SkeletonCard = ({
  style,
  index,
  isDone,
  isFailed,
  onRetry,
}: {
  style: (typeof STYLES)[0];
  index: number;
  isDone: boolean;
  isFailed: boolean;
  onRetry?: () => void;
}) => {
  const shimmer = useSharedValue(0);
  const checkScale = useSharedValue(0);
  const cardScale = useSharedValue(0.9);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
    cardScale.value = withDelay(index * 100, withSpring(1, { damping: 18 }));
    cardOpacity.value = withDelay(index * 100, withTiming(1, { duration: 400 }));
  }, []);

  useEffect(() => {
    if (isDone) {
      checkScale.value = withSpring(1, { damping: 12 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [isDone]);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.3, 0.8]),
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const entryStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  return (
    <Animated.View style={entryStyle}>
      <View
        style={[
          styles.skeletonCard,
          {
            borderColor: isDone
              ? style.color + '40'
              : isFailed
              ? '#EF444440'
              : 'rgba(255,255,255,0.06)',
          },
        ]}
      >
        {/* Shimmer area */}
        {!isDone && !isFailed && (
          <Animated.View style={[styles.shimmerArea, shimmerStyle]}>
            <LinearGradient
              colors={[
                'rgba(255,255,255,0.03)',
                'rgba(255,255,255,0.08)',
                'rgba(255,255,255,0.03)',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        )}

        {/* Done overlay */}
        {isDone && (
          <Animated.View style={[styles.doneOverlay, checkStyle]}>
            <View style={[styles.doneCheck, { backgroundColor: style.color }]}>
              <Ionicons name="checkmark" size={16} color="#fff" />
            </View>
          </Animated.View>
        )}

        {/* Failed overlay with retry */}
        {isFailed && (
          <View style={styles.failedOverlay}>
            <Ionicons name="alert-circle-outline" size={24} color="#EF4444" />
            <Text style={styles.failedText}>Failed</Text>
            {onRetry && (
              <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
                <Ionicons name="refresh-outline" size={14} color="#A78BFA" />
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Card bottom info */}
        <View style={styles.cardBottom}>
          <Text style={styles.cardEmoji}>{style.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardLabel, { color: style.color }]}>
              {style.label}
            </Text>
            <Text style={styles.cardStatus}>
              {isDone ? '✓ Ready' : isFailed ? '✕ Error' : 'Generating...'}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

// Animated progress bar
const ProgressBar = ({ progress }: { progress: number }) => {
  const barWidth = useSharedValue(0);

  useEffect(() => {
    barWidth.value = withTiming(progress, { duration: 500 });
  }, [progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value}%`,
  }));

  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, barStyle]}>
        <LinearGradient
          colors={['#7C3AED', '#4F46E5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

// Pulsing dot indicator
const PulsingDot = () => {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(0.4, { duration: 1000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, []);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ scale: interpolate(pulse.value, [0.4, 1], [0.8, 1.2]) }],
  }));

  return <Animated.View style={[styles.pulseDot, dotStyle]} />;
};

export default function GeneratingScreen() {
  const { image, customPrompt, intensity } = useImageStore();
  const { statuses, progress, isComplete, retryStyle } = useGenerateCliparts(
    image!,
    { customPrompt, intensity }
  );

  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(() => {
        router.replace('/results');
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isComplete]);

  const completedCount = Object.values(statuses).filter(
    (s) => s === 'done'
  ).length;
  const failedCount = Object.values(statuses).filter(
    (s) => s === 'failed'
  ).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <PulsingDot />
        <Text style={styles.headerTitle}>Generating Cliparts</Text>
        <View style={styles.parallelBadge}>
          <Text style={styles.parallelBadgeText}>PARALLEL</Text>
        </View>
      </View>

      {/* Progress section */}
      <View style={styles.progressSection}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressLabel}>
            {completedCount}/{STYLES.length} complete
          </Text>
          <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
        </View>
        <ProgressBar progress={progress} />
        <Text style={styles.progressHint}>
          {completedCount < STYLES.length
            ? 'All styles processing simultaneously...'
            : failedCount > 0
            ? `${failedCount} style(s) failed — tap to retry`
            : 'All done! Loading results...'}
        </Text>
      </View>

      {/* Grid of skeletons */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.grid}
      >
        {STYLES.map((style, index) => (
          <SkeletonCard
            key={style.id}
            style={style}
            index={index}
            isDone={statuses[style.id] === 'done'}
            isFailed={statuses[style.id] === 'failed'}
            onRetry={() => retryStyle(style.id)}
          />
        ))}
      </ScrollView>

      {/* Tip at bottom */}
      <View style={styles.tipRow}>
        <Ionicons name="bulb-outline" size={14} color="#7C3AED" />
        <Text style={styles.tipText}>
          Go back to preview and add custom prompts for personalized results
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7C3AED',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    flex: 1,
  },
  parallelBadge: {
    backgroundColor: 'rgba(52,211,153,0.15)',
    borderColor: 'rgba(52,211,153,0.3)',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  parallelBadgeText: {
    color: '#34D399',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  progressSection: {
    marginBottom: 28,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressLabel: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
  },
  progressPercent: {
    color: '#A78BFA',
    fontSize: 13,
    fontWeight: '700',
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressHint: {
    color: '#6B7280',
    fontSize: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 20,
  },
  skeletonCard: {
    width: CARD_SIZE,
    height: CARD_SIZE + 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  shimmerArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 44,
  },
  doneOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 5,
  },
  doneCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  failedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 44,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  failedText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(124,58,237,0.15)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 4,
  },
  retryText: {
    color: '#A78BFA',
    fontSize: 11,
    fontWeight: '600',
  },
  cardBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  cardEmoji: {
    fontSize: 18,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  cardStatus: {
    fontSize: 11,
    color: '#6B7280',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 32,
    paddingTop: 8,
  },
  tipText: {
    color: '#6B7280',
    fontSize: 12,
    flex: 1,
  },
});
