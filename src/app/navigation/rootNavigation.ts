import { navigationRef } from 'src/app/navigation/NavigationContainer'
import { RootParamList } from 'src/app/navigation/types'
import { logger } from 'src/utils/logger'

export async function navigate<RouteName extends keyof RootParamList>(
  ...args: undefined extends RootParamList[RouteName]
    ? [RouteName] | [RouteName, RootParamList[RouteName]]
    : [RouteName, RootParamList[RouteName]]
) {
  const [routeName, params] = args
  if (!navigationRef.isReady()) {
    logger.info('rootNavigation', 'navigate', 'Navigator was called before it was initialized')
    return
  }

  // Type assignment to `never` is a workaround until we figure out how to
  // type `createNavigationContainerRef` in a way that's compatible
  navigationRef.navigate(routeName as never, params as never)
}

export async function goBack() {
  if (!navigationRef.isReady()) {
    logger.info('rootNavigation', 'navigate', 'Navigator was called before it was initialized')
    return
  }

  navigationRef.goBack()
}
