import { firebase } from '@react-native-firebase/analytics'
import { firebase as firebasePerf } from '@react-native-firebase/perf'
import { logger } from 'src/utils/logger'

export async function enableAnalytics() {
  if (__DEV__) {
    // avoid polluting analytics dashboards with dev data
    // consider re-enabling if validating data prior to launches is useful
    return
  }

  try {
    await firebase.analytics().setAnalyticsCollectionEnabled(true)
    await firebasePerf.perf().setPerformanceCollectionEnabled(true)
  } catch (err) {
    logger.error('telemetry', 'enableAnalytics', 'error from Firebase', err)
  }
}

/** Logs a generic event with payload. */
export async function logEvent(name: string, params: {}) {
  if (__DEV__) {
    logger.info('telemetry', 'logEvent', `${name}: ${JSON.stringify(params)}`)
  }

  try {
    await firebase.analytics().logEvent(name, params)
  } catch (err) {
    logger.error('telemetry', 'logEvent', 'error from Firebase', err)
  }
}

/** Logs a screen view event. */
export async function logScreenView(name: string) {
  if (__DEV__) {
    logger.info('telemetry', 'logScreenView', name)
  }

  try {
    await firebase.analytics().logScreenView({ screen_name: name })
  } catch (err) {
    logger.error('telemetry', 'logScreenView', 'error from Firebase', err)
  }
}
