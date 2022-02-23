import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useTheme } from '@shopify/restyle'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppStackParamList } from 'src/app/navigation/types'
import Clock from 'src/assets/icons/clock.svg'
import QrCode from 'src/assets/icons/qr-code.svg'
import Settings from 'src/assets/icons/settings.svg'
import { AccountCardList } from 'src/components/AccountCardList/AccountCardList'
import { AccountHeader } from 'src/components/accounts/AccountHeader'
import { Button } from 'src/components/buttons/Button'
import { GradientBackground } from 'src/components/gradients/GradientBackground'
import { PrimaryToSecondaryLinear } from 'src/components/gradients/PinkToBlueLinear'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { WalletQRCode } from 'src/components/modals/WalletQRCode'
import { Text } from 'src/components/Text'
import { TokenBalanceList } from 'src/components/TokenBalanceList/TokenBalanceList'
import { useAllBalancesByChainId } from 'src/features/balances/hooks'
import { TotalBalance } from 'src/features/balances/TotalBalance'
import { useActiveChainIds } from 'src/features/chains/utils'
import { isEnabled } from 'src/features/remoteConfig'
import { TestConfig } from 'src/features/remoteConfig/testConfigs'
import { ElementName } from 'src/features/telemetry/constants'
import { useAllTokens } from 'src/features/tokens/useTokens'
import { TransactionStatusBanner } from 'src/features/transactions/TransactionStatusBanner'
import { useTestAccount } from 'src/features/wallet/accounts/useTestAccount'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'
import { Theme } from 'src/styles/theme'
import { sleep } from 'src/utils/timing'

type Props = NativeStackScreenProps<AppStackParamList, Screens.TabNavigator>

export function HomeScreen({ navigation }: Props) {
  // imports test account for easy development/testing
  useTestAccount()

  const { t } = useTranslation()
  const theme = useTheme<Theme>()

  const activeAccount = useActiveAccount()
  const currentChains = useActiveChainIds()
  const chainIdToTokens = useAllTokens()
  const { balances, loading } = useAllBalancesByChainId(
    currentChains,
    chainIdToTokens,
    activeAccount?.address
  )
  const [refreshing, setRefreshing] = useState(false)
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    // TODO: this is a callback to give illusion of refreshing, in future we can spin until the next block number has updated
    sleep(300).then(() => setRefreshing(false))
  }, [])

  const [showQRModal, setShowQRModal] = useState(false)
  const onPressQRCode = () => setShowQRModal(true)
  const onCloseQrCode = () => setShowQRModal(false)

  const onPressSend = () => {
    navigation.navigate(Screens.Transfer)
  }

  const onPressNotifications = () => navigation.navigate(Screens.Notifications)

  const onPressToken = (currencyAmount: CurrencyAmount<Currency>) =>
    navigation.navigate(Screens.TokenDetails, { currency: currencyAmount.currency })

  const onPressSettings = () =>
    navigation.navigate(Screens.SettingsStack, { screen: Screens.Settings })

  if (!activeAccount)
    return (
      <Screen>
        <Box mx="md" my="sm">
          <AccountHeader />
        </Box>
      </Screen>
    )

  return (
    <Screen edges={['top', 'left', 'right']}>
      <GradientBackground height="50%">
        <PrimaryToSecondaryLinear />
      </GradientBackground>
      <Flex gap="md" mt="lg" mx="lg">
        <Box alignItems="center" flexDirection="row" justifyContent="space-between">
          <AccountHeader />
          <Flex flexDirection="row">
            <Button name={ElementName.Settings} onPress={onPressSettings}>
              <Settings height={24} stroke="gray100" width={24} />
            </Button>
            <Button name={ElementName.Notifications} onPress={onPressNotifications}>
              <Clock height={24} stroke="gray100" width={24} />
            </Button>
          </Flex>
        </Box>
        <TransactionStatusBanner />
        {isEnabled(TestConfig.SwipeableAccounts) ? (
          <AccountCardList
            balances={balances}
            onPressQRCode={onPressQRCode}
            onPressSend={onPressSend}
          />
        ) : (
          <Flex gap="xs">
            <Text color="gray600" variant="bodySm">
              {t('Total Balance')}
            </Text>
            <Flex alignItems="flex-start" flexDirection="row" gap="sm">
              <Flex flexGrow={1} gap="xxs">
                <TotalBalance balances={balances} />
              </Flex>
              <Button
                backgroundColor="mainBackground"
                name={ElementName.QRCodeModalToggle}
                padding="md"
                style={buttonStyle}
                onPress={onPressQRCode}>
                <QrCode height={16} stroke={theme.colors.textColor} width={16} />
              </Button>
            </Flex>
          </Flex>
        )}
        <WalletQRCode isVisible={showQRModal} onClose={onCloseQrCode} />
      </Flex>
      <Box bg="mainBackground" flex={1}>
        <TokenBalanceList
          balances={balances}
          loading={loading}
          refreshing={refreshing}
          onPressToken={onPressToken}
          onRefresh={onRefresh}
        />
      </Box>
    </Screen>
  )
}

const buttonStyle = { borderRadius: 16 }
