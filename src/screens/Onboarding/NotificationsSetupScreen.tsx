import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import AaveIcon from 'src/assets/icons/aave-icon.svg'
import ArrowDownCircleIcon from 'src/assets/icons/arrow-down-circle.svg'
import CheckIcon from 'src/assets/icons/check-circle.svg'
import DaiIcon from 'src/assets/icons/dai-icon.svg'
import EthIcon from 'src/assets/icons/eth-icon.svg'
import EthLightIcon from 'src/assets/icons/eth-light-icon.svg'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TextButton } from 'src/components/buttons/TextButton'
import OverlayIcon from 'src/components/icons/OverlayIcon'
import { Box, Flex } from 'src/components/layout'
import {
  NotificationContent,
  NotificationContentProps,
} from 'src/features/notifications/NotificationToast'
import { promptPushPermission } from 'src/features/notifications/Onesignal'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { OnboardingEntryPoint } from 'src/features/onboarding/utils'
import { ElementName } from 'src/features/telemetry/constants'
import { useIsBiometricAuthEnabled } from 'src/features/wallet/hooks'
import { OnboardingScreens } from 'src/screens/Screens'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.Notifications>

export function NotificationsSetupScreen({ navigation, route: { params } }: Props) {
  const { t } = useTranslation()
  const isBiometricAuthEnabled = useIsBiometricAuthEnabled()

  const onPressNext = () => {
    navigateToNextScreen()
  }

  const onPressEnableNotifications = () => {
    promptPushPermission(() => {
      navigateToNextScreen()
    })
  }

  const navigateToNextScreen = () => {
    if (isBiometricAuthEnabled || params?.entryPoint === OnboardingEntryPoint.Sidebar) {
      navigation.navigate({ name: OnboardingScreens.Outro, params, merge: true })
    } else {
      navigation.navigate({ name: OnboardingScreens.Security, params, merge: true })
    }
  }

  return (
    <OnboardingScreen
      subtitle={t('Receive transaction status updates when you:')}
      title={t('Turn on push notifications')}>
      <Flex grow justifyContent="space-between">
        <SampleNotifications />
        <Flex alignItems="center" gap="xl" justifyContent="flex-end" width={'100%'}>
          <PrimaryButton
            alignSelf="stretch"
            label={t('Turn on notifications')}
            name={ElementName.Enable}
            testID={ElementName.Enable}
            variant="onboard"
            onPress={onPressEnableNotifications}
          />
          <TextButton
            name={ElementName.Skip}
            testID={ElementName.Skip}
            textColor="textPrimary"
            textVariant="mediumLabel"
            onPress={onPressNext}>
            {t('Maybe later')}
          </TextButton>
        </Flex>
      </Flex>
    </OnboardingScreen>
  )
}

function SampleNotifications() {
  const { t } = useTranslation()

  const sampleNotifications: NotificationContentProps[] = useMemo(
    () => [
      {
        title: t('Send or receive tokens or NFTs'),
        icon: <OverlayIcon icon={<EthIcon />} offset={6} overlay={<ArrowDownCircleIcon />} />,
      },
      {
        title: t('Swap tokens'),
        icon: <OverlayIcon icon={<DaiIcon />} offset={4} overlay={<EthLightIcon height={16} />} />,
      },
      {
        title: t('Approve tokens for use with apps'),
        icon: <OverlayIcon icon={<AaveIcon />} offset={6} overlay={<CheckIcon />} />,
      },
    ],
    [t]
  )

  return (
    <Flex gap="md">
      {sampleNotifications.map((value, i) => (
        <Box key={i} backgroundColor="backgroundSurface" borderRadius="lg" padding="sm">
          <NotificationContent key={i} icon={value.icon} title={value.title} />
        </Box>
      ))}
    </Flex>
  )
}
