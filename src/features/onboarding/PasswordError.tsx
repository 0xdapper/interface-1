import React from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'

interface PasswordErrorProps {
  errorText: string
  style?: StyleProp<ViewStyle>
}

export function PasswordError({ errorText, style }: PasswordErrorProps) {
  const theme = useAppTheme()

  return (
    <AnimatedFlex centered row gap="xs" pt="sm" px="xs" style={style}>
      <AlertTriangle
        color={theme.colors.accentCritical}
        height={ERROR_ICON_HEIGHT}
        width={ERROR_ICON_HEIGHT}
      />
      <Flex>
        <Text color="accentCritical" variant="bodySmall">
          {errorText}
        </Text>
      </Flex>
    </AnimatedFlex>
  )
}

const ERROR_ICON_HEIGHT = 20
