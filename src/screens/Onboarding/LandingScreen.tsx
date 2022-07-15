import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, View } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { UNISWAP_SPLASH_LOGO } from 'src/assets'
import { Button } from 'src/components/buttons/Button'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TextButton } from 'src/components/buttons/TextButton'
import { DevelopmentOnly } from 'src/components/DevelopmentOnly/DevelopmentOnly'
import { RainbowLinearGradientStops } from 'src/components/gradients'
import { LinearGradientBox } from 'src/components/gradients/LinearGradient'
import { Box, Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { ImportType } from 'src/features/onboarding/utils'
import { ElementName } from 'src/features/telemetry/constants'
import { createAccountActions } from 'src/features/wallet/createAccountSaga'
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'src/features/wallet/pendingAcccountsSaga'
import { setFinishedOnboarding } from 'src/features/wallet/walletSlice'
import { OnboardingScreens } from 'src/screens/Screens'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.Landing>

export function LandingScreen({ navigation }: Props) {
  const dispatch = useAppDispatch()

  const { t } = useTranslation()

  const onPressCreateWallet = () => {
    // Clear any existing pending accounts first.
    dispatch(pendingAccountActions.trigger(PendingAccountActions.DELETE))
    dispatch(createAccountActions.trigger(0))
    navigation.navigate({
      name: OnboardingScreens.EditName,
      params: { importType: ImportType.Create },
      merge: true,
    })
  }
  const onPressImportWallet = () => {
    dispatch(pendingAccountActions.trigger(PendingAccountActions.DELETE))
    navigation.navigate(OnboardingScreens.ImportMethod)
  }

  // Explore is no longer in spec. Keeping for dev purposes.
  const onPressExplore = () => {
    dispatch(pendingAccountActions.trigger(PendingAccountActions.DELETE))
    dispatch(createAccountActions.trigger(0))
    dispatch(pendingAccountActions.trigger(PendingAccountActions.ACTIVATE))
    dispatch(setFinishedOnboarding({ finishedOnboarding: true }))
  }

  return (
    <Screen edges={['bottom']}>
      <Box flex={1} justifyContent="flex-end">
        <Box alignItems="center" flex={1} justifyContent="center">
          <Box>
            <LinearGradientBox radius="xl" stops={RainbowLinearGradientStops}>
              <View style={styles.padded}>
                <Box bg="backgroundBackdrop" borderRadius="xl">
                  <Image source={UNISWAP_SPLASH_LOGO} />
                </Box>
              </View>
            </LinearGradientBox>
          </Box>
        </Box>
        <Flex centered gap="lg" mx="md" my="sm">
          <PrimaryButton
            flexGrow={1}
            label={t('Create a wallet')}
            name={ElementName.OnboardingCreateWallet}
            testID={ElementName.OnboardingCreateWallet}
            variant="onboard"
            width="100%"
            onPress={onPressCreateWallet}
          />
          <TextButton
            name={ElementName.OnboardingImportWallet}
            testID={ElementName.OnboardingImportWallet}
            onPress={onPressImportWallet}>
            <Text color="textPrimary" variant="mediumLabel">
              {t('I Already Have a Wallet')}
            </Text>
          </TextButton>
          <DevelopmentOnly>
            <Button
              flexDirection="row"
              justifyContent="center"
              name={ElementName.OnboardingExplore}
              pt="sm"
              testID={ElementName.OnboardingExplore}
              onPress={onPressExplore}>
              <Text variant="caption">{t('Not ready? Try')}</Text>
              <Text color="accentAction" variant="caption">
                {' '}
                {t('Exploring')}{' '}
              </Text>
              <Text variant="caption">{t('first.')}</Text>
            </Button>
          </DevelopmentOnly>
        </Flex>
      </Box>
    </Screen>
  )
}

const styles = StyleSheet.create({
  padded: { padding: 1 },
})
