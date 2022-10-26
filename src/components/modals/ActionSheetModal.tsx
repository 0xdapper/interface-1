import { selectionAsync } from 'expo-haptics'
import React, { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native-gesture-handler'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Flex } from 'src/components/layout'
import { BottomSheetDetachedModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { ModalName } from 'src/features/telemetry/constants'
import { flex } from 'src/styles/flex'
import { dimensions } from 'src/styles/sizing'

export interface MenuItemProp {
  key: string
  onPress: () => void
  render: () => ReactNode
}

interface ActionSheetModalContentProps {
  closeButtonLabel?: string
  onClose: () => void
  options: MenuItemProp[]
  header?: ReactNode | string
}

export function ActionSheetModalContent(props: ActionSheetModalContentProps) {
  const { t } = useTranslation()

  const { header, closeButtonLabel = t('Cancel'), options, onClose } = props

  return (
    <Flex gap="sm" justifyContent="flex-end">
      <Flex centered bg="background1" borderRadius="lg" gap="none" overflow="hidden">
        {typeof header === 'string' ? (
          <Flex centered gap="xxs" py="md">
            <Text variant="buttonLabelMedium">{header}</Text>
          </Flex>
        ) : (
          header
        )}

        <Flex gap="none" maxHeight={dimensions.fullHeight * 0.5} width="100%">
          <ScrollView bounces={false} style={flex.grow}>
            {options.map(({ key, onPress, render }) => {
              return (
                <TouchableArea
                  key={key}
                  name={key}
                  testID={key}
                  onPress={() => {
                    selectionAsync()
                    onPress()
                  }}>
                  {render()}
                </TouchableArea>
              )
            })}
          </ScrollView>
        </Flex>
      </Flex>
      <Flex bg="background1" borderRadius="md">
        <TouchableArea
          onPress={() => {
            selectionAsync()
            onClose()
          }}>
          <Flex centered bg="background3" borderRadius="md" py="md">
            <Text color="textPrimary" variant="subheadLarge">
              {closeButtonLabel}
            </Text>
          </Flex>
        </TouchableArea>
      </Flex>
    </Flex>
  )
}

interface ActionSheetModalProps extends ActionSheetModalContentProps {
  isVisible: boolean
  name: ModalName
}

export function ActionSheetModal({ isVisible, onClose, name, ...rest }: ActionSheetModalProps) {
  return (
    <BottomSheetDetachedModal
      hideHandlebar
      backgroundColor="transparent"
      isVisible={isVisible}
      name={name}
      onClose={onClose}>
      <ActionSheetModalContent onClose={onClose} {...rest} />
    </BottomSheetDetachedModal>
  )
}
