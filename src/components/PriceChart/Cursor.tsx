import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics'
import React from 'react'
import { StyleSheet } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import {
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { getYForX, round } from 'react-native-redash'
import { AnimatedBox, Box } from 'src/components/layout/Box'
import {
  AnimatedNumber,
  AnimatedTranslation,
  GraphMetadatas,
} from 'src/components/PriceChart/types'
import { HEIGHT } from 'src/components/PriceChart/utils'

const CURSOR_INNER_SIZE = 12
const CURSOR_SIZE = CURSOR_INNER_SIZE + 6
const LINE_WIDTH = 1

// Length in screen unit of a single tick
// TODO(MOB-2255): correlate ticks to scale
const TICK_LENGTH = 10

interface CursorProps {
  graphs: GraphMetadatas
  index: AnimatedNumber
  isActive: SharedValue<boolean>
  translation: AnimatedTranslation
}

export const Cursor = ({ graphs, index, isActive, translation }: CursorProps) => {
  const isLongPressActive = useSharedValue(false)

  const longPressGesture = Gesture.LongPress()
    .onStart(() => {
      isLongPressActive.value = true
    })
    .minDuration(100)

  const panGesture = Gesture.Pan()
    .manualActivation(true)
    .onTouchesMove((_e, state) => {
      if (isLongPressActive.value) {
        state.activate()
      } else {
        state.fail()
      }
    })
    .onStart(() => {
      isActive.value = true
      runOnJS(impactAsync)(ImpactFeedbackStyle.Light)
    })
    .onUpdate((event) => {
      // First verify if we're crossing a tick for haptic feedback
      const hasCrossedTick =
        round(event.x / TICK_LENGTH) * TICK_LENGTH !==
        round(translation.x.value / TICK_LENGTH) * TICK_LENGTH
      if (hasCrossedTick) {
        runOnJS(impactAsync)(ImpactFeedbackStyle.Light)
      }

      // Then update value continuously
      translation.x.value = event.x
      translation.y.value = getYForX(graphs[index.value].data.path, translation.x.value) || 0
    })
    .onFinalize(() => (isActive.value = false))
    .simultaneousWithExternalGesture(longPressGesture)

  const containerStyles = useAnimatedStyle(() => ({
    opacity: withTiming(isActive.value ? 1 : 0),
  }))

  // cursor position and scale animation
  const cursorAnimatedStyles = useAnimatedStyle(() => {
    const translateX = translation.x.value - CURSOR_SIZE / 2
    const translateY = translation.y.value - CURSOR_SIZE / 2
    return {
      transform: [{ translateX }, { translateY }, { scale: withSpring(isActive.value ? 1 : 0) }],
    }
  })
  const verticalLineAnimatedStyles = useAnimatedStyle(() => {
    const translateX = translation.x.value - LINE_WIDTH
    return {
      transform: [{ translateX }, { scale: withTiming(isActive.value ? 1 : 0) }],
    }
  })

  const composedGesture = Gesture.Race(panGesture, longPressGesture)

  return (
    <Box flex={1} style={StyleSheet.absoluteFill}>
      <GestureDetector gesture={composedGesture}>
        <AnimatedBox style={[StyleSheet.absoluteFill, containerStyles]}>
          {/* Vertical line */}
          <AnimatedBox
            borderColor="backgroundOutline"
            borderRadius="xs"
            borderStyle="dashed"
            borderWidth={1}
            height={HEIGHT}
            style={[verticalLineAnimatedStyles, StyleSheet.absoluteFill]}
            width={LINE_WIDTH}
          />

          {/* Circular cursor */}
          <AnimatedBox
            alignItems="center"
            height={CURSOR_SIZE}
            justifyContent="center"
            position="relative"
            style={cursorAnimatedStyles}
            width={CURSOR_SIZE}>
            {/* Translucent cursor background */}
            <Box
              bg="backgroundOutline"
              borderRadius="full"
              height={CURSOR_SIZE}
              style={StyleSheet.absoluteFillObject}
              width={CURSOR_SIZE}
            />
            <Box
              bg="textSecondary"
              borderRadius="full"
              height={CURSOR_INNER_SIZE}
              width={CURSOR_INNER_SIZE}
            />
          </AnimatedBox>
        </AnimatedBox>
      </GestureDetector>
    </Box>
  )
}
