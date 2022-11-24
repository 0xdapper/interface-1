import React, { memo } from 'react'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { TokenLogo } from 'src/components/CurrencyLogo/TokenLogo'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { WarmLoadingShimmer } from 'src/components/loading/WarmLoadingShimmer'
import { Text } from 'src/components/Text'
import { RelativeChange } from 'src/components/text/RelativeChange'
import { PortfolioBalance } from 'src/features/dataApi/types'
import { CurrencyId } from 'src/utils/currencyId'
import { formatNumber, formatUSDPrice, NumberType } from 'src/utils/format'

interface TokenBalanceItemProps {
  portfolioBalance: PortfolioBalance
  onPressToken?: (currencyId: CurrencyId) => void
  isWarmLoading?: boolean
}

export const TokenBalanceItem = memo(
  ({ portfolioBalance, onPressToken, isWarmLoading }: TokenBalanceItemProps) => {
    const { quantity, currencyInfo, relativeChange24 } = portfolioBalance
    const { currency } = currencyInfo

    const onPress = () => {
      onPressToken?.(currencyInfo.currencyId)
    }

    return (
      <TouchableArea
        alignItems="flex-start"
        bg="none"
        flexDirection="row"
        justifyContent="space-between"
        minHeight={56}
        py="xs"
        onPress={onPress}>
        <AnimatedFlex
          row
          alignItems="center"
          entering={FadeIn}
          exiting={FadeOut}
          flexShrink={1}
          gap="sm"
          overflow="hidden">
          <TokenLogo
            chainId={currency.chainId}
            symbol={currency.symbol}
            url={currencyInfo.logoUrl ?? undefined}
          />
          <Flex alignItems="flex-start" flexShrink={1} gap="none">
            <Text ellipsizeMode="tail" numberOfLines={1} variant="bodyLarge">
              {currency.name ?? currency.symbol}
            </Text>
            <Flex row alignItems="center" gap="xs" minHeight={20}>
              <Text color="textSecondary" numberOfLines={1} variant="subheadSmall">
                {`${formatNumber(quantity, NumberType.TokenNonTx)}`} {currency.symbol}
              </Text>
            </Flex>
          </Flex>
        </AnimatedFlex>
        <AnimatedFlex entering={FadeIn} exiting={FadeOut} justifyContent="space-between">
          <WarmLoadingShimmer isWarmLoading={isWarmLoading}>
            <Flex alignItems="flex-end" gap="xxs" pl="xs">
              <Text
                color={isWarmLoading ? 'textSecondary' : 'textPrimary'}
                numberOfLines={1}
                variant="bodyLarge">
                {formatUSDPrice(portfolioBalance.balanceUSD, NumberType.FiatTokenQuantity)}
              </Text>
              <Text color="textSecondary">
                <RelativeChange
                  change={relativeChange24 ?? undefined}
                  negativeChangeColor={isWarmLoading ? 'textSecondary' : 'accentCritical'}
                  positiveChangeColor={isWarmLoading ? 'textSecondary' : 'accentSuccess'}
                  variant="subheadSmall"
                />
              </Text>
            </Flex>
          </WarmLoadingShimmer>
        </AnimatedFlex>
      </TouchableArea>
    )
  }
)
