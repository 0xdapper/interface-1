import {
  createNavigationContainerRef,
  DefaultTheme,
  NavigationContainer as NativeNavigationContainer,
  NavigationContainerRefWithCurrent,
} from '@react-navigation/native'
import { AnyAction } from '@reduxjs/toolkit'
import React, { Dispatch, FC, useEffect } from 'react'
import { Linking } from 'react-native'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { DeepLink, openDeepLink } from 'src/features/deepLinking/handleDeepLink'
import { Trace } from 'src/features/telemetry/Trace'

interface Props {
  onReady: (navigationRef: NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>) => void
}

export const navigationRef = createNavigationContainerRef()

/** Wrapped `NavigationContainer` with telemetry tracing. */
export const NavigationContainer: FC<Props> = ({ children, onReady }) => {
  const dispatch = useAppDispatch()
  const theme = useAppTheme()

  useManageDeepLinks(dispatch)

  return (
    <NativeNavigationContainer
      ref={navigationRef}
      // avoid white flickering background on screen navigation
      theme={{
        ...DefaultTheme,
        colors: { ...DefaultTheme.colors, background: theme.colors.backgroundBackdrop },
      }}
      onReady={() => {
        onReady(navigationRef)
      }}>
      <Trace>{children}</Trace>
    </NativeNavigationContainer>
  )
}

export const useManageDeepLinks = (dispatch: Dispatch<AnyAction | AnyAction>) =>
  useEffect(() => {
    const handleDeepLink = (payload: DeepLink) => dispatch(openDeepLink(payload))
    const urlListener = Linking.addEventListener('url', (event: { url: string }) =>
      handleDeepLink({ url: event.url, coldStart: false })
    )
    const handleDeepLinkColdStart = async () => {
      const url = await Linking.getInitialURL()
      if (url) handleDeepLink({ url, coldStart: true })
    }

    handleDeepLinkColdStart()
    return urlListener.remove
  }, [dispatch])
