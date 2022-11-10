import { useNetInfo } from '@react-native-community/netinfo'
import { providers } from 'ethers'
import React, { ComponentProps, PropsWithChildren, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleProp, ViewStyle } from 'react-native'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
import { Button, ButtonEmphasis, ButtonSize } from 'src/components/buttons/Button'
import { Box, Flex } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { NetworkFee } from 'src/components/Network/NetworkFee'
import { Text } from 'src/components/Text'
import { AccountDetails } from 'src/components/WalletConnect/RequestModal/AccountDetails'
import { ClientDetails, PermitInfo } from 'src/components/WalletConnect/RequestModal/ClientDetails'
import { useHasSufficientFunds } from 'src/components/WalletConnect/RequestModal/hooks'
import { RequestDetails } from 'src/components/WalletConnect/RequestModal/RequestDetails'
import { useTransactionGasFee } from 'src/features/gas/hooks'
import { GasSpeed } from 'src/features/gas/types'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { NativeCurrency } from 'src/features/tokenLists/NativeCurrency'
import { BlockedAddressWarning } from 'src/features/trm/BlockedAddressWarning'
import { useIsBlocked } from 'src/features/trm/hooks'
import { useSignerAccounts } from 'src/features/wallet/hooks'
import { signWcRequestActions } from 'src/features/walletConnect/saga'
import { EthMethod, isPrimaryTypePermit, PermitMessage } from 'src/features/walletConnect/types'
import { rejectRequest } from 'src/features/walletConnect/WalletConnect'
import {
  isTransactionRequest,
  SignRequest,
  TransactionRequest,
  WalletConnectRequest,
} from 'src/features/walletConnect/walletConnectSlice'
import { iconSizes } from 'src/styles/sizing'
import { toSupportedChainId } from 'src/utils/chainId'
import { buildCurrencyId } from 'src/utils/currencyId'
import { logger } from 'src/utils/logger'

const MAX_MODAL_MESSAGE_HEIGHT = 200

interface Props {
  isVisible: boolean
  onClose: () => void
  request: SignRequest | TransactionRequest
}

const isPotentiallyUnsafe = (request: WalletConnectRequest) =>
  request.type !== EthMethod.PersonalSign

const methodCostsGas = (request: WalletConnectRequest): request is TransactionRequest =>
  request.type === EthMethod.EthSendTransaction

/** If the request is a permit then parse the relevant information otherwise return undefined. */
const getPermitInfo = (request: WalletConnectRequest): PermitInfo | undefined => {
  if (request.type !== EthMethod.SignTypedDataV4) {
    return undefined
  }

  try {
    const message = JSON.parse(request.rawMessage)
    if (!isPrimaryTypePermit(message)) {
      return undefined
    }

    const { domain, message: permitPayload } = message as PermitMessage
    const currencyId = buildCurrencyId(domain.chainId, domain.verifyingContract)
    const amount = permitPayload.value

    return { currencyId, amount }
  } catch (e) {
    logger.info('WalletConnectRequestModal', 'getPermitInfo', 'invalid JSON message', e)
    return undefined
  }
}

const VALID_REQUEST_TYPES = [
  EthMethod.PersonalSign,
  EthMethod.SignTypedData,
  EthMethod.SignTypedDataV4,
  EthMethod.EthSign,
  EthMethod.EthSignTransaction,
  EthMethod.EthSendTransaction,
]

function SectionContainer({
  children,
  style,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return children ? (
    <Box p="md" style={style}>
      {children}
    </Box>
  ) : null
}

const spacerProps: ComponentProps<typeof Box> = {
  borderBottomColor: 'backgroundOutline',
  borderBottomWidth: 1,
}

export function WalletConnectRequestModal({ isVisible, onClose, request }: Props) {
  const theme = useAppTheme()
  const netInfo = useNetInfo()
  const chainId = toSupportedChainId(request.dapp.chain_id) ?? undefined

  const tx: providers.TransactionRequest | null = useMemo(() => {
    if (!chainId || !isTransactionRequest(request)) {
      return null
    }

    return { ...request.transaction, chainId }
  }, [chainId, request])

  const signerAccounts = useSignerAccounts()
  const signerAccount = signerAccounts.find((account) => account.address === request.account)
  const gasFeeInfo = useTransactionGasFee(tx, GasSpeed.Urgent)
  const hasSufficientFunds = useHasSufficientFunds({
    account: request.account,
    chainId,
    gasFeeInfo,
    value: isTransactionRequest(request) ? request.transaction.value : undefined,
  })

  const { isBlocked, isBlockedLoading } = useIsBlocked(request.account)

  const checkConfirmEnabled = () => {
    if (!netInfo.isInternetReachable) return false

    if (!signerAccount) return false

    if (isBlocked || isBlockedLoading) return false

    if (methodCostsGas(request)) return !!(tx && hasSufficientFunds && gasFeeInfo)

    if (isTransactionRequest(request)) return !!tx

    return true
  }

  const confirmEnabled = checkConfirmEnabled()

  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  /**
   * TODO: implement this behavior in a less janky way. Ideally if we can distinguish between `onClose` being called programmatically and `onClose` as a results of a user dismissing the modal then we can determine what this value should be without this class variable.
   * Indicates that the modal can reject the request when the modal happens. This will be false when the modal closes as a result of the user explicitly confirming or rejecting a request and true otherwise.
   */
  const rejectOnCloseRef = useRef(true)

  if (!VALID_REQUEST_TYPES.includes(request.type)) {
    return null
  }

  const onReject = () => {
    rejectRequest(request.internalId)
    rejectOnCloseRef.current = false
    onClose()
  }

  const onConfirm = async () => {
    if (!confirmEnabled || !signerAccount) return
    if (
      request.type === EthMethod.EthSignTransaction ||
      request.type === EthMethod.EthSendTransaction
    ) {
      if (!gasFeeInfo) return // appeasing typescript
      dispatch(
        signWcRequestActions.trigger({
          requestInternalId: request.internalId,
          method: request.type,
          transaction: { ...tx, ...gasFeeInfo.params },
          account: signerAccount,
          dapp: request.dapp,
        })
      )
    } else {
      dispatch(
        signWcRequestActions.trigger({
          requestInternalId: request.internalId,
          method: request.type,
          // @ts-ignore this is EthSignMessage type
          message: request.message || request.rawMessage,
          account: signerAccount,
          dapp: request.dapp,
        })
      )
    }

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

  const nativeCurrency = chainId && NativeCurrency.onChain(chainId)
  let permitInfo = getPermitInfo(request)

  return (
    <BottomSheetModal isVisible={isVisible} name={ModalName.WCSignRequest} onClose={handleClose}>
      <Flex gap="lg" paddingBottom="xxl" paddingHorizontal="md" paddingTop="xl">
        <ClientDetails permitInfo={permitInfo} request={request} />
        <Flex gap="sm">
          <Flex
            backgroundColor="background2"
            borderRadius="lg"
            gap="none"
            spacerProps={spacerProps}>
            {!permitInfo && (
              <SectionContainer style={requestMessageStyle}>
                <Flex gap="sm">
                  <RequestDetails request={request} />
                </Flex>
              </SectionContainer>
            )}

            {methodCostsGas(request) && chainId && (
              <NetworkFee chainId={chainId} gasFee={gasFeeInfo?.gasFee} />
            )}

            {signerAccounts.length > 1 && (
              <SectionContainer>
                <AccountDetails address={request.account} />
                {!hasSufficientFunds && (
                  <Text color="accentWarning" paddingTop="xs" variant="bodySmall">
                    {t("You don't have enough {{symbol}} to complete this transaction.", {
                      symbol: nativeCurrency?.symbol,
                    })}
                  </Text>
                )}
              </SectionContainer>
            )}
          </Flex>
          {!netInfo.isInternetReachable ? (
            <BaseCard.InlineErrorState
              backgroundColor="accentWarningSoft"
              icon={
                <AlertTriangle
                  color={theme.colors.accentWarning}
                  height={theme.iconSizes.sm}
                  width={theme.iconSizes.sm}
                />
              }
              textColor="accentWarning"
              title={t('Internet or network connection error')}
            />
          ) : (
            <WarningSection
              isBlockedAddress={isBlocked}
              request={request}
              showUnsafeWarning={isPotentiallyUnsafe(request)}
            />
          )}
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
              disabled={!confirmEnabled}
              emphasis={ButtonEmphasis.Primary}
              label={isTransactionRequest(request) ? t('Accept') : t('Sign')}
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

function WarningSection({
  request,
  showUnsafeWarning,
  isBlockedAddress,
}: {
  request: WalletConnectRequest
  showUnsafeWarning: boolean
  isBlockedAddress: boolean
}) {
  const theme = useAppTheme()
  const { t } = useTranslation()

  if (!showUnsafeWarning && !isBlockedAddress) return null

  if (isBlockedAddress) {
    return <BlockedAddressWarning centered row alignSelf="center" />
  }

  return (
    <Flex centered row alignSelf="center" gap="xs">
      <AlertTriangle
        color={theme.colors.accentWarning}
        height={iconSizes.sm}
        width={iconSizes.sm}
      />
      <Text color="textSecondary" fontStyle="italic" variant="bodyMicro">
        {t('Be careful: this {{ requestType }} authorizes assets', {
          requestType: isTransactionRequest(request) ? 'transaction' : 'message',
        })}
      </Text>
    </Flex>
  )
}

const requestMessageStyle: StyleProp<ViewStyle> = {
  // need a fixed height here or else modal gets confused about total height
  maxHeight: MAX_MODAL_MESSAGE_HEIGHT,
  overflow: 'hidden',
}
