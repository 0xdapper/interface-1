import React from 'react'
import WebView from 'react-native-webview'
import { AppStackScreenProp, SettingsStackScreenProp } from 'src/app/navigation/types'
import { BackButtonRow } from 'src/components/layout/BackButtonRow'
import { Screen } from 'src/components/layout/Screen'
import { Separator } from 'src/components/layout/Separator'
import { Text } from 'src/components/Text'
import { Screens } from 'src/screens/Screens'

export function WebViewScreen({
  route,
}: SettingsStackScreenProp<Screens.WebView> | AppStackScreenProp<Screens.WebView>) {
  const { headerTitle, uriLink } = route.params
  return (
    <Screen edges={['top', 'left', 'right']}>
      <BackButtonRow mb="md" pt="lg" px="lg">
        <Text variant="subhead">{headerTitle}</Text>
      </BackButtonRow>
      <Separator />
      <WebView
        source={{
          uri: uriLink,
        }}
      />
    </Screen>
  )
}
