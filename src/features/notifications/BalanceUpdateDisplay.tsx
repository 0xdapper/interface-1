import { Currency } from '@uniswap/sdk-core'
import React, { Suspense, useMemo } from 'react'
import { Text } from 'src/components/Text'
import { useSpotPrice } from 'src/features/dataApi/spotPricesQuery'
import { createBalanceUpdate } from 'src/features/notifications/utils'
import { TransactionStatus, TransactionType } from 'src/features/transactions/types'

interface BalanceUpdateProps {
  currency: NullUndefined<Currency>
  amountRaw: string | undefined
  transactionType: TransactionType
  transactionStatus: TransactionStatus
}

export default function BalanceUpdateDisplay({
  currency,
  amountRaw,
  transactionType,
  transactionStatus,
}: BalanceUpdateProps) {
  return (
    <Suspense fallback={null}>
      <BalanceUpdateInner
        amountRaw={amountRaw}
        currency={currency}
        transactionStatus={transactionStatus}
        transactionType={transactionType}
      />
    </Suspense>
  )
}

function BalanceUpdateInner({
  currency,
  amountRaw,
  transactionType,
  transactionStatus,
}: BalanceUpdateProps) {
  const spotPrice = useSpotPrice(currency)

  return useMemo(() => {
    if (!amountRaw || !currency) {
      return null
    }
    const balanceUpdate = createBalanceUpdate({
      transactionType,
      transactionStatus,
      currency,
      currencyAmountRaw: amountRaw,
      spotPrice,
    })
    if (!balanceUpdate) {
      return null
    }
    return (
      <>
        <Text
          adjustsFontSizeToFit
          color="accentSuccess"
          fontWeight="600"
          numberOfLines={1}
          variant="smallLabel">
          {balanceUpdate.assetValueChange}
        </Text>
        <Text
          adjustsFontSizeToFit
          color="textSecondary"
          fontWeight="500"
          numberOfLines={1}
          variant="badge">
          {balanceUpdate.usdValueChange}
        </Text>
      </>
    )
  }, [amountRaw, currency, spotPrice, transactionStatus, transactionType])
}
