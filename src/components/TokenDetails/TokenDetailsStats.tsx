import { Currency } from '@uniswap/sdk-core'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import { LinkButton } from 'src/components/buttons/LinkButton'
import { Flex } from 'src/components/layout'
import { Shimmer } from 'src/components/loading/Shimmer'
import { Text } from 'src/components/Text'
import { LongText } from 'src/components/text/LongText'
import { TokenDetailsScreenQuery } from 'src/data/__generated__/types-and-hooks'
import { currencyAddress } from 'src/utils/currencyId'
import { formatNumber, NumberType } from 'src/utils/format'
import { ExplorerDataType, getExplorerLink, getTwitterLink } from 'src/utils/linking'

export function TokenDetailsMarketData({
  marketCap,
  volume,
  priceLow52W,
  priceHight52W,
  isLoading = false,
}: {
  marketCap?: number
  volume?: number
  priceLow52W?: number
  priceHight52W?: number
  isLoading?: boolean
}) {
  const { t } = useTranslation()

  // Utility component to render formatted values
  const FormattedValue = useCallback(
    ({ value, numberType }: { value?: number; numberType: NumberType }) => {
      if (isLoading) {
        return (
          <Shimmer>
            <Text
              loading
              height="100%"
              loadingPlaceholderText="$0.00"
              variant="bodyLarge"
              width="50%"
            />
          </Shimmer>
        )
      }
      return <Text variant="bodyLarge">{formatNumber(value, numberType)}</Text>
    },
    [isLoading]
  )

  return (
    <Flex row justifyContent="space-between">
      <Flex flex={1} gap="lg">
        <Flex gap="xxs">
          <Text color="textTertiary" variant="subheadSmall">
            {t('Market cap')}
          </Text>
          <FormattedValue numberType={NumberType.FiatTokenStats} value={marketCap} />
        </Flex>
        <Flex gap="xxs">
          <Text color="textTertiary" variant="subheadSmall">
            {t('52W low')}
          </Text>
          <FormattedValue numberType={NumberType.FiatTokenDetails} value={priceLow52W} />
        </Flex>
      </Flex>
      <Flex flex={1} gap="lg">
        <Flex gap="xxs">
          <Text color="textTertiary" variant="subheadSmall">
            {t('24h Uniswap volume')}
          </Text>
          <FormattedValue numberType={NumberType.FiatTokenStats} value={volume} />
        </Flex>
        <Flex gap="xxs">
          <Text color="textTertiary" variant="subheadSmall">
            {t('52W high')}
          </Text>
          <FormattedValue numberType={NumberType.FiatTokenDetails} value={priceHight52W} />
        </Flex>
      </Flex>
    </Flex>
  )
}

export function TokenDetailsStats({
  currency,
  data,
  tokenColor,
}: {
  currency: Currency
  data: TokenDetailsScreenQuery | undefined
  tokenColor?: NullUndefined<string>
}) {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const tokenData = data?.tokens?.[0]
  const tokenProjectData = tokenData?.project

  const marketData = tokenProjectData?.markets ? tokenProjectData.markets[0] : null

  const explorerLink = getExplorerLink(
    currency.chainId,
    currencyAddress(currency),
    ExplorerDataType.ADDRESS
  )

  return (
    <Flex gap="lg">
      <Text variant="subheadLarge">{t('Stats')}</Text>
      <TokenDetailsMarketData
        marketCap={marketData?.marketCap?.value}
        priceHight52W={marketData?.priceHigh52W?.value}
        priceLow52W={marketData?.priceLow52W?.value}
        volume={tokenData?.market?.volume?.value}
      />
      <Flex gap="xxs">
        {tokenProjectData?.name ? (
          <Text color="textTertiary" variant="subheadSmall">
            {t('About {{ token }}', { token: tokenProjectData.name })}
          </Text>
        ) : null}
        <Flex gap="md">
          {tokenProjectData?.description && (
            <LongText
              gap="xxxs"
              initialDisplayedLines={5}
              linkColor={tokenColor ?? theme.colors.textPrimary}
              readMoreOrLessColor={tokenColor ?? theme.colors.accentAction}
              text={tokenProjectData.description.trim()}
            />
          )}
          <Flex row>
            {tokenProjectData?.homepageUrl && (
              <LinkButton
                color={tokenColor ?? theme.colors.textSecondary}
                label={t('Website')}
                textVariant="buttonLabelSmall"
                url={tokenProjectData.homepageUrl}
              />
            )}
            {tokenProjectData?.twitterName && (
              <LinkButton
                color={tokenColor ?? theme.colors.textSecondary}
                label={t('Twitter')}
                textVariant="buttonLabelSmall"
                url={getTwitterLink(tokenProjectData.twitterName)}
              />
            )}
            <LinkButton
              color={tokenColor ?? theme.colors.textSecondary}
              label={t('Etherscan')}
              textVariant="buttonLabelSmall"
              url={explorerLink}
            />
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}
