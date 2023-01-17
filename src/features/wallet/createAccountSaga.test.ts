import dayjs from 'dayjs'
import { expectSaga } from 'redux-saga-test-plan'
import { rootReducer } from 'src/app/rootReducer'
import { Account, AccountType, SignerMnemonicAccount } from 'src/features/wallet/accounts/types'
import { createAccount } from 'src/features/wallet/createAccountSaga'

const createNativeAccount = async (initialAccounts = {}, timeout = 250) => {
  const { storeState } = await expectSaga(createAccount)
    .withReducer(rootReducer)
    .withState({
      wallet: {
        accounts: initialAccounts as { [key: string]: Account },
      },
    })
    .run(timeout)

  return storeState as { wallet: { accounts: Account } }
}

// even when we test scenarios of deleting seed phrase accounts, we must first create them so that generated menmonic is stored
const createMultipleNativeAccounts = async (
  initialAccountState = {},
  numAccounts = 0
): Promise<Account> => {
  let accounts = initialAccountState as Account
  for (let i = 0; i < numAccounts; i++) {
    const storedState = await createNativeAccount(accounts)
    accounts = storedState.wallet.accounts
  }
  return accounts
}

describe(createAccount, () => {
  jest.setTimeout(10000)
  it('Creates first native account (initial onboarding)', async () => {
    const state = await createNativeAccount()

    const wallets = state.wallet.accounts
    const accounts = Object.values(wallets)
    expect(accounts).toHaveLength(1)
    const newlyCreatedWallet = accounts[0] as SignerMnemonicAccount
    expect(newlyCreatedWallet.timeImportedMs).toBeDefined()
    expect(newlyCreatedWallet.derivationIndex).toEqual(0)
    expect(newlyCreatedWallet.address).toEqual(newlyCreatedWallet.mnemonicId)
  })

  it('Adds a second native account with existing seed phrase', async () => {
    const wallets = await createMultipleNativeAccounts({}, 2)
    const accounts = Object.values(wallets).sort((a, b) => a.derivationIndex - b.derivationIndex)
    expect(accounts).toHaveLength(2)
    const existingWallet = accounts[0]
    const newlyCreatedWallet = accounts[1]
    expect(existingWallet.mnemonicId).toEqual(newlyCreatedWallet.mnemonicId)
    expect(newlyCreatedWallet.timeImportedMs).toBeDefined()
    expect(newlyCreatedWallet.derivationIndex).toEqual(1)
    expect(newlyCreatedWallet.mnemonicId).toEqual(existingWallet.mnemonicId)
  })

  it('Creates first native account when a view-only wallet exists (after initial onboarding)', async () => {
    const state = await createNativeAccount({
      '0xaddress1': {
        type: AccountType.Readonly,
        address: '0xaddress1',
        name: 'READONLY ACCOUNT',
        timeImportedMs: dayjs().valueOf(),
      },
    })

    const wallets = state.wallet.accounts
    const accounts = Object.values(wallets)
    expect(accounts).toHaveLength(2)
    expect(accounts.filter((a) => a.type === AccountType.Readonly)).toHaveLength(1)
    const newlyCreatedWallet = accounts.find(
      (account) => account.type === AccountType.SignerMnemonic
    ) as SignerMnemonicAccount
    expect(newlyCreatedWallet.timeImportedMs).toBeDefined()
    expect(newlyCreatedWallet.derivationIndex).toEqual(0)
    expect(newlyCreatedWallet.address).toEqual(newlyCreatedWallet.mnemonicId)
  })

  it('Creates new native account when wallet with derivation index 0 is deleted', async () => {
    const initialAccountsMap = await createMultipleNativeAccounts({}, 2)
    const initialAccounts = Object.values(initialAccountsMap)
      .filter((a) => a.type === AccountType.SignerMnemonic)
      .sort((a, b) => a.derivationIndex - b.derivationIndex)
    const state = await createNativeAccount({
      [initialAccounts[1].address]: initialAccounts[1],
    })

    const wallets = state.wallet.accounts
    const accounts = Object.values(wallets).sort((a, b) => a.derivationIndex - b.derivationIndex)
    expect(accounts).toHaveLength(2)
    const newlyCreatedWallet = accounts[0]
    const existingWallet = accounts[1]
    expect(newlyCreatedWallet.derivationIndex).toEqual(0)
    expect(existingWallet.derivationIndex).toEqual(1)
    expect(newlyCreatedWallet.address).toEqual(newlyCreatedWallet.mnemonicId)
  })

  it('Creates new native account when wallet with derivation index 1 of [0,1,2] is deleted', async () => {
    const initialAccountsMap = await createMultipleNativeAccounts({}, 3)
    const initialAccounts = Object.values(initialAccountsMap)
      .filter((a) => a.type === AccountType.SignerMnemonic)
      .sort((a, b) => a.derivationIndex - b.derivationIndex)

    const walletAddressRemoved = initialAccounts[1].address
    const state = await createNativeAccount({
      [initialAccounts[0].address]: initialAccounts[0],
      [initialAccounts[2].address]: initialAccounts[2],
    })

    const wallets = state.wallet.accounts
    const accounts = Object.values(wallets).sort((a, b) => a.derivationIndex - b.derivationIndex)
    expect(accounts).toHaveLength(3)
    const newlyCreatedWallet = accounts[1]
    expect(newlyCreatedWallet.derivationIndex).toEqual(1)
    expect(newlyCreatedWallet.address).toEqual(walletAddressRemoved)
    expect(accounts.every((a) => a.mnemonicId)).toEqual(true)
  })
})