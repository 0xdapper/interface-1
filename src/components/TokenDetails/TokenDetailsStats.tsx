import { Currency } from '@uniswap/sdk-core'
import { graphql } from 'babel-plugin-relay/macro'
import React, { Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { useFragment } from 'react-relay-offline'
import { LinkButton } from 'src/components/buttons/LinkButton'
import { Flex } from 'src/components/layout'
import { Loading } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { LongText } from 'src/components/text/LongText'
import { TokenDetailsStats_tokenProject$key } from 'src/components/TokenDetails/__generated__/TokenDetailsStats_tokenProject.graphql'
import { currencyAddress } from 'src/utils/currencyId'
import { formatNumber, formatUSDPrice } from 'src/utils/format'
import { ExplorerDataType, getExplorerLink, getTwitterLink } from 'src/utils/linking'

export const tokenDetailsStatsFragment = graphql`
  fragment TokenDetailsStats_tokenProject on TokenProject {
    description
    homepageUrl
    twitterName
    name
    markets(currencies: [USD]) {
      price {
        value
        currency
      }
      marketCap {
        value
        currency
      }
      fullyDilutedMarketCap {
        value
        currency
      }
      volume24h: volume(duration: DAY) {
        value
        currency
      }
      priceHigh52W: priceHighLow(duration: YEAR, highLow: HIGH) {
        value
        currency
      }
      priceLow52W: priceHighLow(duration: YEAR, highLow: LOW) {
        value
        currency
      }
    }
    tokens {
      chain
      address
      symbol
      decimals
    }
  }
`

function TokenDetailsStatsInner({
  currency,
  tokenProject,
}: {
  currency: Currency
  tokenProject: TokenDetailsStats_tokenProject$key
}) {
  const { t } = useTranslation()

  const tokenProjectData = useFragment(tokenDetailsStatsFragment, tokenProject)

  const marketData = tokenProjectData?.markets ? tokenProjectData.markets[0] : null

  if (!tokenProject || !marketData) return null

  const explorerLink = getExplorerLink(
    currency.chainId,
    currencyAddress(currency),
    ExplorerDataType.ADDRESS
  )

  return (
    <Flex gap="xl">
      <Flex row justifyContent="space-between">
        <Flex flex={1} gap="lg">
          <Flex gap="xs">
            <Text color="textSecondary" variant="subheadSmall">
              {t('Market cap')}
            </Text>
            <Text variant="headlineMedium">{formatNumber(marketData?.marketCap?.value)}</Text>
          </Flex>
          <Flex gap="xs">
            <Text color="textSecondary" variant="subheadSmall">
              {t('52W low')}
            </Text>
            <Text variant="headlineMedium">{formatUSDPrice(marketData?.priceLow52W?.value)}</Text>
          </Flex>
        </Flex>
        <Flex flex={1} gap="lg">
          <Flex gap="xs">
            <Text color="textSecondary" variant="subheadSmall">
              {t('24h volume')}
            </Text>
            <Text variant="headlineMedium">{formatNumber(marketData?.volume24h?.value)}</Text>
          </Flex>
          <Flex gap="xs">
            <Text color="textSecondary" variant="subheadSmall">
              {t('52W high')}
            </Text>
            <Text variant="headlineMedium">{formatUSDPrice(marketData?.priceHigh52W?.value)}</Text>
          </Flex>
        </Flex>
      </Flex>
      <Flex gap="xs">
        <Text color="textSecondary" variant="subheadSmall">
          {t('About {{ token }}', { token: tokenProjectData.name })}
        </Text>
        {tokenProjectData.description && (
          <LongText
            gap="xxxs"
            initialDisplayedLines={5}
            text={tokenProjectData.description.trim()}
          />
        )}
        <Flex row>
          {tokenProjectData.homepageUrl && (
            <LinkButton
              color="accentAction"
              label={t('Website')}
              textVariant="caption"
              url={tokenProjectData.homepageUrl}
            />
          )}
          {tokenProjectData.twitterName && (
            <LinkButton
              color="accentAction"
              label={t('Twitter')}
              textVariant="caption"
              url={getTwitterLink(tokenProjectData.twitterName)}
            />
          )}
          <LinkButton
            color="accentAction"
            label={t('Etherscan')}
            textVariant="caption"
            url={explorerLink}
          />
        </Flex>
      </Flex>
    </Flex>
  )
}

export function TokenDetailsStats({
  currency,
  tokenProject,
}: {
  currency: Currency
  tokenProject: TokenDetailsStats_tokenProject$key | null | undefined
}) {
  if (!tokenProject) return null
  return (
    <Suspense fallback={<Loading />}>
      <TokenDetailsStatsInner currency={currency} tokenProject={tokenProject} />
    </Suspense>
  )
}
