import { useScrollToTop } from '@react-navigation/native'
import { BlurView } from 'expo-blur'
import React, { ReactElement, useRef } from 'react'
import { FlatListProps, useColorScheme, ViewStyle } from 'react-native'
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedProps,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AnimatedFlex, Box } from 'src/components/layout'
import { AnimatedFlatList } from 'src/components/layout/AnimatedFlatList'
import { Screen } from 'src/components/layout/Screen'
import { WithScrollToTop } from 'src/components/layout/screens/WithScrollToTop'

const CONTENT_MAX_SCROLL_Y = 50

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView)

// Types for React Native View prop pointerEvents, necessary typing for AnimatedBlurView's animatedProps
type PointerEvent = 'auto' | 'none'

type HeaderListScreenProps = {
  fixedHeader: ReactElement
  contentHeader?: ReactElement
} & FlatListProps<any>

export function HeaderListScreen({
  fixedHeader,
  contentHeader,
  ...listProps
}: HeaderListScreenProps) {
  const isDarkMode = useColorScheme() === 'dark'

  const listRef = useRef(null)
  useScrollToTop(listRef)

  const insets = useSafeAreaInsets()
  const scrollY = useSharedValue(0)

  // On scroll, ListContentHeader fades out and FixedHeaderBar fades in
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
    },
    onEndDrag: (event) => {
      scrollY.value = withTiming(
        event.contentOffset.y > CONTENT_MAX_SCROLL_Y / 2 ? CONTENT_MAX_SCROLL_Y : 0
      )
    },
  })

  const headerStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scrollY.value, [0, CONTENT_MAX_SCROLL_Y], [0, 1], Extrapolate.CLAMP),
    }
  })

  const blurViewProps = useAnimatedProps(() => {
    return {
      pointerEvents: (scrollY.value === 0 ? 'none' : 'auto') as PointerEvent,
    }
  })

  const contentHeaderStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scrollY.value, [0, CONTENT_MAX_SCROLL_Y / 2], [1, 0], Extrapolate.CLAMP),
    }
  })

  const ContentHeader = (
    <AnimatedFlex mx="md" style={contentHeaderStyle}>
      {contentHeader}
    </AnimatedFlex>
  )

  const FixedHeaderBar = (
    <AnimatedBlurView
      animatedProps={blurViewProps}
      intensity={95}
      style={[
        headerStyle,
        BlurHeaderStyle,
        {
          paddingTop: insets.top,
        },
      ]}
      tint={isDarkMode ? 'dark' : 'default'}>
      <WithScrollToTop ref={listRef}>
        <Box mx="md" my="sm">
          {fixedHeader}
        </Box>
      </WithScrollToTop>
    </AnimatedBlurView>
  )

  return (
    <Screen edges={['top', 'left', 'right']}>
      {FixedHeaderBar}
      <AnimatedFlatList
        {...listProps}
        ref={listRef}
        ListHeaderComponent={ContentHeader}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
      />
    </Screen>
  )
}

const BlurHeaderStyle: ViewStyle = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  zIndex: 10,
}
