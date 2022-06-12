import React, {
  ComponentProps,
  createContext,
  ReactElement,
  ReactNode,
  useCallback,
  useRef,
} from 'react'
import { ListRenderItemInfo } from 'react-native'
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated'
import { AnimatedIndicator } from 'src/components/carousel/Indicator'
import { Flex } from 'src/components/layout'
import { AnimatedFlatList } from 'src/components/layout/AnimatedFlatList'
import { dimensions } from 'src/styles/sizing'

const { fullWidth } = dimensions

interface CarouselContextProps {
  current: number
  goToNext: () => void
  goToPrev: () => void
}

// Allows child components to control the carousel
export const CarouselContext = createContext<CarouselContextProps>({
  goToNext: () => {},
  goToPrev: () => {},
  current: 0,
})

type CarouselProps = {
  slides: ReactElement[]
} & Pick<ComponentProps<typeof Animated.FlatList>, 'scrollEnabled'>

export const Carousel = ({ slides, ...flatListProps }: CarouselProps) => {
  const scroll = useSharedValue(0)
  const myRef = useRef<Animated.FlatList<any>>(null)

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scroll.value = event.contentOffset.x
    },
  })

  const goToNext = useCallback(() => {
    // @ts-expect-error https://github.com/software-mansion/react-native-reanimated/issues/2976
    myRef.current?._listRef._scrollRef.scrollTo({
      x: scroll.value + fullWidth,
    })
  }, [scroll.value])

  const goToPrev = useCallback(() => {
    // @ts-expect-error https://github.com/software-mansion/react-native-reanimated/issues/2976
    myRef.current?._listRef._scrollRef.scrollTo({
      x: scroll.value - fullWidth,
    })
  }, [scroll.value])

  return (
    <CarouselContext.Provider value={{ goToNext, goToPrev, current: 0 }}>
      <Flex grow mb="lg">
        <AnimatedIndicator scroll={scroll} stepCount={slides.length} />
        <AnimatedFlatList
          horizontal
          pagingEnabled
          data={slides}
          keyExtractor={key}
          {...flatListProps}
          ref={myRef}
          renderItem={({ item }: ListRenderItemInfo<ReactNode>) => (
            <Flex centered grow p="lg" pt="none" width={fullWidth}>
              {item}
            </Flex>
          )}
          scrollEnabled={true}
          scrollEventThrottle={32}
          showsHorizontalScrollIndicator={false}
          onScroll={scrollHandler}
        />
      </Flex>
    </CarouselContext.Provider>
  )
}

const key = (_: ReactElement, index: number) => index.toString()
