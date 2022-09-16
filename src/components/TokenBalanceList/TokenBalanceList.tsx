import React, { ReactElement, useMemo } from 'react'
import Animated from 'react-native-reanimated'
import { useAppSelector } from 'src/app/hooks'
import {
  TabViewScrollProps,
  TAB_VIEW_SCROLL_THROTTLE,
} from 'src/components/layout/screens/TabbedScrollScreen'
import { Separator } from 'src/components/layout/Separator'
import { TokenBalanceItem } from 'src/components/TokenBalanceList/TokenBalanceItem'
import { useSortedPortfolioBalancesList } from 'src/features/dataApi/balances'
import { PortfolioBalance } from 'src/features/dataApi/types'
import { selectHideSmallBalances } from 'src/features/wallet/selectors'
import { CurrencyId } from 'src/utils/currencyId'

type TokenBalanceListProps = {
  empty?: ReactElement | null
  onPressTokenIn: (currencyId: CurrencyId) => void
  onPressToken: (currencyId: CurrencyId) => void
  onRefresh?: () => void
  refreshing?: boolean
  owner: Address
  count?: number
  tabViewScrollProps?: TabViewScrollProps
}

export function TokenBalanceList({
  owner,
  count,
  empty,
  onPressToken,
  onPressTokenIn,
  tabViewScrollProps,
}: TokenBalanceListProps) {
  const hideSmallBalances = useAppSelector(selectHideSmallBalances)
  const balances = useSortedPortfolioBalancesList(owner, hideSmallBalances)
  const truncatedBalances = useMemo(() => balances.slice(0, count), [balances, count])
  return (
    <Animated.FlatList
      ItemSeparatorComponent={() => <Separator />}
      ListEmptyComponent={empty}
      data={truncatedBalances}
      keyExtractor={key}
      renderItem={({ item }: { item: PortfolioBalance }) => (
        <TokenBalanceItem
          portfolioBalance={item}
          onPressToken={onPressToken}
          onPressTokenIn={onPressTokenIn}
        />
      )}
      scrollEventThrottle={TAB_VIEW_SCROLL_THROTTLE}
      showsVerticalScrollIndicator={false}
      onScroll={tabViewScrollProps?.onScroll}
      {...tabViewScrollProps}
    />
  )
}

function key({ currencyInfo }: PortfolioBalance) {
  return currencyInfo.currencyId
}
