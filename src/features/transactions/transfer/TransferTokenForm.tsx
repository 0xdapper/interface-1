import { AnyAction } from '@reduxjs/toolkit'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, StyleSheet } from 'react-native'
import { FadeIn, FadeOut, FadeOutDown } from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangleIcon from 'src/assets/icons/alert-triangle.svg'
import { Button, ButtonSize } from 'src/components/buttons/Button'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { TransferArrowButton } from 'src/components/buttons/TransferArrowButton'
import { Suspense } from 'src/components/data/Suspense'
import { CurrencyInputPanel } from 'src/components/input/CurrencyInputPanel'
import { DecimalPad } from 'src/components/input/DecimalPad'
import { RecipientInputPanel } from 'src/components/input/RecipientInputPanel'
import { TextInputProps } from 'src/components/input/TextInput'
import { AnimatedFlex, Box, Flex } from 'src/components/layout'
import { Warning, WarningAction, WarningSeverity } from 'src/components/modals/WarningModal/types'
import WarningModal, { getAlertColor } from 'src/components/modals/WarningModal/WarningModal'
import { NFTTransfer } from 'src/components/NFT/NFTTransfer'
import { Text } from 'src/components/Text'
import { useUSDCValue } from 'src/features/routing/useUSDCPrice'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { useShouldShowNativeKeyboard } from 'src/features/transactions/hooks'
import { useSwapActionHandlers, useUSDTokenUpdater } from 'src/features/transactions/swap/hooks'
import {
  CurrencyField,
  transactionStateActions,
} from 'src/features/transactions/transactionState/transactionState'
import { DerivedTransferInfo } from 'src/features/transactions/transfer/hooks'
import { TransferFormSpeedbumps } from 'src/features/transactions/transfer/TransferFormWarnings'
import { createOnToggleShowRecipientSelector } from 'src/features/transactions/transfer/utils'
import { createTransactionId } from 'src/features/transactions/utils'
import { BlockedAddressWarning } from 'src/features/trm/BlockedAddressWarning'
import { useIsBlockedActiveAddress } from 'src/features/trm/hooks'
import { dimensions } from 'src/styles/sizing'
import { usePrevious } from 'src/utils/hooks'

interface TransferTokenProps {
  dispatch: React.Dispatch<AnyAction>
  derivedTransferInfo: DerivedTransferInfo
  onNext: () => void
  warnings: Warning[]
  showingSelectorScreen: boolean
}

export interface TransferSpeedbump {
  hasWarning: boolean
  loading: boolean
}

export function TransferTokenForm({
  dispatch,
  derivedTransferInfo,
  onNext,
  warnings,
  showingSelectorScreen,
}: TransferTokenProps) {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const {
    currencyAmounts,
    currencyBalances,
    exactAmountToken,
    exactAmountUSD,
    recipient,
    isUSDInput = false,
    currencyIn,
    nftIn,
    chainId,
  } = derivedTransferInfo

  useUSDTokenUpdater(
    dispatch,
    isUSDInput,
    exactAmountToken,
    exactAmountUSD,
    currencyIn ?? undefined
  )

  const inputCurrencyUSDValue = useUSDCValue(currencyAmounts[CurrencyField.INPUT])

  const [showWarningModal, setShowWarningModal] = useState(false)
  const [showSpeedbumpModal, setShowSpeedbumpModal] = useState(false)
  const [transferSpeedbump, setTransferSpeedbump] = useState<TransferSpeedbump>({
    loading: true,
    hasWarning: false,
  })

  const { onShowTokenSelector, onSetAmount, onSetMax } = useSwapActionHandlers(dispatch)
  const onToggleShowRecipientSelector = createOnToggleShowRecipientSelector(dispatch)

  const { isBlocked, isBlockedLoading } = useIsBlockedActiveAddress()

  const actionButtonDisabled =
    warnings.some((warning) => warning.action === WarningAction.DisableReview) ||
    transferSpeedbump.loading ||
    isBlocked ||
    isBlockedLoading

  const goToNext = useCallback(() => {
    const txId = createTransactionId()
    dispatch(transactionStateActions.setTxId(txId))
    onNext()
  }, [dispatch, onNext])

  const onPressReview = useCallback(() => {
    if (transferSpeedbump.hasWarning) {
      setShowSpeedbumpModal(true)
    } else {
      goToNext()
    }
  }, [goToNext, transferSpeedbump.hasWarning])

  const onSetTransferSpeedbump = useCallback(({ hasWarning, loading }: TransferSpeedbump) => {
    setTransferSpeedbump({ hasWarning, loading })
  }, [])

  const onSetShowSpeedbumpModal = useCallback((showModal: boolean) => {
    setShowSpeedbumpModal(showModal)
  }, [])

  const [inputSelection, setInputSelection] = useState<TextInputProps['selection']>()

  const resetSelection = useCallback(
    (start: number, end?: number) => {
      setInputSelection({ start, end: end ?? start })
    },
    [setInputSelection]
  )

  const prevIsUSDInput = usePrevious(isUSDInput)

  // when text changes on the screen, the default iOS input behavior is to use the same cursor
  // position but from the END of the input. so for example, if the cursor is currently at
  // 12.3|4 and the input changes to $1.232354, then new cursor will be at $1.23235|4
  // this useEffect essentially calculates where the new cursor position is when the text has changed
  // and that only happens on toggling USD <-> token input
  useEffect(() => {
    // only run this useEffect if isUSDInput has changed
    // if inputSelection is undefined, then that means no text selection or cursor
    // movement has happened yet, so let iOS do its default thang
    if (isUSDInput === prevIsUSDInput || !inputSelection) return

    if (inputSelection.start !== inputSelection.end) {
      setInputSelection(undefined)
      return
    }

    const [prevInput, newInput] = isUSDInput
      ? [exactAmountToken, exactAmountUSD]
      : [exactAmountUSD, exactAmountToken]
    const positionFromEnd = prevInput.length - inputSelection.start
    const newPositionFromStart = newInput.length - positionFromEnd
    const newPositionFromStartWithPrefix = newPositionFromStart + (isUSDInput ? 1 : -1)

    setInputSelection({
      start: newPositionFromStartWithPrefix,
      end: newPositionFromStartWithPrefix,
    })
  }, [
    isUSDInput,
    prevIsUSDInput,
    inputSelection,
    setInputSelection,
    exactAmountToken,
    exactAmountUSD,
  ])

  const onTransferWarningClick = () => {
    Keyboard.dismiss()
    setShowWarningModal(true)
  }

  const transferWarning = warnings.find((warning) => warning.severity >= WarningSeverity.Medium)
  const transferWarningColor = getAlertColor(transferWarning?.severity)

  const { showNativeKeyboard, onDecimalPadLayout, isLayoutPending, onInputPanelLayout } =
    useShouldShowNativeKeyboard()

  const TRANSFER_DIRECTION_BUTTON_SIZE = theme.iconSizes.md
  const TRANSFER_DIRECTION_BUTTON_INNER_PADDING = theme.spacing.sm
  const TRANSFER_DIRECTION_BUTTON_BORDER_WIDTH = theme.spacing.xxs

  return (
    <>
      {showWarningModal && transferWarning?.title && (
        <WarningModal
          caption={transferWarning.message}
          confirmText={t('OK')}
          modalName={ModalName.SendWarning}
          severity={transferWarning.severity}
          title={transferWarning.title}
          onClose={() => setShowWarningModal(false)}
          onConfirm={() => setShowWarningModal(false)}
        />
      )}
      <Suspense fallback={null}>
        <TransferFormSpeedbumps
          chainId={chainId}
          dispatch={dispatch}
          recipient={recipient}
          setShowSpeedbumpModal={onSetShowSpeedbumpModal}
          setTransferSpeedbump={onSetTransferSpeedbump}
          showSpeedbumpModal={showSpeedbumpModal}
          onNext={goToNext}
        />
      </Suspense>
      <Flex grow gap="xs" justifyContent="space-between">
        <AnimatedFlex entering={FadeIn} exiting={FadeOut} gap="xxxxs" onLayout={onInputPanelLayout}>
          {nftIn ? (
            <NFTTransfer asset={nftIn} nftSize={dimensions.fullHeight / 4} />
          ) : (
            <Flex backgroundColor="background2" borderRadius="xl" justifyContent="center">
              <CurrencyInputPanel
                focus
                currency={currencyIn}
                currencyAmount={currencyAmounts[CurrencyField.INPUT]}
                currencyBalance={currencyBalances[CurrencyField.INPUT]}
                isOnScreen={!showingSelectorScreen}
                isUSDInput={isUSDInput}
                selection={inputSelection}
                showSoftInputOnFocus={showNativeKeyboard}
                usdValue={inputCurrencyUSDValue}
                value={isUSDInput ? exactAmountUSD : exactAmountToken}
                warnings={warnings}
                onSelectionChange={
                  showNativeKeyboard ? undefined : (start, end) => setInputSelection({ start, end })
                }
                onSetAmount={(value) => onSetAmount(CurrencyField.INPUT, value, isUSDInput)}
                onSetMax={onSetMax}
                onShowTokenSelector={() => onShowTokenSelector(CurrencyField.INPUT)}
              />
            </Flex>
          )}

          <Box zIndex="popover">
            <Box
              alignItems="center"
              height={
                TRANSFER_DIRECTION_BUTTON_SIZE +
                TRANSFER_DIRECTION_BUTTON_INNER_PADDING +
                TRANSFER_DIRECTION_BUTTON_BORDER_WIDTH
              }
              style={StyleSheet.absoluteFill}>
              <Box
                alignItems="center"
                bottom={TRANSFER_DIRECTION_BUTTON_SIZE / 2}
                position="absolute">
                <TransferArrowButton
                  disabled
                  bg={recipient ? 'background2' : 'background1'}
                  padding="xs"
                />
              </Box>
            </Box>
          </Box>

          <Box>
            <Flex
              backgroundColor={recipient ? 'background2' : 'none'}
              borderBottomLeftRadius={transferWarning || isBlocked ? 'none' : 'xl'}
              borderBottomRightRadius={transferWarning || isBlocked ? 'none' : 'xl'}
              borderTopLeftRadius="xl"
              borderTopRightRadius="xl"
              justifyContent="center"
              mt="xxs"
              px="md"
              py="lg">
              {recipient && (
                <RecipientInputPanel
                  recipientAddress={recipient}
                  onToggleShowRecipientSelector={onToggleShowRecipientSelector}
                />
              )}
            </Flex>
            {transferWarning && !isBlocked ? (
              <TouchableArea onPress={onTransferWarningClick}>
                <Flex
                  row
                  alignItems="center"
                  alignSelf="stretch"
                  backgroundColor={transferWarningColor.background}
                  borderBottomLeftRadius="lg"
                  borderBottomRightRadius="lg"
                  flexGrow={1}
                  gap="xs"
                  px="md"
                  py="sm">
                  <AlertTriangleIcon
                    color={theme.colors[transferWarningColor.text]}
                    height={theme.iconSizes.sm}
                    width={theme.iconSizes.sm}
                  />
                  <Text color={transferWarningColor.text} variant="subheadSmall">
                    {transferWarning.title}
                  </Text>
                </Flex>
              </TouchableArea>
            ) : null}
            {isBlocked ? (
              <BlockedAddressWarning
                row
                alignItems="center"
                alignSelf="stretch"
                backgroundColor="background2"
                borderBottomLeftRadius="lg"
                borderBottomRightRadius="lg"
                flexGrow={1}
                mt="xxxs"
                px="md"
                py="sm"
              />
            ) : null}
          </Box>
        </AnimatedFlex>
        <AnimatedFlex
          bottom={0}
          exiting={FadeOutDown}
          gap="xs"
          left={0}
          opacity={isLayoutPending ? 0 : 1}
          position="absolute"
          right={0}
          onLayout={onDecimalPadLayout}>
          {!nftIn && !showNativeKeyboard && (
            <DecimalPad
              hasCurrencyPrefix={isUSDInput}
              resetSelection={resetSelection}
              selection={inputSelection}
              setValue={(newValue) => onSetAmount(CurrencyField.INPUT, newValue, isUSDInput)}
              value={isUSDInput ? exactAmountUSD : exactAmountToken}
            />
          )}
          <Button
            disabled={actionButtonDisabled}
            label={t('Review transfer')}
            name={ElementName.ReviewTransfer}
            size={ButtonSize.Large}
            onPress={onPressReview}
          />
        </AnimatedFlex>
      </Flex>
    </>
  )
}
