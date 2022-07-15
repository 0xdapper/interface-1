import { ChainId } from 'src/constants/chains'
import { WRAPPED_NATIVE_CURRENCY } from 'src/constants/tokens'
import { getFlow, ImportType } from 'src/features/onboarding/utils'
import { NativeCurrency } from 'src/features/tokenLists/NativeCurrency'
import { getWrapType, serializeQueryParams } from 'src/features/transactions/swap/utils'
import { WrapType } from 'src/features/transactions/swap/wrapSaga'

describe(serializeQueryParams, () => {
  it('handles the correct types', () => {
    expect(
      serializeQueryParams({ a: '0x6B175474E89094C44Da98b954EedeAC495271d0F', b: 2, c: false })
    ).toBe('a=0x6B175474E89094C44Da98b954EedeAC495271d0F&b=2&c=false')
  })

  it('escapes characters', () => {
    expect(serializeQueryParams({ space: ' ', bang: '!' })).toEqual('space=%20&bang=!')
  })
})

describe(getWrapType, () => {
  const eth = NativeCurrency.onChain(ChainId.Mainnet)
  const weth = WRAPPED_NATIVE_CURRENCY[ChainId.Mainnet]

  const rinkEth = NativeCurrency.onChain(ChainId.Rinkeby)
  const rinkWeth = WRAPPED_NATIVE_CURRENCY[ChainId.Rinkeby]

  it('handles undefined args', () => {
    expect(getWrapType(undefined, weth)).toEqual(WrapType.NotApplicable)
    expect(getWrapType(weth, undefined)).toEqual(WrapType.NotApplicable)
    expect(getWrapType(undefined, undefined)).toEqual(WrapType.NotApplicable)
  })

  it('handles wrap', () => {
    expect(getWrapType(eth, weth)).toEqual(WrapType.Wrap)

    // different chains
    expect(getWrapType(rinkEth, weth)).toEqual(WrapType.NotApplicable)
    expect(getWrapType(eth, rinkWeth)).toEqual(WrapType.NotApplicable)
  })

  it('handles unwrap', () => {
    expect(getWrapType(weth, eth)).toEqual(WrapType.Unwrap)

    // different chains
    expect(getWrapType(weth, rinkEth)).toEqual(WrapType.NotApplicable)
    expect(getWrapType(rinkWeth, eth)).toEqual(WrapType.NotApplicable)
  })
})

describe(getFlow, () => {
  it('correctly returns length of onboarding create flow without seed phrase with add security screen ', () => {
    expect(getFlow(ImportType.Create, true, false, true)).toHaveLength(5)
  })

  it('correctly returns length of onboarding create flow with seed phrase existing without add security screen ', () => {
    expect(getFlow(ImportType.Create, true, true, true)).toHaveLength(4)
  })

  it('correctly returns length of add account create flow showing add security screen and seed phrase does not exist', () => {
    expect(getFlow(ImportType.Create, false, false, false)).toHaveLength(5)
  })

  it('correctly returns length of add account with view-only wallet not showing add security screen, but face ID was already added', () => {
    expect(getFlow(ImportType.Watch, true, false, false)).toHaveLength(2)
  })
})
