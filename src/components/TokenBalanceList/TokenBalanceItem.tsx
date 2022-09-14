import React from 'react'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { Button } from 'src/components/buttons/Button'
import { CurrencyInfoLogo } from 'src/components/CurrencyLogo/CurrencyInfoLogo'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { RelativeChange } from 'src/components/text/RelativeChange'
import { PortfolioBalance } from 'src/features/dataApi/types'
import { CurrencyId } from 'src/utils/currencyId'
import { formatNumberBalance, formatUSDPrice } from 'src/utils/format'

interface TokenBalanceItemProps {
  portfolioBalance: PortfolioBalance
  onPressToken?: (currencyId: CurrencyId) => void
  onPressTokenIn?: (currencyId: CurrencyId) => void
}

export function TokenBalanceItem({
  portfolioBalance,
  onPressToken,
  onPressTokenIn,
}: TokenBalanceItemProps) {
  const { quantity, currencyInfo, relativeChange24 } = portfolioBalance
  const { currency } = currencyInfo

  const onPress = () => {
    onPressToken?.(currencyInfo.currencyId)
  }

  const onPressIn = () => {
    onPressTokenIn?.(currencyInfo.currencyId)
  }

  return (
    <Button
      alignItems="center"
      bg="none"
      delayPressIn={150}
      flexDirection="row"
      justifyContent="space-between"
      minHeight={56}
      p="sm"
      onPress={onPress}
      onPressIn={onPressIn}>
      <AnimatedFlex
        row
        alignItems="center"
        entering={FadeIn}
        exiting={FadeOut}
        flexShrink={1}
        gap="sm"
        overflow="hidden">
        <CurrencyInfoLogo currencyInfo={currencyInfo} size={36} />
        <Flex alignItems="flex-start" flexShrink={1} gap="none">
          <Text ellipsizeMode="tail" numberOfLines={1} variant="subhead">
            {currency.name ?? currency.symbol}
          </Text>
          <Flex row alignItems="center" gap="xs" height={20}>
            <Text color="textSecondary" numberOfLines={1} variant="caption">
              {`${formatNumberBalance(quantity)}`} {currency.symbol}
            </Text>
          </Flex>
        </Flex>
      </AnimatedFlex>
      <AnimatedFlex entering={FadeIn} exiting={FadeOut} justifyContent="space-between">
        <Flex alignItems="flex-end" gap="xxs">
          <Text variant="body">{formatUSDPrice(portfolioBalance.balanceUSD)}</Text>
          <Text color="textSecondary" variant="caption">
            <RelativeChange change={relativeChange24} />
          </Text>
        </Flex>
      </AnimatedFlex>
    </Button>
  )
}
