import React, { ComponentProps, useRef } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Button, ButtonEmphasis, ButtonSize } from 'src/components/buttons/Button'
import { LinkButton } from 'src/components/buttons/LinkButton'
import { Box, Flex } from 'src/components/layout'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { InlineNetworkPill } from 'src/components/Network/NetworkPill'
import { Text } from 'src/components/Text'
import { AccountDetails } from 'src/components/WalletConnect/RequestModal/AccountDetails'
import { HeaderIcon } from 'src/components/WalletConnect/RequestModal/HeaderIcon'
import { CHAIN_INFO } from 'src/constants/chains'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { confirmSwitchChainRequest, rejectRequest } from 'src/features/walletConnect/WalletConnect'
import { SwitchChainRequest } from 'src/features/walletConnect/walletConnectSlice'
import { toSupportedChainId } from 'src/utils/chainId'

interface Props {
  isVisible: boolean
  onClose: () => void
  request: SwitchChainRequest
}

const spacerProps: ComponentProps<typeof Box> = {
  borderBottomColor: 'backgroundOutline',
  borderBottomWidth: 1,
}

export function WalletConnectSwitchChainModal({ isVisible, onClose, request }: Props) {
  const { t } = useTranslation()

  /**
   * TODO: implement this behavior in a less janky way. Ideally if we can distinguish between `onClose` being called programmatically and `onClose` as a results of a user dismissing the modal then we can determine what this value should be without this class variable.
   * Indicates that the modal can reject the request when the modal happens. This will be false when the modal closes as a result of the user explicitly confirming or rejecting a request and true otherwise.
   */
  const rejectOnCloseRef = useRef(true)

  const newChainId = toSupportedChainId(request.newChainId)
  // newChainId should always be non-null because we reject switching to unsupported chains in the WC switch chain handler
  if (!newChainId) return null

  const newChainName = CHAIN_INFO[newChainId].label
  const { dapp } = request

  const onReject = () => {
    rejectRequest(request.internalId)
    rejectOnCloseRef.current = false
    onClose()
  }

  const onConfirm = async () => {
    confirmSwitchChainRequest(request.internalId)
    rejectOnCloseRef.current = false
    onClose()
  }

  const handleClose = () => {
    if (rejectOnCloseRef.current) {
      onReject()
    } else {
      onClose()
    }
  }

  return (
    <BottomSheetModal
      isVisible={isVisible}
      name={ModalName.WCSwitchChainRequest}
      onClose={handleClose}>
      <Flex gap="lg" paddingBottom="xxl" paddingHorizontal="md" paddingTop="xl">
        <Flex alignItems="center" gap="md">
          <HeaderIcon showChain dapp={{ ...dapp, chain_id: newChainId }} />
          <Text textAlign="center" variant="headlineSmall">
            <Trans t={t}>
              <Text fontWeight="bold">{{ dapp: dapp.name }}</Text> wants to connect to the{' '}
              {newChainName} network
            </Trans>
          </Text>
          <LinkButton
            backgroundColor="accentActiveSoft"
            borderRadius="sm"
            color="accentActive"
            label={dapp.url}
            p="xs"
            textVariant="buttonLabelMicro"
            url={dapp.url}
          />
        </Flex>
        <Flex gap="sm">
          <Flex
            backgroundColor="background2"
            borderRadius="lg"
            gap="none"
            spacerProps={spacerProps}>
            <Flex row alignItems="center" justifyContent="space-between" p="md">
              <Text variant="subheadSmall">{t('Network')}</Text>
              <InlineNetworkPill chainId={newChainId} />
            </Flex>
            <Box p="md">
              <AccountDetails address={request.account} />
            </Box>
          </Flex>
          <Flex row gap="sm">
            <Button
              fill
              emphasis={ButtonEmphasis.Tertiary}
              label={t('Cancel')}
              name={ElementName.Cancel}
              size={ButtonSize.Medium}
              onPress={onReject}
            />
            <Button
              fill
              emphasis={ButtonEmphasis.Primary}
              label={t('Connect')}
              name={ElementName.Confirm}
              size={ButtonSize.Medium}
              onPress={onConfirm}
            />
          </Flex>
        </Flex>
      </Flex>
    </BottomSheetModal>
  )
}
