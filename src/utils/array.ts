function onlyUnique<T>(value: T, index: number, self: T[]) {
  return self.indexOf(value) === index
}

export function unique<T>(array: any[], isUnique: typeof onlyUnique = onlyUnique): T[] {
  return array.filter(isUnique)
}

export function next<T>(array: T[], current: T) {
  const i = array.findIndex((v) => v === current)
  if (i < 0) return undefined
  return array[(i + 1) % array.length]
}

// get items in `array` that are not in `without`
// e.g. difference([B, C, D], [A, B, C]) would return ([D])
export function differenceWith<T>(
  array: T[],
  without: T[],
  comparator: (item1: T, item2: T) => boolean
) {
  return array.filter((item: T) => {
    const inWithout = Boolean(without.find((otherItem: T) => comparator(item, otherItem)))
    return !inWithout
  })
}
