import { graphql } from 'babel-plugin-relay/macro'
import { logger } from 'ethers'
import { useMemo } from 'react'
import { useLazyLoadQuery } from 'react-relay-offline'
import { GraphMetadatas } from 'src/components/PriceChart/types'
import { buildGraph, GRAPH_PRECISION } from 'src/components/PriceChart/utils'
import { PortfolioModel_PortfolioQuery } from 'src/components/PriceChart/__generated__/PortfolioModel_PortfolioQuery.graphql'

/*
TODO: Added the tokenBalances fields here because usePortfolioBalances's `balancesQuery'
is querying the same endpoint, and somehow, when this portfolioCharts query is run,
react-relay overrides the return value of `balancesQuery` to be undefined. Figure out
how to cache in react-relay properly
*/
const portfolioCharts = graphql`
  query PortfolioModel_PortfolioQuery($ownerAddress: String!) {
    portfolios(ownerAddresses: [$ownerAddress]) {
      hourlyValues: tokensTotalDenominatedValueHistory(duration: HOUR) {
        timestamp
        close: value
      }
      dailyValues: tokensTotalDenominatedValueHistory(duration: DAY) {
        timestamp
        close: value
      }
      weeklyValues: tokensTotalDenominatedValueHistory(duration: WEEK) {
        timestamp
        close: value
      }
      monthlyValues: tokensTotalDenominatedValueHistory(duration: MONTH) {
        timestamp
        close: value
      }
      yearlyValues: tokensTotalDenominatedValueHistory(duration: YEAR) {
        timestamp
        close: value
      }
      tokenBalances {
        quantity
        denominatedValue {
          currency
          value
        }
        token {
          chain
          address
          name
          symbol
          decimals
        }
        tokenProjectMarket {
          tokenProject {
            logoUrl
          }
          relativeChange24: pricePercentChange(duration: DAY) {
            value
          }
        }
      }
    }
  }
`

export function usePortfolioBalanceGraphs(owner: Address): NullUndefined<GraphMetadatas> {
  const { data: portfolioData } = useLazyLoadQuery<PortfolioModel_PortfolioQuery>(portfolioCharts, {
    ownerAddress: owner,
  })

  return useMemo(() => {
    if (!portfolioData) {
      return undefined
    }

    const { hourlyValues, dailyValues, weeklyValues, monthlyValues, yearlyValues } =
      portfolioData.portfolios?.[0] ?? {}

    if (!hourlyValues || !dailyValues || !weeklyValues || !monthlyValues || !yearlyValues) {
      logger.debug('PortfolioModel/usePortfolioBalanceGraphs', 'Historical portfolio prices error')
      return null
    }

    const graphs = [
      {
        label: '1H',
        index: 0,
        data: buildGraph(hourlyValues as any, GRAPH_PRECISION),
      },
      {
        label: '1D',
        index: 1,
        data: buildGraph(dailyValues as any, GRAPH_PRECISION),
      },
      {
        label: '1W',
        index: 2,
        data: buildGraph(weeklyValues as any, GRAPH_PRECISION),
      },
      {
        label: '1M',
        index: 3,
        data: buildGraph(monthlyValues as any, GRAPH_PRECISION),
      },
      {
        label: '1Y',
        index: 4,
        data: buildGraph(yearlyValues as any, GRAPH_PRECISION),
      },
    ] as const

    return graphs as GraphMetadatas
  }, [portfolioData])
}
