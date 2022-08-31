import { TFunction } from 'i18next'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { goBack } from 'src/app/navigation/rootNavigation'
import { useSelectTransaction } from 'src/features/transactions/hooks'
import { TransactionPending } from 'src/features/transactions/TransactionPending/TransactionPending'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'
import { DerivedTransferInfo } from 'src/features/transactions/transfer/hooks'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'src/features/transactions/types'
import { useActiveAccountAddressWithThrow, useDisplayName } from 'src/features/wallet/hooks'
import { formatCurrencyAmount } from 'src/utils/format'

type TransferStatusProps = {
  derivedTransferInfo: DerivedTransferInfo
  txId: string | undefined
  onNext: () => void
  onTryAgain: () => void
}

const getTextFromTransferStatus = (
  t: TFunction,
  derivedTransferInfo: DerivedTransferInfo,
  recipient: string | undefined,
  transactionDetails?: TransactionDetails
) => {
  const { currencyIn, nftIn, currencyAmounts, isUSDInput, formattedAmounts } = derivedTransferInfo
  if (
    !transactionDetails ||
    transactionDetails.typeInfo.type !== TransactionType.Send ||
    !recipient ||
    (!currencyIn && !nftIn)
  ) {
    // TODO: should never go into this state but should probably do some
    // error display here as well as log to sentry or amplitude
    return {
      title: t('Sending'),
      description: t(
        'We’ll notify you once your transaction is complete. You can now safely leave this page.'
      ),
    }
  }
  const status = transactionDetails.status

  if (status === TransactionStatus.Success) {
    return {
      title: t('Send successful!'),
      description: t(
        'You sent {{ currencyAmount }}{{ tokenName }}{{ usdValue }} to {{ recipient }}.',
        {
          currencyAmount: nftIn ? '' : formatCurrencyAmount(currencyAmounts[CurrencyField.INPUT]),
          usdValue: isUSDInput ? ` ($${formattedAmounts[CurrencyField.INPUT]})` : '',
          tokenName: nftIn?.name ?? ` ${currencyIn?.symbol}` ?? ' tokens',
          recipient,
        }
      ),
    }
  }

  if (status === TransactionStatus.Failed) {
    return {
      title: t('Send failed'),
      description: t('Keep in mind that the network fee is still charged for failed transfers.'),
    }
  }

  // TODO: handle TransactionStatus.Unknown state
  return {
    title: t('Sending'),
    description: t(
      'We’ll notify you once your transaction is complete. You can now safely leave this page.'
    ),
  }
}

export function TransferStatus({
  derivedTransferInfo,
  txId,
  onNext,
  onTryAgain,
}: TransferStatusProps) {
  const { t } = useTranslation()
  const activeAddress = useActiveAccountAddressWithThrow()

  const { recipient, chainId } = derivedTransferInfo

  const transaction = useSelectTransaction(activeAddress, chainId, txId)

  const recipientName = useDisplayName(recipient)?.name ?? recipient
  const { title, description } = useMemo(() => {
    return getTextFromTransferStatus(t, derivedTransferInfo, recipientName, transaction)
  }, [t, derivedTransferInfo, recipientName, transaction])

  const onClose = useCallback(() => {
    onNext()
    goBack()
  }, [onNext])

  if (!chainId) return null

  return (
    <TransactionPending
      chainId={chainId}
      description={description}
      title={title}
      transaction={transaction}
      onNext={onClose}
      onTryAgain={onTryAgain}
    />
  )
}
