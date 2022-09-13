import { Currency } from '@uniswap/sdk-core'
import { providers } from 'ethers'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { useProvider } from 'src/app/walletContext'
import { ChainId } from 'src/constants/chains'
import { AssetType } from 'src/entities/assets'
import { useNativeCurrencyBalance, useTokenBalance } from 'src/features/balances/hooks'
import { useNFT } from 'src/features/nfts/hooks'
import { NFTAsset } from 'src/features/nfts/types'
import { useCurrency } from 'src/features/tokens/useCurrency'
import {
  CurrencyField,
  TransactionState,
} from 'src/features/transactions/transactionState/transactionState'
import { BaseDerivedInfo } from 'src/features/transactions/transactionState/types'
import { TransferTokenParams } from 'src/features/transactions/transfer/useTransferTransactionRequest'
import { transferTokenActions } from 'src/features/transactions/transfer/transferTokenSaga'
import { getTransferWarnings } from 'src/features/transactions/transfer/validate'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { buildCurrencyId } from 'src/utils/currencyId'
import { tryParseExactAmount } from 'src/utils/tryParseAmount'

export type DerivedTransferInfo = BaseDerivedInfo<Currency | NFTAsset.Asset> & {
  currencyTypes: { [CurrencyField.INPUT]?: AssetType }
  currencyIn: Currency | undefined
  nftIn: NFTAsset.Asset | undefined
  chainId: ChainId | undefined
  exactCurrencyField: CurrencyField.INPUT
  recipient?: string
  isUSDInput?: boolean
  txId?: string
}

export function useDerivedTransferInfo(state: TransactionState): DerivedTransferInfo {
  const {
    [CurrencyField.INPUT]: tradeableAsset,
    exactAmountToken,
    exactAmountUSD,
    recipient,
    isUSDInput,
    txId,
  } = state
  const { t } = useTranslation()

  const activeAccount = useActiveAccount()
  const chainId = tradeableAsset?.chainId

  const currencyIn = useCurrency(
    tradeableAsset?.type === AssetType.Currency
      ? buildCurrencyId(tradeableAsset?.chainId, tradeableAsset?.address)
      : undefined
  )

  const { asset: nftIn } = useNFT(
    activeAccount?.address,
    tradeableAsset?.address,
    tradeableAsset?.type === AssetType.ERC1155 || tradeableAsset?.type === AssetType.ERC721
      ? tradeableAsset.tokenId
      : undefined
  )

  const currencies = {
    [CurrencyField.INPUT]: currencyIn ?? nftIn,
  }

  const { balance: tokenInBalance } = useTokenBalance(
    currencyIn?.isToken ? currencyIn : undefined,
    activeAccount?.address
  )

  const { balance: nativeInBalance } = useNativeCurrencyBalance(
    chainId ?? ChainId.Mainnet,
    activeAccount?.address
  )

  const amountSpecified = useMemo(
    () => tryParseExactAmount(exactAmountToken, currencyIn),
    [currencyIn, exactAmountToken]
  )
  const currencyAmounts = {
    [CurrencyField.INPUT]: amountSpecified,
  }
  const currencyBalances = {
    [CurrencyField.INPUT]: currencyIn?.isNative ? nativeInBalance : tokenInBalance,
  }

  const warnings = getTransferWarnings(t, {
    currencyBalances,
    currencyAmounts,
    recipient,
    currencyIn: currencyIn ?? undefined,
    nftIn,
    chainId,
  })

  // TODO: memoize this return value
  return {
    currencies,
    currencyAmounts,
    currencyBalances,
    currencyTypes: { [CurrencyField.INPUT]: tradeableAsset?.type },
    chainId,
    currencyIn: currencyIn ?? undefined,
    nftIn: nftIn ?? undefined,
    exactAmountUSD,
    exactAmountToken,
    exactCurrencyField: CurrencyField.INPUT,
    formattedAmounts: {
      [CurrencyField.INPUT]: isUSDInput ? exactAmountUSD || '' : exactAmountToken,
    },
    isUSDInput,
    recipient,
    warnings,
    txId,
  }
}

/** Helper transfer callback for ERC20s */
export function useTransferERC20Callback(
  txId?: string,
  chainId?: ChainId,
  toAddress?: Address,
  tokenAddress?: Address,
  amountInWei?: string,
  transferTxWithGasSettings?: providers.TransactionRequest,
  onSubmit?: () => void
) {
  const account = useActiveAccount()

  return useTransferCallback(
    chainId && toAddress && tokenAddress && amountInWei && account
      ? {
          account,
          chainId,
          toAddress,
          tokenAddress,
          amountInWei,
          type: AssetType.Currency,
          txId,
        }
      : undefined,
    transferTxWithGasSettings,
    onSubmit
  )
}

/** Helper transfer callback for NFTs */
export function useTransferNFTCallback(
  txId?: string,
  chainId?: ChainId,
  toAddress?: Address,
  tokenAddress?: Address,
  tokenId?: string,
  txRequest?: providers.TransactionRequest,
  onSubmit?: () => void
) {
  const account = useActiveAccount()

  return useTransferCallback(
    account && chainId && toAddress && tokenAddress && tokenId
      ? {
          account,
          chainId,
          toAddress,
          tokenAddress,
          tokenId,
          type: AssetType.ERC721,
          txId,
        }
      : undefined,
    txRequest,
    onSubmit
  )
}

/** General purpose transfer callback for ERC20s, NFTs, etc. */
function useTransferCallback(
  transferTokenParams?: TransferTokenParams,
  txRequest?: providers.TransactionRequest,
  onSubmit?: () => void
): null | (() => void) {
  const dispatch = useAppDispatch()

  return useMemo(() => {
    if (!transferTokenParams || !txRequest) return null

    return () => {
      dispatch(transferTokenActions.trigger({ transferTokenParams, txRequest }))
      onSubmit?.()
    }
  }, [transferTokenParams, dispatch, txRequest, onSubmit])
}

export function useIsSmartContractAddress(address: string | undefined, chainId: ChainId) {
  const provider = useProvider(chainId)
  const [state, setState] = useState<{ loading: boolean; isSmartContractAddress: boolean }>({
    loading: true,
    isSmartContractAddress: false,
  })

  useEffect(() => {
    if (!address) return setState({ loading: false, isSmartContractAddress: false })
    setState((s) => ({ ...s, loading: true }))
    provider?.getCode(address).then((code: string) => {
      // provider.getCode(address) will return a hex string if code is deployed at that address = it's a smart contract
      // returning just 0x means there's no code and it's not a smart contract
      const isSmartContractAddress = code !== '0x'
      setState({ loading: false, isSmartContractAddress })
    })
  }, [address, provider])
  return state
}
