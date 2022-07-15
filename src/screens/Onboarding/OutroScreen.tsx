import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import QRCode from 'react-native-qrcode-svg'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Box, Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { ElementName } from 'src/features/telemetry/constants'
import { useActiveAccount } from 'src/features/wallet/hooks'
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'src/features/wallet/pendingAcccountsSaga'
import { setFinishedOnboarding } from 'src/features/wallet/walletSlice'
import { OnboardingScreens } from 'src/screens/Screens'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.SelectColor>

export function OutroScreen({}: Props) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const theme = useAppTheme()

  const activeAddress = useActiveAccount()?.address

  const onPressNext = () => {
    // Remove pending flag from all new accounts.
    dispatch(pendingAccountActions.trigger(PendingAccountActions.ACTIVATE))
    dispatch(setFinishedOnboarding({ finishedOnboarding: true }))
  }

  return (
    <Screen>
      <Flex grow justifyContent="space-between" px="md" py="lg">
        <Flex centered grow gap="xl" mb="sm">
          <Box borderColor="accentAction" borderRadius="lg" borderWidth={2} padding="lg">
            <QRCode
              backgroundColor={theme.colors.backgroundSurface}
              color={theme.colors.accentAction}
              size={190}
              value={activeAddress ?? ''}
            />
          </Box>
          <Flex centered gap="sm">
            <Text variant="headlineSmall">{t("You're ready to go!")}</Text>
            <Text color="textSecondary" textAlign="center" variant="body">
              {t(
                'Transfer tokens to your wallet to make a swap or add assets to your watchlist to save them for later.'
              )}
            </Text>
          </Flex>
        </Flex>
        <PrimaryButton
          label={t('Next')}
          name={ElementName.Next}
          testID={ElementName.Next}
          variant="onboard"
          onPress={onPressNext}
        />
      </Flex>
    </Screen>
  )
}
