import { Token } from '@uniswap/sdk-core'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAppSelector } from 'src/app/hooks'
import { MATIC_MAINNET_ADDRESS } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { DAI, nativeOnChain, USDC, USDT, WBTC, WRAPPED_NATIVE_CURRENCY } from 'src/constants/tokens'
import { useTokenProjects } from 'src/features/dataApi/tokenProjects'
import { CurrencyInfo } from 'src/features/dataApi/types'
import { selectFavoriteTokensSet } from 'src/features/favorites/selectors'
import { areAddressesEqual } from 'src/utils/addresses'
import { currencyId } from 'src/utils/currencyId'

export function useFavoriteCurrencies(): CurrencyInfo[] {
  const favoriteCurrencyIds = useAppSelector(selectFavoriteTokensSet)
  return useTokenProjects(Array.from(favoriteCurrencyIds))
}

// Use Mainnet base token addresses since TokenProjects query returns each token on Arbitrum, Optimism, Polygon
const baseCurrencies = [
  nativeOnChain(ChainId.Mainnet),
  nativeOnChain(ChainId.Polygon), // Used for MATIC base currency on Polygon
  DAI,
  USDC,
  USDT,
  WBTC,
  WRAPPED_NATIVE_CURRENCY[ChainId.Mainnet],
]

export function useAllCommonBaseCurrencies(): CurrencyInfo[] {
  const baseCurrencyIds = baseCurrencies.map((currency) => currencyId(currency))
  const baseCurrencyInfos = useTokenProjects(baseCurrencyIds)

  // TokenProjects returns MATIC on Mainnet and Polygon, but we only want MATIC on Polygon
  const filteredBaseCurrencyInfos = useMemo(() => {
    return baseCurrencyInfos.filter(
      (currencyInfo) =>
        !areAddressesEqual((currencyInfo.currency as Token).address, MATIC_MAINNET_ADDRESS)
    )
  }, [baseCurrencyInfos])
  return filteredBaseCurrencyInfos
}

export function useFilterCallbacks(chainId: ChainId | null) {
  const [chainFilter, setChainFilter] = useState<ChainId | null>(chainId)
  const [searchFilter, setSearchFilter] = useState<string | null>(null)

  useEffect(() => {
    setChainFilter(chainId)
  }, [chainId])

  const onChangeChainFilter = useCallback((newChainFilter: typeof chainFilter) => {
    setChainFilter(newChainFilter)
  }, [])

  const onClearSearchFilter = useCallback(() => {
    setSearchFilter(null)
  }, [])

  const onChangeText = useCallback(
    (newSearchFilter: string) => setSearchFilter(newSearchFilter),
    [setSearchFilter]
  )

  return {
    chainFilter,
    searchFilter,
    onChangeChainFilter,
    onClearSearchFilter,
    onChangeText,
  }
}
