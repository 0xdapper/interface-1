import React, { forwardRef, ReactElement, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Keyboard,
  LayoutChangeEvent,
  TextInput as NativeTextInput,
  useColorScheme,
  ViewStyle,
} from 'react-native'
import { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import X from 'src/assets/icons/x.svg'
import { AnimatedTouchableArea, TouchableArea } from 'src/components/buttons/TouchableArea'
import { TextInput, TextInputProps } from 'src/components/input/TextInput'
import { AnimatedFlex, Box } from 'src/components/layout'
import { SHADOW_OFFSET_SMALL } from 'src/components/layout/BaseCard'
import { Text } from 'src/components/Text'
import { dimensions } from 'src/styles/sizing'
import SearchIcon from '../../assets/icons/search.svg'

export const springConfig = {
  stiffness: 1000,
  damping: 500,
  mass: 3,
  overshootClamping: true,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
}

export type SearchTextInputProps = TextInputProps & {
  value: string
  onFocus?: () => void
  onCancel?: () => void
  clearIcon?: ReactElement
  disableClearable?: boolean
  endAdornment?: ReactElement
  showCancelButton?: boolean
  showShadow?: boolean
}

export const SearchTextInput = forwardRef<NativeTextInput, SearchTextInputProps>((props, ref) => {
  const theme = useAppTheme()
  const isDarkMode = useColorScheme() === 'dark'
  const { t } = useTranslation()
  const {
    autoFocus,
    backgroundColor = 'background1',
    clearIcon,
    disableClearable,
    endAdornment,
    onCancel,
    onChangeText,
    onFocus,
    placeholder,
    showCancelButton,
    showShadow,
    value,
  } = props

  const isFocus = useSharedValue(false)
  const showClearButton = useSharedValue(value.length > 0 && !disableClearable)
  const cancelButtonWidth = useSharedValue(showCancelButton ? 40 : 0)

  const onPressCancel = () => {
    isFocus.value = false
    Keyboard.dismiss()
    onChangeText?.('')
    onCancel?.()
  }

  const onCancelLayout = useCallback(
    (event: LayoutChangeEvent) => {
      cancelButtonWidth.value = event.nativeEvent.layout.width
    },
    [cancelButtonWidth]
  )

  const onClear = () => {
    onChangeText?.('')
    showClearButton.value = false
  }

  const onTextInputFocus = () => {
    onFocus?.()
    isFocus.value = true
  }

  const onTextInputSubmitEditing = () => {
    isFocus.value = false
    Keyboard.dismiss()
  }

  const onChangeTextInput = useCallback(
    (text: string) => {
      onChangeText?.(text)
      if (text.length > 0) {
        showClearButton.value = true
      } else {
        showClearButton.value = false
      }
    },
    [showClearButton, onChangeText]
  )

  const textInputStyle = useAnimatedStyle(() => {
    return {
      marginRight: withSpring(
        showCancelButton && isFocus.value ? cancelButtonWidth.value + theme.spacing.sm : 0,
        springConfig
      ),
    }
  })

  const clearButtonStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isFocus.value && showClearButton.value ? 1 : 0),
      transform: [{ scale: withTiming(isFocus.value && showClearButton.value ? 1 : 0) }],
    }
  })

  const endAdornmentStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isFocus.value && showClearButton.value ? 0 : 1),
      transform: [{ scale: withTiming(isFocus.value && showClearButton.value ? 0 : 1) }],
    }
  })

  const cancelButtonStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isFocus.value ? 1 : 0),
      transform: [
        { scale: withTiming(isFocus.value ? 1 : 0) },
        {
          translateX: isFocus.value
            ? withTiming(0, { duration: 0 })
            : withTiming(dimensions.fullWidth, { duration: 650 }),
        },
      ],
    }
  })

  const shadowProps = showShadow
    ? {
        shadowColor: isDarkMode ? 'black' : 'brandedAccentSoft',
        shadowOffset: SHADOW_OFFSET_SMALL,
        shadowOpacity: 0.25,
        shadowRadius: 6,
      }
    : null

  return (
    <Box alignItems="center" flexDirection="row" flexShrink={1}>
      <AnimatedFlex
        row
        alignItems="center"
        backgroundColor={backgroundColor}
        borderRadius="lg"
        flex={1}
        flexGrow={1}
        gap="none"
        minHeight={48}
        px="sm"
        style={textInputStyle}
        {...shadowProps}>
        <SearchIcon color={theme.colors.textTertiary} height={20} width={20} />
        <TextInput
          ref={ref}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus={autoFocus}
          backgroundColor="none"
          borderWidth={0}
          flex={1}
          fontFamily={theme.textVariants.bodyLarge.fontFamily}
          fontSize={theme.textVariants.bodyLarge.fontSize}
          maxFontSizeMultiplier={theme.textVariants.bodyLarge.maxFontSizeMultiplier}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textTertiary}
          px="xs"
          returnKeyType="done"
          textContentType="none"
          value={value}
          onChangeText={onChangeTextInput}
          onFocus={onTextInputFocus}
          onSubmitEditing={onTextInputSubmitEditing}
        />
        {showClearButton.value ? (
          <AnimatedFlex style={[clearButtonStyle]}>
            <ClearButton clearIcon={clearIcon} onPress={onClear} />
          </AnimatedFlex>
        ) : (
          <AnimatedFlex style={[endAdornmentStyle]}>{endAdornment}</AnimatedFlex>
        )}
      </AnimatedFlex>
      {showCancelButton && (
        <AnimatedTouchableArea
          style={[cancelButtonStyle, CancelButtonDefaultStyle]}
          onLayout={onCancelLayout}
          onPress={onPressCancel}>
          <Text variant="buttonLabelMedium">{t('Cancel')}</Text>
        </AnimatedTouchableArea>
      )}
    </Box>
  )
})

const CancelButtonDefaultStyle: ViewStyle = {
  position: 'absolute',
  right: 0,
}

interface ClearButtonProps {
  clearIcon: SearchTextInputProps['clearIcon']
  onPress: () => void
}

function ClearButton(props: ClearButtonProps) {
  const theme = useAppTheme()

  const { onPress, clearIcon = <X color={theme.colors.textSecondary} height={16} width={16} /> } =
    props

  return (
    <TouchableArea
      backgroundColor="backgroundOutline"
      borderRadius="full"
      p="xxs"
      onPress={onPress}>
      {clearIcon}
    </TouchableArea>
  )
}
