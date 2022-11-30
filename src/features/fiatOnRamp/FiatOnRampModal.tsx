import * as WebBrowser from 'expo-web-browser'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import FiatOnRampModalBackground from 'src/assets/backgrounds/fiat-onramp-modal.svg'
import InformationIcon from 'src/assets/icons/i-icon.svg'
import { Button, ButtonEmphasis, ButtonSize } from 'src/components/buttons/Button'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Box } from 'src/components/layout'
import { Flex } from 'src/components/layout/Flex'
import { Screen } from 'src/components/layout/Screen'
import { SpinningLoader } from 'src/components/loading/SpinningLoader'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import {
  useFiatOnRampWidgetUrlQuery,
  useIsFiatOnRampBuyAllowedQuery,
} from 'src/features/fiatOnRamp/api'
import { useFiatOnRampTransactionCreator } from 'src/features/fiatOnRamp/hooks'
import { closeModal, selectFiatOnRampModalState } from 'src/features/modals/modalSlice'
import { ElementName, EventName, ModalName } from 'src/features/telemetry/constants'
import { useActiveAccountAddressWithThrow } from 'src/features/wallet/hooks'
import { openUri } from 'src/utils/linking'

const MOONPAY_UNSUPPORTED_REGION_HELP_URL =
  'https://support.uniswap.org/hc/en-us/articles/10966551707533-Why-is-MoonPay-not-supported-in-my-region'

export function FiatOnRampModal() {
  const modalState = useAppSelector(selectFiatOnRampModalState)

  if (!modalState.isOpen) {
    // avoid doing any work until the modal needs to be open
    return null
  }

  return <FiatOnRampModalInner />
}

function FiatOnRampModalInner() {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const dispatch = useAppDispatch()
  const onClose = () => {
    dispatch(closeModal({ name: ModalName.FiatOnRamp }))
  }

  // we can consider adding `ownerAddress` as a prop to this modal in the future
  // for now, always assume the user wants to fund the current account
  const activeAccountAddress = useActiveAccountAddressWithThrow()
  const { externalTransactionId, dispatchAddTransaction } =
    useFiatOnRampTransactionCreator(activeAccountAddress)

  const {
    data: eligible,
    isLoading: isEligibleLoading,
    isError: isFiatBuyAllowedQueryError,
  } = useIsFiatOnRampBuyAllowedQuery()

  const {
    data: fiatOnRampHostUrl,
    isError: isWidgetUrlQueryError,
    isLoading: isWidgetUrlLoading,
  } = useFiatOnRampWidgetUrlQuery(
    // PERF: could consider skipping this call until eligibility in determined (ux tradeoffs)
    // as-is, avoids waterfalling requests => better ux
    {
      ownerAddress: activeAccountAddress,
      colorCode: theme.colors.accentAction,
      externalTransactionId,
    }
  )

  const onPress = () => {
    if (!fiatOnRampHostUrl) return

    const webBrowserOptions: WebBrowser.WebBrowserOpenOptions = {
      controlsColor: theme.colors.accentAction,
    }
    WebBrowser.openBrowserAsync(fiatOnRampHostUrl, webBrowserOptions)

    dispatchAddTransaction()
    onClose()
  }

  const isLoading = isEligibleLoading || isWidgetUrlLoading
  const isError = isFiatBuyAllowedQueryError || isWidgetUrlQueryError
  const buttonEnabled = eligible && !isError && fiatOnRampHostUrl

  return (
    <BottomSheetModal disableSwipe name={ModalName.FiatOnRamp} onClose={onClose}>
      <Screen bg="background1" edges={['bottom']} mb="lg" pt="md" px="lg">
        <Flex gap="lg">
          <FiatOnRampModalBackground color={theme.colors.background1} width="100%" />
          <Flex alignItems="center" gap="lg">
            <Flex alignItems="center" gap="sm">
              <Text color="textPrimary" textAlign="center" variant="headlineSmall">
                {t('Buy crypto with your back account or card')}
              </Text>
              <Box alignItems="center">
                <Text color="textSecondary" textAlign="center" variant="bodySmall">
                  {t('Get tokens on all supported chains at the best prices, powered by MoonPay.')}
                </Text>
              </Box>
            </Flex>
            <Flex width="100%">
              <Button
                fill
                CustomIcon={
                  isLoading ? (
                    <SpinningLoader color="textOnBrightPrimary" />
                  ) : eligible === false ? (
                    <TouchableArea onPress={() => openUri(MOONPAY_UNSUPPORTED_REGION_HELP_URL)}>
                      <InformationIcon color={theme.colors.white} width={theme.iconSizes.md} />
                    </TouchableArea>
                  ) : undefined
                }
                disabled={!buttonEnabled}
                emphasis={ButtonEmphasis.Primary}
                eventName={EventName.FiatOnRampWidgetOpened}
                label={
                  isLoading
                    ? undefined
                    : eligible === false
                    ? t('Not supported in your region')
                    : t('Buy Crypto')
                }
                name={ElementName.FiatOnRampWidgetButton}
                properties={{ externalTransactionId }}
                size={ButtonSize.Medium}
                onPress={onPress}
              />
              {isError ? (
                <Text color="textSecondary" textAlign="center" variant="bodyMicro">
                  {t('Something went wrong on our side.')}
                </Text>
              ) : null}
            </Flex>
          </Flex>
        </Flex>
      </Screen>
    </BottomSheetModal>
  )
}
