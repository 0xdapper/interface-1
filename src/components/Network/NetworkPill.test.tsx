import React from 'react'
import { InlineNetworkPill, NetworkPill } from 'src/components/Network/NetworkPill'
import { ChainId } from 'src/constants/chains'
import { renderWithTheme } from 'src/test/render'

it('renders a NetworkPill without image', () => {
  const tree = renderWithTheme(<NetworkPill chainId={ChainId.Rinkeby} />)
  expect(tree).toMatchSnapshot()
})

it('renders a NetworkPill with border', () => {
  const tree = renderWithTheme(<NetworkPill chainId={ChainId.Rinkeby} showBorder={true} />)
  expect(tree).toMatchSnapshot()
})

it('renders an InlineNetworkPill', () => {
  const tree = renderWithTheme(<InlineNetworkPill chainId={ChainId.Rinkeby} />)
  expect(tree).toMatchSnapshot()
})
