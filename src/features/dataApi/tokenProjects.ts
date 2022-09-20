import { graphql } from 'babel-plugin-relay/macro'
import { useMemo } from 'react'
import { useLazyLoadQuery } from 'react-relay-offline'
import { EMPTY_ARRAY } from 'src/constants/misc'
import { CurrencyInfo } from 'src/features/dataApi/types'
import { currencyIdToContractInput, tokenProjectToCurrencyInfos } from 'src/features/dataApi/utils'
import { tokenProjectsQuery } from 'src/features/dataApi/__generated__/tokenProjectsQuery.graphql'
import { CurrencyId } from 'src/utils/currencyId'

const query = graphql`
  query tokenProjectsQuery($contracts: [ContractInput!]!) {
    tokenProjects(contracts: $contracts) {
      tokens {
        chain
        address
        decimals
        name
        symbol
      }
      logoUrl
    }
  }
`

/**
 * Fetches token information as CurrencyInfo from currencyIds. When used, wrap component
 * with Suspense.
 */
export function useTokenProjects(currencyIds: CurrencyId[]): CurrencyInfo[] {
  const contracts = currencyIds.map((id) => currencyIdToContractInput(id))

  const { data } = useLazyLoadQuery<tokenProjectsQuery>(query, {
    contracts,
  })

  return useMemo(() => {
    if (!data || !data.tokenProjects) return EMPTY_ARRAY

    return tokenProjectToCurrencyInfos(data.tokenProjects)
  }, [data])
}
