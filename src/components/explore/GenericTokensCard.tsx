import { default as React, ReactElement, ReactNode } from 'react'
import { FlatListProps } from 'react-native'
import { useExploreStackNavigation } from 'src/app/navigation/types'
import { Box, Flex } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { Separator } from 'src/components/layout/Separator'
import { Loading } from 'src/components/loading'
import { CoingeckoMarketCoin, CoingeckoOrderBy } from 'src/features/dataApi/coingecko/types'
import { Screens } from 'src/screens/Screens'
import { flex } from 'src/styles/flex'
import { spacing } from 'src/styles/sizing'

export interface BaseTokensCardProps {
  displayFavorites?: boolean
  fixedCount?: number
  metadataDisplayType: string
  orderBy?: CoingeckoOrderBy
  onCycleMetadata?: () => void
}

type GenericTokensCardProps<T> = BaseTokensCardProps & {
  assets?: T[]
  ListEmptyComponent?: ReactElement
  horizontal?: boolean
  id: string
  loading?: boolean
  title: string | ReactNode
  subtitle?: string | ReactNode
  icon?: ReactElement
  renderItem: FlatListProps<CoingeckoMarketCoin>['renderItem']
}

/** Renders a token list inside a Flatlist with expand behavior */
export function GenericTokensCard<T>({
  ListEmptyComponent,
  assets,
  displayFavorites,
  fixedCount,
  horizontal,
  id,
  loading,
  renderItem,
  subtitle,
  title,
  icon,
}: GenericTokensCardProps<T>) {
  const navigation = useExploreStackNavigation()

  const onPress = () => {
    if (displayFavorites) {
      navigation.navigate(Screens.ExploreFavorites)
    } else {
      navigation.navigate(Screens.ExploreTokens)
    }
  }

  const margin = horizontal ? 'sm' : 'none'

  if (loading) {
    return (
      <BaseCard.Container>
        <BaseCard.Header icon={icon} subtitle={subtitle} title={title} onPress={onPress} />
        {displayFavorites ? (
          <Flex row alignItems="flex-start" m="sm">
            <Loading repeat={4} type="favorite" />
          </Flex>
        ) : (
          <Loading showSeparator repeat={10} type="token" />
        )}
      </BaseCard.Container>
    )
  }

  return (
    <BaseCard.Container>
      <BaseCard.Header icon={icon} subtitle={subtitle} title={title} onPress={onPress} />
      <Box>
        <BaseCard.List
          ItemSeparatorComponent={() => <Separator ml={margin} />}
          ListEmptyComponent={ListEmptyComponent}
          contentContainerStyle={
            horizontal ? { ...flex.grow, padding: spacing.sm } : { ...flex.fill }
          }
          data={fixedCount ? assets?.slice(0, fixedCount) : assets}
          horizontal={horizontal}
          keyExtractor={key}
          listKey={id}
          renderItem={renderItem}
        />
      </Box>
    </BaseCard.Container>
  )
}

function key({ id }: { id: string }) {
  return id
}
