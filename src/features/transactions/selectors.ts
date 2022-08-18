import { createSelector } from '@reduxjs/toolkit'
import { RootState } from 'src/app/rootReducer'
import { SearchableRecipient } from 'src/components/RecipientSelect/types'
import { uniqueAddressesOnly } from 'src/components/RecipientSelect/utils'
import { ChainId } from 'src/constants/chains'
import {
  SendTokenTransactionInfo,
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'src/features/transactions/types'
import { flattenObjectOfObjects } from 'src/utils/objects'

export const selectTransactions = (state: RootState) => state.transactions

export const makeSelectAddressTransactions = (address: Address | null) =>
  createSelector(selectTransactions, (transactions) => {
    if (!address || !transactions[address]) return undefined
    return flattenObjectOfObjects(transactions[address])
  })

export const makeSelectTransaction = (
  address: Address | undefined,
  chainId: ChainId | undefined,
  txId: string | undefined
) =>
  createSelector(selectTransactions, (transactions) => {
    if (!address || !transactions[address] || !chainId || !txId) {
      return undefined
    }

    const addressTxs = transactions[address]?.[chainId]
    if (!addressTxs) {
      return undefined
    }

    return Object.values(addressTxs).find((txDetails) => txDetails.id === txId)
  })

// Returns a list of past recipients ordered from most to least recent
// TODO: either revert this to return addresses or keep but also return
//     displayName so that it's searchable for RecipientSelect
export const selectRecipientsByRecency = (state: RootState) => {
  const transactionsByChainId = flattenObjectOfObjects(state.transactions)
  const sendTransactions = transactionsByChainId.reduce<TransactionDetails[]>(
    (accum, transactions) => {
      const sendTransactionsWithRecipients = Object.values(transactions).filter(
        (tx) => tx.typeInfo.type === TransactionType.Send && tx.typeInfo.recipient
      )
      return [...accum, ...sendTransactionsWithRecipients]
    },
    []
  )
  const sortedRecipients = sendTransactions
    .sort((a, b) => (a.addedTime < b.addedTime ? 1 : -1))
    .map((transaction) => {
      return {
        address: (transaction.typeInfo as SendTokenTransactionInfo)?.recipient,
        name: '',
      } as SearchableRecipient
    })
  return uniqueAddressesOnly(sortedRecipients)
}

export const selectIncompleteTransactions = (state: RootState) => {
  const transactionsByChainId = flattenObjectOfObjects(state.transactions)
  return transactionsByChainId.reduce<TransactionDetails[]>((accum, transactions) => {
    const pendingTxs = Object.values(transactions).filter(
      (tx) => Boolean(!tx.receipt) && tx.status !== TransactionStatus.Failed
    )
    return [...accum, ...pendingTxs]
  }, [])
}
