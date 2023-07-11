import { ApolloProvider } from '@apollo/client'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import * as Sentry from '@sentry/react-native'
import { PerformanceProfiler, RenderPassReport } from '@shopify/react-native-performance'
import * as SplashScreen from 'expo-splash-screen'
import React, { StrictMode, useCallback, useEffect, useState } from 'react'
import { NativeModules, StatusBar } from 'react-native'
import { getUniqueId } from 'react-native-device-info'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { ErrorBoundary } from 'src/app/ErrorBoundary'
import { AppModals } from 'src/app/modals/AppModals'
import { AppStackNavigator } from 'src/app/navigation/navigation'
import { NavigationContainer } from 'src/app/navigation/NavigationContainer'
import { persistor, store } from 'src/app/store'
import { OfflineBanner } from 'src/components/banners/OfflineBanner'
import { Trace } from 'src/components/telemetry/Trace'
import { TraceUserProperties } from 'src/components/telemetry/TraceUserProperties'
import { usePersistedApolloClient } from 'src/data/usePersistedApolloClient'
import { initAppsFlyer } from 'src/features/analytics/appsflyer'
import { useIsDarkMode } from 'src/features/appearance/hooks'
import { LockScreenContextProvider } from 'src/features/authentication/lockScreenContext'
import { BiometricContextProvider } from 'src/features/biometrics/context'
import { NotificationToastWrapper } from 'src/features/notifications/NotificationToastWrapper'
import { initOneSignal } from 'src/features/notifications/Onesignal'
import { sendAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName } from 'src/features/telemetry/constants'
import { TransactionHistoryUpdater } from 'src/features/transactions/TransactionHistoryUpdater'
import { DynamicThemeProvider } from 'src/theme/DynamicThemeProvider'
import { getSentryEnvironment, getStatsigEnvironmentTier } from 'src/utils/version'
import { StatsigProvider } from 'statsig-react-native'
import { flex } from 'ui/src/theme/restyle/flex'
import { config } from 'wallet/src/config'
import { useTrmQuery } from 'wallet/src/features/trm/api'
import { AccountType } from 'wallet/src/features/wallet/accounts/types'
import { WalletContextProvider } from 'wallet/src/features/wallet/context'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'

// Keep the splash screen visible while we fetch resources until one of our landing pages loads
SplashScreen.preventAutoHideAsync()

// Construct a new instrumentation instance. This is needed to communicate between the integration and React
const routingInstrumentation = new Sentry.ReactNavigationInstrumentation()

// Dummy key since we use the reverse proxy will handle the real key
const DUMMY_STATSIG_SDK_KEY = 'client-0000000000000000000000000000000000000000000'

if (!__DEV__) {
  Sentry.init({
    environment: getSentryEnvironment(),
    dsn: config.sentryDsn,
    attachViewHierarchy: true,
    enableCaptureFailedRequests: true,
    tracesSampler: (_) => {
      return 0.2
    },
    integrations: [
      new Sentry.ReactNativeTracing({
        enableUserInteractionTracing: true,
        enableNativeFramesTracking: true,
        enableStallTracking: true,
        // Pass instrumentation to be used as `routingInstrumentation`
        routingInstrumentation,
      }),
    ],
  })
}

initOneSignal()
initAppsFlyer()

function App(): JSX.Element | null {
  const client = usePersistedApolloClient()
  const [deviceId, setDeviceId] = useState<string | null>(null)

  // We want to ensure deviceID is used as the identifier to link with analytics
  useEffect(() => {
    async function fetchAndSetDeviceId(): Promise<void> {
      const uniqueId = await getUniqueId()
      setDeviceId(uniqueId)
      Sentry.setUser({
        id: uniqueId,
      })
    }
    fetchAndSetDeviceId()
  }, [])

  const onReportPrepared = useCallback((report: RenderPassReport) => {
    sendAnalyticsEvent(MobileEventName.PerformanceReport, report)
  }, [])

  if (!client) {
    return null
  }

  const statSigOptions = {
    options: {
      environment: {
        tier: getStatsigEnvironmentTier(),
      },
      api: config.statSigProxyUrl,
    },
    sdkKey: DUMMY_STATSIG_SDK_KEY,
    user: deviceId ? { userID: deviceId } : {},
    waitForInitialization: true,
  }

  return (
    <Trace>
      <StrictMode>
        <StatsigProvider {...statSigOptions}>
          <SafeAreaProvider>
            <Provider store={store}>
              <ApolloProvider client={client}>
                <PersistGate loading={null} persistor={persistor}>
                  <DynamicThemeProvider>
                    <ErrorBoundary>
                      <GestureHandlerRootView style={flex.fill}>
                        <WalletContextProvider>
                          <BiometricContextProvider>
                            <LockScreenContextProvider>
                              <Sentry.TouchEventBoundary>
                                <DataUpdaters />
                                <BottomSheetModalProvider>
                                  <AppModals />
                                  <PerformanceProfiler onReportPrepared={onReportPrepared}>
                                    <AppInner />
                                  </PerformanceProfiler>
                                </BottomSheetModalProvider>
                              </Sentry.TouchEventBoundary>
                            </LockScreenContextProvider>
                          </BiometricContextProvider>
                        </WalletContextProvider>
                      </GestureHandlerRootView>
                    </ErrorBoundary>
                  </DynamicThemeProvider>
                </PersistGate>
              </ApolloProvider>
            </Provider>
          </SafeAreaProvider>
        </StatsigProvider>
      </StrictMode>
    </Trace>
  )
}

function AppInner(): JSX.Element {
  const isDarkMode = useIsDarkMode()

  useEffect(() => {
    // TODO: This is a temporary solution (it should be replaced with Appearance.setColorScheme
    // after updating RN to 0.72.0 or higher)
    NativeModules.ThemeModule.setColorScheme(isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  return <NavStack isDarkMode={isDarkMode} />
}

function DataUpdaters(): JSX.Element {
  const activeAccount = useActiveAccount()
  useTrmQuery(
    activeAccount && activeAccount.type === AccountType.SignerMnemonic
      ? activeAccount.address
      : undefined
  )

  return (
    <>
      <TraceUserProperties />
      <TransactionHistoryUpdater />
    </>
  )
}

function NavStack({ isDarkMode }: { isDarkMode: boolean }): JSX.Element {
  return (
    <NavigationContainer
      onReady={(navigationRef): void => {
        routingInstrumentation.registerNavigationContainer(navigationRef)
      }}>
      <OfflineBanner />
      <NotificationToastWrapper />
      <AppStackNavigator />
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />
    </NavigationContainer>
  )
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function getApp() {
  return __DEV__ ? App : Sentry.wrap(App)
}

export default getApp()
