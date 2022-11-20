import { default as React } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import TripleDots from 'src/assets/icons/triple-dots.svg'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { ElementName } from 'src/features/telemetry/constants'

export function FavoriteHeaderRow({
  title,
  editingTitle,
  isEditing,
  onPress,
}: {
  title: string
  editingTitle: string
  isEditing: boolean
  onPress: () => void
}) {
  const { t } = useTranslation()
  const theme = useAppTheme()
  return (
    <Flex row alignItems="center" justifyContent="space-between" mb="xs" mx="xs">
      <Text color="textSecondary" variant="subheadSmall">
        {isEditing ? editingTitle : title}
      </Text>
      {!isEditing ? (
        <TouchableArea hapticFeedback name={ElementName.Edit} onPress={onPress}>
          <TripleDots
            color={theme.colors.textSecondary}
            height={theme.iconSizes.md}
            strokeLinecap="round"
            strokeWidth="1"
            width={theme.iconSizes.md}
          />
        </TouchableArea>
      ) : (
        <TouchableArea height={theme.iconSizes.lg} onPress={onPress}>
          <Text color="accentActive" variant="buttonLabelSmall">
            {t('Done')}
          </Text>
        </TouchableArea>
      )}
    </Flex>
  )
}
