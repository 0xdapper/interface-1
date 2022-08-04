import { LayoutProps } from '@shopify/restyle'
import React, { PropsWithChildren } from 'react'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import CopyIcon from 'src/assets/icons/copy-sheets.svg'
import { Button } from 'src/components/buttons/Button'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { UniconWithVisibilityBadge } from 'src/components/unicons/UniconWithVisibilityBadge'
import { pushNotification } from 'src/features/notifications/notificationSlice'
import { AppNotificationType } from 'src/features/notifications/types'
import { ElementName } from 'src/features/telemetry/constants'
import { useDisplayName } from 'src/features/wallet/hooks'
import { Theme } from 'src/styles/theme'
import { shortenAddress } from 'src/utils/addresses'
import { setClipboard } from 'src/utils/clipboard'

type AddressDisplayProps = {
  address: string
  showAddressAsSubtitle?: boolean
  size?: number
  variant?: keyof Theme['textVariants']
  color?: keyof Theme['colors']
  captionVariant?: keyof Theme['textVariants']
  captionColor?: keyof Theme['colors']
  verticalGap?: keyof Theme['spacing']
  horizontalGap?: keyof Theme['spacing']
  showNotificationBadge?: boolean
  direction?: 'row' | 'column'
  showCopy?: boolean
  showUnicon?: boolean
  showViewOnly?: boolean
  showShortenedEns?: boolean
} & LayoutProps<Theme>

type CopyButtonWrapperProps = {
  onPress?: () => void
}

function CopyButtonWrapper({ children, onPress }: PropsWithChildren<CopyButtonWrapperProps>) {
  if (onPress)
    return (
      <Button name={ElementName.Copy} testID={ElementName.Copy} onPress={onPress}>
        {children}
      </Button>
    )

  return <>{children}</>
}

/** Helper component to display identicon and formatted address */
export function AddressDisplay({
  address,
  size = 24,
  variant = 'body',
  color = 'textPrimary',
  captionVariant = 'caption',
  captionColor = 'textSecondary',
  verticalGap = 'xxs',
  horizontalGap = 'sm',
  showAddressAsSubtitle,
  direction = 'row',
  showCopy = false,
  showUnicon = true,
  showViewOnly = false,
  showShortenedEns = false,
  ...rest
}: AddressDisplayProps) {
  const dispatch = useAppDispatch()
  const theme = useAppTheme()
  const displayName = useDisplayName(address, showShortenedEns)
  const nameTypeIsAddress = displayName?.type === 'address'

  const onPressCopyAddress = () => {
    if (!address) return
    dispatch(pushNotification({ type: AppNotificationType.Copied }))
    setClipboard(address)
  }

  const showCaption = showAddressAsSubtitle && !nameTypeIsAddress

  // Extract sizes so copy icon can match font variants
  const mainSize = theme.textVariants[variant].fontSize
  const captionSize = theme.textVariants[captionVariant].fontSize

  return (
    <Flex alignItems="center" flexDirection={direction} gap={horizontalGap} {...rest}>
      {showUnicon && (
        <UniconWithVisibilityBadge address={address} showViewOnlyBadge={showViewOnly} size={size} />
      )}
      <Flex
        alignItems={!showUnicon || direction === 'column' ? 'center' : 'flex-start'}
        flexShrink={1}
        gap={verticalGap}>
        <CopyButtonWrapper onPress={showCopy && !showCaption ? onPressCopyAddress : undefined}>
          <Flex centered row gap="sm">
            <Text
              color={color}
              ellipsizeMode="tail"
              numberOfLines={1}
              testID={`address-display/name/${displayName?.name}`}
              variant={variant}>
              {displayName?.name}
            </Text>
            {showCopy && !showCaption && (
              <CopyIcon color={theme.colors.textPrimary} height={mainSize} width={mainSize} />
            )}
          </Flex>
        </CopyButtonWrapper>
        {showCaption && (
          <CopyButtonWrapper onPress={showCopy ? onPressCopyAddress : undefined}>
            <Flex centered row gap="sm">
              <Text color={captionColor} variant={captionVariant}>
                {shortenAddress(address)}
              </Text>
              {showCopy && (
                <CopyIcon
                  color={theme.colors[captionColor]}
                  height={captionSize}
                  width={captionSize}
                />
              )}
            </Flex>
          </CopyButtonWrapper>
        )}
      </Flex>
    </Flex>
  )
}
