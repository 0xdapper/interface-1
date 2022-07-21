import { BigNumber, providers } from 'ethers'
import { appSelect } from 'src/app/hooks'
import { i18n } from 'src/app/i18n'
import { getProvider, getSignerManager } from 'src/app/walletContext'
import { pushNotification } from 'src/features/notifications/notificationSlice'
import { AppNotificationType } from 'src/features/notifications/types'
import { signAndSendTransaction } from 'src/features/transactions/sendTransaction'
import { finalizeTransaction, updateTransaction } from 'src/features/transactions/slice'
import { TransactionDetails, TransactionStatus } from 'src/features/transactions/types'
import { getSerializableTransactionRequest } from 'src/features/transactions/utils'
import { selectAccounts } from 'src/features/wallet/selectors'
import { normalizeAddress } from 'src/utils/addresses'
import { logger } from 'src/utils/logger'
import { assert } from 'src/utils/validation'
import { call, put } from 'typed-redux-saga'

export function* attemptReplaceTransaction(
  transaction: TransactionDetails,
  newTxRequest: providers.TransactionRequest,
  isCancellation = false
) {
  const { chainId, hash, options } = transaction
  logger.debug('replaceTransaction', '', 'Attempting tx replacement', hash)
  try {
    const { from, nonce } = options.request
    assert(
      from && nonce && BigNumber.from(nonce).gte(0),
      `Cannot replace invalid transaction: ${hash}`
    )

    const accounts = yield* appSelect(selectAccounts)
    const account = accounts[normalizeAddress(from)]
    assert(account, `Cannot replace transaction, account missing: ${hash}`)

    const request: providers.TransactionRequest = {
      ...newTxRequest,
      from,
      nonce,
    }

    const provider = yield* call(getProvider, chainId)
    const signerManager = yield* call(getSignerManager)
    const { transactionResponse, populatedRequest } = yield* call(
      signAndSendTransaction,
      request,
      account,
      provider,
      signerManager
    )
    logger.debug('replaceTransaction', '', 'Tx submitted. New hash:', transactionResponse.hash)

    const updatedTransaction: TransactionDetails = {
      ...transaction,
      hash: transactionResponse.hash,
      status: isCancellation ? TransactionStatus.Cancelling : TransactionStatus.Pending,
      receipt: undefined,
      options: {
        ...options,
        request: getSerializableTransactionRequest(populatedRequest, chainId),
      },
    }
    yield* put(updateTransaction(updatedTransaction))
  } catch (error) {
    logger.info('replaceTransaction', '', 'Error while attempting tx replacement', hash, error)

    // Caught an invalid replacement, which is a failed cancelation attempt. Aka previous
    // txn was already mined.
    if (transaction.status === TransactionStatus.Cancelling) {
      const updatedTransaction: TransactionDetails = {
        ...transaction,
        hash: hash,
        status: TransactionStatus.FailedCancel,
        receipt: undefined,
        options: {
          ...options,
        },
      }
      // Finalize and end attempts to replace.
      yield* put(
        finalizeTransaction({ ...updatedTransaction, status: TransactionStatus.FailedCancel })
      )
    }

    yield* put(
      pushNotification({
        type: AppNotificationType.Error,
        address: transaction.from,
        errorMessage: isCancellation
          ? i18n.t('Unable to cancel transaction')
          : i18n.t('Unable to replace transaction'),
      })
    )
  }
}
