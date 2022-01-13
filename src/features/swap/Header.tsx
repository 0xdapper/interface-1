import React from 'react'
import { useTranslation } from 'react-i18next'
import X from 'src/assets/icons/x.svg'
import { Button } from 'src/components/buttons/Button'
import { Box } from 'src/components/layout/Box'
import { NetworkPill } from 'src/components/Network/NetworkPill'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'

interface HeaderProps {
  chainId?: ChainId
  onPressBack: () => void
  onPressNetwork: () => void
}

export function Header({ chainId, onPressBack, onPressNetwork }: HeaderProps) {
  const { t } = useTranslation()

  return (
    <Box px="lg" flexDirection="row" justifyContent="space-between" alignItems="center">
      <Text variant="h3">{t`Swap`}</Text>
      <Box flexDirection="row" alignContent="center" justifyContent="flex-end" flex={1}>
        {chainId && (
          <Button ml="md" onPress={onPressNetwork} alignSelf="center">
            <NetworkPill chainId={chainId} />
          </Button>
        )}
        <Button ml="md" onPress={onPressBack} alignSelf="center">
          <X height={20} width={20} />
        </Button>
      </Box>
    </Box>
  )
}
