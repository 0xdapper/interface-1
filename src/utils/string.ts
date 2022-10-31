interface Sliceable {
  length: number
  slice: (i: number, j: number) => any
}

export function chunk<T extends Sliceable>(str: T, size: number) {
  const R: Array<T> = []
  for (let i = 0; i < str.length; i += size) {
    R.push(str.slice(i, i + size))
  }
  return R
}

export function trimToLength(value: string, maxLength: number) {
  if (!value) return ''
  const trimmed = value.trim()
  return trimmed.length > maxLength ? trimmed.substring(0, maxLength) + '...' : trimmed
}

// Remove slashes (/) from the beginning and end of the string
export function trimSlashes(value: string) {
  return value.replace(/^\/+|\/+$/g, '')
}

export function toTitleCase(str: string) {
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}

export function normalizeTextInput(input: string, toLowerCase = true) {
  // Trim and replace all white spaces with a single space
  const trimmed = input.trim().replace(/\s+/g, ' ')
  return toLowerCase ? trimmed.toLowerCase() : trimmed
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}
