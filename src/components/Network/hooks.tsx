import { default as React, useMemo } from 'react'
import { useAppTheme } from 'src/app/hooks'
import Check from 'src/assets/icons/check.svg'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { Separator } from 'src/components/layout/Separator'
import { Text } from 'src/components/Text'
import { ChainId, CHAIN_INFO } from 'src/constants/chains'
import { useActiveChainIds } from 'src/features/chains/utils'
import { ElementName } from 'src/features/telemetry/constants'

export function useNetworkOptions(
  selectedChain: ChainId | null,
  onPress: (chainId: ChainId | null) => void
) {
  const theme = useAppTheme()
  const activeChains = useActiveChainIds()

  return useMemo(
    () =>
      activeChains.map((chainId) => {
        const info = CHAIN_INFO[chainId]
        return {
          key: `${ElementName.NetworkButton}-${chainId}`,
          onPress: () => onPress(chainId),
          render: () => (
            <>
              <Separator />
              <Flex row alignItems="center" justifyContent="space-between" px="lg" py="md">
                <NetworkLogo chainId={chainId} size={24} />
                <Text color="textPrimary" variant="bodyLarge">
                  {info.label}
                </Text>
                <Box height={24} width={24}>
                  {selectedChain === chainId && (
                    <Check color={theme.colors.accentActive} height={24} width={24} />
                  )}
                </Box>
              </Flex>
            </>
          ),
        }
      }),
    [activeChains, onPress, selectedChain, theme.colors.accentActive]
  )
}
