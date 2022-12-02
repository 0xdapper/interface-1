import { NetInfoState, useNetInfo } from '@react-native-community/netinfo'
import { Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { TFunction } from 'react-i18next'
import Eye from 'src/assets/icons/eye.svg'
import { getNetworkWarning } from 'src/components/modals/WarningModal/constants'
import {
  Warning,
  WarningAction,
  WarningLabel,
  WarningSeverity,
} from 'src/components/modals/WarningModal/types'
import { ChainId } from 'src/constants/chains'
import { GQLNftAsset } from 'src/features/nfts/hooks'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'
import { DerivedTransferInfo } from 'src/features/transactions/transfer/hooks'
import { Account, AccountType } from 'src/features/wallet/accounts/types'
import { currencyAddress } from 'src/utils/currencyId'

export function getTransferWarnings(
  t: TFunction,
  account: Account,
  derivedTransferInfo: DerivedTransferInfo,
  networkStatus: NetInfoState
) {
  const warnings: Warning[] = []
  if (!networkStatus.isConnected) {
    warnings.push(getNetworkWarning(t))
  }

  const { currencyBalances, currencyAmounts, recipient, currencyIn, nftIn, chainId } =
    derivedTransferInfo

  const currencyBalanceIn = currencyBalances[CurrencyField.INPUT]
  const currencyAmountIn = currencyAmounts[CurrencyField.INPUT]
  const isMissingRequiredParams = checkIsMissingRequiredParams(
    currencyIn,
    nftIn,
    chainId,
    recipient,
    !!currencyAmountIn,
    !!currencyBalanceIn
  )

  // insufficient balance
  if (currencyAmountIn && currencyBalanceIn?.lessThan(currencyAmountIn)) {
    warnings.push({
      type: WarningLabel.InsufficientFunds,
      severity: WarningSeverity.None,
      action: WarningAction.DisableReview,
      title: t('Not enough {{ symbol }}.', {
        symbol: currencyAmountIn.currency?.symbol,
      }),
      message: t(
        "Your {{ symbol }} balance has decreased since you entered the amount you'd like to send",
        { symbol: currencyAmountIn.currency?.symbol }
      ),
    })
  }

  // transfer form is missing fields
  if (isMissingRequiredParams) {
    warnings.push({
      type: WarningLabel.FormIncomplete,
      severity: WarningSeverity.None,
      action: WarningAction.DisableReview,
    })
  }

  if (account?.type === AccountType.Readonly) {
    warnings.push({
      type: WarningLabel.ViewOnlyAccount,
      severity: WarningSeverity.Low,
      action: WarningAction.DisableSubmit,
      title: t('This wallet is view-only'),
      message: t('You need to import this wallet via recovery phrase to send assets.'),
      icon: Eye,
    })
  }

  // TODO: Add warning for insufficient gas for transfer

  return warnings
}

export function useTransferWarnings(
  t: TFunction,
  account: Account,
  derivedTransferInfo: DerivedTransferInfo
) {
  const networkStatus = useNetInfo()
  return useMemo(() => {
    return getTransferWarnings(t, account, derivedTransferInfo, networkStatus)
  }, [account, derivedTransferInfo, networkStatus, t])
}

const checkIsMissingRequiredParams = (
  currencyIn: Currency | undefined,
  nftIn: GQLNftAsset | undefined,
  chainId: ChainId | undefined,
  recipient: Address | undefined,
  hasCurrencyAmount: boolean,
  hasCurrencyBalance: boolean
) => {
  const tokenAddress = currencyIn ? currencyAddress(currencyIn) : nftIn?.nftContract?.address

  if (!tokenAddress || !chainId || !recipient) return true
  if (!currencyIn && !nftIn) return true
  if (currencyIn && (!hasCurrencyAmount || !hasCurrencyBalance)) return true
  return false
}
