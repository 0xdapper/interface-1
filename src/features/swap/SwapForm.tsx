import { StackActions } from '@react-navigation/native'
import { Currency } from '@uniswap/sdk-core'
import { notificationAsync } from 'expo-haptics'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, StyleSheet } from 'react-native'
import { AnyAction } from 'redux'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { Button } from 'src/components/buttons/Button'
import { LongPressButton } from 'src/components/buttons/LongPressButton'
import { SwapArrow } from 'src/components/icons/SwapArrow'
import { CurrencyInput } from 'src/components/input/CurrencyInput'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { useBiometricPrompt } from 'src/features/biometrics/hooks'
import {
  useDerivedSwapInfo,
  useSwapActionHandlers,
  useSwapCallback,
  useWrapCallback,
} from 'src/features/swap/hooks'
import { QuickDetails } from 'src/features/swap/QuickDetails'
import { SwapDetails } from 'src/features/swap/SwapDetails'
import { CurrencyField, SwapFormState } from 'src/features/swap/swapFormSlice'
import { isWrapAction } from 'src/features/swap/utils'
import { getHumanReadableSwapInputStatus } from 'src/features/swap/validate'
import { WrapType } from 'src/features/swap/wrapSaga'
import { ElementName, SectionName } from 'src/features/telemetry/constants'
import { Trace } from 'src/features/telemetry/Trace'
import { useActiveAccount } from 'src/features/wallet/hooks'

interface SwapFormProps {
  state: SwapFormState
  dispatch: React.Dispatch<AnyAction>
}

// TODO:
// -check erc20 permits
// -handle price impact too high
// TODO: token warnings
export function SwapForm(props: SwapFormProps) {
  const { state, dispatch } = props
  const [showDetails, setShowDetails] = useState(false)

  const activeAccount = useActiveAccount()
  const navigation = useAppStackNavigation()
  const { t } = useTranslation()

  const onSubmit = useCallback(() => {
    navigation.dispatch(StackActions.popToTop())
  }, [navigation])

  const derivedSwapInfo = useDerivedSwapInfo(state)

  const {
    currencies,
    currencyAmounts,
    currencyBalances,
    formattedAmounts,
    trade: { trade: trade, status: quoteStatus },
    wrapType,
  } = derivedSwapInfo

  const { onSelectCurrency, onSwitchCurrencies, onEnterExactAmount } =
    useSwapActionHandlers(dispatch)

  const { swapCallback } = useSwapCallback(trade, onSubmit)
  const { wrapCallback } = useWrapCallback(currencyAmounts[CurrencyField.INPUT], wrapType, onSubmit)

  const swapInputStatusMessage = getHumanReadableSwapInputStatus(activeAccount, derivedSwapInfo, t)
  const actionButtonDisabled = Boolean(!(isWrapAction(wrapType) || trade) || swapInputStatusMessage)

  return (
    <Box flex={1} justifyContent="space-between" px="md">
      <Box flex={1}>
        <Trace section={SectionName.CurrencyInputPanel}>
          <CurrencyInput
            autofocus
            currency={currencies[CurrencyField.INPUT]}
            currencyAmount={currencyAmounts[CurrencyField.INPUT]}
            currencyBalance={currencyBalances[CurrencyField.INPUT]}
            otherSelectedCurrency={currencies[CurrencyField.OUTPUT]}
            showNonZeroBalancesOnly={true}
            value={formattedAmounts[CurrencyField.INPUT]}
            onSelectCurrency={(newCurrency: Currency) =>
              onSelectCurrency(CurrencyField.INPUT, newCurrency)
            }
            onSetAmount={(value) => onEnterExactAmount(CurrencyField.INPUT, value)}
          />
        </Trace>
        <Box zIndex="popover">
          <Box alignItems="center" height={40} style={StyleSheet.absoluteFill}>
            <Box
              alignItems="center"
              bg="gray50"
              borderColor="mainBackground"
              borderRadius="md"
              borderWidth={4}
              bottom={18}
              justifyContent="center"
              p="xs"
              position="relative">
              <Button
                alignItems="center"
                borderRadius="md"
                justifyContent="center"
                px="xxs"
                py="xs"
                onPress={onSwitchCurrencies}>
                <SwapArrow
                  color="textColor"
                  height={18}
                  strokeLinecap="round"
                  strokeWidth="1.5"
                  width={18}
                />
              </Button>
            </Box>
          </Box>
        </Box>
        <Trace section={SectionName.CurrencyOutputPanel}>
          <CurrencyInput
            backgroundColor="gray50"
            currency={currencies[CurrencyField.OUTPUT]}
            currencyAmount={currencyAmounts[CurrencyField.OUTPUT]}
            currencyBalance={currencyBalances[CurrencyField.OUTPUT]}
            otherSelectedCurrency={currencies[CurrencyField.INPUT]}
            showNonZeroBalancesOnly={false}
            title={t("You'll receive")}
            value={formattedAmounts[CurrencyField.OUTPUT]}
            onSelectCurrency={(newCurrency: Currency) =>
              onSelectCurrency(CurrencyField.OUTPUT, newCurrency)
            }
            onSetAmount={(value) => onEnterExactAmount(CurrencyField.OUTPUT, value)}
          />
        </Trace>
      </Box>
      <Flex flex={1} gap="md" justifyContent={'flex-end'} my="xs">
        {showDetails && !isWrapAction(wrapType) && trade && quoteStatus === 'success' && (
          <SwapDetails
            currencyIn={currencyAmounts[CurrencyField.INPUT]}
            currencyOut={currencyAmounts[CurrencyField.OUTPUT]}
            trade={trade}
          />
        )}
        {!isWrapAction(wrapType) && (
          <Button
            onPress={() => {
              Keyboard.dismiss()
              setShowDetails(!showDetails)
            }}>
            <QuickDetails label={swapInputStatusMessage} trade={trade} />
          </Button>
        )}
        <ActionButton
          callback={isWrapAction(wrapType) ? wrapCallback : swapCallback}
          disabled={actionButtonDisabled}
          label={
            wrapType === WrapType.Wrap
              ? t('Hold to wrap')
              : wrapType === WrapType.Unwrap
              ? t('Hold to unwrap')
              : t('Hold to swap')
          }
          loading={quoteStatus === 'loading'}
          name={
            wrapType === WrapType.Wrap
              ? ElementName.Wrap
              : wrapType === WrapType.Unwrap
              ? ElementName.Unwrap
              : ElementName.Swap
          }
        />
      </Flex>
    </Box>
  )
}

type ActionButtonProps = {
  disabled: boolean
  name: ElementName
  label: string
  loading: boolean
  callback: () => void
}

function ActionButton({ callback, disabled, label, name }: ActionButtonProps) {
  const { trigger: actionButtonTrigger, modal: BiometricModal } = useBiometricPrompt(callback)

  return (
    <>
      <LongPressButton
        disabled={disabled}
        label={label}
        name={name}
        onComplete={() => {
          notificationAsync()
          actionButtonTrigger()
        }}
      />

      {BiometricModal}
    </>
  )
}
