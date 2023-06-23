import type { IconProps } from '@tamagui/helpers-icon'
import { forwardRef, memo } from 'react'
import { Path, Svg } from 'react-native-svg'
import { getTokenValue, isWeb, useTheme } from 'tamagui'

const Icon = forwardRef<Svg, IconProps>((props, ref) => {
  // isWeb currentColor to maintain backwards compat a bit better, on native uses theme color
  const {
    color: colorProp = isWeb ? 'currentColor' : undefined,
    size: sizeProp = '$true',
    strokeWidth: strokeWidthProp,
    ...restProps
  } = props
  const theme = useTheme()

  const size = typeof sizeProp === 'string' ? getTokenValue(sizeProp, 'size') : sizeProp

  const strokeWidth =
    typeof strokeWidthProp === 'string' ? getTokenValue(strokeWidthProp, 'size') : strokeWidthProp

  const color =
    // @ts-expect-error its fine to access colorProp undefined
    theme[colorProp]?.get() ?? colorProp ?? theme.color.get()

  const svgProps = {
    ...restProps,
    size,
    strokeWidth,
    color,
  }

  return (
    <Svg ref={ref} fill="none" height={size} viewBox="0 0 24 24" width={size} {...svgProps}>
      <Path
        d="M17 3H7C5 3 4 4 4 6V18C4 20 5 21 7 21H17C19 21 20 20 20 18V6C20 4 19 3 17 3ZM8 16.75C7.586 16.75 7.25 16.414 7.25 16C7.25 15.586 7.586 15.25 8 15.25C8.414 15.25 8.75 15.586 8.75 16C8.75 16.414 8.414 16.75 8 16.75ZM8 12.75C7.586 12.75 7.25 12.414 7.25 12C7.25 11.586 7.586 11.25 8 11.25C8.414 11.25 8.75 11.586 8.75 12C8.75 12.414 8.414 12.75 8 12.75ZM8 8.75C7.586 8.75 7.25 8.414 7.25 8C7.25 7.586 7.586 7.25 8 7.25C8.414 7.25 8.75 7.586 8.75 8C8.75 8.414 8.414 8.75 8 8.75ZM16 16.75H11C10.586 16.75 10.25 16.414 10.25 16C10.25 15.586 10.586 15.25 11 15.25H16C16.414 15.25 16.75 15.586 16.75 16C16.75 16.414 16.414 16.75 16 16.75ZM16 12.75H11C10.586 12.75 10.25 12.414 10.25 12C10.25 11.586 10.586 11.25 11 11.25H16C16.414 11.25 16.75 11.586 16.75 12C16.75 12.414 16.414 12.75 16 12.75ZM16 8.75H11C10.586 8.75 10.25 8.414 10.25 8C10.25 7.586 10.586 7.25 11 7.25H16C16.414 7.25 16.75 7.586 16.75 8C16.75 8.414 16.414 8.75 16 8.75Z"
        fill={color}
      />
    </Svg>
  )
})

Icon.displayName = 'ContractInteraction'

export const ContractInteraction = memo<IconProps>(Icon)
