import {
  AllowanceProvider,
  AllowanceTransfer,
  PERMIT2_ADDRESS,
  PermitSingle,
} from '@uniswap/permit2-sdk'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { UNIVERSAL_ROUTER_ADDRESS } from '@uniswap/universal-router-sdk'
import dayjs from 'dayjs'
import { BigNumber, providers } from 'ethers'
import { useCallback } from 'react'
import { useProvider, useWalletSigners } from 'src/app/walletContext'
import { ChainId } from 'src/constants/chains'
import { SignerManager } from 'src/features/wallet/accounts/SignerManager'
import { Account } from 'src/features/wallet/accounts/types'
import { useActiveAccountWithThrow } from 'src/features/wallet/hooks'
import { signTypedData } from 'src/features/walletConnect/saga'
import { useAsyncData } from 'src/utils/hooks'
import { currentTimeInSeconds, inXMinutesUnix } from 'src/utils/time'

const PERMIT2_SIG_VALIDITY_TIME = 30 // minutes
function getPermitStruct(
  tokenAddress: string,
  nonce: number,
  universalRouterAddress: string
): PermitSingle {
  return {
    details: {
      token: tokenAddress,
      // TODO: import constant from permit2-sdk
      // this is BigUInt160
      amount: BigNumber.from('0xffffffffffffffffffffffffffffffffffffffff'),
      // expiration specifies when the allowance will need to be re-set
      expiration: dayjs().add(1, 'month').unix(),
      nonce,
    },
    spender: universalRouterAddress,
    // the time at which the permit signature is invalid
    // can be quite short as we assume this will be submitted right away
    // traditional permit has this as well
    sigDeadline: inXMinutesUnix(PERMIT2_SIG_VALIDITY_TIME),
  }
}

export type PermitSignatureInfo = {
  signature: string
  permitMessage: PermitSingle
  nonce: number
  expiry: number
}

async function getPermit2PermitSignature(
  provider: providers.JsonRpcProvider,
  signerManager: SignerManager,
  account: Account,
  tokenAddress: string,
  chainId: ChainId,
  tokenInAmount: string
): Promise<PermitSignatureInfo | undefined> {
  const user = account.address
  const allowanceProvider = new AllowanceProvider(provider, PERMIT2_ADDRESS)
  const universalRouterAddress = UNIVERSAL_ROUTER_ADDRESS(chainId)
  const {
    amount: permitAmount,
    expiration,
    nonce,
  } = await allowanceProvider.getAllowanceData(tokenAddress, user, universalRouterAddress)

  if (!permitAmount.lt(tokenInAmount) && expiration > currentTimeInSeconds()) {
    return
  }

  const permitMessage = getPermitStruct(tokenAddress, nonce, universalRouterAddress)
  const { domain, types, values } = AllowanceTransfer.getPermitData(
    permitMessage,
    PERMIT2_ADDRESS,
    chainId
  )

  const signature = await signTypedData(domain, types, values, account, signerManager)
  return {
    signature,
    permitMessage,
    nonce,
    expiry: BigNumber.from(permitMessage.sigDeadline).toNumber(),
  }
}

export function usePermit2Signature(
  currencyInAmount: NullUndefined<CurrencyAmount<Currency>>,
  skip: boolean
) {
  const signerManager = useWalletSigners()
  const account = useActiveAccountWithThrow()
  const currencyIn = currencyInAmount?.currency
  const provider = useProvider(currencyIn?.chainId ?? ChainId.Mainnet)

  const permitSignatureFetcher = useCallback(() => {
    if (!provider || !currencyIn || currencyIn.isNative || skip) return

    return getPermit2PermitSignature(
      provider,
      signerManager,
      account,
      currencyIn.address,
      currencyIn.chainId,
      currencyInAmount.quotient.toString()
    )
  }, [account, currencyIn, currencyInAmount?.quotient, provider, signerManager, skip])

  return useAsyncData(permitSignatureFetcher)
}
