import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SwitchNetworksModal } from 'src/app/features/home/SwitchNetworksModal'
import { AppRoutes } from 'src/app/navigation/constants'
import { useDappContext } from 'src/background/features/dapp/hooks'
import { Icons, Popover, XStack } from 'ui/src'
import { Button } from 'ui/src/components/button/Button'
import { Chevron } from 'ui/src/components/icons/Chevron'
import { Flex } from 'ui/src/components/layout/Flex'
import { Text } from 'ui/src/components/text/Text'
import { Unicon } from 'ui/src/components/Unicon'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { useDisplayName } from 'wallet/src/features/wallet/hooks'

type PortfolioHeaderProps = {
  address: Address
}

export function PortfolioHeader({ address }: PortfolioHeaderProps): JSX.Element {
  const navigate = useNavigate()

  const displayName = useDisplayName(address)?.name

  const onPressAccount = (): void => {
    navigate(AppRoutes.AccountSwitcher.valueOf())
  }

  // Value does not matter, only used as a trigger to re-render the component when the dapp connection status changes
  const [updateConnectionStatus, setUpdateConnectionStatus] = useState(false)
  const { dappConnected } = useDappContext(undefined, updateConnectionStatus)

  return (
    <XStack alignItems="center" justifyContent="space-between" padding="$spacing16">
      <Flex
        alignItems="center"
        flexDirection="row"
        gap="$spacing8"
        justifyContent="center"
        onPress={onPressAccount}>
        <Unicon address={address} size={iconSizes.icon36} />
        <Text variant="subheadSmall">{displayName}</Text>
        <Chevron
          color="$textSecondary"
          direction="s"
          height={iconSizes.icon20}
          width={iconSizes.icon20}
        />
      </Flex>
      <XStack alignItems="center" gap="$spacing16" justifyContent="space-around">
        {dappConnected ? (
          <Popover>
            <Popover.Trigger
              onTouchEnd={(): void => setUpdateConnectionStatus(!updateConnectionStatus)}>
              <Icons.Globe
                color="$textSecondary"
                height={iconSizes.icon20}
                width={iconSizes.icon20}
              />
            </Popover.Trigger>
            <Popover.Content borderRadius="$rounded12">
              <SwitchNetworksModal />
            </Popover.Content>
          </Popover>
        ) : null}
        <Button padding={0} onPress={(): void => navigate('/settings')}>
          <Icons.Settings
            color="$textSecondary"
            height={iconSizes.icon24}
            width={iconSizes.icon24}
          />
        </Button>
      </XStack>
    </XStack>
  )
}
