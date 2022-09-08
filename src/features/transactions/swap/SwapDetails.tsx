import { Currency, TradeType } from '@uniswap/sdk-core'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { Button } from 'src/components/buttons/Button'
import { Flex } from 'src/components/layout/Flex'
import { Warning } from 'src/components/modals/types'
import { Text } from 'src/components/Text'
import { useUSDCPrice } from 'src/features/routing/useUSDCPrice'
import { Trade } from 'src/features/transactions/swap/useTrade'
import { getRateToDisplay } from 'src/features/transactions/swap/utils'
import {
  TransactionDetails,
  TRANSACTION_DETAILS_SPACER,
} from 'src/features/transactions/TransactionDetails'
import { formatPrice } from 'src/utils/format'

interface SwapDetailsProps {
  acceptedTrade: Trade<Currency, Currency, TradeType>
  trade: Trade<Currency, Currency, TradeType>
  gasFee?: string
  newTradeToAccept: boolean
  warning?: Warning
  onAcceptTrade: () => void
  onShowWarning?: () => void
}

export function SwapDetails({
  acceptedTrade,
  gasFee,
  newTradeToAccept,
  trade,
  warning,
  onAcceptTrade,
  onShowWarning,
}: SwapDetailsProps) {
  const { t } = useTranslation()
  const [showInverseRate, setShowInverseRate] = useState(false)

  const price = acceptedTrade.executionPrice
  const usdcPrice = useUSDCPrice(showInverseRate ? price.quoteCurrency : price.baseCurrency)
  const acceptedRate = getRateToDisplay(acceptedTrade, showInverseRate)
  const rate = getRateToDisplay(trade, showInverseRate)

  return (
    <TransactionDetails
      chainId={acceptedTrade.inputAmount.currency.chainId}
      gasFee={gasFee}
      showWarning={warning && !newTradeToAccept}
      warning={warning}
      onShowWarning={onShowWarning}>
      {newTradeToAccept && (
        <Flex
          row
          alignItems="center"
          backgroundColor="accentActiveSoft"
          borderTopEndRadius="lg"
          borderTopStartRadius="lg"
          flexShrink={1}
          gap="sm"
          justifyContent="space-between"
          p="xs"
          pl="md">
          <Flex centered row gap="none">
            <Text color="accentActive" variant="subheadSmall">
              {t('New rate')}
            </Text>
          </Flex>
          <Flex row flex={1} flexBasis="100%" flexShrink={1} gap="none" justifyContent="flex-end">
            <TouchableOpacity onPress={() => setShowInverseRate(!showInverseRate)}>
              <Text
                adjustsFontSizeToFit
                color="accentActive"
                numberOfLines={1}
                textAlign="center"
                variant="subheadSmall">
                {rate}
              </Text>
            </TouchableOpacity>
          </Flex>
          <Flex centered row gap="none">
            <Button
              backgroundColor="accentActive"
              borderRadius="md"
              padding="xs"
              onPress={onAcceptTrade}>
              <Text color="accentTextLightPrimary" variant="smallLabel">
                {t('Accept')}
              </Text>
            </Button>
          </Flex>
        </Flex>
      )}
      <Flex
        row
        alignItems="center"
        borderBottomColor={TRANSACTION_DETAILS_SPACER.color}
        borderBottomWidth={TRANSACTION_DETAILS_SPACER.width}
        gap="xs"
        justifyContent="space-between"
        p="md">
        <Text variant="subheadSmall">{t('Rate')}</Text>
        <TouchableOpacity onPress={() => setShowInverseRate(!showInverseRate)}>
          <Flex row gap="none">
            <Text variant="subheadSmall">{acceptedRate}</Text>
            <Text color="textSecondary" variant="subheadSmall">
              {usdcPrice &&
                ` (${formatPrice(usdcPrice, { maximumFractionDigits: 6, notation: 'standard' })})`}
            </Text>
          </Flex>
        </TouchableOpacity>
      </Flex>
    </TransactionDetails>
  )
}
