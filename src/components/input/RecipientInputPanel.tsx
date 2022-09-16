import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Button } from 'src/components/buttons/Button'
import { Chevron } from 'src/components/icons/Chevron'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { ElementName } from 'src/features/telemetry/constants'
import { useAllTransactionsBetweenAddresses } from 'src/features/transactions/hooks'
import { useActiveAccountAddressWithThrow } from 'src/features/wallet/hooks'

interface RecipientInputPanelProps {
  recipientAddress: string
  onToggleShowRecipientSelector: () => void
}

/**
 * Panel displaying currently selected recipient metadata as well as a toggle
 * to open the recipient selector modal.
 */
export function RecipientInputPanel({
  recipientAddress,
  onToggleShowRecipientSelector,
}: RecipientInputPanelProps) {
  const theme = useAppTheme()

  return (
    <Flex centered gap="sm">
      <Button
        bg={recipientAddress ? 'none' : 'accentActive'}
        borderRadius="lg"
        name={ElementName.SelectRecipient}
        p="xs"
        px="sm"
        onPress={onToggleShowRecipientSelector}>
        <Flex gap="xxs">
          <Flex centered row gap="sm">
            <AddressDisplay address={recipientAddress} variant="headlineSmall" />
            <Chevron color={theme.colors.textPrimary} direction="e" />
          </Flex>
          {recipientAddress && <RecipientPrevTransfers recipient={recipientAddress} />}
        </Flex>
      </Button>
    </Flex>
  )
}

export function RecipientPrevTransfers({ recipient }: { recipient: string }) {
  const { t } = useTranslation()
  const activeAddress = useActiveAccountAddressWithThrow()
  const prevTxns = useAllTransactionsBetweenAddresses(activeAddress, recipient).length

  return (
    <Text color="textSecondary" textAlign="center" variant="caption">
      {t('{{ prevTxns }} previous transfers', { prevTxns })}
    </Text>
  )
}
