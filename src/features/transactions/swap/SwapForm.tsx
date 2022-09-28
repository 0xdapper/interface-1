import { AnyAction } from '@reduxjs/toolkit'
import React, { Dispatch, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, TextInputProps } from 'react-native'
import { FadeIn, FadeOut, FadeOutDown } from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import InfoCircle from 'src/assets/icons/info-circle.svg'
import { Button } from 'src/components/buttons/Button'
import { GradientButton } from 'src/components/buttons/GradientButton'
import { SwapArrowButton } from 'src/components/buttons/SwapArrowButton'
import { CurrencyInputPanel } from 'src/components/input/CurrencyInputPanel'
import { DecimalPad } from 'src/components/input/DecimalPad'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { LaserLoader } from 'src/components/loading/LaserLoader'
import { WarningAction, WarningSeverity } from 'src/components/modals/types'
import WarningModal, { getAlertColor } from 'src/components/modals/WarningModal'
import { Text } from 'src/components/Text'
import { useUSDCPrice, useUSDCValue } from 'src/features/routing/useUSDCPrice'
import { ElementName, ModalName, SectionName } from 'src/features/telemetry/constants'
import { Trace } from 'src/features/telemetry/Trace'
import { useShouldCompressView } from 'src/features/transactions/hooks'
import {
  DerivedSwapInfo,
  useShowSwapNetworkNotification,
  useSwapActionHandlers,
  useUSDTokenUpdater,
} from 'src/features/transactions/swap/hooks'
import {
  getRateToDisplay,
  getReviewActionName,
  isWrapAction,
} from 'src/features/transactions/swap/utils'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'
import { createTransactionId } from 'src/features/transactions/utils'
import { formatPrice } from 'src/utils/format'

interface SwapFormProps {
  dispatch: Dispatch<AnyAction>
  onNext: () => void
  derivedSwapInfo: DerivedSwapInfo
}

export const ARROW_SIZE = 44

export function SwapForm({ dispatch, onNext, derivedSwapInfo }: SwapFormProps) {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const {
    chainId,
    currencies,
    currencyAmounts,
    currencyBalances,
    exactCurrencyField,
    exactAmountToken,
    exactAmountUSD = '',
    formattedAmounts,
    trade,
    wrapType,
    isUSDInput = false,
    warnings,
  } = derivedSwapInfo

  const {
    onSwitchCurrencies,
    onSetAmount,
    onSetMax,
    onCreateTxId,
    onUpdateExactCurrencyField,
    onShowTokenSelector,
  } = useSwapActionHandlers(dispatch)

  const { shouldCompressView, onLayout } = useShouldCompressView()

  useUSDTokenUpdater(
    dispatch,
    isUSDInput,
    exactAmountToken,
    exactAmountUSD,
    currencies[exactCurrencyField] ?? undefined
  )

  const inputCurrencyUSDValue = useUSDCValue(currencyAmounts[CurrencyField.INPUT])
  const outputCurrencyUSDValue = useUSDCValue(currencyAmounts[CurrencyField.OUTPUT])

  useShowSwapNetworkNotification(chainId)

  const [showWarningModal, setShowWarningModal] = useState(false)

  const swapDataRefreshing = !isWrapAction(wrapType) && (trade.isFetching || trade.loading)

  const noValidSwap = !isWrapAction(wrapType) && !trade.trade
  const blockingWarning = warnings.some((warning) => warning.action === WarningAction.DisableReview)

  const actionButtonDisabled = noValidSwap || blockingWarning || swapDataRefreshing

  const swapWarning = warnings.find((warning) => warning.severity >= WarningSeverity.Medium)
  const swapWarningColor = getAlertColor(swapWarning?.severity)

  const onReview = () => {
    const txId = createTransactionId()
    onCreateTxId(txId)
    onNext()
  }

  const onCurrencyInputPress = (currencyField: CurrencyField) => () => {
    const newExactAmount = formattedAmounts[currencyField]
    onUpdateExactCurrencyField(currencyField, newExactAmount)
  }

  const [inputSelection, setInputSelection] = React.useState<TextInputProps['selection']>()
  const [outputSelection, setOutputSelection] = React.useState<TextInputProps['selection']>()
  const selection = React.useMemo(
    () => ({
      [CurrencyField.INPUT]: inputSelection,
      [CurrencyField.OUTPUT]: outputSelection,
    }),
    [inputSelection, outputSelection]
  )
  const resetSelection = (start: number, end?: number) => {
    const reset =
      exactCurrencyField === CurrencyField.INPUT ? setInputSelection : setOutputSelection
    reset({ start, end })
  }

  const [showInverseRate, setShowInverseRate] = useState(false)
  const price = trade.trade?.executionPrice
  const rateUnitPrice = useUSDCPrice(showInverseRate ? price?.quoteCurrency : price?.baseCurrency)
  const showRate =
    trade.trade &&
    !swapWarning &&
    currencies[CurrencyField.INPUT] &&
    currencies[CurrencyField.OUTPUT]

  return (
    <>
      {showWarningModal && swapWarning?.title && (
        <WarningModal
          isVisible
          caption={swapWarning.message}
          confirmText={t('OK')}
          modalName={ModalName.SwapWarning}
          severity={swapWarning.severity}
          title={swapWarning.title}
          onClose={() => setShowWarningModal(false)}
          onConfirm={() => setShowWarningModal(false)}
        />
      )}
      <Flex fill grow gap="xs" justifyContent="space-between" onLayout={onLayout}>
        <AnimatedFlex fill entering={FadeIn} exiting={FadeOut} gap="xs">
          <Trace section={SectionName.CurrencyInputPanel}>
            <Flex backgroundColor="backgroundContainer" borderRadius="xl" px="md" py="lg">
              <CurrencyInputPanel
                currency={currencies[CurrencyField.INPUT]}
                currencyAmount={currencyAmounts[CurrencyField.INPUT]}
                currencyBalance={currencyBalances[CurrencyField.INPUT]}
                dimTextColor={exactCurrencyField === CurrencyField.OUTPUT && swapDataRefreshing}
                focus={exactCurrencyField === CurrencyField.INPUT}
                isUSDInput={isUSDInput}
                selection={inputSelection}
                showSoftInputOnFocus={shouldCompressView}
                usdValue={inputCurrencyUSDValue}
                value={formattedAmounts[CurrencyField.INPUT]}
                warnings={warnings}
                onPressIn={onCurrencyInputPress(CurrencyField.INPUT)}
                onSelectionChange={(start, end) => setInputSelection({ start, end })}
                onSetAmount={(value) => onSetAmount(CurrencyField.INPUT, value, isUSDInput)}
                onSetMax={onSetMax}
                onShowTokenSelector={() => onShowTokenSelector(CurrencyField.INPUT)}
              />
            </Flex>
          </Trace>

          <Box zIndex="popover">
            <Box alignItems="center" height={ARROW_SIZE} style={StyleSheet.absoluteFill}>
              <Box alignItems="center" bottom={ARROW_SIZE / 2} position="absolute">
                <SwapArrowButton bg="backgroundSurface" onPress={onSwitchCurrencies} />
              </Box>
            </Box>
          </Box>

          <Trace section={SectionName.CurrencyOutputPanel}>
            <Flex fill gap="none">
              <Flex
                backgroundColor="backgroundContainer"
                borderBottomLeftRadius={swapWarning || showRate ? 'none' : 'xl'}
                borderBottomRightRadius={swapWarning || showRate ? 'none' : 'xl'}
                borderTopLeftRadius="xl"
                borderTopRightRadius="xl"
                gap="none"
                overflow="hidden"
                position="relative"
                px="md"
                py="lg">
                <Box bottom={0} left={0} position="absolute" right={0}>
                  {swapDataRefreshing && !swapWarning ? <LaserLoader /> : null}
                </Box>
                <CurrencyInputPanel
                  isOutput
                  currency={currencies[CurrencyField.OUTPUT]}
                  currencyAmount={currencyAmounts[CurrencyField.OUTPUT]}
                  currencyBalance={currencyBalances[CurrencyField.OUTPUT]}
                  dimTextColor={exactCurrencyField === CurrencyField.INPUT && swapDataRefreshing}
                  focus={exactCurrencyField === CurrencyField.OUTPUT}
                  isUSDInput={isUSDInput}
                  selection={outputSelection}
                  showNonZeroBalancesOnly={false}
                  showSoftInputOnFocus={shouldCompressView}
                  usdValue={outputCurrencyUSDValue}
                  value={formattedAmounts[CurrencyField.OUTPUT]}
                  warnings={warnings}
                  onPressIn={onCurrencyInputPress(CurrencyField.OUTPUT)}
                  onSelectionChange={(start, end) => setOutputSelection({ start, end })}
                  onSetAmount={(value) => onSetAmount(CurrencyField.OUTPUT, value, isUSDInput)}
                  onShowTokenSelector={() => onShowTokenSelector(CurrencyField.OUTPUT)}
                />
              </Flex>
              {swapWarning && (
                <Button onPress={() => setShowWarningModal(true)}>
                  <Flex
                    centered
                    row
                    alignItems="center"
                    alignSelf="stretch"
                    backgroundColor={swapWarningColor.background}
                    borderBottomLeftRadius="lg"
                    borderBottomRightRadius="lg"
                    flexGrow={1}
                    gap="xs"
                    p="sm">
                    <Text color={swapWarningColor.text} variant="badge">
                      {swapWarning.title}
                    </Text>
                    <InfoCircle
                      color={theme.colors[swapWarningColor.text]}
                      height={18}
                      width={18}
                    />
                  </Flex>
                </Button>
              )}
              {trade.trade && showRate && (
                <Button onPress={() => setShowInverseRate(!showInverseRate)}>
                  <Flex
                    row
                    alignItems="center"
                    alignSelf="stretch"
                    backgroundColor="backgroundAction"
                    borderBottomLeftRadius="lg"
                    borderBottomRightRadius="lg"
                    flexGrow={1}
                    gap="xs"
                    justifyContent="space-between"
                    px="lg"
                    py="sm">
                    <Flex row gap="none">
                      <Text color="accentTextLightPrimary" variant="bodySmall">
                        {getRateToDisplay(trade.trade, showInverseRate)}
                      </Text>
                      <Text color="textSecondary" variant="bodySmall">
                        {rateUnitPrice &&
                          ` (${formatPrice(rateUnitPrice, {
                            maximumFractionDigits: 6,
                            notation: 'standard',
                          })})`}
                      </Text>
                    </Flex>
                    <InfoCircle
                      color={theme.colors.textSecondary}
                      height={theme.iconSizes.md}
                      width={theme.iconSizes.md}
                    />
                  </Flex>
                </Button>
              )}
            </Flex>
          </Trace>
        </AnimatedFlex>
        <AnimatedFlex exiting={FadeOutDown} gap="xs">
          {!shouldCompressView && (
            <DecimalPad
              resetSelection={resetSelection}
              selection={selection[exactCurrencyField]}
              setValue={(value: string) => onSetAmount(exactCurrencyField, value, isUSDInput)}
              value={formattedAmounts[exactCurrencyField]}
            />
          )}
          <GradientButton
            disabled={actionButtonDisabled}
            height={56}
            label={getReviewActionName(t, wrapType)}
            name={ElementName.ReviewSwap}
            testID={ElementName.ReviewSwap}
            textColor={theme.colors.accentTextLightPrimary}
            textVariant="largeLabel"
            onPress={onReview}
          />
        </AnimatedFlex>
      </Flex>
    </>
  )
}
