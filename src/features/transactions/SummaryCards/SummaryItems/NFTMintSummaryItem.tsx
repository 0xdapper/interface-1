import React from 'react'
import { useTranslation } from 'react-i18next'
import { LogoWithTxStatus } from 'src/components/CurrencyLogo/LogoWithTxStatus'
import { AssetType } from 'src/entities/assets'
import { useCurrency } from 'src/features/tokens/useCurrency'
import BalanceUpdate from 'src/features/transactions/SummaryCards/BalanceUpdate'
import TransactionSummaryLayout, {
  TXN_HISTORY_ICON_SIZE,
} from 'src/features/transactions/SummaryCards/TransactionSummaryLayout'
import { BaseTransactionSummaryProps } from 'src/features/transactions/SummaryCards/TransactionSummaryRouter'
import { formatTitleWithStatus } from 'src/features/transactions/SummaryCards/utils'
import { NFTMintTransactionInfo, TransactionType } from 'src/features/transactions/types'

export default function NFTMintSummaryItem({
  transaction,
  showInlineWarning,
  readonly,
  ...rest
}: BaseTransactionSummaryProps & { transaction: { typeInfo: NFTMintTransactionInfo } }) {
  const { t } = useTranslation()
  const title = formatTitleWithStatus({
    status: transaction.status,
    text: t('Mint'),
    showInlineWarning,
    t,
  })

  const currency = useCurrency(transaction.typeInfo.purchaseCurrencyId)
  const amountRaw = transaction.typeInfo.purchaseCurrencyAmountRaw

  return (
    <TransactionSummaryLayout
      caption={transaction.typeInfo.nftSummaryInfo.collectionName}
      endAdornment={
        amountRaw && currency ? (
          <BalanceUpdate
            amountRaw={amountRaw}
            currency={currency}
            transactionStatus={transaction.status}
            transactionType={transaction.typeInfo.type}
          />
        ) : undefined
      }
      icon={
        <LogoWithTxStatus
          assetType={AssetType.ERC721}
          nftImageUrl={transaction.typeInfo.nftSummaryInfo.imageURL}
          size={TXN_HISTORY_ICON_SIZE}
          txStatus={transaction.status}
          txType={TransactionType.NFTMint}
        />
      }
      readonly={readonly}
      showInlineWarning={showInlineWarning}
      title={title}
      transaction={transaction}
      {...rest}
    />
  )
}
