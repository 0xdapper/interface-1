import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import * as Sentry from '@sentry/react-native'
import React, { StrictMode } from 'react'
import { StatusBar, useColorScheme } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Provider } from 'react-redux'
import { RelayEnvironmentProvider } from 'react-relay'
import { PersistGate } from 'redux-persist/integration/react'
import { ErrorBoundary } from 'src/app/ErrorBoundary'
import { AppModals } from 'src/app/modals/AppModals'
import { DrawerNavigator } from 'src/app/navigation/navigation'
import { NavigationContainer } from 'src/app/navigation/NavigationContainer'
import { persistor, store } from 'src/app/store'
import { WalletContextProvider } from 'src/app/walletContext'
import { config } from 'src/config'
import RelayEnvironment from 'src/data/relay'
import { LockScreenContextProvider } from 'src/features/authentication/lockScreenContext'
import { BiometricContextProvider } from 'src/features/biometrics/context'
import { TransactionHistoryUpdater } from 'src/features/dataApi/zerion/updater'
import { MulticallUpdaters } from 'src/features/multicall'
import { NotificationToastWrapper } from 'src/features/notifications/NotificationToastWrapper'
import { initOneSignal } from 'src/features/notifications/Onesignal'
import { initializeRemoteConfig } from 'src/features/remoteConfig'
import { enableAnalytics } from 'src/features/telemetry'
import { TokenListUpdater } from 'src/features/tokenLists/updater'
import { DynamicThemeProvider } from 'src/styles/DynamicThemeProvider'

// Construct a new instrumentation instance. This is needed to communicate between the integration and React
const routingInstrumentation = new Sentry.ReactNavigationInstrumentation()

if (!__DEV__) {
  Sentry.init({
    dsn: config.sentryDsn,
    tracesSampler: (_) => {
      // Lower to ~20% before going live: MOB-1634
      return 1
    },
    integrations: [
      new Sentry.ReactNativeTracing({
        // Pass instrumentation to be used as `routingInstrumentation`
        routingInstrumentation,
      }),
    ],
  })
}

initializeRemoteConfig()
initOneSignal()
enableAnalytics()

function App() {
  const isDarkMode = useColorScheme() === 'dark'

  return (
    <StrictMode>
      <SafeAreaProvider>
        <Provider store={store}>
          <RelayEnvironmentProvider environment={RelayEnvironment}>
            <PersistGate loading={null} persistor={persistor}>
              <DynamicThemeProvider>
                <ErrorBoundary>
                  <WalletContextProvider>
                    <BiometricContextProvider>
                      <LockScreenContextProvider>
                        <DataUpdaters />
                        <BottomSheetModalProvider>
                          <AppModals />
                          <NavStack isDarkMode={isDarkMode} />
                        </BottomSheetModalProvider>
                      </LockScreenContextProvider>
                    </BiometricContextProvider>
                  </WalletContextProvider>
                </ErrorBoundary>
              </DynamicThemeProvider>
            </PersistGate>
          </RelayEnvironmentProvider>
        </Provider>
      </SafeAreaProvider>
    </StrictMode>
  )
}

function DataUpdaters() {
  return (
    <>
      <TransactionHistoryUpdater />
      <MulticallUpdaters />
      <TokenListUpdater />
    </>
  )
}

function NavStack({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <NavigationContainer
      onReady={(navigationRef) => {
        routingInstrumentation.registerNavigationContainer(navigationRef)
      }}>
      <NotificationToastWrapper>
        <DrawerNavigator />
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      </NotificationToastWrapper>
    </NavigationContainer>
  )
}

function getApp() {
  return __DEV__ ? App : Sentry.wrap(App)
}

export default getApp()
