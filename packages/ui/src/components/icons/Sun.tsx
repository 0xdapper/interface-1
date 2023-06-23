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
        d="M16.5 12C16.5 14.481 14.481 16.5 12 16.5C9.519 16.5 7.5 14.481 7.5 12C7.5 9.519 9.519 7.5 12 7.5C14.481 7.5 16.5 9.519 16.5 12ZM12.75 5V3C12.75 2.586 12.414 2.25 12 2.25C11.586 2.25 11.25 2.586 11.25 3V5C11.25 5.414 11.586 5.75 12 5.75C12.414 5.75 12.75 5.414 12.75 5ZM12.75 21V19C12.75 18.586 12.414 18.25 12 18.25C11.586 18.25 11.25 18.586 11.25 19V21C11.25 21.414 11.586 21.75 12 21.75C12.414 21.75 12.75 21.414 12.75 21ZM5.75 12C5.75 11.586 5.414 11.25 5 11.25H3C2.586 11.25 2.25 11.586 2.25 12C2.25 12.414 2.586 12.75 3 12.75H5C5.414 12.75 5.75 12.414 5.75 12ZM21.75 12C21.75 11.586 21.414 11.25 21 11.25H19C18.586 11.25 18.25 11.586 18.25 12C18.25 12.414 18.586 12.75 19 12.75H21C21.414 12.75 21.75 12.414 21.75 12ZM7.58099 7.58099C7.87399 7.28799 7.87399 6.81299 7.58099 6.51999L6.16699 5.10599C5.87399 4.81299 5.39899 4.81299 5.10599 5.10599C4.81299 5.39899 4.81299 5.87399 5.10599 6.16699L6.51999 7.58099C6.66599 7.72699 6.85799 7.80099 7.04999 7.80099C7.24199 7.80099 7.43399 7.72699 7.58099 7.58099ZM18.894 18.894C19.187 18.601 19.187 18.126 18.894 17.833L17.48 16.419C17.187 16.126 16.712 16.126 16.419 16.419C16.126 16.712 16.126 17.187 16.419 17.48L17.833 18.894C17.979 19.04 18.171 19.114 18.363 19.114C18.555 19.114 18.748 19.041 18.894 18.894ZM6.16699 18.894L7.58099 17.48C7.87399 17.187 7.87399 16.712 7.58099 16.419C7.28799 16.126 6.81299 16.126 6.51999 16.419L5.10599 17.833C4.81299 18.126 4.81299 18.601 5.10599 18.894C5.25199 19.04 5.44399 19.114 5.63599 19.114C5.82799 19.114 6.01999 19.041 6.16699 18.894ZM17.48 7.58099L18.894 6.16699C19.187 5.87399 19.187 5.39899 18.894 5.10599C18.601 4.81299 18.126 4.81299 17.833 5.10599L16.419 6.51999C16.126 6.81299 16.126 7.28799 16.419 7.58099C16.565 7.72699 16.757 7.80099 16.949 7.80099C17.141 7.80099 17.333 7.72699 17.48 7.58099Z"
        fill={color}
      />
    </Svg>
  )
})

Icon.displayName = 'Sun'

export const Sun = memo<IconProps>(Icon)
