import React from 'react'
import { useTranslation } from 'react-i18next'
import { TextButton } from 'src/components/buttons/TextButton'
import { Flex } from 'src/components/layout/Flex'
import { ToastIcon, ToastVariant } from 'src/components/notifications/Toast'
import { Text } from 'src/components/Text'
import { CHAIN_INFO } from 'src/constants/chains'
import { ElementName } from 'src/features/telemetry/constants'
import { getNotificationName } from 'src/features/transactions/TransactionStatusBanner'
import { TransactionDetails, TransactionStatus } from 'src/features/transactions/types'
import { shortenAddress } from 'src/utils/addresses'
import { openUri } from 'src/utils/linking'
import { trimToLength } from 'src/utils/string'

// TODO improve this when designs are finalized
export function TransactionSummaryCard({ tx }: { tx: TransactionDetails }) {
  const { t } = useTranslation()

  const onPressHash = () => {
    const explorerUrl = CHAIN_INFO[tx.chainId]?.explorer
    if (!explorerUrl) return
    openUri(`${explorerUrl}/tx/${tx.hash}`)
  }

  let toastVariant: ToastVariant
  if (tx.status === TransactionStatus.Success) {
    toastVariant = ToastVariant.Success
  } else if (tx.status === TransactionStatus.Failed) {
    toastVariant = ToastVariant.Failed
  } else {
    toastVariant = ToastVariant.Pending
  }

  const fromAddress = shortenAddress(tx.from)
  const chainName = CHAIN_INFO[tx.chainId]?.label ?? t('Unknown')

  return (
    <Flex
      alignItems="center"
      borderColor="gray200"
      borderRadius="lg"
      borderWidth={1}
      flexDirection="row"
      gap="md"
      justifyContent="space-between"
      p="md">
      <Flex gap="sm">
        <Text variant="body">{getNotificationName(tx, t)}</Text>
        <Text variant="bodySm">
          {t('From {{addr}} on {{chain}}', { addr: fromAddress, chain: chainName })}
        </Text>
        <TextButton
          name={ElementName.TransactionSummaryHash}
          textVariant="bodySm"
          onPress={onPressHash}>
          {t('Hash: {{hash}}', { hash: trimToLength(tx.hash, 10) })}
        </TextButton>
      </Flex>
      <ToastIcon variant={toastVariant} />
    </Flex>
  )
}
