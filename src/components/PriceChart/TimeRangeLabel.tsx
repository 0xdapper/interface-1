import React from 'react'
import { interpolateColor, useAnimatedStyle } from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import { AnimatedNumber } from 'src/components/PriceChart/types'
import { AnimatedText } from 'src/components/Text'

interface Props {
  label: string
  index: number
  selectedIndex: AnimatedNumber
  transition: AnimatedNumber
}

export function TimeRangeLabel({ index, label, selectedIndex, transition }: Props) {
  const theme = useAppTheme()

  const style = useAnimatedStyle(() => {
    const selected = index === selectedIndex.value

    if (!selected) return { color: theme.colors.textSecondary }

    const color = interpolateColor(
      transition.value,
      [0, 1],
      [theme.colors.textSecondary, theme.colors.textPrimary]
    )

    return { color }
  })

  return (
    <AnimatedText style={style} textAlign="center" variant="subheadSmall">
      {label}
    </AnimatedText>
  )
}
