import { render } from '@testing-library/react-native'
import React, { createElement } from 'react'
import { View } from 'react-native'
import { UniconAttributes } from 'src/components/unicons/types'
import { Unicon } from 'src/components/unicons/Unicon'
import { deriveUniconAttributeIndices, isEthAddress } from 'src/components/unicons/utils'
import { renderWithTheme } from 'src/test/render'

const PlainView = ({ children, ...props }: any) => createElement(View, props, children)
const noop = () => null

jest.mock('@shopify/react-native-skia', () => {
  return {
    Canvas: PlainView,
    BlurMask: PlainView,
    Circle: PlainView,
    Group: PlainView,
    LinearGradient: PlainView,
    Mask: PlainView,
    Path: PlainView,
    Rect: PlainView,
    vec: noop,
  }
})

it('renders a Unicon', () => {
  const tree = render(
    <Unicon address="0x11E4857Bb9993a50c685A79AFad4E6F65D518DDa" size={36} />
  ).toJSON()
  expect(tree).toMatchSnapshot()
})

it('fails to render a Unicon if given an invalid eth address', () => {
  const tree = renderWithTheme(<Unicon address="mymoneydontjigglejiggle" size={36} />)
  expect(tree).toMatchSnapshot()
})

it('identifies valid and invalid eth addresses', () => {
  const normal = '0x0c7213bac2B9e7b99ABa344243C9de84227911Be'
  const no0X = '0c7213bac2B9e7b99ABa344243C9de84227911Be'
  const tooShort = '0x0c713bac2B9e7b99ABa344243C9de84227911Be'
  const tooLong = '0x0c7213bac2B9e7b99ABa344243C9de84227911Beaaa'
  const definitelyAnAddress = 'mymoneydontjigglejiggle'

  expect(isEthAddress(normal)).toBe(true)
  expect(isEthAddress(no0X)).toBe(false)
  expect(isEthAddress(tooShort)).toBe(false)
  expect(isEthAddress(tooLong)).toBe(false)
  expect(isEthAddress(definitelyAnAddress)).toBe(false)
})

it('derives attribute indices from eth addresses', () => {
  const specialAddress = '0x01010101c2B9e7b99ABa344243C9de84227911Be'
  const derivedIndices = deriveUniconAttributeIndices(specialAddress)
  expect(derivedIndices).toEqual({
    [UniconAttributes.GradientStart]: 1,
    [UniconAttributes.GradientEnd]: 1,
    [UniconAttributes.Container]: 1,
    [UniconAttributes.Shape]: 1,
  })
})
