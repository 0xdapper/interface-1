import { AnyAction } from '@reduxjs/toolkit'
import { Currency } from '@uniswap/sdk-core'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TransferArrowButton } from 'src/components/buttons/TransferArrowButton'
import { NFTViewer } from 'src/components/images/NFTViewer'
import { CurrencyInputPanel } from 'src/components/input/CurrencyInputPanel'
import { DecimalPad } from 'src/components/input/DecimalPad'
import { RecipientInputPanel } from 'src/components/input/RecipientInputPanel'
import { Box, Flex } from 'src/components/layout'
import { WarningAction } from 'src/components/warnings/types'
import { AssetType } from 'src/entities/assets'
import { NFTAsset } from 'src/features/nfts/types'
import { ElementName } from 'src/features/telemetry/constants'
import { useSwapActionHandlers, useUSDTokenUpdater } from 'src/features/transactions/swap/hooks'
import {
  CurrencyField,
  TransactionState,
} from 'src/features/transactions/transactionState/transactionState'
import {
  useDerivedTransferInfo,
  useUpdateTransferGasEstimate,
} from 'src/features/transactions/transfer/hooks'
import { currencyAddress } from 'src/utils/currencyId'

interface TransferTokenProps {
  state: TransactionState
  dispatch: React.Dispatch<AnyAction>
  onNext: () => void
}

export function TransferTokenForm({ state, dispatch, onNext }: TransferTokenProps) {
  const { t } = useTranslation()

  const derivedTransferInfo = useDerivedTransferInfo(state)
  const {
    currencies,
    currencyAmounts,
    currencyBalances,
    currencyTypes,
    formattedAmounts,
    exactAmountToken,
    exactAmountUSD = '',
    recipient,
    isUSDInput = false,
    warnings,
  } = derivedTransferInfo

  const { onSelectCurrency, onSetAmount, onSetMax, onSelectRecipient, onToggleUSDInput } =
    useSwapActionHandlers(dispatch)

  // TODO: consider simplifying this logic
  const isNFT =
    currencyTypes[CurrencyField.INPUT] === AssetType.ERC721 ||
    currencyTypes[CurrencyField.INPUT] === AssetType.ERC1155
  const currencyIn = !isNFT ? (currencies[CurrencyField.INPUT] as Currency) : undefined
  const nftIn = isNFT ? (currencies[CurrencyField.INPUT] as NFTAsset.Asset) : undefined

  useUSDTokenUpdater(
    dispatch,
    isUSDInput,
    exactAmountToken,
    exactAmountUSD,
    currencyIn ?? undefined
  )

  const actionButtonDisabled = warnings.some(
    (warning) => warning.action === WarningAction.DisableReview
  )

  // if action button is disabled, make amount undefined so that gas estimate doesn't run
  useUpdateTransferGasEstimate(
    dispatch,
    isNFT ? nftIn?.chainId : currencyIn?.chainId,
    isNFT ? nftIn?.asset_contract.address : currencyIn ? currencyAddress(currencyIn) : undefined,
    !actionButtonDisabled ? currencyAmounts[CurrencyField.INPUT]?.quotient.toString() : undefined,
    recipient,
    nftIn?.token_id,
    currencyTypes[CurrencyField.INPUT]
  )

  return (
    <Flex grow justifyContent="space-between" p="md">
      <Flex gap="md">
        {isNFT ? (
          <Flex centered mx="xl">
            {nftIn && <NFTViewer uri={nftIn.image_url} />}
          </Flex>
        ) : (
          <CurrencyInputPanel
            autoFocus
            currency={currencyIn}
            currencyAmount={currencyAmounts[CurrencyField.INPUT]}
            currencyBalance={currencyBalances[CurrencyField.INPUT]}
            isUSDInput={isUSDInput}
            value={formattedAmounts[CurrencyField.INPUT]}
            warnings={warnings}
            onSelectCurrency={(newCurrency: Currency) =>
              onSelectCurrency(CurrencyField.INPUT, newCurrency)
            }
            onSetAmount={(value) => onSetAmount(CurrencyField.INPUT, value, isUSDInput)}
            // TODO: enable USD inputs in transfer token form
            onSetMax={onSetMax}
            onToggleUSDInput={() => onToggleUSDInput(!isUSDInput)}
          />
        )}
        <Flex
          backgroundColor={recipient ? 'backgroundContainer' : 'none'}
          borderRadius="lg"
          mt="xl"
          width="100%">
          <Box zIndex="popover">
            <Box alignItems="center" height={36} style={StyleSheet.absoluteFill}>
              <Box alignItems="center" position="absolute" top={-24}>
                <TransferArrowButton
                  disabled
                  bg="backgroundAction"
                  borderColor="backgroundSurface"
                />
              </Box>
            </Box>
          </Box>
          <Flex pb="xl" pt="xl" px="md">
            <RecipientInputPanel
              recipientAddress={recipient}
              setRecipientAddress={onSelectRecipient}
            />
          </Flex>
        </Flex>
      </Flex>

      {isNFT ? null : (
        <DecimalPad
          setValue={(newValue) => onSetAmount(CurrencyField.INPUT, newValue, false)}
          value={formattedAmounts[CurrencyField.INPUT]}
        />
      )}

      <PrimaryButton
        disabled={actionButtonDisabled}
        label={t('Review transfer')}
        name={ElementName.ReviewTransfer}
        py="md"
        testID={ElementName.ReviewTransfer}
        textVariant="largeLabel"
        variant="blue"
        onPress={onNext}
      />
    </Flex>
  )
}
