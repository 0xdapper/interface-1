import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, ListRenderItemInfo } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { useAppDispatch } from 'src/app/hooks'
import { Switch } from 'src/components/buttons/Switch'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Box } from 'src/components/layout/Box'
import { Flex } from 'src/components/layout/Flex'
import { Screen } from 'src/components/layout/Screen'
import { BiometricAuthWarningModal } from 'src/components/Settings/BiometricAuthWarningModal'
import { Text } from 'src/components/Text'
import {
  useBiometricAppSettings,
  useBiometricPrompt,
  useDeviceSupportsBiometricAuth,
  useOsBiometricAuthEnabled,
} from 'src/features/biometrics/hooks'
import {
  BiometricSettingType,
  setRequiredForAppAccess,
  setRequiredForTransactions,
} from 'src/features/biometrics/slice'
import { openSettings } from 'src/utils/linking'

interface BiometricAuthSetting {
  onValueChange: (newValue: boolean) => void
  value: boolean
  text: string
  subText: string
}

export function SettingsBiometricAuthScreen() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const [showUnsafeWarningModal, setShowUnsafeWarningModal] = useState(false)
  const [unsafeWarningModalType, setUnsafeWarningModalType] = useState<BiometricSettingType | null>(
    null
  )
  const onCloseModal = useCallback(() => setShowUnsafeWarningModal(false), [])

  const osBiometricAuthEnabled = useOsBiometricAuthEnabled()
  const { touchId } = useDeviceSupportsBiometricAuth()
  const authenticationTypeName = touchId ? 'Touch' : 'Face'

  const { requiredForAppAccess, requiredForTransactions } = useBiometricAppSettings()
  const { trigger } = useBiometricPrompt(({ biometricAppSettingType, newValue }) => {
    switch (biometricAppSettingType) {
      case BiometricSettingType.RequiredForAppAccess:
        dispatch(setRequiredForAppAccess(newValue))
        break
      case BiometricSettingType.RequiredForTransactions:
        dispatch(setRequiredForTransactions(newValue))
        break
    }
  })

  const options: BiometricAuthSetting[] = useMemo((): BiometricAuthSetting[] => {
    const handleFaceIdTurnedOff = () => {
      Alert.alert(
        t(
          '{{authenticationTypeName}} ID is currently turned off for Uniswap Wallet—you can turn it on in your system settings.',
          { authenticationTypeName }
        ),
        '',
        [
          { text: t('Settings'), onPress: openSettings },
          {
            text: t('Cancel'),
          },
        ]
      )
    }

    return [
      {
        onValueChange: (newRequiredForAppAccessValue) => {
          if (!newRequiredForAppAccessValue && !requiredForTransactions) {
            setShowUnsafeWarningModal(true)
            setUnsafeWarningModalType(BiometricSettingType.RequiredForAppAccess)
            return
          }
          osBiometricAuthEnabled
            ? trigger({
                biometricAppSettingType: BiometricSettingType.RequiredForAppAccess,
                newValue: newRequiredForAppAccessValue,
              })
            : handleFaceIdTurnedOff()
        },
        value: requiredForAppAccess,
        text: t('App access'),
        subText: t('Require {{authenticationTypeName}} ID to open app', { authenticationTypeName }),
      },
      {
        onValueChange: (newRequiredForTransactionsValue) => {
          if (!newRequiredForTransactionsValue && !requiredForAppAccess) {
            setShowUnsafeWarningModal(true)
            setUnsafeWarningModalType(BiometricSettingType.RequiredForTransactions)
            return
          }
          osBiometricAuthEnabled
            ? trigger({
                biometricAppSettingType: BiometricSettingType.RequiredForTransactions,
                newValue: newRequiredForTransactionsValue,
              })
            : handleFaceIdTurnedOff()
        },
        value: requiredForTransactions,
        text: t('Transactions'),
        subText: t('Require {{authenticationTypeName}} ID to transact', { authenticationTypeName }),
      },
    ]
  }, [
    requiredForAppAccess,
    t,
    authenticationTypeName,
    requiredForTransactions,
    osBiometricAuthEnabled,
    trigger,
  ])

  const renderItem = ({
    item: { text, subText, value, onValueChange },
  }: ListRenderItemInfo<BiometricAuthSetting>) => {
    return (
      <Box alignItems="center" flexDirection="row" justifyContent="space-between">
        <Flex row>
          <Flex gap="none">
            <Text variant="bodyLarge">{text}</Text>
            <Text color="textSecondary" variant="bodyMicro">
              {subText}
            </Text>
          </Flex>
        </Flex>
        <TouchableArea
          activeOpacity={1}
          onPress={() => {
            onValueChange(!value)
          }}>
          <Switch pointerEvents="none" value={value} onValueChange={onValueChange} />
        </TouchableArea>
      </Box>
    )
  }

  return (
    <>
      {showUnsafeWarningModal && (
        <BiometricAuthWarningModal
          isTouchIdDevice={touchId}
          onClose={onCloseModal}
          onConfirm={() => {
            trigger({
              biometricAppSettingType: unsafeWarningModalType,
              // flip the bit
              newValue: !(unsafeWarningModalType === BiometricSettingType.RequiredForAppAccess
                ? requiredForAppAccess
                : requiredForTransactions),
            })
            setShowUnsafeWarningModal(false)
            setUnsafeWarningModalType(null)
          }}
        />
      )}
      <Screen>
        <BackHeader alignment="center" mx="md" pt="md">
          <Text variant="bodyLarge">
            {t('{{authenticationTypeName}} ID', { authenticationTypeName })}
          </Text>
        </BackHeader>
        <Box p="lg">
          <FlatList
            ItemSeparatorComponent={() => <Box bg="backgroundOutline" height={1} my="md" />}
            data={options}
            renderItem={renderItem}
            scrollEnabled={false}
          />
        </Box>
      </Screen>
    </>
  )
}
