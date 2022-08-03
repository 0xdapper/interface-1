import dayjs from 'dayjs'
import { appSelect } from 'src/app/hooks'
import { AccountType, BackupType, NativeAccount } from 'src/features/wallet/accounts/types'
import { selectSortedMnemonicAccounts } from 'src/features/wallet/selectors'
import { activateAccount, addAccount } from 'src/features/wallet/walletSlice'
import { generateAndStoreMnemonic, generateAndStorePrivateKey } from 'src/lib/RNEthersRs'
import { logger } from 'src/utils/logger'
import { createMonitoredSaga } from 'src/utils/saga'
import { call, put } from 'typed-redux-saga'

export function* createAccount() {
  const sortedMnemonicAccounts: NativeAccount[] = yield* appSelect(selectSortedMnemonicAccounts)
  const { nextDerivationIndex, mnemonicId, existingBackups } = yield* call(
    getNewAccountParams,
    sortedMnemonicAccounts
  )
  const address = yield* call(generateAndStorePrivateKey, mnemonicId, nextDerivationIndex)

  yield* put(
    addAccount({
      type: AccountType.Native,
      address: address,
      pending: true,
      timeImportedMs: dayjs().valueOf(),
      derivationIndex: nextDerivationIndex,
      mnemonicId: mnemonicId,
      backups: existingBackups,
    })
  )
  yield* put(activateAccount(address))
  logger.info('createAccountSaga', '', 'New account created:', address)
}

async function getNewAccountParams(sortedAccounts: NativeAccount[]): Promise<{
  nextDerivationIndex: number
  mnemonicId: string
  existingBackups?: BackupType[]
}> {
  if (sortedAccounts.length === 0) {
    const mnemonicId = await generateAndStoreMnemonic()
    return { nextDerivationIndex: 0, mnemonicId: mnemonicId }
  }
  return {
    nextDerivationIndex: getNextDerivationIndex(sortedAccounts),
    mnemonicId: sortedAccounts[0].mnemonicId,
    existingBackups: sortedAccounts[0].backups,
  }
}

function getNextDerivationIndex(sortedAccounts: NativeAccount[]): number {
  // if there is a missing index in the series (0, 1, _, 3), return this missing index
  let nextIndex = 0
  for (const account of sortedAccounts) {
    if (account.derivationIndex !== nextIndex) {
      return Math.min(account.derivationIndex, nextIndex)
    }
    nextIndex += 1
  }
  // if all exist, nextDerivation = sortedMnemonicAccounts.length + 1
  return nextIndex
}

export const {
  name: createAccountSagaName,
  wrappedSaga: createAccountSaga,
  reducer: createAccountReducer,
  actions: createAccountActions,
} = createMonitoredSaga(createAccount, 'createAccount')
