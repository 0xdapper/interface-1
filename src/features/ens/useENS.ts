// Copied from https://github.com/Uniswap/interface/blob/main/src/hooks/useENS.ts

import { ChainId } from 'src/constants/chains'
import { useENSAddress } from 'src/features/ens/useENSAddress'
import { useENSName } from 'src/features/ens/useENSName'
import { getValidAddress } from 'src/utils/addresses'

/**
 * Given a name or address, does a lookup to resolve to an address and name
 * @param nameOrAddress ENS name or address
 */
export function useENS(
  chainId: ChainId,
  nameOrAddress?: string | null,
  autocompleteDomain?: boolean
): {
  loading: boolean
  address: string | null
  name: string | null
} {
  const validated = getValidAddress(nameOrAddress)
  const reverseLookup = useENSName(chainId, validated ? validated : undefined)
  const lookup = useENSAddress(
    chainId,
    autocompleteDomain ? getCompletedENSName(nameOrAddress) : nameOrAddress
  )

  return {
    loading: reverseLookup.loading || lookup.loading,
    address: validated ? validated : lookup.address,
    name: reverseLookup.ENSName
      ? reverseLookup.ENSName
      : !validated && lookup.address
      ? lookup.name
      : null,
  }
}

const getCompletedENSName = (name?: string | null) =>
  name?.concat(name ? (!name?.endsWith('.eth') ? '.eth' : '') : '')
