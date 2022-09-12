import { default as React, ReactElement, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { Button, ButtonProps } from 'src/components/buttons/Button'
import { Flex } from 'src/components/layout/Flex'
import { SpinningLoader } from 'src/components/loading/SpinningLoader'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { InlineNetworkPill } from 'src/components/Network/NetworkPill'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { ModalName } from 'src/features/telemetry/constants'
import { useLowestPendingNonce } from 'src/features/transactions/hooks'
import { cancelTransaction } from 'src/features/transactions/slice'
import AlertBanner, { FailedCancelBadge } from 'src/features/transactions/SummaryCards/AlertBanner'
import { CancelConfirmationView } from 'src/features/transactions/SummaryCards/CancelConfirmationView'
import TransactionActionsModal from 'src/features/transactions/SummaryCards/TransactionActionsModal'
import { TransactionDetails, TransactionStatus } from 'src/features/transactions/types'
import { openTransactionLink } from 'src/utils/linking'

export const TXN_HISTORY_ICON_SIZE = 24
const LOADING_SPINNER_SIZE = 20

function TransactionSummaryLayout({
  transaction,
  title,
  caption,
  endAdornment,
  icon,
  readonly,
  showInlineWarning,
  bg,
  ...rest
}: {
  transaction: TransactionDetails
  title: string
  caption: string | undefined
  readonly: boolean
  endAdornment?: ReactElement
  icon?: ReactElement
  showInlineWarning?: boolean // Show warning inline and not as header banner.
} & ButtonProps) {
  const { t } = useTranslation()

  const [showActionsModal, setShowActionsModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const dispatch = useAppDispatch()

  const { status, addedTime, hash, chainId } = transaction

  const canceled = status === TransactionStatus.Cancelled
  const cancelling = status === TransactionStatus.Cancelling
  const failedCancel = status === TransactionStatus.FailedCancel
  const inProgress = status === TransactionStatus.Cancelling || status === TransactionStatus.Pending

  // Monitor latest nonce to identify queued transactions.
  const lowestPendingNonce = useLowestPendingNonce()
  const nonce = transaction?.options?.request?.nonce
  const queued = nonce && lowestPendingNonce ? nonce > lowestPendingNonce : false

  const isCancelable =
    status === TransactionStatus.Pending && !readonly && Boolean(transaction.options?.request)

  function handleCancel() {
    if (!transaction) return
    dispatch(
      cancelTransaction({
        chainId: transaction.chainId,
        id: transaction.id,
        address: transaction.from,
      })
    )
    setShowCancelModal(false)
  }

  return (
    <>
      <Button overflow="hidden" onPress={() => setShowActionsModal(true)} {...rest}>
        {(canceled || cancelling || failedCancel) && !showInlineWarning && (
          <AlertBanner status={status} />
        )}
        <Flex
          grow
          row
          alignItems="flex-start"
          bg={bg ?? 'backgroundContainer'}
          gap="md"
          justifyContent="space-between"
          px="sm"
          py="sm">
          <Flex row alignItems="center" gap="xs" height="100%" justifyContent="flex-start">
            {icon && (
              <Flex
                centered
                height={TXN_HISTORY_ICON_SIZE * 1.5}
                width={TXN_HISTORY_ICON_SIZE * 1.5}>
                {icon}
              </Flex>
            )}
            <Flex grow gap="xxxs">
              <Flex row alignItems="center" gap="xxs">
                <Text fontWeight="500" numberOfLines={1} variant="mediumLabel">
                  {title}
                </Text>
                {chainId !== ChainId.Mainnet && <InlineNetworkPill chainId={chainId} height={16} />}
                {status === TransactionStatus.FailedCancel && showInlineWarning && (
                  <FailedCancelBadge />
                )}
              </Flex>
              {caption && (
                <Text color="textSecondary" variant="caption">
                  {caption}
                </Text>
              )}
            </Flex>
          </Flex>
          {inProgress ? (
            <Flex alignItems="flex-end" gap="xxxs">
              <SpinningLoader disabled={queued} size={LOADING_SPINNER_SIZE} />
              {queued && (
                <Text color="textSecondary" variant="badge">
                  {t('Queued')}
                </Text>
              )}
            </Flex>
          ) : (
            endAdornment
          )}
        </Flex>
      </Button>
      <TransactionActionsModal
        hash={hash}
        isVisible={showActionsModal}
        msTimestampAdded={addedTime}
        showCancelButton={isCancelable}
        transactionDetails={transaction}
        onCancel={() => {
          setShowActionsModal(false)
          setShowCancelModal(true)
        }}
        onClose={() => setShowActionsModal(false)}
        onExplore={() => openTransactionLink(hash, chainId)}
      />
      <BottomSheetModal
        hideHandlebar={false}
        isVisible={showCancelModal}
        name={ModalName.TransactionActions}
        onClose={() => setShowCancelModal(false)}>
        {transaction && (
          <CancelConfirmationView
            transactionDetails={transaction}
            onBack={() => {
              setShowActionsModal(true)
              setShowCancelModal(false)
            }}
            onCancel={handleCancel}
          />
        )}
      </BottomSheetModal>
    </>
  )
}

export default TransactionSummaryLayout

export function AssetUpdateLayout({
  title,
  caption,
}: {
  title: string | undefined
  caption?: string | undefined
}) {
  return (
    <Flex shrink alignItems="flex-end" gap="xxxs">
      <Text numberOfLines={1} variant="body">
        {title}
      </Text>
      {caption && (
        <Text color="textSecondary" numberOfLines={1} variant="caption">
          {caption}
        </Text>
      )}
    </Flex>
  )
}
