import React, { PropsWithChildren } from 'react'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
import InfoCircle from 'src/assets/icons/info-circle.svg'
import { Button } from 'src/components/buttons/Button'
import { Box } from 'src/components/layout/Box'
import { Flex } from 'src/components/layout/Flex'
import { Warning } from 'src/components/modals/types'
import { getAlertColor } from 'src/components/modals/WarningModal'
import { NetworkFee } from 'src/components/Network/NetworkFee'
import { Text } from 'src/components/Text'
import { AccountDetails } from 'src/components/WalletConnect/RequestModal/AccountDetails'
import { ChainId } from 'src/constants/chains'
import { useActiveAccountAddressWithThrow } from 'src/features/wallet/hooks'
import { Theme } from 'src/styles/theme'

const ALERT_ICONS_SIZE = 18

interface TransactionDetailsProps {
  chainId: ChainId | undefined
  gasFee: string | undefined
  showWarning?: boolean
  warning?: Warning
  onShowWarning?: () => void
}

export const TRANSACTION_DETAILS_SPACER: { color: keyof Theme['colors']; width: number } = {
  color: 'backgroundOutline',
  width: 0.5,
}

export function TransactionDetails({
  children,
  chainId,
  gasFee,
  showWarning,
  warning,
  onShowWarning,
}: PropsWithChildren<TransactionDetailsProps>) {
  const theme = useAppTheme()
  const userAddress = useActiveAccountAddressWithThrow()
  const warningColor = getAlertColor(warning?.severity)

  return (
    <Flex backgroundColor="backgroundContainer" borderRadius="lg" gap="none">
      {showWarning && warning && onShowWarning && (
        <Button onPress={onShowWarning}>
          <Flex
            row
            alignItems="center"
            backgroundColor={warningColor.background}
            borderTopEndRadius="lg"
            borderTopStartRadius="lg"
            flexGrow={1}
            gap="xs"
            p="sm">
            <AlertTriangle
              color={theme.colors[warningColor?.text]}
              height={ALERT_ICONS_SIZE}
              width={ALERT_ICONS_SIZE}
            />
            <Flex flexGrow={1}>
              <Text color={warningColor.text} variant="subheadSmall">
                {warning.title}
              </Text>
            </Flex>
            <InfoCircle
              color={theme.colors[warningColor.text]}
              height={ALERT_ICONS_SIZE}
              width={ALERT_ICONS_SIZE}
            />
          </Flex>
        </Button>
      )}
      {children}
      <NetworkFee chainId={chainId} gasFee={gasFee} />
      <Box
        borderTopColor={TRANSACTION_DETAILS_SPACER.color}
        borderTopWidth={TRANSACTION_DETAILS_SPACER.width}
        p="md">
        <AccountDetails address={userAddress} iconSize={24} />
      </Box>
    </Flex>
  )
}
