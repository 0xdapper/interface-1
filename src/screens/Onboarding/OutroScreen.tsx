import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { Screen } from 'src/components/layout/Screen'
import { ImportType, OnboardingEntryPoint } from 'src/features/onboarding/utils'
import { sendAnalyticsEvent } from 'src/features/telemetry'
import { EventName } from 'src/features/telemetry/constants'
import { useTrace } from 'src/features/telemetry/hooks'
import { useActiveAccount, usePendingAccounts } from 'src/features/wallet/hooks'
import {
  pendingAccountActions,
  PendingAccountActions,
} from 'src/features/wallet/pendingAcccountsSaga'
import { setFinishedOnboarding } from 'src/features/wallet/walletSlice'
import { OnboardingCompleteAnimation } from 'src/screens/Onboarding/OnboardingCompleteAnimation/OnboardingCompleteAnimation'
import { OnboardingScreens, Screens } from 'src/screens/Screens'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.Outro>

export function OutroScreen({ navigation, route: { params } }: Props) {
  const dispatch = useAppDispatch()

  const activeAddress = useActiveAccount()?.address
  const pendingAccounts = usePendingAccounts()
  const parentTrace = useTrace()

  const onPressNext = () => {
    sendAnalyticsEvent(
      params?.entryPoint === OnboardingEntryPoint.Sidebar
        ? EventName.WalletAdded
        : EventName.OnboardingCompleted,
      {
        wallet_type: params?.importType,
        accounts_imported_count: Object.entries(pendingAccounts).length,
        ...parentTrace,
      }
    )

    // Remove pending flag from all new accounts.
    dispatch(pendingAccountActions.trigger(PendingAccountActions.ACTIVATE))
    dispatch(setFinishedOnboarding({ finishedOnboarding: true }))
    if (params?.entryPoint === OnboardingEntryPoint.Sidebar) {
      navigation.navigate(Screens.Home)
    }
  }

  return (
    <Screen>
      <OnboardingCompleteAnimation
        activeAddress={activeAddress ?? ''}
        isNewWallet={params?.importType === ImportType.Create}
        onPressNext={onPressNext}
      />
    </Screen>
  )
}
