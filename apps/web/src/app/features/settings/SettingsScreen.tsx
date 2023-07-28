import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AccountRowItem } from 'src/app/features/accounts/AccountRowItem'
import { BackButtonHeader } from 'src/app/features/settings/BackButtonHeader'
import { SettingsRoutes } from 'src/app/navigation/constants'
import { useExtensionNavigation } from 'src/app/navigation/utils'
import { useAppDispatch, useAppSelector } from 'src/background/store'
import { Icons, ListItem, ScrollView, Text, YGroup, YStack } from 'ui/src'
import { Button } from 'ui/src/components/button/Button'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { authActions } from 'wallet/src/features/auth/saga'
import { AuthActionType } from 'wallet/src/features/auth/types'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { selectAllAccountsSorted } from 'wallet/src/features/wallet/selectors'

const DEFAULT_ACCOUNTS_TO_DISPLAY = 3

export function SettingsScreen(): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { navigateTo } = useExtensionNavigation()

  const allAccountsSorted: Account[] = useAppSelector(selectAllAccountsSorted)

  // TODO: Add better dynamic logic for showing the show all button based on height once Tamagui supports ref.height
  const showAllWalletsButton = allAccountsSorted.length > DEFAULT_ACCOUNTS_TO_DISPLAY
  const [showAll, setShowAll] = useState(false)

  const onPressLockWallet = async (): Promise<void> => {
    await dispatch(authActions.trigger({ type: AuthActionType.Lock }))
  }

  return (
    <YStack backgroundColor="$background0" flex={1}>
      <BackButtonHeader headerText={t('Settings')} />
      <ScrollView padding="$spacing12" showsVerticalScrollIndicator={false}>
        <Text color="$textSecondary" variant="subheadSmall">
          {t('Wallet settings')}
        </Text>
        {allAccountsSorted
          .slice(0, showAll ? allAccountsSorted.length : DEFAULT_ACCOUNTS_TO_DISPLAY)
          .map((account: Account) => (
            <AccountRowItem
              key={account.address}
              address={account.address}
              onPress={(): void => navigateTo(`${SettingsRoutes.Wallet}/${account.address}`)}
            />
          ))}
        {showAllWalletsButton ? (
          <Button
            borderRadius="$roundedFull"
            padding="$spacing4"
            onPress={(): void => setShowAll(!showAll)}>
            {showAll
              ? t('Hide wallets')
              : // TODO(EXT-178): add back t() wrapper and figure out why {{}} is not working
                `Show all ${allAccountsSorted.length} wallets`}
          </Button>
        ) : null}
        <YGroup>
          <YGroup.Item>
            <ListItem
              hoverTheme
              flexShrink={1}
              iconAfter={
                <Icons.FileListLock
                  color="$textSecondary"
                  height={iconSizes.icon20}
                  width={iconSizes.icon20}
                />
              }
              padding="$none"
              size={48}
              title={<Text variant="subheadSmall">{t('View recovery phrase')}</Text>}
              onPress={(): void => navigateTo(SettingsRoutes.ViewRecoveryPhrase.valueOf())}
            />
          </YGroup.Item>
          <YGroup.Item>
            <ListItem
              hoverTheme
              flexShrink={1}
              iconAfter={
                <Icons.HelpCenter
                  color="$textSecondary"
                  height={iconSizes.icon20}
                  width={iconSizes.icon20}
                />
              }
              padding="$none"
              size={48}
              title={<Text variant="subheadSmall">{t('Help center')}</Text>}
            />
          </YGroup.Item>
        </YGroup>
      </ScrollView>
      <Button icon={<Icons.Lock />} theme="secondary" onPress={onPressLockWallet}>
        {t('Lock Wallet')}
      </Button>
    </YStack>
  )
}
