import { useTheme } from '@shopify/restyle'
import { Currency } from '@uniswap/sdk-core'
import { selectionAsync } from 'expo-haptics'
import React, { ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import { navigate } from 'src/app/navigation/rootNavigation'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { CurrencySelect } from 'src/components/CurrencySelector/CurrencySelect'
import { Toggle } from 'src/components/CurrencySelector/Toggle'
import { Chevron } from 'src/components/icons/Chevron'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { CenterBox } from 'src/components/layout/CenterBox'
import { Text } from 'src/components/Text'
import { Screens } from 'src/screens/Screens'
import { Theme } from 'src/styles/theme'
import { currencyId } from 'src/utils/currencyId'

interface CurrencySelectorProps {
  showNonZeroBalancesOnly?: boolean
  onSelectCurrency: ComponentProps<typeof CurrencySelect>['onSelectCurrency']
  otherSelectedCurrency?: Currency | null
  selectedCurrency?: Currency | null
}

export function CurrencySelector({
  showNonZeroBalancesOnly,
  onSelectCurrency,
  otherSelectedCurrency,
  selectedCurrency,
}: CurrencySelectorProps) {
  const { t } = useTranslation()
  const theme = useTheme<Theme>()

  const selectCurrency = () => {
    selectionAsync()
    navigate(Screens.CurrencySelector, {
      onSelectCurrency,
      otherCurrencyAddress: otherSelectedCurrency ? currencyId(otherSelectedCurrency) : undefined,
      otherCurrencyChainId: otherSelectedCurrency?.chainId,
      selectedCurrencyAddress: selectedCurrency ? currencyId(selectedCurrency) : undefined,
      selectedCurrencyChainId: selectedCurrency?.chainId,
      showNonZeroBalancesOnly: Boolean(showNonZeroBalancesOnly),
    })
  }

  return (
    <Box>
      <Toggle
        backgroundColor={!selectedCurrency ? 'accentActive' : 'backgroundAction'}
        filled={!selectedCurrency}
        testID={`currency-selector-toggle-${showNonZeroBalancesOnly ? 'in' : 'out'}`}
        onToggle={() => {
          selectCurrency()
        }}>
        <CenterBox>
          {selectedCurrency ? (
            <Flex centered row flexDirection="row" gap="sm" px="sm" py="xs">
              <CurrencyLogo currency={selectedCurrency} size={25} />
              <Text color="textPrimary" variant="headlineSmall">
                {selectedCurrency.symbol}
              </Text>
              <Chevron color={theme.colors.textPrimary} direction="e" />
            </Flex>
          ) : (
            <Flex centered row gap="xs" px="md" py="xs">
              <Text color="accentTextLightPrimary" lineHeight={20} variant="mediumLabel">
                {t('Choose token')}
              </Text>
              <Chevron color="accentTextLightPrimary" direction="e" />
            </Flex>
          )}
        </CenterBox>
      </Toggle>
    </Box>
  )
}
