import { SpacingProps, SpacingShorthandProps } from '@shopify/restyle'
import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import XIcon from 'src/assets/icons/x.svg'
import { Button } from 'src/components/buttons/Button'
import { Theme } from 'src/styles/theme'

type Props = {
  onPress: () => void
  size?: number
  strokeWidth?: number
  color?: keyof Theme['colors']
} & SpacingProps<Theme> &
  SpacingShorthandProps<Theme>

export function CloseButton({ onPress, size, strokeWidth, color, ...rest }: Props) {
  const theme = useAppTheme()
  return (
    <Button onPress={onPress} {...rest}>
      <XIcon
        color={theme.colors[color ?? 'white']}
        height={size ?? 20}
        strokeWidth={strokeWidth ?? 2}
        width={size ?? 20}
      />
    </Button>
  )
}
