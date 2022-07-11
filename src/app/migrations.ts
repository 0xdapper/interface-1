import dayjs from 'dayjs'
import { ChainId } from 'src/constants/chains'
import { AccountType } from 'src/features/wallet/accounts/types'

export const migrations = {
  0: (state: any) => {
    const oldTransactionState = state.transactions
    const newTransactionState: any = {}

    const chainIds = Object.keys(oldTransactionState.byChainId)
    for (const chainId of chainIds) {
      const transactions = oldTransactionState.byChainId[chainId]
      const txIds = Object.keys(transactions)
      for (const txId of txIds) {
        const txDetails = transactions[txId]
        const address = txDetails.from
        newTransactionState[address] ??= {}
        newTransactionState[address][chainId] ??= {}
        newTransactionState[address][chainId][txId] = { ...txDetails }
      }
    }

    const oldNotificationState = state.notifications
    const newNotificationState = { ...oldNotificationState, lastTxNotificationUpdate: {} }
    const addresses = Object.keys(oldTransactionState.lastTxHistoryUpdate)
    for (const address of addresses) {
      newNotificationState.lastTxNotificationUpdate[address] = {
        [ChainId.Mainnet]: oldTransactionState.lastTxHistoryUpdate[address],
      }
    }

    return { ...state, transactions: newTransactionState, notifications: newNotificationState }
  },

  1: (state: any) => {
    const newState = { ...state }
    delete newState.walletConnect.modalState
    return newState
  },

  2: (state: any) => {
    const newState = { ...state }
    const oldFollowingAddresses = state.favorites.followedAddresses
    newState.favorites.watchedAddresses = oldFollowingAddresses
    delete newState.favorites.followedAddresses
    return newState
  },

  3: (state: any) => {
    const newState = { ...state }
    newState.searchHistory = { results: [] }
    return newState
  },

  4: (state: any) => {
    const newState = { ...state }
    const accounts = newState.wallet.accounts
    let derivationIndex = 0
    for (const account of Object.keys(accounts)) {
      newState.wallet.accounts[account].timeImportedMs = dayjs().valueOf()
      if (newState.wallet.accounts[account].type === AccountType.Native) {
        newState.wallet.accounts[account].derivationIndex = derivationIndex
        derivationIndex += 1
      }
    }
    return newState
  },
}
