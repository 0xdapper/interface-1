import React from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { mixPath, useVector } from 'react-native-redash'
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg'
import { useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components-uds/TouchableArea'
import { AnimatedBox, Box } from 'src/components/layout/Box'
import { Cursor } from 'src/components/PriceChart/Cursor'
import { PriceHeader } from 'src/components/PriceChart/PriceHeader'
import { TimeRangeLabel } from 'src/components/PriceChart/TimeRangeLabel'
import { GraphMetadatas } from 'src/components/PriceChart/types'
import { HEIGHT, NUM_GRAPHS, WIDTH } from 'src/components/PriceChart/utils'
import { theme as styles } from 'src/styles/theme'

const AnimatedPath = Animated.createAnimatedComponent(Path)

const BUTTON_PADDING = styles.spacing.lg
const BUTTON_WIDTH = WIDTH / NUM_GRAPHS
const LABEL_WIDTH = BUTTON_WIDTH - BUTTON_PADDING * 2

interface GraphProps {
  graphs: GraphMetadatas
}

/**
 * Displays a set of graphs with header, scrubbable chart and navigation row.
 * Inspired by https://github.com/wcandillon/can-it-be-done-in-react-native/tree/master/season4/src/Rainbow
 */
export const PriceExplorer = ({ graphs }: GraphProps) => {
  const theme = useAppTheme()

  // whether the graph pan gesture is active
  const isPanning = useSharedValue(false)
  // pan gesture x and y
  const translation = useVector()
  // used in animations
  const transition = useSharedValue(1)
  // previous graph index used in animations
  const previousGraphIndex = useSharedValue<number>(1)
  // graph index used to display the current graph
  const currentGraphIndex = useSharedValue<number>(1)

  // mixes graph paths on index change
  const graphTransitionAnimatedProps = useAnimatedProps(() => {
    const previousPath = graphs[previousGraphIndex.value].data.path
    const currentPath = graphs[currentGraphIndex.value].data.path
    const d = {
      d: mixPath(transition.value, previousPath, currentPath),
    }
    return d
  })
  const graphTransitionClosedAnimatedProps = useAnimatedProps(() => {
    const previousPath = graphs[previousGraphIndex.value].data.path
    const currentPath = graphs[currentGraphIndex.value].data.path
    return {
      d: `${mixPath(
        transition.value,
        previousPath,
        currentPath
      )} L ${WIDTH} ${HEIGHT} L 0 ${HEIGHT}`,
    }
  })

  // animates slider (time range label background) on press
  const sliderStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: withTiming(BUTTON_WIDTH * currentGraphIndex.value + BUTTON_PADDING) },
    ],
  }))

  return (
    <Box>
      <PriceHeader
        graphs={graphs}
        index={currentGraphIndex}
        isPanning={isPanning}
        translation={translation}
      />
      <Box my="xs">
        <Svg height={HEIGHT} width={WIDTH}>
          <AnimatedPath
            animatedProps={graphTransitionAnimatedProps}
            fill="transparent"
            stroke={theme.colors.accentAction}
            strokeWidth={1.5}
          />

          <Defs>
            <LinearGradient id="gradient" x1="50%" x2="50%" y1="0%" y2="100%">
              <Stop offset="0%" stopColor={theme.colors.accentAction} stopOpacity="0.2" />
              <Stop offset="100%" stopColor={theme.colors.accentAction} stopOpacity="0" />
            </LinearGradient>
          </Defs>

          <AnimatedPath
            animatedProps={graphTransitionClosedAnimatedProps}
            fill="url(#gradient)"
            stroke="transparent"
            strokeWidth={3}
          />
        </Svg>
        <Cursor
          graphs={graphs}
          index={currentGraphIndex}
          isActive={isPanning}
          translation={translation}
        />
      </Box>
      <Box alignSelf="center" flexDirection="row" width={WIDTH}>
        <View style={StyleSheet.absoluteFill}>
          <AnimatedBox
            bg="backgroundSurface"
            borderRadius="xs"
            style={[StyleSheet.absoluteFillObject, sliderStyle]}
            width={LABEL_WIDTH}
          />
        </View>
        {graphs.map((graph, index) => {
          return (
            <TouchableArea
              key={graph.label}
              p="xs"
              width={BUTTON_WIDTH}
              onPress={() => {
                previousGraphIndex.value = currentGraphIndex.value
                transition.value = 0
                currentGraphIndex.value = index
                transition.value = withTiming(1)
              }}>
              <TimeRangeLabel
                index={index}
                label={graph.label}
                selectedIndex={currentGraphIndex}
                transition={transition}
              />
            </TouchableArea>
          )
        })}
      </Box>
    </Box>
  )
}
