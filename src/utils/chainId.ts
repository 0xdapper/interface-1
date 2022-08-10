import { BigNumberish } from 'ethers'
import { Chain as GraphQLChain } from 'src/components/TokenDetails/__generated__/TokenDetailsStatsQuery.graphql'
import { ChainId, TESTNET_CHAIN_IDS } from 'src/constants/chains'

const supportedChains = Object.values(ChainId).map((c) => c.toString())

// Some code from the web app uses chainId types as numbers
// This validates them as coerces into SupportedChainId
export function toSupportedChainId(chainId?: BigNumberish) {
  if (!chainId || !supportedChains.includes(chainId.toString())) {
    return null
  }
  return parseInt(chainId.toString(), 10) as ChainId
}

// variant on `toSupportedChain` with a narrower return type
export function parseActiveChains(activeChainsString: string): ChainId[] {
  return activeChainsString.split(',').map((id) => parseInt(id, 10) as ChainId)
}

export function isTestnet(chainId: ChainId): boolean {
  return TESTNET_CHAIN_IDS.includes(chainId)
}

export function fromGraphQLChain(chain: GraphQLChain | undefined): ChainId | null {
  switch (chain) {
    case 'ETHEREUM':
      return ChainId.Mainnet
    case 'ARBITRUM':
      return ChainId.ArbitrumOne
    case 'ETHEREUM_GOERLI':
      return ChainId.Goerli
    case 'OPTIMISM':
      return ChainId.Optimism
    case 'POLYGON':
      return ChainId.Polygon
  }

  return null
}

export function toGraphQLChain(chainId: ChainId): GraphQLChain | null {
  switch (chainId) {
    case ChainId.Mainnet:
      return 'ETHEREUM'
    case ChainId.ArbitrumOne:
      return 'ARBITRUM'
    case ChainId.Goerli:
      return 'ETHEREUM_GOERLI'
    case ChainId.Optimism:
      return 'OPTIMISM'
    case ChainId.Polygon:
      return 'POLYGON'
  }
  return null // TODO: throw error?
}
