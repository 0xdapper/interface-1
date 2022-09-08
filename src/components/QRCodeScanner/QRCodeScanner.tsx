import MaskedView from '@react-native-masked-view/masked-view'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, LayoutRectangle, StyleSheet, ViewStyle } from 'react-native'
import { FadeIn, FadeOut, runOnJS } from 'react-native-reanimated'
import {
  Camera,
  CameraPermissionRequestResult,
  useCameraDevices,
  useFrameProcessor,
} from 'react-native-vision-camera'
import { useAppTheme } from 'src/app/hooks'
import CameraScan from 'src/assets/icons/camera-scan.svg'
import GlobalIcon from 'src/assets/icons/global.svg'
import WalletConnectLogo from 'src/assets/icons/walletconnect.svg'
import { Button } from 'src/components/buttons/Button'
import PasteButton from 'src/components/buttons/PasteButton'
import { DevelopmentOnly } from 'src/components/DevelopmentOnly/DevelopmentOnly'
import { AnimatedFlex, Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { dimensions } from 'src/styles/sizing'
import { opacify } from 'src/utils/colors'
import { openSettings } from 'src/utils/linking'
import { Barcode, BarcodeFormat, scanBarcodes } from 'vision-camera-code-scanner'

type QRCodeScannerProps = {
  onScanCode: (data: string) => void
  shouldFreezeCamera: boolean
}
interface WCScannerProps extends QRCodeScannerProps {
  numConnections: number
  onPressConnections: () => void
}

function isWalletConnect(props: QRCodeScannerProps | WCScannerProps): props is WCScannerProps {
  return 'numConnections' in props
}

const SCAN_ICON_WIDTH_RATIO = 0.7
const SCAN_ICON_MASK_OFFSET = 10 // used for mask to match spacing in CameraScan SVG

export function QRCodeScanner(props: QRCodeScannerProps | WCScannerProps) {
  const { onScanCode, shouldFreezeCamera } = props
  const isWalletConnectModal = isWalletConnect(props)

  const { t } = useTranslation()
  const theme = useAppTheme()

  // restricted is an iOS-only permission status: https://mrousavy.com/react-native-vision-camera/docs/guides
  const [permission, setPermission] = useState<CameraPermissionRequestResult | null | 'restricted'>(
    null
  )

  const devices = useCameraDevices()
  const backCamera = devices.back

  // QR codes are a "type" of Barcode in the scanning library
  const [barcodes, setBarcodes] = useState<Barcode[]>([])
  const data = barcodes[0]?.content.data
  const [infoLayout, setInfoLayout] = useState<LayoutRectangle | null>()
  const [connectionLayout, setConnectionLayout] = useState<LayoutRectangle | null>()

  useEffect(() => {
    async function getPermissionStatuses() {
      const status = await Camera.getCameraPermissionStatus()

      if (status === 'not-determined') {
        const perm = await Camera.requestCameraPermission()
        setPermission(perm)
      } else {
        setPermission(status)
      }
    }

    getPermissionStatuses()
  }, [])

  useEffect(() => {
    if (permission === 'denied') {
      Alert.alert(
        t('Camera is disabled'),
        t('To scan a code, allow Camera access in system settings'),
        [
          { text: t('Go to settings'), onPress: openSettings },
          {
            text: t('Not now'),
          },
        ]
      )
    }
  }, [permission, t])

  useEffect(() => {
    if (!data) return

    // qr code scanning returns string here
    onScanCode(data as string)
  }, [data, onScanCode])

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet'
    const detectedBarcodes = scanBarcodes(frame, [BarcodeFormat.QR_CODE])
    runOnJS(setBarcodes)(detectedBarcodes)
  }, [])

  return (
    <AnimatedFlex grow borderRadius="md" entering={FadeIn} exiting={FadeOut} overflow="hidden">
      <MaskedView
        maskElement={
          <Box
            alignItems="center"
            bg="backgroundScrim"
            justifyContent="center"
            position="absolute"
            style={StyleSheet.absoluteFill}>
            <Box
              bg="white"
              height={dimensions.fullWidth * SCAN_ICON_WIDTH_RATIO - SCAN_ICON_MASK_OFFSET}
              style={scanIconMaskStyle}
              width={dimensions.fullWidth * SCAN_ICON_WIDTH_RATIO - SCAN_ICON_MASK_OFFSET}
            />
          </Box>
        }
        style={StyleSheet.absoluteFill}>
        {backCamera && (
          <Camera
            device={backCamera}
            frameProcessor={frameProcessor}
            isActive={!shouldFreezeCamera}
            style={StyleSheet.absoluteFill}
            zoom={backCamera.neutralZoom}
          />
        )}
      </MaskedView>
      <Flex centered gap="xxl" style={StyleSheet.absoluteFill}>
        <Flex alignItems="center" gap="none">
          <Flex
            centered
            gap="sm"
            position="absolute"
            style={{
              transform: [{ translateY: infoLayout ? -infoLayout.height - theme.spacing.lg : 0 }],
            }}
            top={0}
            width="100%"
            onLayout={(event: any) => setInfoLayout(event.nativeEvent.layout)}>
            <Text color="textPrimary" variant="largeLabel">
              {t('Scan a QR code')}
            </Text>
            {isWalletConnectModal ? (
              <>
                <Flex centered row gap="sm">
                  <WalletConnectLogo height={16} width={16} />
                  <Text color="textPrimary" variant="bodySmall">
                    {t('Connect to an app with WalletConnect')}
                  </Text>
                </Flex>
                <DevelopmentOnly>
                  <PasteButton onPress={onScanCode} />
                </DevelopmentOnly>
              </>
            ) : (
              <Text color="textPrimary" variant="bodySmall">
                {t('Scan a wallet address to send tokens')}
              </Text>
            )}
          </Flex>
          <CameraScan
            color={theme.colors.white}
            height={dimensions.fullWidth * SCAN_ICON_WIDTH_RATIO}
            strokeWidth={5}
            width={dimensions.fullWidth * SCAN_ICON_WIDTH_RATIO}
          />
          {isWalletConnectModal && props.numConnections > 0 && (
            <Button
              bottom={0}
              position="absolute"
              style={{
                transform: [
                  { translateY: connectionLayout ? connectionLayout.height + theme.spacing.lg : 0 },
                ],
              }}
              onLayout={(event: any) => setConnectionLayout(event.nativeEvent.layout)}
              onPress={props.onPressConnections}>
              <Flex
                row
                alignItems="center"
                borderRadius="md"
                gap="xs"
                px="md"
                py="sm"
                style={{ backgroundColor: opacify(40, theme.colors.black) }}>
                <GlobalIcon color={theme.colors.white} height={20} strokeWidth={2} width={20} />
                <Text color="white" variant="mediumLabel">
                  {props.numConnections === 1
                    ? t('1 site connected')
                    : t('{{numConnections}} sites connected', {
                        numConnections: props.numConnections,
                      })}
                </Text>
              </Flex>
            </Button>
          )}
        </Flex>
      </Flex>
    </AnimatedFlex>
  )
}

const scanIconMaskStyle: ViewStyle = {
  borderRadius: 30,
}
