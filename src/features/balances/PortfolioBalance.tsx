import React, { useEffect, useState } from 'react'
import { Flex } from 'src/components/layout'
import { WarmLoadingShimmer } from 'src/components/loading/WarmLoadingShimmer'
import { DecimalNumber } from 'src/components/text/DecimalNumber'
import { RelativeChange } from 'src/components/text/RelativeChange'
import { PollingInterval } from 'src/constants/misc'
import { isWarmLoadingStatus } from 'src/data/utils'
import { usePortfolioBalanceQuery } from 'src/data/__generated__/types-and-hooks'
import { theme } from 'src/styles/theme'
import { formatUSDPrice, NumberType } from 'src/utils/format'

interface PortfolioBalanceProps {
  owner: Address
}

export function PortfolioBalance({ owner }: PortfolioBalanceProps) {
  const { data, loading, networkStatus } = usePortfolioBalanceQuery({
    variables: { owner },
    pollInterval: PollingInterval.Fast,
    notifyOnNetworkStatusChange: true,
    // This is better than using network status to check, because doing it that way we would have to wait
    // for the network status to go back to "ready", which results in the numbers updating, and _then_ the
    // shimmer disappearing. Using onCompleted it disappears at the same time as the data loads in.
    onCompleted: () => {
      setIsWarmLoading(false)
    },
  })

  const [isWarmLoading, setIsWarmLoading] = useState(false)
  const isLoading = loading && !data

  useEffect(() => {
    if (!!data && isWarmLoadingStatus(networkStatus)) {
      setIsWarmLoading(true)
    }
  }, [data, networkStatus])

  const portfolioBalance = data?.portfolios?.[0]
  const portfolioChange = portfolioBalance?.tokensTotalDenominatedValueChange

  return (
    <WarmLoadingShimmer isWarmLoading={isWarmLoading && !isLoading}>
      <Flex gap="xxs">
        <DecimalNumber
          adjustsFontSizeToFit
          color={isWarmLoading ? 'textSecondary' : undefined}
          // initially set color to textSecondary when isWarm because the shimmer mask takes a second to load, resulting in a flash of the underlying color
          fontWeight="600"
          loading={isLoading}
          number={formatUSDPrice(
            portfolioBalance?.tokensTotalDenominatedValue?.value ?? undefined,
            NumberType.PortfolioBalance
          )}
          numberOfLines={1}
          variant="headlineLarge"
        />
        <RelativeChange
          absoluteChange={portfolioChange?.absolute?.value}
          arrowSize={theme.iconSizes.md}
          change={portfolioChange?.percentage?.value}
          loading={isLoading}
          negativeChangeColor={isWarmLoading ? 'textSecondary' : 'accentCritical'}
          positiveChangeColor={isWarmLoading ? 'textSecondary' : 'accentSuccess'}
          variant="bodyLarge"
        />
      </Flex>
    </WarmLoadingShimmer>
  )
}
