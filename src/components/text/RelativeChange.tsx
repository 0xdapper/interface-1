import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import { Arrow } from 'src/components/icons/Arrow'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { Theme } from 'src/styles/theme'
import { formatPrice } from 'src/utils/format'

interface RelativeChangeProps {
  change?: number
  absoluteChange?: number
  variant?: keyof Theme['textVariants']
}

export function RelativeChange({
  absoluteChange,
  change,
  variant = 'caption',
}: RelativeChangeProps) {
  const theme = useAppTheme()
  const isPositiveChange = change ? change > 0 : undefined

  return (
    <Flex row alignItems="center" gap="none">
      <Text color="textSecondary" variant={variant}>
        {change ? `${change.toFixed(2)}%` : '-'}{' '}
        {absoluteChange ? `(${formatPrice(absoluteChange)})` : ''}
      </Text>
      {isPositiveChange === undefined ? null : (
        <Arrow
          color={isPositiveChange ? theme.colors.accentSuccess : theme.colors.accentFailure}
          direction={isPositiveChange ? 'ne' : 'se'}
          size={16}
        />
      )}
    </Flex>
  )
}
