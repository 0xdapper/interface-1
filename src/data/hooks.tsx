import {
  ApolloClient,
  createHttpLink,
  InMemoryCache,
  NormalizedCacheObject,
  useApolloClient,
} from '@apollo/client'
import { relayStylePagination } from '@apollo/client/utilities'
import { MMKVWrapper, persistCache } from 'apollo3-cache-persist'
import { useCallback, useEffect, useState } from 'react'
import { MMKV } from 'react-native-mmkv'
import { config } from 'src/config'
import { uniswapUrls } from 'src/constants/urls'
import { logger } from 'src/utils/logger'

const mmkv = new MMKV()
if (__DEV__) {
  // requires Flipper plugin `react-native-mmkv` to be installed
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('react-native-mmkv-flipper-plugin').initializeMMKVFlipper({ default: mmkv })
}

// ONLY for use once in App.tsx! If you add this in other places you will go to JAIL!
export const usePersistedApolloClient = () => {
  const [client, setClient] = useState<ApolloClient<NormalizedCacheObject>>()

  useEffect(() => {
    async function init() {
      const cache = new InMemoryCache({
        typePolicies: {
          Query: {
            fields: {
              // relayStylePagination function unfortunately generates a field policy that ignores args
              nftBalances: relayStylePagination(['ownerAddress']),
            },
          },
        },
      })

      try {
        await persistCache({
          cache,
          storage: new MMKVWrapper(mmkv),
        })
      } catch (e) {
        // non-fatal error, simply log
        logger.error('data/hooks', 'init', `Error while restoring Apollo cache: ${e}`)
      }

      const httpLink = createHttpLink({
        uri: uniswapUrls.graphQLUrl,
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': config.uniswapApiKey,
          // TODO: remove once API gateway supports mobile origin URL
          Origin: uniswapUrls.apiBaseUrl,
        },
      })

      setClient(
        new ApolloClient({
          link: httpLink,
          cache,
          defaultOptions: {
            watchQuery: {
              // NOTE: when polling is enabled, if there is cached data, the first request is skipped.
              // `cache-and-network` ensures we send a request on first query, keeping queries
              // across the app in sync.
              fetchPolicy: 'cache-and-network',
              // ensures query is returning data even if some fields errored out
              errorPolicy: 'all',
            },
          },
        })
      )
    }

    init()
  }, [])

  useEffect(() => {
    if (__DEV__) {
      // requires Flipper plugin `react-native-apollo-devtools` to be installed
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('react-native-apollo-devtools-client').apolloDevToolsInit(client)
    }
  }, [client])

  return client
}

export function useRefetchQueries() {
  const client = useApolloClient()

  return useCallback(
    (
      include: Parameters<
        ApolloClient<NormalizedCacheObject>['refetchQueries']
      >[0]['include'] = 'active'
    ) => {
      client?.refetchQueries({ include })
    },
    [client]
  )
}
