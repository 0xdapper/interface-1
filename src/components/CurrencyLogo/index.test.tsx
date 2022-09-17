import { render } from '@testing-library/react-native'
import React from 'react'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { ChainId } from 'src/constants/chains'
import { UNI } from 'src/constants/tokens'
import { renderWithTheme } from 'src/test/render'

jest.mock('src/assets', () => 'ethereum-logo.png')

it('renders a currency logo without network logo', () => {
  const tree = render(<CurrencyLogo currency={UNI[ChainId.Mainnet]} size={20} />).toJSON()
  expect(tree).toMatchSnapshot()
})

it('renders a currency logo with network logo', () => {
  const tree = renderWithTheme(<CurrencyLogo currency={UNI[ChainId.Goerli]} size={20} />)
  expect(tree).toMatchSnapshot()
})
