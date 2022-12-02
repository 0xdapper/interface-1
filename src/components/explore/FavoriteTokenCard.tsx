import { ImpactFeedbackStyle } from 'expo-haptics'
import React, { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ViewProps } from 'react-native'
import ContextMenu from 'react-native-context-menu-view'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import { AnimatedTouchableArea } from 'src/components/buttons/TouchableArea'
import { TokenLogo } from 'src/components/CurrencyLogo/TokenLogo'
import RemoveButton from 'src/components/explore/RemoveButton'
import { Box } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { Flex } from 'src/components/layout/Flex'
import { Loading } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { RelativeChange } from 'src/components/text/RelativeChange'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import { PollingInterval } from 'src/constants/misc'
import { isNonPollingRequestInFlight } from 'src/data/utils'
import { useFavoriteTokenCardQuery } from 'src/data/__generated__/types-and-hooks'
import { AssetType } from 'src/entities/assets'
import { currencyIdToContractInput } from 'src/features/dataApi/utils'
import { selectFavoriteTokensSet } from 'src/features/favorites/selectors'
import { removeFavoriteToken } from 'src/features/favorites/slice'
import { openModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import {
  CurrencyField,
  TransactionState,
} from 'src/features/transactions/transactionState/transactionState'
import { fromGraphQLChain } from 'src/utils/chainId'
import { formatUSDPrice } from 'src/utils/format'
import { usePollOnFocusOnly } from 'src/utils/hooks'

export const FAVORITE_TOKEN_CARD_LOADER_HEIGHT = 100

type FavoriteTokenCardProps = {
  currencyId: string
  isEditing?: boolean
  setIsEditing: (update: boolean) => void
} & ViewProps

function FavoriteTokenCard({
  currencyId,
  isEditing,
  setIsEditing,
  ...rest
}: FavoriteTokenCardProps) {
  const theme = useAppTheme()
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const tokenDetailsNavigation = useTokenDetailsNavigation()

  const favoriteCurrencyIdsSet = useAppSelector(selectFavoriteTokensSet)

  const favoriteCurrencyContractInputs = useMemo(
    () => currencyIdToContractInput(currencyId),
    [currencyId]
  )
  const { data, networkStatus, startPolling, stopPolling } = useFavoriteTokenCardQuery({
    variables: {
      favoriteTokenContract: favoriteCurrencyContractInputs,
    },
    // Rely on cache for fast favoriting UX, and poll for updates.
    fetchPolicy: 'cache-first',
  })

  usePollOnFocusOnly(startPolling, stopPolling, PollingInterval.Fast)

  const token = data?.tokens?.[0]

  // Mirror behavior in top tokens list, use first chain the token is on for the symbol
  const chainId = fromGraphQLChain(token?.chain)

  const usdPrice = token?.project?.markets?.[0]?.price?.value
  const pricePercentChange = token?.project?.markets?.[0]?.pricePercentChange24h?.value

  const onRemove = useCallback(() => {
    if (favoriteCurrencyIdsSet.size === 1) {
      setIsEditing(false)
    }
    if (currencyId) {
      dispatch(removeFavoriteToken({ currencyId }))
    }
  }, [currencyId, dispatch, favoriteCurrencyIdsSet.size, setIsEditing])

  const navigateToSwapSell = useCallback(() => {
    if (!token?.address || !chainId) return

    const swapFormState: TransactionState = {
      exactCurrencyField: CurrencyField.INPUT,
      exactAmountToken: '0',
      [CurrencyField.INPUT]: {
        address: token.address,
        chainId: chainId,
        type: AssetType.Currency,
      },
      [CurrencyField.OUTPUT]: null,
    }
    dispatch(openModal({ name: ModalName.Swap, initialState: swapFormState }))
  }, [chainId, dispatch, token?.address])

  const menuActions = useMemo(() => {
    return [
      { title: t('Remove favorite'), systemIcon: 'heart.fill' },
      { title: t('Edit favorites'), systemIcon: 'square.and.pencil' },
      { title: t('Swap'), systemIcon: 'arrow.2.squarepath' },
    ]
  }, [t])

  const onPress = () => {
    if (isEditing || !currencyId) return
    tokenDetailsNavigation.preload(currencyId)
    tokenDetailsNavigation.navigate(currencyId)
  }

  if (isNonPollingRequestInFlight(networkStatus)) {
    return <Loading height={FAVORITE_TOKEN_CARD_LOADER_HEIGHT} type="favorite" />
  }

  return (
    <ContextMenu
      actions={menuActions}
      disabled={isEditing}
      style={{ borderRadius: theme.borderRadii.lg }}
      onPress={(e) => {
        // Emitted index based on order of menu action array
        // remove favorite action
        if (e.nativeEvent.index === 0) {
          onRemove()
        }
        // Edit mode toggle action
        if (e.nativeEvent.index === 1) {
          setIsEditing(true)
        }
        // Swap token action
        if (e.nativeEvent.index === 2) {
          navigateToSwapSell()
        }
      }}
      {...rest}>
      <AnimatedTouchableArea
        hapticFeedback
        borderRadius="lg"
        entering={FadeIn}
        exiting={FadeOut}
        hapticStyle={ImpactFeedbackStyle.Light}
        testID={`token-box-${token?.symbol}`}
        onPress={onPress}>
        <BaseCard.Shadow>
          <Flex alignItems="flex-start" gap="xs">
            <Flex row gap="xxs" justifyContent="space-between">
              <Flex grow row alignItems="center" gap="xxs">
                <TokenLogo
                  chainId={chainId ?? undefined}
                  size={theme.imageSizes.sm}
                  symbol={token?.symbol ?? undefined}
                  url={token?.project?.logoUrl ?? undefined}
                />
                <Text variant="bodyLarge">{token?.symbol}</Text>
              </Flex>
              {isEditing ? (
                <RemoveButton onPress={onRemove} />
              ) : (
                <Box height={theme.imageSizes.md} />
              )}
            </Flex>
            <Flex gap="xxxs">
              <Text adjustsFontSizeToFit numberOfLines={1} variant="subheadLarge">
                {formatUSDPrice(usdPrice)}
              </Text>
              <RelativeChange
                arrowSize={theme.iconSizes.md}
                change={pricePercentChange ?? undefined}
                semanticColor={true}
                variant="subheadSmall"
              />
            </Flex>
          </Flex>
        </BaseCard.Shadow>
      </AnimatedTouchableArea>
    </ContextMenu>
  )
}

export default memo(FavoriteTokenCard)
