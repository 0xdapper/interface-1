import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import { Button } from 'src/components/buttons/Button'
import { CurrencyInfoLogo } from 'src/components/CurrencyLogo/CurrencyInfoLogo'
import { Box, Flex } from 'src/components/layout'
import { InlineNetworkPill } from 'src/components/Network/NetworkPill'
import { Text } from 'src/components/Text'

import TokenWarningModal from 'src/components/tokens/TokenWarningModal'
import WarningIcon from 'src/components/tokens/WarningIcon'
import { TokenOption } from 'src/components/TokenSelector/types'
import {
  TokenWarningLevel,
  TokenWarningLevelMap,
  useDismissTokenWarnings,
} from 'src/features/tokens/useTokenWarningLevel'
import { currencyId } from 'src/utils/currencyId'
import { formatNumberBalance, formatUSDPrice } from 'src/utils/format'

interface OptionProps {
  option: TokenOption
  showNetworkPill: boolean
  onPress: () => void
  tokenWarningLevelMap: TokenWarningLevelMap
}

export function TokenOptionItem({
  option,
  showNetworkPill,
  onPress,
  tokenWarningLevelMap,
}: OptionProps) {
  const { currencyInfo, quantity, balanceUSD } = option
  const { currency } = currencyInfo

  const theme = useAppTheme()
  const { t } = useTranslation()

  const [showWarningModal, setShowWarningModal] = useState(false)

  const id = currencyId(currency.wrapped)

  const tokenWarningLevel =
    tokenWarningLevelMap?.[currency.chainId]?.[id] ?? TokenWarningLevel.MEDIUM

  const [dismissedWarningTokens, dismissTokenWarning] = useDismissTokenWarnings()
  const dismissed = Boolean(dismissedWarningTokens[currency.chainId]?.[currency.wrapped.address])

  const onPressTokenOption = useCallback(() => {
    if (
      tokenWarningLevel === TokenWarningLevel.BLOCKED ||
      ((tokenWarningLevel === TokenWarningLevel.LOW ||
        tokenWarningLevel === TokenWarningLevel.MEDIUM) &&
        !dismissed)
    ) {
      Keyboard.dismiss()
      setShowWarningModal(true)
      return
    }

    onPress()
  }, [dismissed, onPress, tokenWarningLevel])

  return (
    <>
      <Button
        opacity={tokenWarningLevel === TokenWarningLevel.BLOCKED ? 0.5 : 1}
        testID={`token-option-${currency.chainId}-${currency.symbol}`}
        onPress={onPressTokenOption}>
        <Flex row alignItems="center" gap="xs" justifyContent="space-between" py="sm">
          <Flex row shrink alignItems="center" gap="sm">
            <CurrencyInfoLogo currencyInfo={currencyInfo} size={32} />
            <Flex shrink alignItems="flex-start" gap="none">
              <Flex centered row gap="xs">
                <Flex shrink>
                  <Text color="textPrimary" numberOfLines={1} variant="subhead">
                    {currency.name}
                  </Text>
                </Flex>
                <WarningIcon
                  height={theme.iconSizes.sm}
                  tokenWarningLevel={tokenWarningLevel}
                  width={theme.iconSizes.sm}
                />
              </Flex>
              <Flex centered row gap="xs">
                <Text color="textPrimary" numberOfLines={1} variant="caption">
                  {currency.symbol}
                </Text>
                {showNetworkPill && <InlineNetworkPill chainId={currency.chainId} height={20} />}
              </Flex>
            </Flex>
          </Flex>

          {tokenWarningLevel === TokenWarningLevel.BLOCKED ? (
            <Flex backgroundColor="translucentBackground" borderRadius="md" padding="sm">
              <Text variant="mediumLabel">{t('Not available')}</Text>
            </Flex>
          ) : quantity && quantity !== 0 ? (
            <Box alignItems="flex-end">
              <Text variant="body">{formatNumberBalance(quantity)}</Text>
              <Text color="textSecondary" variant="bodySmall">
                {formatUSDPrice(balanceUSD)}
              </Text>
            </Box>
          ) : null}
        </Flex>
      </Button>

      {showWarningModal ? (
        <TokenWarningModal
          isVisible
          currency={currency}
          tokenWarningLevel={tokenWarningLevel}
          onAccept={() => {
            dismissTokenWarning(currency)
            setShowWarningModal(false)
            onPress()
          }}
          onClose={() => setShowWarningModal(false)}
        />
      ) : null}
    </>
  )
}
