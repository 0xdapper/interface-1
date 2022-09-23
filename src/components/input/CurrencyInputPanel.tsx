import { backgroundColor, BackgroundColorProps, useRestyle } from '@shopify/restyle'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { TextInput, TextInputProps } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import { MaxAmountButton } from 'src/components/buttons/MaxAmountButton'
import { AmountInput } from 'src/components/input/AmountInput'
import { Flex } from 'src/components/layout/Flex'
import { Warning, WarningLabel } from 'src/components/modals/types'
import { Text } from 'src/components/Text'
import { SelectTokenButton } from 'src/components/TokenSelector/SelectTokenButton'
import { useDynamicFontSizing } from 'src/features/transactions/hooks'
import { Theme } from 'src/styles/theme'
import { formatCurrencyAmount, formatUSDPrice } from 'src/utils/format'

const restyleFunctions = [backgroundColor]
type RestyleProps = BackgroundColorProps<Theme>

type CurrentInputPanelProps = {
  currency: Currency | null | undefined
  currencyAmount: CurrencyAmount<Currency> | null | undefined
  currencyBalance: CurrencyAmount<Currency> | null | undefined
  onShowTokenSelector: () => void
  onSetAmount: (amount: string) => void
  value?: string
  showNonZeroBalancesOnly?: boolean
  showSoftInputOnFocus?: boolean
  autoFocus?: boolean
  focus?: boolean
  isOutput?: boolean
  isUSDInput?: boolean
  onSetMax?: (amount: string) => void
  onPressIn?: () => void
  warnings: Warning[]
  dimTextColor?: boolean
  selection?: TextInputProps['selection']
  onSelectionChange?: (start: number, end: number) => void
  usdValue: CurrencyAmount<Currency> | null
} & RestyleProps

const MAX_INPUT_FONT_SIZE = 36
const MIN_INPUT_FONT_SIZE = 18

/** Input panel for a single side of a transfer action. */
export function CurrencyInputPanel(props: CurrentInputPanelProps) {
  const {
    currency,
    currencyAmount,
    currencyBalance,
    onSetAmount,
    onSetMax,
    onShowTokenSelector,
    value,
    showNonZeroBalancesOnly = true,
    showSoftInputOnFocus = false,
    focus,
    autoFocus,
    isOutput = false,
    isUSDInput = false,
    onPressIn,
    warnings,
    dimTextColor,
    selection,
    onSelectionChange,
    usdValue,
    ...rest
  } = props

  const theme = useAppTheme()
  const { t } = useTranslation()
  const transformedProps = useRestyle(restyleFunctions, rest)
  const inputRef = useRef<TextInput>(null)
  const isBlankOutputState = isOutput && !currency

  const insufficientBalanceWarning = warnings.find(
    (warning) => warning.type === WarningLabel.InsufficientFunds
  )

  const showInsufficientBalanceWarning = insufficientBalanceWarning && !isOutput

  const formattedUSDValue = usdValue ? `${formatUSDPrice(usdValue?.toExact())}` : '$0'
  const formattedCurrencyAmount = currencyAmount ? formatCurrencyAmount(currencyAmount) : ''

  useEffect(() => {
    if (focus) {
      inputRef.current?.focus()
    } else {
      inputRef.current?.blur()
    }
  }, [focus, inputRef])

  const { onContentSizeChange, onLayout, fontSize } = useDynamicFontSizing(
    MAX_INPUT_FONT_SIZE,
    MIN_INPUT_FONT_SIZE
  )

  return (
    <Flex gap="none" {...transformedProps}>
      <Flex
        row
        alignItems="center"
        gap="xxxs"
        justifyContent={isBlankOutputState ? 'center' : 'space-between'}
        py={isBlankOutputState ? 'sm' : 'none'}>
        {!isBlankOutputState && (
          <Flex fill grow row onLayout={onLayout}>
            <AmountInput
              ref={inputRef}
              alignSelf="stretch"
              autoFocus={autoFocus ?? focus}
              backgroundColor="none"
              borderWidth={0}
              dimTextColor={dimTextColor}
              flex={1}
              fontFamily={theme.textVariants.headlineLarge.fontFamily}
              fontSize={fontSize}
              height={MAX_INPUT_FONT_SIZE}
              overflow="visible"
              placeholder="0"
              placeholderTextColor={theme.colors.textSecondary}
              px="none"
              py="none"
              selection={selection}
              showCurrencySign={isUSDInput}
              showSoftInputOnFocus={showSoftInputOnFocus}
              testID={isOutput ? 'amount-input-out' : 'amount-input-in'}
              value={value}
              onChangeText={(newAmount: string) => onSetAmount(newAmount)}
              onContentSizeChange={onContentSizeChange}
              onPressIn={onPressIn}
              onSelectionChange={({
                nativeEvent: {
                  selection: { start, end },
                },
              }) => onSelectionChange && onSelectionChange(start, end)}
            />
          </Flex>
        )}
        <Flex row alignItems="center" gap="xs">
          {onSetMax && (
            <MaxAmountButton
              currencyAmount={currencyAmount}
              currencyBalance={currencyBalance}
              onSetMax={onSetMax}
            />
          )}
          <SelectTokenButton
            selectedCurrency={currency}
            showNonZeroBalancesOnly={showNonZeroBalancesOnly}
            onPress={onShowTokenSelector}
          />
        </Flex>
      </Flex>

      {!isBlankOutputState && (
        <Flex row alignItems="center" gap="xs" justifyContent="space-between" py="xxs">
          {currency && (
            <Text color="textSecondary" variant="caption">
              {!isUSDInput ? formattedUSDValue : formattedCurrencyAmount}
            </Text>
          )}
          <Flex justifyContent="flex-end">
            {showInsufficientBalanceWarning && (
              <Text color="accentWarning" variant="caption">
                {insufficientBalanceWarning.title}
              </Text>
            )}

            {currency && !showInsufficientBalanceWarning && (
              <Text color="textSecondary" variant="caption">
                {t('Balance')}: {formatCurrencyAmount(currencyBalance)} {currency.symbol}
              </Text>
            )}
          </Flex>
        </Flex>
      )}
    </Flex>
  )
}
