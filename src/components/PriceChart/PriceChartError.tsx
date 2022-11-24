import React, { ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Flex } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { CHART_HEIGHT } from 'src/components/PriceChart/utils'
import { Text } from 'src/components/Text'

export function PriceChartError({
  onRetry,
}: Pick<ComponentProps<typeof BaseCard.ErrorState>, 'onRetry'>) {
  const { t } = useTranslation()
  return (
    <Flex gap="md" mx="lg">
      <Flex gap="sm">
        <Text color="textTertiary" variant="headlineLarge">
          {
            // em dash
            '\u2013'
          }
        </Text>
        <Text color="textTertiary" variant="bodySmall">
          -
        </Text>
      </Flex>
      <Box
        alignItems="center"
        borderRadius="lg"
        height={CHART_HEIGHT}
        justifyContent="center"
        overflow="hidden">
        <BaseCard.ErrorState
          description={t('Something went wrong on our side.')}
          retryButtonLabel={t('Retry')}
          title={t("Couldn't load price chart")}
          onRetry={onRetry}
        />
      </Box>
    </Flex>
  )
}
