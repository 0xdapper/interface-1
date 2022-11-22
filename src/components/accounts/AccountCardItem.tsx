import React, { useMemo } from 'react'
import { useAppTheme } from 'src/app/hooks'
import Check from 'src/assets/icons/check.svg'
import TripleDots from 'src/assets/icons/triple-dots.svg'
import { AccountIcon } from 'src/components/AccountIcon'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Box, Flex } from 'src/components/layout'
import { Loading } from 'src/components/loading'
import { NotificationBadge } from 'src/components/notifications/Badge'
import { Text } from 'src/components/Text'
import { DecimalNumber } from 'src/components/text/DecimalNumber'
import { useENSAvatar } from 'src/features/ens/api'
import { useSelectAddressHasNotifications } from 'src/features/notifications/hooks'
import { ElementName } from 'src/features/telemetry/constants'
import { useDisplayName } from 'src/features/wallet/hooks'
import { iconSizes } from 'src/styles/sizing'
import { formatUSDPrice, NumberType } from 'src/utils/format'

type AccountCardItemProps = {
  address: Address
  isActive?: boolean
  isViewOnly: boolean
  onPress?: (address: Address) => void
  onPressEdit?: (address: Address) => void
} & PortfolioValueProps

type PortfolioValueProps = {
  isPortfolioValueLoading: boolean
  portfolioValue: NullUndefined<number>
}

function PortfolioValue({ isPortfolioValueLoading, portfolioValue }: PortfolioValueProps) {
  const theme = useAppTheme()

  if (isPortfolioValueLoading && !portfolioValue) {
    return (
      <Box width="50%">
        <Loading height={theme.textVariants.bodySmall.lineHeight} type="text" />
      </Box>
    )
  }

  return (
    <DecimalNumber
      color="textSecondary"
      number={formatUSDPrice(portfolioValue, NumberType.FiatTokenQuantity)}
      variant="bodySmall"
    />
  )
}

export function AccountCardItem({
  address,
  isViewOnly,
  isActive,
  isPortfolioValueLoading,
  portfolioValue,
  onPress,
  onPressEdit,
}: AccountCardItemProps) {
  const theme = useAppTheme()
  const displayName = useDisplayName(address)
  const { data: avatar } = useENSAvatar(address)
  const hasNotifications = useSelectAddressHasNotifications(address)

  const icon = useMemo(() => {
    return (
      <AccountIcon
        address={address}
        avatarUri={avatar}
        showViewOnlyBadge={isViewOnly}
        size={iconSizes.xl}
      />
    )
  }, [address, avatar, isViewOnly])

  return (
    <TouchableArea hapticFeedback pb="sm" pt="xs" px="lg" onPress={() => onPress?.(address)}>
      <Flex row alignItems="center" testID={`account_item/${address}`}>
        <Flex row shrink alignItems="center">
          <NotificationBadge showIndicator={hasNotifications}>{icon}</NotificationBadge>
          <Flex fill gap="none">
            <Text numberOfLines={1} variant="bodyLarge">
              {displayName?.name}
            </Text>
            <PortfolioValue
              isPortfolioValueLoading={isPortfolioValueLoading}
              portfolioValue={portfolioValue}
            />
          </Flex>
        </Flex>
        <Flex row alignItems="center" gap="xs">
          {isActive && (
            <Check
              color={theme.colors.userThemeMagenta}
              height={theme.iconSizes.md}
              width={theme.iconSizes.md}
            />
          )}
          {onPressEdit && (
            <TouchableArea name={ElementName.Edit} onPress={() => onPressEdit(address)}>
              <TripleDots
                color={theme.colors.textTertiary}
                height={iconSizes.xs}
                strokeLinecap="round"
                strokeWidth="1"
                width={iconSizes.sm}
              />
            </TouchableArea>
          )}
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
