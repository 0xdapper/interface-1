import { Currency } from '@uniswap/sdk-core'
import React, { useCallback, useEffect, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TokenSelector, TokenSelectorVariation } from 'src/components/TokenSelector/TokenSelector'
import {
  useDerivedSwapInfo,
  useSwapActionHandlers,
  useSwapTxAndGasInfo,
} from 'src/features/transactions/swap/hooks'
import { TransactionFlow, TransactionStep } from 'src/features/transactions/TransactionFlow'
import {
  CurrencyField,
  initialState as emptyState,
  TransactionState,
  transactionStateReducer,
} from 'src/features/transactions/transactionState/transactionState'

interface SwapFormProps {
  prefilledState?: TransactionState
  onClose: () => void
}

function otherCurrencyField(field: CurrencyField): CurrencyField {
  return field === CurrencyField.INPUT ? CurrencyField.OUTPUT : CurrencyField.INPUT
}

export function SwapFlow({ prefilledState, onClose }: SwapFormProps) {
  const { t } = useTranslation()
  const [state, dispatch] = useReducer(transactionStateReducer, prefilledState || emptyState)
  const derivedSwapInfo = useDerivedSwapInfo(state)
  const { onSelectCurrency, onHideTokenSelector } = useSwapActionHandlers(dispatch)
  const { selectingCurrencyField, currencies } = derivedSwapInfo
  const [step, setStep] = useState<TransactionStep>(TransactionStep.FORM)
  const { txRequest, approveTxRequest, totalGasFee } = useSwapTxAndGasInfo(
    derivedSwapInfo,
    step === TransactionStep.SUBMITTED
  )

  // keep currencies list option as state so that rendered list remains stable through the slide animation
  const [listVariation, setListVariation] = useState<TokenSelectorVariation>(
    TokenSelectorVariation.BalancesAndPopular
  )

  useEffect(() => {
    if (selectingCurrencyField) {
      setListVariation(
        selectingCurrencyField === CurrencyField.INPUT
          ? TokenSelectorVariation.BalancesAndPopular
          : TokenSelectorVariation.SuggestedAndPopular
      )
    }
  }, [selectingCurrencyField])

  const onTokenSelectorSelectCurrency = useCallback(
    (currency: Currency) => {
      selectingCurrencyField && onSelectCurrency(selectingCurrencyField, currency)
    },
    [selectingCurrencyField, onSelectCurrency]
  )

  return (
    <TransactionFlow
      approveTxRequest={approveTxRequest}
      derivedInfo={derivedSwapInfo}
      dispatch={dispatch}
      flowName={t('Swap')}
      setStep={setStep}
      showTokenSelector={!!selectingCurrencyField}
      step={step}
      tokenSelector={
        <TokenSelector
          otherCurrency={
            selectingCurrencyField
              ? currencies[otherCurrencyField(selectingCurrencyField)]
              : undefined
          }
          selectedCurrency={selectingCurrencyField ? currencies[selectingCurrencyField] : undefined}
          variation={listVariation}
          onBack={onHideTokenSelector}
          onSelectCurrency={onTokenSelectorSelectCurrency}
        />
      }
      totalGasFee={totalGasFee}
      txRequest={txRequest}
      onClose={onClose}
    />
  )
}
