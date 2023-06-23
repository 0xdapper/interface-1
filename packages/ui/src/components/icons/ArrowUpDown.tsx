import type { IconProps } from '@tamagui/helpers-icon'
import { forwardRef, memo } from 'react'
import { Path, Svg } from 'react-native-svg'
import { getTokenValue, useTheme } from 'tamagui'

const Icon = forwardRef<Svg, IconProps>((props, ref) => {
  // isWeb currentColor to maintain backwards compat a bit better, on native uses theme color
  const {
    color: colorProp = '#7C85A2',
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
    <Svg ref={ref} fill="none" height={size} viewBox="0 0 19 16" width={size} {...svgProps}>
      <Path
        d="M14.7 0.895996C14.361 0.541922 13.8337 0.549456 13.5022 0.895996L9.7053 4.78327C9.55463 4.93394 9.4567 5.16748 9.4567 5.37088C9.4567 5.84549 9.78817 6.16943 10.2552 6.16943C10.4813 6.16943 10.6621 6.0941 10.8127 5.93589L12.3646 4.32373L13.359 3.17864L13.2988 4.77574L13.2988 14.5542C13.2988 15.0213 13.6378 15.3603 14.1049 15.3603C14.5719 15.3603 14.9034 15.0213 14.9034 14.5542L14.9034 4.77574L14.8507 3.17864L15.8376 4.32373L17.3895 5.9359C17.5401 6.0941 17.7285 6.16943 17.9545 6.16943C18.414 6.16943 18.7455 5.84549 18.7455 5.37088C18.7455 5.16748 18.6475 4.93394 18.4969 4.78327L14.7 0.895996ZM4.72567 15.0966C5.06468 15.4507 5.59202 15.4431 5.9235 15.0966L9.72037 11.2169C9.87104 11.0587 9.96898 10.8251 9.96898 10.6217C9.96898 10.1546 9.6375 9.8307 9.17043 9.8307C8.95196 9.8307 8.76362 9.90604 8.61295 10.0567L7.06105 11.6689L6.07417 12.814L6.1269 11.2169L6.1269 1.43841C6.1269 0.978864 5.78789 0.632324 5.32082 0.632324C4.86128 0.632324 4.52227 0.978864 4.52227 1.43841L4.52227 11.2169L4.575 12.814L3.58812 11.6689L2.03622 10.0567C1.88555 9.90604 1.69721 9.8307 1.47874 9.8307C1.01167 9.8307 0.680193 10.1546 0.680193 10.6217C0.680193 10.8251 0.778128 11.0587 0.928797 11.2169L4.72567 15.0966Z"
        fill={color ?? '#7C85A2'}
      />
    </Svg>
  )
})

Icon.displayName = 'ArrowUpDown'

export const ArrowUpDown = memo<IconProps>(Icon)
