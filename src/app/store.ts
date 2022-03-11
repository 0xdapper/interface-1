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
import { rootReducer } from 'src/app/rootReducer'
import { rootSaga } from 'src/app/rootSaga'
import { walletContextValue } from 'src/app/walletContext'
import { config } from 'src/config'
import { swapActions } from 'src/features/swap/swapSaga'
import { tokenWrapActions } from 'src/features/swap/wrapSaga'

const sagaMiddleware = createSagaMiddleware({
  context: {
    signers: walletContextValue.signers,
    providers: walletContextValue.providers,
    contracts: walletContextValue.contracts,
  },
})

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['wallet', 'balances', 'chains', 'favorites', 'transactions', 'tokenLists', 'tokens'],
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) => {
    const middleware = [
      ...getDefaultMiddleware({
        thunk: false,
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
          ],
          warnAfter: 128,
        },
        invariantCheck: {
          warnAfter: 256,
        },
        immutableCheck: {
          warnAfter: 256,
        },
      }),
      sagaMiddleware,
    ]

    return middleware
  },
  devTools: config.debug,
})

export const persistor = persistStore(store)
sagaMiddleware.run(rootSaga)

export type AppDispatch = typeof store.dispatch
