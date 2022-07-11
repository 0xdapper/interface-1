import React, { ComponentProps, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import CheckCircle from 'src/assets/icons/check-circle.svg'
import CopySheets from 'src/assets/icons/copy-sheets.svg'
import { Button } from 'src/components/buttons/Button'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TextButton } from 'src/components/buttons/TextButton'
import { setClipboard } from 'src/utils/clipboard'

interface TextButtonProps extends ComponentProps<typeof TextButton> {
  copyText?: string
}

interface PrimaryButtonProps extends ComponentProps<typeof Button> {
  copyText?: string
}

const ICON_SIZE = 18

export function CopyTextButton({
  copyText,
  children,
  ...rest
}: TextButtonProps | PrimaryButtonProps) {
  const onPress = () => {
    // TODO show a toast box to notify user
    if (copyText) setClipboard(copyText)
    else if (typeof children === 'string') setClipboard(children)
  }

  return <TextButton children={children} onPress={onPress} {...rest} />
}

export function PrimaryCopyTextButton({ copyText, children, ...rest }: PrimaryButtonProps) {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const [isCopied, setIsCopied] = useState(false)

  const copyIcon = (
    <CopySheets color={theme.colors.textPrimary} height={ICON_SIZE} width={ICON_SIZE} />
  )
  const copiedIcon = (
    <CheckCircle color={theme.colors.accentSuccess} height={ICON_SIZE} width={ICON_SIZE} />
  )

  const onPress = () => {
    if (copyText) setClipboard(copyText)
    else if (typeof children === 'string') setClipboard(children)
    setIsCopied(true)
  }

  return (
    <PrimaryButton
      children={children}
      icon={isCopied ? copiedIcon : copyIcon}
      label={isCopied ? t`Copied` : t`Copy`}
      textColor="textPrimary"
      variant="transparent"
      onPress={onPress}
      {...rest}
    />
  )
}
