import React, { ReactElement } from 'react'
import WebView from 'react-native-webview'
import { AppStackScreenProp, SettingsStackScreenProp } from 'src/app/navigation/types'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Screen } from 'src/components/layout/Screen'
import { Separator } from 'src/components/layout/Separator'
import { Text } from 'src/components/Text'
import { Screens } from 'src/screens/Screens'

export function WebViewScreen({
  route,
}: SettingsStackScreenProp<Screens.WebView> | AppStackScreenProp<Screens.WebView>): ReactElement {
  const { headerTitle, uriLink } = route.params
  return (
    <Screen edges={['top', 'left', 'right']}>
      <BackHeader alignment="center" mb="md" pt="xxs" px="sm">
        <Text variant="bodyLarge">{headerTitle}</Text>
      </BackHeader>
      <Separator />
      <WebView
        source={{
          uri: uriLink,
        }}
      />
    </Screen>
  )
}