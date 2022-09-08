import React, { ComponentProps, forwardRef, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { FlexAlignType, Image, ImageStyle, Pressable } from 'react-native'
import { Swipeable } from 'react-native-gesture-handler'
import { useAppSelector, useAppTheme } from 'src/app/hooks'
import { useExploreStackNavigation } from 'src/app/navigation/types'
import { Button } from 'src/components/buttons/Button'
import { FavoriteButton } from 'src/components/explore/FavoriteButton'
import { Box } from 'src/components/layout/Box'
import { AnimatedFlex, Flex } from 'src/components/layout/Flex'
import { Text } from 'src/components/Text'
import { RelativeChange } from 'src/components/text/RelativeChange'
import { CoingeckoMarketCoin, CoingeckoOrderBy } from 'src/features/dataApi/coingecko/types'
import { useToggleFavoriteCallback } from 'src/features/favorites/hooks'
import { selectFavoriteTokensSet } from 'src/features/favorites/selectors'
import { useCurrencyIdFromCoingeckoId } from 'src/features/tokens/useCurrency'
import { Screens } from 'src/screens/Screens'
import { formatNumber, formatUSDPrice } from 'src/utils/format'
import { logger } from 'src/utils/logger'

const THIN_BORDER = 0.5

const BOX_TOKEN_LOGO_SIZE = 32
const boxTokenLogoStyle: ImageStyle = { width: BOX_TOKEN_LOGO_SIZE, height: BOX_TOKEN_LOGO_SIZE }

const TOKEN_LOGO_SIZE = 36
const tokenLogoStyle: ImageStyle = {
  width: TOKEN_LOGO_SIZE,
  height: TOKEN_LOGO_SIZE,
  resizeMode: 'contain',
}

interface TokenItemProps {
  coin: CoingeckoMarketCoin
  gesturesEnabled?: boolean
  index?: number
  metadataDisplayType?: string
  onCycleMetadata?: () => void
}

/** Uses a forwardRef to close previously open token rows */
export const TokenItem = forwardRef<Swipeable, TokenItemProps>(
  (
    { coin, gesturesEnabled, index, metadataDisplayType, onCycleMetadata }: TokenItemProps,
    previousOpenRow
  ) => {
    const { t } = useTranslation()
    const { navigate } = useExploreStackNavigation()
    const theme = useAppTheme()

    const _currencyId = useCurrencyIdFromCoingeckoId(coin.id)

    // TODO(judo): better handle when token is last favorite
    const isFavoriteToken = useAppSelector(selectFavoriteTokensSet).has(_currencyId ?? '')
    const toggleFavoriteCallback = useToggleFavoriteCallback(_currencyId ?? '')

    const currentRowRef = useRef<Swipeable>(null)

    const handleSwipeableWillOpen = () => {
      if (typeof previousOpenRow === 'function') {
        logger.debug(
          'TokenItem',
          'handleSwipeableWillOpen',
          'Expected forwarded ref to be a `MutableRef`'
        )
        return
      }

      if (previousOpenRow && previousOpenRow.current !== null) {
        if (previousOpenRow.current !== currentRowRef.current) {
          // close previously open token row
          previousOpenRow.current?.close()
        } else {
        }
      }
    }

    const handleSwipeableOpen = () => {
      if (typeof previousOpenRow === 'function' || !previousOpenRow) return
      previousOpenRow.current = currentRowRef.current
    }

    const renderRightActions: ComponentProps<typeof Swipeable>['renderRightActions'] =
      useCallback(() => {
        return (
          <FavoriteButton
            active={isFavoriteToken}
            coin={coin}
            onPress={() => {
              toggleFavoriteCallback()
              currentRowRef.current?.close()
            }}
          />
        )
      }, [coin, isFavoriteToken, toggleFavoriteCallback])

    if (!_currencyId) return null

    return (
      <Swipeable
        ref={currentRowRef}
        enabled={gesturesEnabled} //  hitSlop prevents TokenItem from interfering with the swipe back navigation gesture
        hitSlop={{ left: -60 }}
        overshootRight={false}
        renderRightActions={renderRightActions}
        onSwipeableOpen={handleSwipeableOpen}
        onSwipeableWillOpen={handleSwipeableWillOpen}>
        <Button
          testID={`token-item-${coin.symbol}`}
          onPress={() => {
            navigate(Screens.TokenDetails, { currencyId: _currencyId })
          }}>
          <AnimatedFlex
            row
            alignItems="center"
            bg={!gesturesEnabled ? 'none' : 'backgroundBackdrop'}
            justifyContent="space-between"
            px="md"
            py="sm">
            <Flex centered row flexShrink={1} gap="xs" overflow="hidden">
              <Flex centered row flexShrink={1} gap="xxs" overflow="hidden">
                {index !== undefined && (
                  <Box minWidth={16}>
                    <Text color="textSecondary" variant="badge">
                      {index + 1}
                    </Text>
                  </Box>
                )}

                <Image
                  source={{ uri: coin.image }}
                  style={[
                    tokenLogoStyle,
                    {
                      backgroundColor: theme.colors.textTertiary,
                      borderRadius: TOKEN_LOGO_SIZE / 2,
                      borderColor: theme.colors.backgroundOutline,
                      borderWidth: THIN_BORDER,
                    },
                  ]}
                />
              </Flex>
              <Flex alignItems="flex-start" flexShrink={1} gap="xxxs" marginLeft="xxs">
                <Text variant="subhead">{coin.name ?? ''}</Text>
                <Text color="textSecondary" variant="caption">
                  {coin.symbol.toUpperCase() ?? ''}
                </Text>
              </Flex>
            </Flex>
            <Flex row justifyContent="flex-end">
              <Button disabled={!onCycleMetadata} onPress={onCycleMetadata}>
                <TokenMetadata
                  main={formatUSDPrice(coin.current_price)}
                  sub={
                    metadataDisplayType === CoingeckoOrderBy.MarketCapDesc ? (
                      <Text variant="caption">
                        {t('MCap {{marketCap}}', { marketCap: formatNumber(coin?.market_cap) })}
                      </Text>
                    ) : (
                      <RelativeChange change={coin.price_change_percentage_24h ?? undefined} />
                    )
                  }
                />
              </Button>
            </Flex>
          </AnimatedFlex>
        </Button>
      </Swipeable>
    )
  }
)

export const TOKEN_ITEM_BOX_MINWIDTH = 137

export function TokenItemBox({ coin }: TokenItemProps) {
  const { navigate } = useExploreStackNavigation()
  const theme = useAppTheme()
  const _currencyId = useCurrencyIdFromCoingeckoId(coin.id)
  if (!_currencyId) return null
  return (
    <Pressable
      testID={`token-box-${coin.symbol}`}
      onPress={() => {
        navigate(Screens.TokenDetails, { currencyId: _currencyId })
      }}>
      <Box
        bg="backgroundContainer"
        borderRadius="md"
        justifyContent="space-between"
        minWidth={TOKEN_ITEM_BOX_MINWIDTH}>
        <Flex p="sm">
          <Flex row alignItems="center" justifyContent="space-between">
            <Text variant="subhead">{coin.symbol.toUpperCase() ?? ''}</Text>
            <Image
              source={{ uri: coin.image }}
              style={[
                boxTokenLogoStyle,
                {
                  backgroundColor: theme.colors.textTertiary,
                  borderRadius: BOX_TOKEN_LOGO_SIZE / 2,
                  borderColor: theme.colors.backgroundOutline,
                  borderWidth: THIN_BORDER,
                },
              ]}
            />
          </Flex>
          <Flex row>
            <TokenMetadata
              align="flex-start"
              main={<Text variant="body">{formatUSDPrice(coin.current_price)}</Text>}
              sub={<RelativeChange change={coin.price_change_percentage_24h ?? undefined} />}
            />
          </Flex>
        </Flex>
      </Box>
    </Pressable>
  )
}

interface TokenMetadataProps {
  pre?: React.ReactNode
  main: React.ReactNode
  sub?: React.ReactNode
  align?: FlexAlignType
}

/** Helper component to format rhs metadata for a given token. */
function TokenMetadata({ pre, main, sub, align = 'flex-end' }: TokenMetadataProps) {
  return (
    <Flex row>
      {pre}
      <Flex alignItems={align} gap="xxs" minWidth={70}>
        <Text variant="body">{main}</Text>
        {sub && (
          <Text color="textSecondary" variant="caption">
            {sub}
          </Text>
        )}
      </Flex>
    </Flex>
  )
}
