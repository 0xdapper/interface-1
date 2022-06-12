import {
  backgroundColor,
  BackgroundColorProps,
  BackgroundColorShorthandProps,
  border,
  BorderProps,
  color,
  ColorProps,
  layout,
  LayoutProps,
  spacing,
  SpacingProps,
  spacingShorthand,
  SpacingShorthandProps,
  typography,
  TypographyProps,
  useRestyle,
  useTheme,
} from '@shopify/restyle'
import React, { RefObject } from 'react'
import { TextInput as TextInputBase, TextInputProps as BaseTextInputProps } from 'react-native'
import { Theme } from 'src/styles/theme'

const restyleFunctions = [
  layout,
  typography,
  spacing,
  spacingShorthand,
  border,
  backgroundColor,
  color,
]
type RestyleProps = TypographyProps<Theme> &
  SpacingProps<Theme> &
  SpacingShorthandProps<Theme> &
  LayoutProps<Theme> &
  SpacingShorthandProps<Theme> &
  BorderProps<Theme> &
  BackgroundColorProps<Theme> &
  BackgroundColorShorthandProps<Theme> &
  ColorProps<Theme>

export type TextInputProps = RestyleProps &
  BaseTextInputProps &
  Required<Pick<BaseTextInputProps, 'onChangeText'>> & { inputRef?: RefObject<TextInputBase> }

export function TextInput({ onChangeText, onBlur, inputRef, ...rest }: TextInputProps) {
  const theme = useTheme<Theme>()

  // Set defaults for style values
  rest.backgroundColor ??= 'mainBackground'
  rest.px ??= 'md'
  rest.py ??= 'sm'
  rest.color ??= 'mainForeground'
  rest.borderRadius ??= 'md'
  rest.placeholderTextColor ??= theme.colors.deprecated_gray600
  const transformedProps = useRestyle(restyleFunctions, rest)

  return (
    <TextInputBase
      ref={inputRef}
      autoCompleteType="off"
      onBlur={onBlur}
      onChangeText={onChangeText}
      {...transformedProps}
    />
  )
}
