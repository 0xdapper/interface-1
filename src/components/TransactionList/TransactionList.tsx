import { NetworkStatus } from '@apollo/client'
import { TFunction } from 'i18next'
import React, { ReactElement, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionList, SectionListData } from 'react-native'
import { useAppSelector } from 'src/app/hooks'
import { Box } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { Loading } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { EMPTY_ARRAY } from 'src/constants/misc'
import { isNonPollingRequestInFlight } from 'src/data/utils'
import {
  TransactionListQuery,
  useTransactionListQuery,
} from 'src/data/__generated__/types-and-hooks'
import { usePersistedError } from 'src/features/dataApi/utils'
import {
  formatTransactionsByDate,
  parseDataResponseToTransactionDetails,
} from 'src/features/transactions/history/utils'
import { useMergeLocalAndRemoteTransactions } from 'src/features/transactions/hooks'
import TransactionSummaryRouter from 'src/features/transactions/SummaryCards/TransactionSummaryRouter'
import { TransactionDetails } from 'src/features/transactions/types'
import { useActiveAccountWithThrow } from 'src/features/wallet/hooks'
import { makeSelectAccountHideSpamTokens } from 'src/features/wallet/selectors'

const PENDING_TITLE = (t: TFunction) => t('Pending')
const TODAY_TITLE = (t: TFunction) => t('Today')
const MONTH_TITLE = (t: TFunction) => t('This Month')

const key = (info: TransactionDetails) => info.hash

const SectionTitle: SectionList['props']['renderSectionHeader'] = ({ section: { title } }) => (
  <Box pb="xxxs" pt="sm" px="xs">
    <Text color="textSecondary" variant="subheadSmall">
      {title}
    </Text>
  </Box>
)

export type TransactionListQueryResponse = NonNullable<
  NonNullable<NonNullable<TransactionListQuery['portfolios']>[0]>['assetActivities']
>[0]

interface TransactionListProps {
  ownerAddress: Address
  readonly: boolean
  emptyStateContent: ReactElement | null
}

export default function TransactionList(props: TransactionListProps) {
  const { t } = useTranslation()

  const {
    refetch,
    networkStatus,
    loading: requestLoading,
    data,
    error: requestError,
  } = useTransactionListQuery({
    variables: { address: props.ownerAddress },
    notifyOnNetworkStatusChange: true,
  })

  const onRetry = useCallback(() => {
    refetch({
      address: props.ownerAddress,
    })
  }, [props.ownerAddress, refetch])

  const hasData = !!data?.portfolios?.[0]?.assetActivities
  const error = usePersistedError(requestLoading, requestError)
  const isLoading = isNonPollingRequestInFlight(networkStatus)

  // show loading if no data and fetching, or refetching when there is error (for UX when "retry" is clicked).
  const showLoading =
    (!hasData && isLoading) || (Boolean(error) && networkStatus === NetworkStatus.refetch)

  if (showLoading) {
    return (
      <Box>
        <Loading type="transactions" />
      </Box>
    )
  }

  if (!hasData && error) {
    return (
      <Box height="100%" pb="xxxl">
        <BaseCard.ErrorState
          retryButtonLabel={t('Retry')}
          title={t('Couldn’t load activity')}
          onRetry={onRetry}
        />
      </Box>
    )
  }

  return <TransactionListInner {...props} data={data} />
}

/** Displays historical and pending transactions for a given address. */
function TransactionListInner({
  data,
  ownerAddress,
  readonly,
  emptyStateContent,
}: TransactionListProps & { data: TransactionListQuery | undefined }) {
  const { t } = useTranslation()

  // Hide all spam transactions if active wallet has enabled setting.
  const activeAccount = useActiveAccountWithThrow()
  const hideSpamTokens = useAppSelector(makeSelectAccountHideSpamTokens(activeAccount.address))

  // Parse remote txn data from query and merge with local txn data
  const formattedTransactions = useMemo(
    () => (data ? parseDataResponseToTransactionDetails(data, hideSpamTokens) : EMPTY_ARRAY),
    [data, hideSpamTokens]
  )
  const transactions = useMergeLocalAndRemoteTransactions(ownerAddress, formattedTransactions)

  // Format transactions for section list
  const {
    pending,
    todayTransactionList,
    monthTransactionList,
    priorByMonthTransactionList,
    combinedTransactionList,
  } = useMemo(() => formatTransactionsByDate(transactions), [transactions])

  const hasTransactions = combinedTransactionList?.length > 0

  const sectionData = useMemo(() => {
    if (!hasTransactions) {
      return EMPTY_ARRAY
    }
    return [
      ...(pending.length > 0 ? [{ title: PENDING_TITLE(t), data: pending }] : []),
      ...(todayTransactionList.length > 0
        ? [{ title: TODAY_TITLE(t), data: todayTransactionList }]
        : EMPTY_ARRAY),
      ...(monthTransactionList.length > 0
        ? [{ title: MONTH_TITLE(t), data: monthTransactionList }]
        : EMPTY_ARRAY),
      // for each month prior, detect length and render if includes transactions
      ...Object.keys(priorByMonthTransactionList).reduce(
        (
          accum: {
            title: string
            data: TransactionDetails[]
          }[],
          month
        ) => {
          const transactionList = priorByMonthTransactionList[month]
          if (transactionList.length > 0) {
            accum.push({ title: month, data: transactionList })
          }
          return accum
        },
        []
      ),
    ]
  }, [
    hasTransactions,
    monthTransactionList,
    pending,
    priorByMonthTransactionList,
    t,
    todayTransactionList,
  ])

  const renderItem = useMemo(() => {
    return ({
      item,
    }: {
      item: TransactionDetails
      index: number
      section: SectionListData<TransactionDetails>
    }) => {
      return (
        <TransactionSummaryRouter
          readonly={readonly}
          // We will most likely need this when design updates.
          showInlineWarning={false}
          transaction={item}
        />
      )
    }
  }, [readonly])

  if (!hasTransactions) {
    return emptyStateContent
  }

  return (
    <SectionList
      keyExtractor={key}
      renderItem={renderItem}
      renderSectionHeader={SectionTitle}
      sections={sectionData}
      showsVerticalScrollIndicator={false}
      stickySectionHeadersEnabled={false}
      windowSize={5}
    />
  )
}
