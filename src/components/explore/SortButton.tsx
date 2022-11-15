import React, { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import ContextMenu from 'react-native-context-menu-view'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import UniswapLogo from 'src/assets/icons/uniswap-logo.svg'
import { Chevron } from 'src/components/icons/Chevron'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { TokenSortableField } from 'src/data/__generated__/types-and-hooks'
import { ClientTokensOrderBy, TokensOrderBy } from 'src/features/explore/types'
import { getTokensOrderByLabel } from 'src/features/explore/utils'
import { setTokensOrderBy } from 'src/features/wallet/walletSlice'
import { logger } from 'src/utils/logger'
interface FilterGroupProps {
  orderBy: TokensOrderBy
}

function _SortButton({ orderBy }: FilterGroupProps) {
  const theme = useAppTheme()
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  const menuActions = useMemo(() => {
    return [
      {
        title: getTokensOrderByLabel(TokenSortableField.Volume, t),
        systemIcon: orderBy === TokenSortableField.Volume ? 'checkmark' : '',
        orderBy: TokenSortableField.Volume,
      },
      {
        title: getTokensOrderByLabel(TokenSortableField.TotalValueLocked, t),
        systemIcon: orderBy === TokenSortableField.TotalValueLocked ? 'checkmark' : '',
        orderBy: TokenSortableField.TotalValueLocked,
      },
      {
        title: getTokensOrderByLabel(TokenSortableField.MarketCap, t),
        systemIcon: orderBy === TokenSortableField.MarketCap ? 'checkmark' : '',
        orderBy: TokenSortableField.MarketCap,
      },
      {
        title: getTokensOrderByLabel(ClientTokensOrderBy.PriceChangePercentage24hDesc, t),
        systemIcon: orderBy === ClientTokensOrderBy.PriceChangePercentage24hDesc ? 'checkmark' : '',
        orderBy: ClientTokensOrderBy.PriceChangePercentage24hDesc,
      },
      {
        title: getTokensOrderByLabel(ClientTokensOrderBy.PriceChangePercentage24hAsc, t),
        systemIcon: orderBy === ClientTokensOrderBy.PriceChangePercentage24hAsc ? 'checkmark' : '',
        orderBy: ClientTokensOrderBy.PriceChangePercentage24hAsc,
      },
    ]
  }, [t, orderBy])

  return (
    <ContextMenu
      actions={menuActions}
      dropdownMenuMode={true}
      onPress={(e) => {
        const selectedMenuAction = menuActions[e.nativeEvent.index]
        // Handle switching selected sort option
        if (!selectedMenuAction) {
          logger.error('SortButtonContextMenu', 'onPress', `Unexpected context menu index selected`)
          return
        }

        dispatch(setTokensOrderBy({ newTokensOrderBy: selectedMenuAction.orderBy }))
      }}>
      <Flex row alignItems="center" bg="background2" borderRadius="full" gap="xxs" px="sm" py="xs">
        {(orderBy === TokenSortableField.Volume ||
          orderBy === TokenSortableField.TotalValueLocked) && (
          <UniswapLogo
            color={theme.colors.textSecondary}
            height={theme.iconSizes.md}
            width={theme.iconSizes.md}
          />
        )}
        <Text color="textSecondary" variant="buttonLabelSmall">
          {orderBy === TokenSortableField.Volume
            ? t('Volume')
            : orderBy === TokenSortableField.TotalValueLocked
            ? t('TVL')
            : getTokensOrderByLabel(orderBy, t)}
        </Text>
        <Chevron
          color={theme.colors.textSecondary}
          direction="s"
          height={theme.iconSizes.md}
          width={theme.iconSizes.md}
        />
      </Flex>
    </ContextMenu>
  )
}

export const SortButton = memo(_SortButton)
