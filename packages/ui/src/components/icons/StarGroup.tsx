import type { IconProps } from '@tamagui/helpers-icon'
import { forwardRef, memo } from 'react'
import { Defs, LinearGradient, Path, Stop, Svg } from 'react-native-svg'
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
    <Svg ref={ref} fill="none" height={size} viewBox="0 0 16 15" width={size} {...svgProps}>
      <Path
        d="M15.8759 8.44882C15.8363 8.37027 15.7384 8.33088 15.6597 8.31125C15.2072 8.31125 11.317 8.15427 11.317 3.6347C11.317 3.49736 11.1992 3.37943 11.0612 3.37943C10.9242 3.37943 10.8063 3.49736 10.8063 3.6347C10.8063 8.15441 6.91568 8.31125 6.48307 8.31125C6.42416 8.31125 6.36513 8.33088 6.32586 8.37027C6.28647 8.38991 6.26661 8.42896 6.24731 8.44882C6.20793 8.52748 6.20793 8.62566 6.24731 8.70432C6.28659 8.78309 6.38466 8.84189 6.48295 8.84189H6.50259C6.95456 8.84189 10.8258 8.99921 10.8258 13.5184C10.8258 13.6558 10.9435 13.7739 11.0814 13.7739C11.219 13.7739 11.3366 13.6559 11.3366 13.5184C11.3366 9.01884 15.2074 8.84189 15.6598 8.84189C15.7579 8.84189 15.8364 8.7832 15.8957 8.70432C15.9345 8.62566 15.9345 8.5277 15.8758 8.44882H15.8759Z"
        fill="url(#paint0_linear_12336_349)"
      />
      <Path
        d="M5.55976 11.6717C5.3239 11.6717 3.20178 11.593 3.20178 9.11712C3.20178 8.97944 3.08385 8.86151 2.94651 8.86151C2.80893 8.86151 2.691 8.97922 2.691 9.11712C2.691 11.593 0.568892 11.6717 0.333025 11.6717H0.313389C0.17593 11.6913 0.0776367 11.7893 0.0776367 11.927C0.0776367 12.0647 0.19557 12.1826 0.333138 12.1826C0.588638 12.1826 2.69112 12.2609 2.69112 14.7368C2.69112 14.8742 2.80905 14.9924 2.94662 14.9924C3.06455 15.0317 3.18248 14.9139 3.18248 14.7566C3.18248 12.2806 5.30459 12.202 5.54046 12.202H5.5601C5.69767 12.202 5.8156 12.0843 5.8156 11.927C5.81515 11.7893 5.69733 11.6717 5.55976 11.6717V11.6717Z"
        fill="url(#paint1_linear_12336_349)"
      />
      <Path
        d="M7.8193 3.34009C7.95698 3.34009 8.07491 3.22216 8.07491 3.06506C8.07491 2.92749 7.95698 2.80979 7.8193 2.80979C7.58377 2.80979 5.46155 2.73113 5.46155 0.25544C5.46155 0.117869 5.34361 -6.10352e-05 5.20605 -6.10352e-05C5.06848 -6.10352e-05 4.95077 0.117872 4.95077 0.25544C4.95077 2.73134 2.82854 2.80979 2.59279 2.80979H2.57304C2.43547 2.82942 2.3374 2.9275 2.3374 3.06506C2.3374 3.20263 2.45534 3.32057 2.5929 3.32057C2.8484 3.32057 4.95088 3.39911 4.95088 5.87491C4.95088 6.01248 5.06859 6.13041 5.20616 6.13041C5.32409 6.15016 5.44202 6.03234 5.44202 5.89455C5.44202 3.41865 7.56402 3.3402 7.8 3.3402L7.8193 3.34009Z"
        fill="url(#paint2_linear_12336_349)"
      />
      <Defs>
        <LinearGradient
          gradientUnits="userSpaceOnUse"
          id="paint0_linear_12336_349"
          x1="7.1365"
          x2="15.9626"
          y1="3.37947"
          y2="13.0528">
          <Stop stopColor="#FF79C9" />
          <Stop offset="1" stopColor="#FFB8E2" />
        </LinearGradient>
        <LinearGradient
          gradientUnits="userSpaceOnUse"
          id="paint1_linear_12336_349"
          x1="0.620828"
          x2="5.83257"
          y1="8.86154"
          y2="14.5802">
          <Stop stopColor="#FF79C9" />
          <Stop offset="1" stopColor="#FFB8E2" />
        </LinearGradient>
        <LinearGradient
          gradientUnits="userSpaceOnUse"
          id="paint2_linear_12336_349"
          x1="2.88055"
          x2="8.08687"
          y1="-3.61877e-05"
          y2="5.71773">
          <Stop stopColor="#FF79C9" />
          <Stop offset="1" stopColor="#FFB8E2" />
        </LinearGradient>
      </Defs>
    </Svg>
  )
})

Icon.displayName = 'StarGroup'

export const StarGroup = memo<IconProps>(Icon)
