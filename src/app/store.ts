import AsyncStorage from '@react-native-async-storage/async-storage'
import { configureStore } from '@reduxjs/toolkit'
import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistReducer,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
} from 'redux-persist'
import createSagaMiddleware from 'redux-saga'
import createMigrate from 'src/app/createMigrate'
import { migrations } from 'src/app/migrations'
import { rootReducer } from 'src/app/rootReducer'
import { rootSaga } from 'src/app/rootSaga'
import { walletContextValue } from 'src/app/walletContext'
import { config } from 'src/config'
import { coingeckoApi } from 'src/features/dataApi/coingecko/enhancedApi'
import { dataApi } from 'src/features/dataApi/slice'
import { zerionApi } from 'src/features/dataApi/zerion/api'
import { estimateGasAction } from 'src/features/gas/estimateGasSaga'
import { nftApi } from 'src/features/nfts/api'
import { routingApi } from 'src/features/routing/routingApi'
import { swapActions } from 'src/features/transactions/swap/swapSaga'
import { tokenWrapActions } from 'src/features/transactions/swap/wrapSaga'

const sagaMiddleware = createSagaMiddleware({
  context: {
    signers: walletContextValue.signers,
    providers: walletContextValue.providers,
    contracts: walletContextValue.contracts,
  },
})

export const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: [
    'wallet',
    'chains',
    'favorites',
    'searchHistory',
    'transactions',
    'tokenLists',
    'tokens',
    'notifications',
    coingeckoApi.reducerPath,
    dataApi.reducerPath,
    nftApi.reducerPath,
  ],
  version: 10,
  migrate: createMigrate(migrations),
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: true, // required for rtk-query
      serializableCheck: {
        ignoredActions: [
          FLUSH,
          REHYDRATE,
          PAUSE,
          PERSIST,
          PURGE,
          REGISTER,
          // contains non-serializable objects that do not hit the store
          swapActions.trigger.type,
          tokenWrapActions.trigger.type,
          estimateGasAction.type,
        ],
        warnAfter: 128,
      },
      invariantCheck: {
        warnAfter: 256,
      },
      // slows down dev build considerably
      immutableCheck: false,
    }).concat(
      sagaMiddleware,
      coingeckoApi.middleware,
      dataApi.middleware,
      nftApi.middleware,
      routingApi.middleware,
      zerionApi.middleware
    ),
  devTools: config.debug,
})

export const persistor = persistStore(store)
sagaMiddleware.run(rootSaga)

export type AppDispatch = typeof store.dispatch
