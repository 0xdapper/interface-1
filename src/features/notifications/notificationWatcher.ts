import { appSelect } from 'src/app/hooks'
import { ChainId } from 'src/constants/chains'
import { AssetType } from 'src/entities/assets'
import { pushNotification } from 'src/features/notifications/notificationSlice'
import { AppNotificationType } from 'src/features/notifications/types'
import { selectTransactions } from 'src/features/transactions/selectors'
import { finalizeTransaction } from 'src/features/transactions/slice'
import { TransactionStatus, TransactionType } from 'src/features/transactions/types'
import { getInputAmountFromTrade, getOutputAmountFromTrade } from 'src/features/transactions/utils'
import { WalletConnectEvent } from 'src/features/walletConnect/saga'
import { logger } from 'src/utils/logger'
import { call, put, takeLatest } from 'typed-redux-saga'

export function* notificationWatcher() {
  yield* takeLatest(finalizeTransaction.type, pushTransactionNotification)
}

export function* pushTransactionNotification(action: ReturnType<typeof finalizeTransaction>) {
  const { chainId, status, typeInfo, hash, id, from, addedTime } = action.payload

  // TODO: Build notifications for `cancelled` txs
  if (status === TransactionStatus.Cancelled) {
    logger.info(
      'notificationWatcher',
      'pushTransactionNotification',
      'Notifications for cancelled transactions are not yet built'
    )
    return
  }

  const baseNotificationData = {
    txStatus: status,
    chainId,
    txHash: hash,
    address: from,
    txId: id,
  }

  switch (typeInfo.type) {
    case TransactionType.Approve:
      const shouldSuppressNotification = yield* call(
        suppressApproveNotification,
        from,
        chainId,
        addedTime
      )
      if (!shouldSuppressNotification) {
        yield* put(
          pushNotification({
            ...baseNotificationData,
            type: AppNotificationType.Transaction,
            txType: TransactionType.Approve,
            tokenAddress: typeInfo.tokenAddress,
            spender: typeInfo.spender,
          })
        )
      }
      break
    case TransactionType.Swap:
      const inputCurrencyAmountRaw = getInputAmountFromTrade(typeInfo)
      const outputCurrencyAmountRaw = getOutputAmountFromTrade(typeInfo)
      yield* put(
        pushNotification({
          ...baseNotificationData,
          type: AppNotificationType.Transaction,
          txType: TransactionType.Swap,
          inputCurrencyId: typeInfo.inputCurrencyId,
          outputCurrencyId: typeInfo.outputCurrencyId,
          inputCurrencyAmountRaw,
          outputCurrencyAmountRaw,
          tradeType: typeInfo.tradeType,
        })
      )
      break
    case TransactionType.Send:
      if (typeInfo?.assetType === AssetType.Currency && typeInfo?.currencyAmountRaw) {
        yield* put(
          pushNotification({
            ...baseNotificationData,
            type: AppNotificationType.Transaction,
            txType: TransactionType.Send,
            assetType: typeInfo.assetType,
            tokenAddress: typeInfo.tokenAddress,
            currencyAmountRaw: typeInfo.currencyAmountRaw,
            recipient: typeInfo.recipient,
          })
        )
      } else if (
        (typeInfo?.assetType === AssetType.ERC1155 || typeInfo?.assetType === AssetType.ERC721) &&
        typeInfo?.tokenId
      ) {
        yield* put(
          pushNotification({
            ...baseNotificationData,
            type: AppNotificationType.Transaction,
            txType: TransactionType.Send,
            assetType: typeInfo.assetType,
            tokenAddress: typeInfo.tokenAddress,
            tokenId: typeInfo.tokenId,
            recipient: typeInfo.recipient,
          })
        )
      }
      break
    case TransactionType.Receive:
      if (
        typeInfo?.assetType === AssetType.Currency &&
        typeInfo?.currencyAmountRaw &&
        typeInfo?.sender
      ) {
        yield* put(
          pushNotification({
            ...baseNotificationData,
            type: AppNotificationType.Transaction,
            txType: TransactionType.Receive,
            assetType: typeInfo.assetType,
            tokenAddress: typeInfo.tokenAddress,
            currencyAmountRaw: typeInfo.currencyAmountRaw,
            sender: typeInfo.sender,
          })
        )
      } else if (
        (typeInfo?.assetType === AssetType.ERC1155 || typeInfo?.assetType === AssetType.ERC721) &&
        typeInfo?.tokenId
      ) {
        yield* put(
          pushNotification({
            ...baseNotificationData,
            type: AppNotificationType.Transaction,
            txType: TransactionType.Receive,
            assetType: typeInfo.assetType,
            tokenAddress: typeInfo.tokenAddress,
            tokenId: typeInfo.tokenId,
            sender: typeInfo.sender,
          })
        )
      }
      break
    case TransactionType.WCConfirm:
      yield* put(
        pushNotification({
          type: AppNotificationType.WalletConnect,
          event: WalletConnectEvent.Confirmed,
          dappName: typeInfo.dapp.name,
          imageUrl: typeInfo.dapp.icon,
          chainId: typeInfo.dapp.chain_id,
        })
      )
      break
    case TransactionType.Unknown:
      yield* put(
        pushNotification({
          ...baseNotificationData,
          type: AppNotificationType.Transaction,
          txType: TransactionType.Unknown,
          tokenAddress: typeInfo?.tokenAddress,
        })
      )
      break
  }
}

// If an approve tx is submitted with a swap tx (i.e, swap tx is added within 3 seconds of an approve tx),
// then suppress the approve notification
function* suppressApproveNotification(
  address: Address,
  chainId: ChainId,
  approveAddedTime: number
) {
  const transactions = (yield* appSelect(selectTransactions))?.[address]?.[chainId]
  const transactionDetails = Object.values(transactions ?? {})
  const foundSwapTx = transactionDetails.find((tx) => {
    const { type } = tx.typeInfo
    if (type !== TransactionType.Swap) {
      return false
    }

    const swapAddedTime = tx.addedTime
    return swapAddedTime - approveAddedTime < 3000
  })

  return !!foundSwapTx
}
