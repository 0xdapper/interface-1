import { ImpactFeedbackStyle } from 'expo-haptics'
import { default as React, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ViewProps } from 'react-native'
import ContextMenu from 'react-native-context-menu-view'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { useEagerExternalProfileNavigation } from 'src/app/navigation/hooks'
import { AccountIcon } from 'src/components/AccountIcon'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import RemoveButton from 'src/components/explore/RemoveButton'
import { Box, Flex } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { Text } from 'src/components/Text'
import { useENSAvatar } from 'src/features/ens/api'
import { selectWatchedAddressSet } from 'src/features/favorites/selectors'
import { removeWatchedAddress } from 'src/features/favorites/slice'
import { useDisplayName } from 'src/features/wallet/hooks'
import { flex } from 'src/styles/flex'
import { theme } from 'src/styles/theme'

type FavoriteWalletCardProps = {
  address: Address
  isEditing?: boolean
  setIsEditing: (update: boolean) => void
} & ViewProps

export default function FavoriteWalletCard({
  address,
  isEditing,
  setIsEditing,
  ...rest
}: FavoriteWalletCardProps) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { preload, navigate } = useEagerExternalProfileNavigation()

  const displayName = useDisplayName(address)
  const { data: avatar } = useENSAvatar(address)

  const watchedWalletsSet = useAppSelector(selectWatchedAddressSet)

  const icon = useMemo(() => {
    return (
      <AccountIcon
        address={address}
        avatarUri={avatar}
        showViewOnlyBadge={false}
        size={theme.iconSizes.md}
      />
    )
  }, [address, avatar])

  const onRemove = useCallback(() => {
    // undo edit mode if remmoving last wallet
    if (watchedWalletsSet.size === 1) {
      setIsEditing(false)
    }
    dispatch(removeWatchedAddress({ address }))
  }, [address, dispatch, setIsEditing, watchedWalletsSet.size])

  /// Options for long press context menu
  const menuActions = useMemo(() => {
    return [
      { title: t('Remove favorite'), systemIcon: 'heart.fill' },
      { title: t('Edit favorites'), systemIcon: 'square.and.pencil' },
    ]
  }, [t])

  return (
    <ContextMenu
      actions={menuActions}
      disabled={isEditing}
      style={{ borderRadius: theme.borderRadii.lg }}
      onPress={(e) => {
        // Emitted index based on order of menu action array
        // remove favorite action
        if (e.nativeEvent.index === 0) {
          onRemove()
        }
        // Edit mode toggle action
        if (e.nativeEvent.index === 1) {
          setIsEditing(true)
        }
      }}
      {...rest}>
      <TouchableArea
        hapticFeedback
        borderRadius="lg"
        hapticStyle={ImpactFeedbackStyle.Light}
        onPress={() => {
          preload(address)
          navigate(address)
        }}>
        <BaseCard.Shadow>
          <Flex row gap="xxs" justifyContent="space-between">
            <Flex row shrink alignItems="center" gap="xs">
              {icon}
              <Text color="textPrimary" numberOfLines={1} style={flex.shrink} variant="bodyLarge">
                {displayName?.name}
              </Text>
            </Flex>
            {isEditing ? <RemoveButton onPress={onRemove} /> : <Box height={theme.imageSizes.md} />}
          </Flex>
        </BaseCard.Shadow>
      </TouchableArea>
    </ContextMenu>
  )
}
