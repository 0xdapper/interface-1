import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { SettingsStackParamList } from 'src/app/navigation/types'
import Checkmark from 'src/assets/icons/check.svg'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Flex } from 'src/components/layout'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Screen } from 'src/components/layout/Screen'
import WarningModal from 'src/components/modals/WarningModal'
import { Text } from 'src/components/Text'
import { useBiometricAppSettings, useBiometricPrompt } from 'src/features/biometrics/hooks'
import { deleteICloudMnemonicBackup } from 'src/features/CloudBackup/RNICloudBackupsManager'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { AccountType, BackupType, NativeAccount } from 'src/features/wallet/accounts/types'
import { EditAccountAction, editAccountActions } from 'src/features/wallet/editAccountSaga'
import { useAccounts } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'

type Props = NativeStackScreenProps<SettingsStackParamList, Screens.SettingsCloudBackupStatus>

export function SettingsCloudBackupStatus({
  navigation,
  route: {
    params: { address },
  },
}: Props) {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const dispatch = useAppDispatch()
  const accounts = useAccounts()

  const mnemonicId = (accounts[address] as NativeAccount)?.mnemonicId
  const associatedAccounts = Object.values(accounts).filter(
    (a) => a.type === AccountType.Native && a.mnemonicId === mnemonicId
  )

  const [showBackupDeleteWarning, setShowBackupDeleteWarning] = useState(false)
  const onConfirmDeleteBackup = () => {
    if (requiredForTransactions) {
      biometricTrigger()
    } else {
      deleteBackup()
    }
  }

  const deleteBackup = async () => {
    try {
      await deleteICloudMnemonicBackup(mnemonicId)
      dispatch(
        editAccountActions.trigger({
          type: EditAccountAction.RemoveBackupMethod,
          address: address,
          backupMethod: BackupType.Cloud,
        })
      )
      navigation.navigate(Screens.SettingsWallet, { address })
    } catch (error) {
      const err = error as Error
      Alert.alert(t('iCloud error'), err.message, [
        {
          text: t('OK'),
          style: 'default',
        },
      ])
    }

    setShowBackupDeleteWarning(false)
  }

  const { requiredForTransactions } = useBiometricAppSettings()
  const { trigger: biometricTrigger, modal: BiometricModal } = useBiometricPrompt(deleteBackup)

  return (
    <Screen mt="lg" mx="lg">
      <BackHeader alignment="left" mb="md">
        <Text variant="subhead">{t('iCloud backup')}</Text>
      </BackHeader>

      <Flex grow alignItems="stretch" justifyContent="space-evenly" mt="md">
        <Flex grow gap="lg" justifyContent="flex-start">
          <Text variant="bodySmall">
            {t(
              'By having your recovery phrase backed up to iCloud, you can recover your wallet just by being logged into your iCloud on any device.'
            )}
          </Text>
          <Flex row justifyContent="space-between">
            <Text variant="subhead">{t('Recovery phrase')}</Text>
            <Flex row alignItems="center" gap="sm" justifyContent="space-around">
              <Text color="textSecondary" variant="caption">
                {t('Backed up')}
              </Text>

              {/* @TODO: Add non-backed up state once we have more options on this page  */}
              <Checkmark color={theme.colors.accentSuccess} height={24} width={24} />
            </Flex>
          </Flex>
        </Flex>
        <Flex justifyContent="center">
          <PrimaryButton
            alignSelf="stretch"
            borderRadius="md"
            label={t('Delete iCloud backup')}
            name={ElementName.Remove}
            textVariant="largeLabel"
            variant="failure"
            onPress={() => {
              setShowBackupDeleteWarning(true)
            }}
          />
        </Flex>
      </Flex>

      <WarningModal
        caption={t(
          'If you delete your iCloud backup, you’ll only be able to recover your wallet with a manual backup of your recovery phrase. Uniswap Labs can’t recover your assets if you lose your recovery phrase.'
        )}
        closeText={t('Cancel')}
        confirmText={t('Delete')}
        isVisible={showBackupDeleteWarning}
        modalName={ModalName.ViewSeedPhraseWarning}
        title={t('Are you sure?')}
        onClose={() => {
          setShowBackupDeleteWarning(false)
        }}
        onConfirm={onConfirmDeleteBackup}>
        {associatedAccounts.length > 1 && (
          <Flex>
            <Text textAlign="left" variant="subheadSmall">
              {t(
                'Because these wallets share a recovery phrase, it will also delete the backups for:'
              )}
            </Text>
            <Flex>
              {associatedAccounts.map((account) => (
                <AddressDisplay
                  showAddressAsSubtitle
                  address={account.address}
                  size={36}
                  variant="subhead"
                  verticalGap="none"
                />
              ))}
            </Flex>
          </Flex>
        )}
      </WarningModal>
      {BiometricModal}
    </Screen>
  )
}
