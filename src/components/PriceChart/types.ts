import Animated from 'react-native-reanimated'
import { Path, Vector } from 'react-native-redash'

export type AnimatedNumber = Animated.SharedValue<number>
export type AnimatedTranslation = Vector<Animated.SharedValue<number>>

export type GraphData = {
  openDate: number
  closeDate: number
  lowPrice: number
  highPrice: number
  openPrice: number
  closePrice: number
  path: Path
}

export type GraphMetadata = Readonly<{
  label: string
  index: number
  data: GraphData
}>

// use tuple for type-safety (assumes there is always five graphs)
export type GraphMetadatas = readonly [
  GraphMetadata,
  GraphMetadata,
  GraphMetadata,
  GraphMetadata,
  GraphMetadata
]

type Price = {
  timestamp: number
  close: number
}
export type PriceList = Readonly<Nullable<Price>[]>
