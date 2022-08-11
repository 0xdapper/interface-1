import { skipToken } from '@reduxjs/toolkit/dist/query'
import { Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { ALL_SUPPORTED_CHAIN_IDS, ChainId, ChainIdTo } from 'src/constants/chains'
import { PollingInterval } from 'src/constants/misc'
import { useActiveChainIds } from 'src/features/chains/utils'
import { useSpotPricesQuery } from 'src/features/dataApi/slice'
import { SpotPrices } from 'src/features/dataApi/types'
import { isTestnet } from 'src/utils/chainId'

// Keys for native currency spot prices are the wrapped token addresses
export function useSpotPrices(currencies: Array<NullUndefined<Currency>>): {
  spotPrices: SpotPrices
  loading: boolean
} {
  const activeChainsIds = useActiveChainIds()

  const addresses = useMemo(
    () =>
      currencies.reduce<ChainIdTo<Address[]>>((acc, cur) => {
        if (!cur) return acc

        acc[cur.chainId as ChainId] ??= []
        acc[cur.chainId as ChainId]!.push(cur.wrapped.address)
        return acc
      }, {}),
    [currencies]
  )

  let spotPrices: SpotPrices = {}
  let loading = false
  for (const chainId of ALL_SUPPORTED_CHAIN_IDS) {
    if (!activeChainsIds.includes(chainId)) continue
    if (isTestnet(chainId)) continue

    const addressesToFetch = addresses[chainId]
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { currentData, isLoading } = useSpotPricesQuery(
      addressesToFetch && addressesToFetch.length > 0
        ? { chainId, addresses: addressesToFetch }
        : skipToken,
      // Covalent pricing endpoint only refreshes every 30 minutes
      { pollingInterval: PollingInterval.Slow }
    )
    spotPrices = { ...spotPrices, ...currentData }
    loading = loading || isLoading
  }

  return { spotPrices, loading }
}
