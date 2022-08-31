import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { SettingsStackParamList } from 'src/app/navigation/types'
import { AppBackground } from 'src/components/gradients/AppBackground'
import { Screen } from 'src/components/layout/Screen'
import { ConnectedDappsList } from 'src/components/WalletConnect/ConnectedDapps/ConnectedDappsList'
import { useWalletConnect } from 'src/features/walletConnect/useWalletConnect'
import { Screens } from './Screens'

type Props = NativeStackScreenProps<SettingsStackParamList, Screens.SettingsWalletManageConnection>

export function SettingsWalletManageConnection({
  route: {
    params: { address },
  },
}: Props) {
  const { sessions } = useWalletConnect(address)

  return (
    <Screen>
      <AppBackground />
      <ConnectedDappsList sessions={sessions} />
    </Screen>
  )
}
