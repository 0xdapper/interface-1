// Copied from https://github.com/Uniswap/interface/blob/main/src/state/lists/wrappedTokenInfo.ts
import { Currency, Token } from '@uniswap/sdk-core'
import { Tags, TokenInfo, TokenList } from '@uniswap/token-lists'
import { ChainIdTo } from 'src/constants/chains'
import { getChecksumAddress } from 'src/utils/addresses'

type TagDetails = Tags[keyof Tags]
interface TagInfo extends TagDetails {
  id: string
}

export type BridgeInfo = ChainIdTo<{ tokenAddress: Address }>

/**
 * Token instances created from token info on a token list.
 */
export class WrappedTokenInfo implements Token {
  public readonly isNative: false = false as const
  public readonly isToken: true = true as const
  public readonly list: TokenList

  public readonly tokenInfo: TokenInfo

  private _checksummedAddress: Address | null = null

  constructor(tokenInfo: TokenInfo, list: TokenList) {
    this.tokenInfo = tokenInfo
    this.list = list
  }

  public get address(): string {
    if (!this._checksummedAddress) {
      this._checksummedAddress = getChecksumAddress(this.tokenInfo.address)
    }
    return this._checksummedAddress
  }

  public get chainId(): number {
    return this.tokenInfo.chainId
  }

  public get decimals(): number {
    return this.tokenInfo.decimals
  }

  public get name(): string {
    return this.tokenInfo.name
  }

  public get symbol(): string {
    return this.tokenInfo.symbol
  }

  public get logoURI(): string | undefined {
    return this.tokenInfo.logoURI
  }

  private _tags: TagInfo[] | null = null
  public get tags(): TagInfo[] {
    if (this._tags !== null) return this._tags
    if (!this.tokenInfo.tags) return (this._tags = [])
    const listTags = this.list.tags
    if (!listTags) return (this._tags = [])

    return (this._tags = this.tokenInfo.tags.map((tagId) => {
      return {
        ...listTags[tagId],
        id: tagId,
      }
    }))
  }

  public get bridgeInfo(): BridgeInfo | undefined {
    return this.tokenInfo.extensions?.bridgeInfo as BridgeInfo | undefined
  }

  equals(other: Currency): boolean {
    return (
      other.chainId === this.chainId &&
      other.isToken &&
      other.address.toLowerCase() === this.address.toLowerCase()
    )
  }

  sortsBefore(other: Token): boolean {
    if (this.equals(other)) throw new Error('Addresses should not be equal')
    return this.address.toLowerCase() < other.address.toLowerCase()
  }

  public get wrapped(): Token {
    return this
  }
}
