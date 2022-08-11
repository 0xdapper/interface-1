import { scaleLinear } from 'd3-scale'
import { curveBasis, line } from 'd3-shape'
import { getYForX, parse, Path } from 'react-native-redash'
import { GraphData, PriceList } from 'src/components/PriceChart/types'
import { dimensions } from 'src/styles/sizing'

export const HEIGHT = 180
export const WIDTH = dimensions.fullWidth

export const NUM_GRAPHS = 5
export const GRAPH_PRECISION = 20 // number of points in graph

export function takeSubset(arr: Array<any> | undefined, end?: number) {
  return arr?.slice(0, end)
}

/**
 * Normalizes a Path by rescaling the x-axis and mapping to the Path.
 * Required because different date ranges have different number of points.
 * redash requires the same number of points to interpolate between paths.
 * @param path to normalize
 * @param precision number of dat points in the new path
 * @param width of the canvas
 **/
export function normalizePath(path: Path, precision: number, width: number): Path {
  const scaleX = scaleLinear()
    .domain([0, precision - 1])
    .range([0, width])

  const values = Array(precision)
    .fill([])
    .map((_, index) => {
      const x = scaleX(index)
      const y = getYForX(path, x)
      return [x, y] as [number, number]
    })

  return parse(
    line()
      .x(([x]) => x)
      .y(([, y]) => y)
      .curve(curveBasis)(values) as string
  )
}

/** Constructs a drawable Path from a PriceList */
export function buildGraph(
  priceList: NullUndefined<PriceList>,
  precision: number,
  width = WIDTH,
  height = HEIGHT
): GraphData | null {
  if (!priceList || priceList.length === 0) return null
  priceList = priceList.slice().reverse()

  const formattedValues = priceList
    .filter((value) => !!value)
    .map((price) => [price!.timestamp, price!.close] as [number, number])

  const prices = formattedValues.map(([, price]) => price)
  const dates = formattedValues.map(([date]) => date)

  const lowPrice = Math.min(...prices)
  const highPrice = Math.max(...prices)
  const openPrice = prices[0]
  const closePrice = prices[prices.length - 1]

  const openDate = dates[0]
  const closeDate = dates[dates.length - 1]

  // TODO: consider using `scaleTime`
  const scaleX = scaleLinear().domain([openDate, closeDate]).range([0, width])
  const scaleY = scaleLinear().domain([lowPrice, highPrice]).range([height, 0])

  // normalize brings all paths to the same precision (number of points)
  const path = normalizePath(
    parse(
      line()
        .x(([x]) => scaleX(x) as number)
        .y(([, y]) => scaleY(y) as number)
        .curve(curveBasis)(formattedValues) as string
    ),
    precision,
    width
  )

  return {
    openDate,
    closeDate,
    lowPrice,
    highPrice,
    openPrice,
    closePrice,
    path,
  }
}
