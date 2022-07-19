import { BigNumber } from 'ethers'
import mockdate from 'mockdate'
import createMigrate from 'src/app/createMigrate'
import { migrations } from 'src/app/migrations'
import {
  getSchema,
  initialSchema,
  v1Schema,
  v2Schema,
  v3Schema,
  v4Schema,
  v5Schema,
} from 'src/app/schema'
import { persistConfig } from 'src/app/store'
import { WalletConnectModalState } from 'src/components/WalletConnect/ScanSheet/WalletConnectModal'
import { SWAP_ROUTER_ADDRESSES } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { initialBlockState } from 'src/features/blocks/blocksSlice'
import { initialChainsState } from 'src/features/chains/chainsSlice'
import { initialSearchHistoryState } from 'src/features/explore/searchHistorySlice'
import { initialFavoritesState } from 'src/features/favorites/slice'
import { initialModalState } from 'src/features/modals/modalSlice'
import { initialNotificationsState } from 'src/features/notifications/notificationSlice'
import { initialProvidersState } from 'src/features/providers/providerSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { initialTokenListsState } from 'src/features/tokenLists/reducer'
import { initialTokensState } from 'src/features/tokens/tokensSlice'
import { initialTransactionsState } from 'src/features/transactions/slice'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'src/features/transactions/types'
import { AccountType } from 'src/features/wallet/accounts/types'
import { initialWalletState } from 'src/features/wallet/walletSlice'
import { initialWalletConnectState } from 'src/features/walletConnect/walletConnectSlice'

const getAllKeysOfNestedObject = (obj: any, prefix = ''): string[] => {
  const keys = Object.keys(obj)
  if (!keys.length && prefix !== '') return [prefix.slice(0, -1)]
  return keys.reduce<string[]>((res, el) => {
    if (Array.isArray(obj[el])) return [...res]

    if (typeof obj[el] === 'object' && obj[el] !== null) {
      return [...res, ...getAllKeysOfNestedObject(obj[el], prefix + el + '.')]
    }

    return [...res, prefix + el]
  }, [])
}

describe('Redux state migrations', () => {
  it('is able to perform all migrations starting from the initial schema', async () => {
    const intialSchemaStub = {
      ...initialSchema,
      _persist: { version: -1, rehydrated: false },
    }

    const migrate = createMigrate(migrations)
    const migratedSchema = await migrate(intialSchemaStub, persistConfig.version)
    expect(typeof migratedSchema).toBe('object')
  })

  // If this test fails then it's likely a required property was added to the Redux state but a migration was not defined
  it('migrates all the properties correctly', async () => {
    const intialSchemaStub = {
      ...initialSchema,
      _persist: { version: -1, rehydrated: false },
    }

    const migrate = createMigrate(migrations)
    const migratedSchema = await migrate(intialSchemaStub, persistConfig.version)

    // Add new slices here!
    const initialState = {
      blocks: initialBlockState,
      chains: initialChainsState,
      favorites: initialFavoritesState,
      modals: initialModalState,
      notifications: initialNotificationsState,
      providers: initialProvidersState,
      saga: {},
      searchHistory: initialSearchHistoryState,
      tokenLists: initialTokenListsState,
      tokens: initialTokensState,
      transactions: initialTransactionsState,
      wallet: initialWalletState,
      walletConnect: initialWalletConnectState,
      _persist: {
        version: persistConfig.version,
        rehydrated: true,
      },
    }

    const migratedSchemaKeys = new Set(getAllKeysOfNestedObject(migratedSchema as any))
    const latestSchemaKeys = new Set(getAllKeysOfNestedObject(getSchema()))
    const initialStateKeys = new Set(getAllKeysOfNestedObject(initialState))

    for (const key of initialStateKeys) {
      if (latestSchemaKeys.has(key)) latestSchemaKeys.delete(key)
      if (migratedSchemaKeys.has(key)) migratedSchemaKeys.delete(key)
      initialStateKeys.delete(key)
    }

    expect(migratedSchemaKeys.size).toBe(0)
    expect(latestSchemaKeys.size).toBe(0)
    expect(initialStateKeys.size).toBe(0)
  })

  // This is a precaution to ensure we do not attempt to access undefined properties during migrations
  // If this test fails, make sure all property references to state are using optional chaining
  it('uses optional chaining when accessing old state variables', async () => {
    const emptyStub = { _persist: { version: -1, rehydrated: false } }

    const migrate = createMigrate(migrations)
    const migratedSchema = await migrate(emptyStub, persistConfig.version)
    expect(typeof migratedSchema).toBe('object')
  })

  it('migrates from initialSchema to v0Schema', () => {
    const txDetails0: TransactionDetails = {
      chainId: ChainId.Mainnet,
      id: '0',
      from: '0xShadowySuperCoder',
      options: {
        request: {
          from: '0x123',
          to: '0x456',
          value: '0x0',
          data: '0x789',
          nonce: 10,
          gasPrice: BigNumber.from('10000'),
        },
      },
      typeInfo: {
        type: TransactionType.Approve,
        tokenAddress: '0xtokenAddress',
        spender: SWAP_ROUTER_ADDRESSES[ChainId.Mainnet],
      },
      status: TransactionStatus.Pending,
      addedTime: 1487076708000,
      hash: '0x123',
    }

    const txDetails1: TransactionDetails = {
      chainId: ChainId.Rinkeby,
      id: '1',
      from: '0xKingHodler',
      options: {
        request: {
          from: '0x123',
          to: '0x456',
          value: '0x0',
          data: '0x789',
          nonce: 10,
          gasPrice: BigNumber.from('10000'),
        },
      },
      typeInfo: {
        type: TransactionType.Approve,
        tokenAddress: '0xtokenAddress',
        spender: SWAP_ROUTER_ADDRESSES[ChainId.Rinkeby],
      },
      status: TransactionStatus.Success,
      addedTime: 1487076708000,
      hash: '0x123',
    }

    const intialSchemaStub = {
      ...initialSchema,
      transactions: {
        byChainId: {
          [ChainId.Mainnet]: {
            '0': txDetails0,
          },
          [ChainId.Rinkeby]: {
            '1': txDetails1,
          },
        },
        lastTxHistoryUpdate: {
          '0xShadowySuperCoder': 12345678912345,
          '0xKingHodler': 9876543210987,
        },
      },
    }

    const newSchema = migrations[0](intialSchemaStub)
    expect(newSchema.transactions[ChainId.Mainnet]).toBeUndefined()
    expect(newSchema.transactions.lastTxHistoryUpdate).toBeUndefined()

    expect(newSchema.transactions['0xShadowySuperCoder'][ChainId.Mainnet]['0'].status).toEqual(
      TransactionStatus.Pending
    )
    expect(newSchema.transactions['0xKingHodler'][ChainId.Mainnet]).toBeUndefined()
    expect(newSchema.transactions['0xKingHodler'][ChainId.Rinkeby]['0']).toBeUndefined()
    expect(newSchema.transactions['0xKingHodler'][ChainId.Rinkeby]['1'].from).toEqual(
      '0xKingHodler'
    )

    expect(newSchema.notifications.lastTxNotificationUpdate).toBeDefined()
    expect(
      newSchema.notifications.lastTxNotificationUpdate['0xShadowySuperCoder'][ChainId.Mainnet]
    ).toEqual(12345678912345)
  })

  it('migrates from v0 to v1', () => {
    const initialSchemaStub = {
      ...initialSchema,
      walletConnect: {
        ...initialSchema.wallet,
        modalState: WalletConnectModalState.ScanQr,
      },
    }

    const v0 = migrations[0](initialSchemaStub)
    const v1 = migrations[1](v0)
    expect(v1.walletConnect.modalState).toEqual(undefined)
  })

  it('migrates from v1 to v2', () => {
    const TEST_ADDRESSES = ['0xTest']

    const v1SchemaStub = {
      ...v1Schema,
      favorites: {
        ...v1Schema.favorites,
        followedAddresses: TEST_ADDRESSES,
      },
    }

    const v2 = migrations[2](v1SchemaStub)

    expect(v2.favorites.watchedAddresses).toEqual(TEST_ADDRESSES)
    expect(v2.favorites.followedAddresses).toBeUndefined()
  })

  it('migrates from v2 to v3', () => {
    const v3 = migrations[3](v2Schema)
    expect(v3.searchHistory.results).toEqual([])
  })

  it('migrates from v3 to v4', () => {
    const TEST_ADDRESSES = ['0xTest', '0xTest2', '0xTest3', '0xTest4']
    const TEST_IMPORT_TIME_MS = 12345678912345

    const v3SchemaStub = {
      ...v3Schema,
      wallet: {
        ...v3Schema.wallet,
        accounts: [
          {
            type: AccountType.Readonly,
            address: TEST_ADDRESSES[0],
            name: 'Test Account 1',
            pending: false,
          },
          {
            type: AccountType.Readonly,
            address: TEST_ADDRESSES[1],
            name: 'Test Account 2',
            pending: false,
          },
          {
            type: AccountType.Native,
            address: TEST_ADDRESSES[2],
            name: 'Test Account 3',
            pending: false,
          },
          {
            type: AccountType.Native,
            address: TEST_ADDRESSES[3],
            name: 'Test Account 4',
            pending: false,
          },
        ],
      },
    }

    mockdate.set(TEST_IMPORT_TIME_MS)

    const v4 = migrations[4](v3SchemaStub)
    expect(v4.wallet.accounts[0].timeImportedMs).toEqual(TEST_IMPORT_TIME_MS)
    expect(v4.wallet.accounts[2].derivationIndex).toBeDefined()
  })

  it('migrates from v4 to v5', () => {
    const v5 = migrations[5](v4Schema)

    expect(v4Schema.balances).toBeDefined()
    expect(v5.balances).toBeUndefined()

    expect(v5.modals[ModalName.Swap].isOpen).toEqual(false)
    expect(v5.modals[ModalName.Send].isOpen).toEqual(false)
  })

  it('migrates from v5 to v6', () => {
    const v6 = migrations[6](v5Schema)

    expect(v6.walletConnect.pendingSession).toBe(null)

    expect(typeof v6.wallet.settings).toBe('object')

    expect(v5Schema.wallet.bluetooth).toBeDefined()
    expect(v6.wallet.bluetooth).toBeUndefined()
  })
})
