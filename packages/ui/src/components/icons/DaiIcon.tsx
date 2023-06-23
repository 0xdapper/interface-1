import type { IconProps } from '@tamagui/helpers-icon'
import { forwardRef, memo } from 'react'
import { Path, Svg } from 'react-native-svg'
import { getTokenValue, useTheme } from 'tamagui'

const Icon = forwardRef<Svg, IconProps>((props, ref) => {
  // isWeb currentColor to maintain backwards compat a bit better, on native uses theme color
  const {
    color: colorProp = '#F5AC37',
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
        d="M12 0C18.628 0 24 5.37305 24 12C24 18.628 18.628 24 12 24C5.37305 24 0 18.6275 0 12C0 5.37305 5.37305 0 12 0Z"
        fill={color ?? '#F5AC37'}
      />
      <Path
        clipRule="evenodd"
        d="M6.28518 18.6151V18.6599L6.28302 18.6615V18.6691H11.4881C12.0773 18.6772 12.6643 18.6302 13.2431 18.5265C13.8528 18.4072 14.4468 18.2192 15.0133 17.9644C15.2589 17.8506 15.4946 17.7131 15.7323 17.5744C15.7925 17.5393 15.8528 17.5041 15.9135 17.4692C16.1932 17.2699 16.461 17.0539 16.7159 16.8244C17.4136 16.1937 17.9536 15.4069 18.2911 14.5294C18.3138 14.4311 18.4099 14.3679 18.5087 14.3868H19.9263C20.0391 14.3868 20.0764 14.349 20.0764 14.2216V13.3138C20.0839 13.2269 20.0839 13.1389 20.0764 13.0519C20.0764 13.0292 20.0822 13.0066 20.088 12.9839C20.0997 12.9388 20.1113 12.8939 20.0764 12.8489H18.8921C18.749 12.8489 18.749 12.8338 18.749 12.7063C18.7901 12.2495 18.7901 11.791 18.749 11.3342C18.7415 11.1992 18.7717 11.1992 18.8765 11.1992H19.9117C20.0321 11.1992 20.0769 11.1689 20.0769 11.0491V9.81892C20.0732 9.73744 20.0713 9.69614 20.0497 9.6752C20.0275 9.65368 19.9844 9.65368 19.8971 9.65368H18.5546C18.4499 9.6715 18.3494 9.60076 18.3305 9.496C18.1766 9.0937 17.9806 8.70867 17.7446 8.34849C17.507 7.99317 17.2392 7.65944 16.9422 7.3511C16.5474 6.9569 16.1041 6.61453 15.6224 6.33103C14.8961 5.90929 14.1018 5.6139 13.275 5.46108C12.8738 5.3871 12.4682 5.34228 12.06 5.32608H6.4353C6.28518 5.32608 6.28518 5.35632 6.28518 5.4762V9.51868C6.28518 9.66124 6.25494 9.66124 6.14262 9.66124H4.53016C4.41028 9.66124 4.41028 9.68338 4.41028 9.766V11.0858C4.41028 11.2057 4.44754 11.2057 4.53772 11.2057H6.16529C6.28518 11.2057 6.28518 11.2278 6.28518 11.318V12.7279C6.28518 12.8554 6.24738 12.8554 6.15018 12.8554H4.41028V14.2804C4.41028 14.4003 4.44754 14.4003 4.53772 14.4003H6.16529C6.28518 14.4003 6.28518 14.4149 6.28518 14.5127V16.2752V16.8676V18.6151ZM16.643 9.53272C16.656 9.5662 16.656 9.60346 16.643 9.63748H16.6792C16.6641 9.6823 16.589 9.69742 16.589 9.69742H7.93435C7.79179 9.69742 7.79179 9.66718 7.79179 9.55486V6.89264C7.79179 6.79489 7.80691 6.75007 7.91923 6.75007H11.9466C12.3754 6.74629 12.803 6.79111 13.2215 6.88507C14.051 7.08164 14.8227 7.4726 15.4717 8.02503C15.6013 8.12169 15.7169 8.23563 15.8168 8.36253C16.0285 8.57259 16.2143 8.80641 16.3719 9.06022C16.4767 9.20872 16.5669 9.36694 16.643 9.53272ZM17.0021 12.8473H12.4423H7.97215C7.88095 12.8473 7.83601 12.8473 7.81386 12.8248C7.79233 12.803 7.79233 12.7599 7.79233 12.675V11.3401C7.79233 11.2348 7.82257 11.1976 7.93489 11.1976H17.0097C17.1074 11.1976 17.1522 11.2348 17.1522 11.325C17.1895 11.7894 17.1895 12.256 17.1522 12.7198C17.1452 12.8473 17.0993 12.8473 17.0021 12.8473ZM16.643 14.4074C16.5156 14.3933 16.3871 14.3933 16.2596 14.4074H7.94245C7.83013 14.4074 7.79233 14.4074 7.79233 14.5575V17.1603C7.79233 17.2802 7.79233 17.3104 7.94245 17.3104H11.7824C11.966 17.3245 12.1496 17.3115 12.3295 17.2732C12.8867 17.2332 13.4348 17.1122 13.9576 16.913C14.1477 16.8471 14.3313 16.7612 14.5046 16.6581H14.557C15.4572 16.1899 16.1883 15.4544 16.6495 14.5515C16.6495 14.5515 16.7019 14.4381 16.643 14.4084V14.4074Z"
        fill={color ?? '#FEFEFD'}
        fillRule="evenodd"
      />
    </Svg>
  )
})

Icon.displayName = 'DaiIcon'

export const DaiIcon = memo<IconProps>(Icon)
