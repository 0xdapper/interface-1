import { useFocusEffect } from '@react-navigation/native'
import React, { useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo } from 'react-native'
import { Swipeable } from 'react-native-gesture-handler'
import { BackButton } from 'src/components/buttons/BackButton'
import { SortingGroup } from 'src/components/explore/FilterGroup'
import { useOrderByModal } from 'src/components/explore/Modals'
import { TokenItem } from 'src/components/explore/TokenItem'
import { Box, Flex } from 'src/components/layout'
import { BackHeader } from 'src/components/layout/BackHeader'
import { HeaderListScreen } from 'src/components/layout/screens/HeaderListScreen'
import { Separator } from 'src/components/layout/Separator'
import { Loading } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { CoingeckoMarketCoin } from 'src/features/dataApi/coingecko/types'
import { useMarketTokens, useTokenMetadataDisplayType } from 'src/features/explore/hooks'
import { getOrderByValues } from 'src/features/explore/utils'

export function ExploreTokensScreen() {
  const { t } = useTranslation()

  const [tokenMetadataDisplayType, cycleTokenMetadataDisplayType] = useTokenMetadataDisplayType()
  const { orderBy, setOrderByModalIsVisible, orderByModal } = useOrderByModal()

  const { tokens } = useMarketTokens(useMemo(() => getOrderByValues(orderBy), [orderBy]))

  // holds a reference to the currently open Swipeable to easily close
  const currentOpenRowRef = useRef<Swipeable | null>(null)

  useFocusEffect(
    useCallback(() => {
      // on screen blur
      return () => {
        if (!currentOpenRowRef) return
        currentOpenRowRef.current?.close()
        currentOpenRowRef.current = null
      }
    }, [])
  )

  const renderItem = useCallback(
    ({ item: coin, index }: ListRenderItemInfo<CoingeckoMarketCoin>) => (
      <TokenItem
        ref={currentOpenRowRef}
        coin={coin}
        gesturesEnabled={true}
        index={index}
        metadataDisplayType={tokenMetadataDisplayType}
        onCycleMetadata={cycleTokenMetadataDisplayType}
      />
    ),
    [tokenMetadataDisplayType, cycleTokenMetadataDisplayType]
  )

  return (
    <>
      <HeaderListScreen
        InitialScreenHeader={
          <Flex gap="md" mt="sm">
            <BackButton showButtonLabel />
            <Flex row alignItems="center" justifyContent="space-between" my="xs">
              <Text variant="headlineSmall">{t('Tokens')}</Text>
              <SortingGroup
                orderBy={orderBy}
                onPressOrderBy={() => setOrderByModalIsVisible(true)}
              />
            </Flex>
          </Flex>
        }
        ItemSeparatorComponent={() => <Separator ml="md" />}
        ListEmptyComponent={
          <Box mx="md" my="sm">
            <Loading repeat={8} type="token" />
          </Box>
        }
        ScrolledScreenHeader={
          <BackHeader>
            <Text variant="subhead">{t('Tokens')}</Text>
          </BackHeader>
        }
        data={tokens}
        keyExtractor={key}
        renderItem={renderItem}
      />
      {orderByModal}
    </>
  )
}

function key({ id }: { id: string }) {
  return id
}
