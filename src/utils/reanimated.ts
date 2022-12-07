/**
 * Util to format numbers inside reanimated worklets.
 *
 * This is nowhere near complete, but it has all the locales
 * we're likely to use.
 *
 * Code adapted from:
 * https://github.com/willsp/polyfill-Number.toLocaleString-with-Locales/blob/master/polyfill.number.toLocaleString.js
 */

function replaceSeparators(sNum: string, separators: { decimal: string; thousands: string }) {
  'worklet'
  const sNumParts = sNum.split('.')
  if (separators && separators.thousands) {
    // every three digits, replace it with the digits + the thousands separator
    // $1 indicates that the matched substring is to be replaced by the first captured group
    sNumParts[0] = sNumParts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + separators.thousands)
  }
  sNum = sNumParts.join(separators.decimal)

  return sNum
}

function renderFormat(
  template: string,
  options: Record<string, string> & { num?: string; code?: string }
) {
  'worklet'
  for (const option in options) {
    if (options[option].indexOf('-') !== -1) {
      options[option] = options[option].replace('-', '')
      template = '-' + template
    }

    if (options[option].indexOf('<') !== -1) {
      options[option] = options[option].replace('<', '')
      template = '<' + template
    }

    template = template.replace('{{' + option + '}}', options[option])
  }

  return template
}

function mapMatch(
  map: { [key in Language]: string | ((key: string, options?: OptionsType) => string) },
  locale: Language
): string | ((key: string, options?: OptionsType) => string) {
  'worklet'
  let match = locale

  if (!map.hasOwnProperty(locale)) {
    match = 'en'
  }

  return map[match]
}

function dotThousCommaDec(sNum: string) {
  'worklet'
  const separators = {
    decimal: ',',
    thousands: '.',
  }

  return replaceSeparators(sNum, separators)
}

function commaThousDotDec(sNum: string) {
  'worklet'
  const separators = {
    decimal: '.',
    thousands: ',',
  }

  return replaceSeparators(sNum, separators)
}

function spaceThousCommaDec(sNum: string) {
  'worklet'
  const separators = {
    decimal: ',',
    thousands: '\u00A0',
  }

  return replaceSeparators(sNum, separators)
}

function apostropheThousDotDec(sNum: string) {
  'worklet'
  const separators = {
    decimal: '.',
    thousands: '\u0027',
  }

  return replaceSeparators(sNum, separators)
}

const transformForLocale = {
  en: commaThousDotDec,
  'en-GB': commaThousDotDec,
  'en-US': commaThousDotDec,
  it: dotThousCommaDec,
  fr: spaceThousCommaDec,
  de: dotThousCommaDec,
  'de-DE': dotThousCommaDec,
  'de-AT': dotThousCommaDec,
  'de-CH': apostropheThousDotDec,
  'de-LI': apostropheThousDotDec,
  'de-BE': dotThousCommaDec,
  nl: dotThousCommaDec,
  'nl-BE': dotThousCommaDec,
  'nl-NL': dotThousCommaDec,
  ro: dotThousCommaDec,
  'ro-RO': dotThousCommaDec,
  ru: spaceThousCommaDec,
  'ru-RU': spaceThousCommaDec,
  hu: spaceThousCommaDec,
  'hu-HU': spaceThousCommaDec,
  'da-DK': dotThousCommaDec,
  'nb-NO': spaceThousCommaDec,
}

const currencyFormatMap = {
  en: 'pre',
  'en-GB': 'pre',
  'en-US': 'pre',
  it: 'post',
  fr: 'post',
  de: 'post',
  'de-DE': 'post',
  'de-AT': 'prespace',
  'de-CH': 'prespace',
  'de-LI': 'post',
  'de-BE': 'post',
  nl: 'post',
  'nl-BE': 'post',
  'nl-NL': 'post',
  ro: 'post',
  'ro-RO': 'post',
  ru: 'post',
  'ru-RU': 'post',
  hu: 'post',
  'hu-HU': 'post',
  'da-DK': 'post',
  'nb-NO': 'post',
}

export type Language = keyof typeof currencyFormatMap | keyof typeof transformForLocale

const currencySymbols: { [key: string]: string } = {
  afn: '؋',
  ars: '$',
  awg: 'ƒ',
  aud: '$',
  azn: '₼',
  bsd: '$',
  bbd: '$',
  byr: 'p.',
  bzd: 'BZ$',
  bmd: '$',
  bob: 'Bs.',
  bam: 'KM',
  bwp: 'P',
  bgn: 'лв',
  brl: 'R$',
  bnd: '$',
  khr: '៛',
  cad: '$',
  kyd: '$',
  clp: '$',
  cny: '¥',
  cop: '$',
  crc: '₡',
  hrk: 'kn',
  cup: '₱',
  czk: 'Kč',
  dkk: 'kr',
  dop: 'RD$',
  xcd: '$',
  egp: '£',
  svc: '$',
  eek: 'kr',
  eur: '€',
  fkp: '£',
  fjd: '$',
  ghc: '¢',
  gip: '£',
  gtq: 'Q',
  ggp: '£',
  gyd: '$',
  hnl: 'L',
  hkd: '$',
  huf: 'Ft',
  isk: 'kr',
  inr: '₹',
  idr: 'Rp',
  irr: '﷼',
  imp: '£',
  ils: '₪',
  jmd: 'J$',
  jpy: '¥',
  jep: '£',
  kes: 'KSh',
  kzt: 'лв',
  kpw: '₩',
  krw: '₩',
  kgs: 'лв',
  lak: '₭',
  lvl: 'Ls',
  lbp: '£',
  lrd: '$',
  ltl: 'Lt',
  mkd: 'ден',
  myr: 'RM',
  mur: '₨',
  mxn: '$',
  mnt: '₮',
  mzn: 'MT',
  nad: '$',
  npr: '₨',
  ang: 'ƒ',
  nzd: '$',
  nio: 'C$',
  ngn: '₦',
  nok: 'kr',
  omr: '﷼',
  pkr: '₨',
  pab: 'B/.',
  pyg: 'Gs',
  pen: 'S/.',
  php: '₱',
  pln: 'zł',
  qar: '﷼',
  ron: 'lei',
  rub: '₽',
  shp: '£',
  sar: '﷼',
  rsd: 'Дин.',
  scr: '₨',
  sgd: '$',
  sbd: '$',
  sos: 'S',
  zar: 'R',
  lkr: '₨',
  sek: 'kr',
  chf: 'CHF',
  srd: '$',
  syp: '£',
  tzs: 'TSh',
  twd: 'NT$',
  thb: '฿',
  ttd: 'TT$',
  try: '',
  trl: '₤',
  tvd: '$',
  ugx: 'USh',
  uah: '₴',
  gbp: '£',
  usd: '$',
  uyu: '$U',
  uzs: 'лв',
  vef: 'Bs',
  vnd: '₫',
  yer: '﷼',
  zwd: 'Z$',
}

const currencyFormats: { [key: string]: string } = {
  pre: '{{code}}{{num}}',
  post: '{{num}} {{code}}',
  prespace: '{{code}} {{num}}',
}

interface OptionsType {
  maximumFractionDigits?: number
  currency?: string
  style?: string
  currencyDisplay?: string
}

// need this function because JS will auto convert very small numbers to scientific notation
function convertSmallSciNotationToDecimal(value: number) {
  'worklet'
  const num = value.toPrecision(3)
  if (!num.includes('e-')) return num

  const [base, exponent] = num.split('e-')
  if (!base || !exponent) return '-'

  const decimal = base.replace('.', '')
  return '0.'.concat('0'.repeat(Number(exponent) - 1).concat(decimal))
}

export function numberToLocaleStringWorklet(
  value: number,
  locale: Language = 'en-US',
  options: OptionsType = {}
) {
  'worklet'
  if (locale && locale.length < 2) {
    throw new RangeError('Invalid language tag: ' + locale)
  }

  if (!value) {
    return '-'
  }

  let sNum

  // if we encounter any coins with a unit price over $1M then add a shorthand case
  if (value < 0) {
    sNum = value.toString()
  } else if (value < 0.00000001) {
    sNum = '<0.00000001'
  } else if (value < 1) {
    sNum = convertSmallSciNotationToDecimal(value)
  } else {
    sNum = value.toFixed(2)
  }

  sNum = (<(key: string, options?: OptionsType) => string>mapMatch(transformForLocale, locale))(
    sNum,
    options
  )

  if (options && options.currency && options.style === 'currency') {
    const format = currencyFormats[<string>mapMatch(currencyFormatMap, locale)]
    const symbol = currencySymbols[options.currency.toLowerCase()]
    if (options.currencyDisplay === 'code' || !symbol) {
      sNum = renderFormat(format, {
        num: sNum,
        code: options.currency.toUpperCase(),
      })
    } else {
      sNum = renderFormat(format, {
        num: sNum,
        code: symbol,
      })
    }
  }

  return sNum
}
