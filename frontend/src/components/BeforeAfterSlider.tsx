import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  PanResponder,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width - 48;
const SLIDER_HEIGHT = SLIDER_WIDTH * 0.75;

interface Props {
  beforeUri: string;
  afterUri: string;
  styleName: string;
  styleColor: string;
}

export function BeforeAfterSlider({ beforeUri, afterUri, styleName, styleColor }: Props) {
  const [sliderX, setSliderX] = useState(SLIDER_WIDTH / 2);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      const newX = Math.max(10, Math.min(SLIDER_WIDTH - 10, gestureState.moveX - 24));
      setSliderX(newX);
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Before / After</Text>
        <Text style={[styles.styleName, { color: styleColor }]}>{styleName}</Text>
      </View>

      <View style={[styles.sliderContainer]} {...panResponder.panHandlers}>
        {/* Before (original) */}
        <Image source={{ uri: beforeUri }} style={styles.baseImage} resizeMode="cover" />

        {/* After (generated) - clipped */}
        <View style={[styles.afterClip, { width: sliderX }]}>
          <Image
            source={{ uri: afterUri }}
            style={[styles.baseImage, { width: SLIDER_WIDTH }]}
            resizeMode="cover"
          />
        </View>

        {/* Divider line */}
        <View style={[styles.divider, { left: sliderX }]}>
          <View style={[styles.dividerHandle, { borderColor: styleColor }]}>
            <View style={[styles.dividerArrow, { borderRightColor: styleColor }]} />
            <View style={[styles.dividerArrowLeft, { borderLeftColor: styleColor }]} />
          </View>
        </View>

        {/* Labels */}
        <View style={styles.beforeLabel}>
          <Text style={styles.compareLabel}>Original</Text>
        </View>
        <View style={[styles.afterLabel, { right: SLIDER_WIDTH - sliderX + 8 }]}>
          <Text style={[styles.compareLabel, { color: styleColor }]}>{styleName}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
  },
  styleName: {
    fontSize: 13,
    fontWeight: '700',
  },
  sliderContainer: {
    width: SLIDER_WIDTH,
    height: SLIDER_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#111',
    position: 'relative',
  },
  baseImage: {
    width: SLIDER_WIDTH,
    height: SLIDER_HEIGHT,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  afterClip: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: SLIDER_HEIGHT,
    overflow: 'hidden',
  },
  divider: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  dividerHandle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  dividerArrow: {
    width: 0,
    height: 0,
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderRightWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  dividerArrowLeft: {
    width: 0,
    height: 0,
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderLeftWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  beforeLabel: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  afterLabel: {
    position: 'absolute',
    top: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  compareLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
});
