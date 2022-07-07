import React from 'react'
import { useTranslation } from 'react-i18next'
import { Image, Share, StyleSheet } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import SendIcon from 'src/assets/icons/send.svg'
import ShareIcon from 'src/assets/icons/share.svg'
import VerifiedIcon from 'src/assets/icons/verified.svg'
import OpenSeaIcon from 'src/assets/logos/opensea.svg'
import { Button } from 'src/components/buttons/Button'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { NFTViewer } from 'src/components/images/NFTViewer'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { BottomSheetScrollModal } from 'src/components/modals/BottomSheetModal'
import { ApplyNFTPaletteButton, NFTPalette } from 'src/components/NFT/NFTPalette'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { AssetType } from 'src/entities/assets'
import { openModal } from 'src/features/modals/modalSlice'
import { NFTAsset } from 'src/features/nfts/types'
import { isEnabled } from 'src/features/remoteConfig'
import { TestConfig } from 'src/features/remoteConfig/testConfigs'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import {
  CurrencyField,
  TransactionState,
} from 'src/features/transactions/transactionState/transactionState'
import { flex } from 'src/styles/flex'
import { nftCollectionBlurImageStyle } from 'src/styles/image'
import { theme } from 'src/styles/theme'
import { openUri } from 'src/utils/linking'
import { logger } from 'src/utils/logger'

interface Props {
  nftAsset?: NFTAsset.Asset
  isVisible: boolean
  onClose: () => void
}

const COLLECTION_IMAGE_WIDTH = 20

export function NFTAssetModal({ nftAsset, isVisible, onClose }: Props) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  if (!nftAsset) return null

  const { name, image_url: imageUrl, collection, permalink } = nftAsset
  const {
    image_url: collectionImageUrl,
    name: collectionName,
    description: collectionDescription,
    safelist_request_status: safelistRequestStatus,
  } = collection

  const onPressSend = () => {
    const transferFormState: TransactionState = {
      exactCurrencyField: CurrencyField.INPUT,
      exactAmountToken: '',
      [CurrencyField.INPUT]: {
        chainId: ChainId.Mainnet,
        address: nftAsset.asset_contract.address,
        tokenId: nftAsset.token_id,
        type:
          nftAsset.asset_contract.schema_name === 'ERC1155' ? AssetType.ERC1155 : AssetType.ERC721,
      },
      [CurrencyField.OUTPUT]: null,
    }
    dispatch(openModal({ name: ModalName.Send, initialState: transferFormState }))
  }

  const onPressShare = async () => {
    try {
      await Share.share({
        title: `${collectionName}: ${name}`,
        url: `https://opensea.io/collection/${collection?.slug}`,
      })
    } catch (e) {
      logger.error('NFTAssetModal', 'onPressShare', 'Error sharing NFT asset', e)
    }
  }

  return (
    <BottomSheetScrollModal isVisible={isVisible} name={ModalName.NFTAsset} onClose={onClose}>
      <Flex gap="md" mx="lg" my="md">
        <Box>
          <NFTViewer
            // TODO: fix dimensions when nft work kicks off
            // height={ITEM_WIDTH}
            uri={imageUrl}
            // width={ITEM_WIDTH}
          />
          <Flex
            alignItems="flex-end"
            justifyContent="space-between"
            m="md"
            style={StyleSheet.absoluteFill}>
            <ApplyNFTPaletteButton asset={nftAsset} />
            {isEnabled(TestConfig.DisplayExtractedNFTColors) && <NFTPalette asset={nftAsset} />}
          </Flex>
        </Box>
        <Flex alignItems="center" flexDirection="row" mt="xs">
          <Text style={flex.fill} variant="headlineSmall">
            {name}
          </Text>
          <Flex>
            <Button onPress={onPressShare}>
              <ShareIcon color={theme.colors.textTertiary} height={24} width={24} />
            </Button>
          </Flex>
        </Flex>
        <Flex centered row>
          <PrimaryButton
            flex={1}
            icon={<OpenSeaIcon color={theme.colors.white} height={20} width={20} />}
            label={t('View')}
            name={ElementName.NFTAssetViewOnOpensea}
            testID={ElementName.NFTAssetViewOnOpensea}
            variant="black"
            onPress={() => openUri(permalink)}
          />
          <PrimaryButton
            flex={1}
            icon={<SendIcon color={theme.colors.white} height={20} strokeWidth={2} width={20} />}
            label={t('Send')}
            name={ElementName.Send}
            testID={ElementName.Send}
            variant="black"
            onPress={onPressSend}
          />
        </Flex>
        <Flex gap="sm">
          <Box
            bg="translucentBackground"
            borderColor="deprecated_gray100"
            borderRadius="md"
            borderWidth={1}>
            {collectionImageUrl && (
              <Image
                blurRadius={5}
                source={{ uri: collectionImageUrl }}
                style={[StyleSheet.absoluteFill, nftCollectionBlurImageStyle]}
              />
            )}
            <Flex
              bg={collectionImageUrl ? 'imageTintBackground' : 'translucentBackground'}
              borderColor="deprecated_gray100"
              borderRadius="md"
              borderWidth={1}
              gap="sm"
              p="md">
              <Text
                color="deprecated_gray400"
                style={flex.fill}
                variant="bodySmall">{t`From the Collection`}</Text>
              <Flex row alignItems="center" gap="xs">
                <Box height={COLLECTION_IMAGE_WIDTH} width={COLLECTION_IMAGE_WIDTH}>
                  <NFTViewer uri={collectionImageUrl} />
                </Box>
                <Text ml="xs" variant="body">
                  {collectionName}
                </Text>
                {safelistRequestStatus === 'verified' && (
                  <VerifiedIcon fill={theme.colors.deprecated_blue} height={16} width={16} />
                )}
              </Flex>
            </Flex>
          </Box>
          <Flex gap="md" mt="sm">
            <Text variant="mediumLabel">{t`Description`}</Text>
            <Text color="deprecated_gray400" variant="bodySmall">
              {collectionDescription}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </BottomSheetScrollModal>
  )
}
