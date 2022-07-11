import dayjs from 'dayjs'
import { Wallet } from 'ethers'
import { ImportAccountParams, ImportAccountType } from 'src/features/import/types'
import { Account, AccountType } from 'src/features/wallet/accounts/types'
import { activateAccount, addAccount, unlockWallet } from 'src/features/wallet/walletSlice'
import { generateAndStorePrivateKey, importMnemonic } from 'src/lib/RNEthersRs'
import { ensureLeading0x, normalizeAddress } from 'src/utils/addresses'
import { logger } from 'src/utils/logger'
import { normalizeMnemonic } from 'src/utils/mnemonics'
import { createMonitoredSaga } from 'src/utils/saga'
import { all, call, put } from 'typed-redux-saga'

export function* importAccount(params: ImportAccountParams) {
  const { type, name } = params
  logger.debug('importAccountSaga', 'importAccount', 'Importing type:', type)

  if (type === ImportAccountType.Address) {
    yield* call(importAddressAccount, params.address, name, params.ignoreActivate)
  } else if (type === ImportAccountType.Mnemonic) {
    yield* call(
      importMnemonicAccounts,
      params.mnemonic,
      name,
      params.indexes,
      params.markAsActive,
      params.ignoreActivate
    )
  } else if (type === ImportAccountType.PrivateKey) {
    yield* call(importPrivateKeyAccount, params.privateKey, name, params.ignoreActivate)
  } else {
    throw new Error('Unsupported import account type')
  }
}

function* importAddressAccount(address: string, name?: string, ignoreActivate?: boolean) {
  const formattedAddress = normalizeAddress(address)
  const account: Account = {
    type: AccountType.Readonly,
    address: formattedAddress,
    name,
    pending: true,
    timeImportedMs: dayjs().valueOf(),
  }
  yield* call(onAccountImport, account, ignoreActivate)
}

function* importMnemonicAccounts(
  mnemonic: string,
  name?: string,
  indexes = [0],
  markAsActive?: boolean,
  ignoreActivate?: boolean
) {
  const formattedMnemonic = normalizeMnemonic(mnemonic)
  const mnemonicId = yield* call(importMnemonic, formattedMnemonic)
  // generate private keys and return addresses for all derivation indexes
  const addresses = yield* all(
    indexes.map((index) => {
      return call(generateAndStorePrivateKey, mnemonicId, index)
    })
  )
  yield* all(
    addresses.slice(1, addresses.length).map((address, index) => {
      const account: Account = {
        type: AccountType.Native,
        address,
        name,
        pending: true,
        timeImportedMs: dayjs().valueOf(),
        derivationIndex: index + 1,
      }
      return put(addAccount(account))
    })
  )

  const activeAccount: Account = {
    type: AccountType.Native,
    address: addresses[0],
    name,
    pending: !markAsActive,
    timeImportedMs: dayjs().valueOf(),
    derivationIndex: indexes[0],
  }
  yield* call(onAccountImport, activeAccount, ignoreActivate)
}

function* importPrivateKeyAccount(privateKey: string, name?: string, ignoreActivate?: boolean) {
  const wallet = new Wallet(ensureLeading0x(privateKey))
  const address = wallet.address
  const account: Account = {
    type: AccountType.Local,
    privateKey,
    name,
    address,
    pending: true,
    timeImportedMs: dayjs().valueOf(),
  }
  // TODO save key to keychain: https://github.com/Uniswap/mobile/issues/131
  yield* call(onAccountImport, account, ignoreActivate)
}

function* onAccountImport(account: Account, ignoreActivate?: boolean) {
  yield* put(addAccount(account))
  if (!ignoreActivate) {
    yield* put(activateAccount(account.address))
  }
  yield* put(unlockWallet())
  logger.info('importAccount', '', `New ${account.type} account imported: ${account.address}`)
}

export const {
  name: importAccountSagaName,
  wrappedSaga: importAccountSaga,
  reducer: importAccountReducer,
  actions: importAccountActions,
} = createMonitoredSaga<ImportAccountParams>(importAccount, 'importAccount')
