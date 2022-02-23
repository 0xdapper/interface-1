import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import InfoCircle from 'src/assets/icons/info-circle.svg'
import { Button } from 'src/components/buttons/Button'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { Trade } from 'src/features/swap/useTrade'
import { formatExecutionPrice } from 'src/features/swap/utils'
import { ElementName, SectionName } from 'src/features/telemetry/constants'
import { Trace } from 'src/features/telemetry/Trace'
import { useNetworkColors } from 'src/utils/colors'
import { formatPrice } from 'src/utils/format'

interface QuickDetailsProps {
  trade: Trade | undefined | null
  label: string | null
}

export function QuickDetails(props: QuickDetailsProps) {
  const { label, trade } = props

  const chainId = trade?.inputAmount.currency.chainId ?? ChainId.Mainnet
  const networkColors = useNetworkColors(chainId)

  const theme = useAppTheme()

  return (
    <Trace logImpression section={SectionName.QuickDetails}>
      <Box
        alignItems="center"
        alignSelf="stretch"
        flexDirection="row"
        justifyContent="space-between">
        <Flex centered row gap="xs">
          <InfoCircle
            color={label ? theme.colors.gray400 : theme.colors.mainForeground}
            height={20}
            width={20}
          />
          <Text color={label ? 'gray400' : 'mainForeground'} fontWeight="500" variant="bodyMd">
            {label || formatExecutionPrice(trade?.executionPrice)}
          </Text>
        </Flex>
        {trade && (
          <Button
            borderRadius="sm"
            name={ElementName.NetworkButton}
            style={{ backgroundColor: networkColors.background }}
            onPress={() => {
              // TODO: implement gas price setting ui
            }}>
            <Flex centered flexDirection="row" gap="xs" m="sm">
              <NetworkLogo chainId={trade.inputAmount.wrapped.currency.chainId} size={15} />
              <Text style={{ color: networkColors.foreground }} variant="bodyMd">
                {formatPrice(trade.quote?.gasUseEstimateUSD?.toString())}
              </Text>
            </Flex>
          </Button>
        )}
      </Box>
    </Trace>
  )
}
