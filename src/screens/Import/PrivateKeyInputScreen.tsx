import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Flex } from 'src/components/layout'
import { GenericImportForm } from 'src/features/import/GenericImportForm'
import { importAccountActions } from 'src/features/import/importAccountSaga'
import { ImportAccountType } from 'src/features/import/types'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { ElementName } from 'src/features/telemetry/constants'
import { OnboardingScreens } from 'src/screens/Screens'
import { isValidPrivateKey } from 'src/utils/privateKeys'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.PrivateKeyInput>

export function PrivateKeyInputScreen({ navigation, route: { params } }: Props) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const [value, setValue] = useState<string | undefined>(undefined)
  const valid = isValidPrivateKey(value ?? '')
  const errorText = valid ? undefined : t('Invalid private key')

  const onSubmit = useCallback(() => {
    if (valid && value) {
      dispatch(
        importAccountActions.trigger({
          type: ImportAccountType.PrivateKey,
          privateKey: value,
        })
      )
      navigation.navigate({ name: OnboardingScreens.EditName, params, merge: true })
    }
  }, [dispatch, navigation, params, valid, value])

  const onChange = (text: string | undefined) => {
    setValue(text ? text.trim() : undefined)
  }

  return (
    <OnboardingScreen
      subtitle={t('Your private key will only be stored locally on your device.')}
      title={t('Enter your private key')}>
      <Flex pt="lg">
        <GenericImportForm
          error={errorText}
          placeholderLabel={t('private key')}
          showSuccess={valid}
          value={value}
          onChange={onChange}
          onSubmit={() => Keyboard.dismiss()}
        />
      </Flex>
      <PrimaryButton
        disabled={!valid}
        label={t('Next')}
        testID={ElementName.Submit}
        variant="onboard"
        onPress={onSubmit}
      />
    </OnboardingScreen>
  )
}
