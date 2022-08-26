import AsyncStorage from '@react-native-async-storage/async-storage'
import { configureStore, Middleware } from '@reduxjs/toolkit'
import { persistReducer, persistStore } from 'redux-persist'
import createSagaMiddleware from 'redux-saga'
import createMigrate from 'src/app/createMigrate'
import { migrations } from 'src/app/migrations'
import { rootReducer } from 'src/app/rootReducer'
import { rootSaga } from 'src/app/rootSaga'
import { walletContextValue } from 'src/app/walletContext'
import { config } from 'src/config'
import { coingeckoApi } from 'src/features/dataApi/coingecko/enhancedApi'
import { zerionApi } from 'src/features/dataApi/zerion/api'
import { nftApi } from 'src/features/nfts/api'
import { routingApi } from 'src/features/routing/routingApi'

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
    'biometricSettings',
    'chains',
    'favorites',
    'searchHistory',
    'transactions',
    'tokenLists',
    'tokens',
    'notifications',
    'ens',
    coingeckoApi.reducerPath,
    nftApi.reducerPath,
  ],
  version: 16,
  migrate: createMigrate(migrations),
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

const middlewares: Middleware[] = []
if (__DEV__) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const createDebugger = require('redux-flipper').default
  middlewares.push(createDebugger())
}

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // required for rtk-query
      thunk: true,
      // turn off since it slows down for dev and also doesn't run in prod
      // TODO: figure out why this is slow: MOB-681
      serializableCheck: false,
      invariantCheck: {
        warnAfter: 256,
      },
      // slows down dev build considerably
      immutableCheck: false,
    }).concat(
      sagaMiddleware,
      coingeckoApi.middleware,
      nftApi.middleware,
      routingApi.middleware,
      zerionApi.middleware,
      ...middlewares
    ),
  devTools: config.debug,
})

export const persistor = persistStore(store)
sagaMiddleware.run(rootSaga)

export type AppDispatch = typeof store.dispatch
