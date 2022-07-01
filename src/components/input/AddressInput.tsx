import React from 'react'
import { TextInput, TextInputProps } from 'src/components/input/TextInput'

export function AddressInput({
  onChangeText,
  ...rest
}: TextInputProps & Required<Pick<TextInputProps, 'onChangeText'>>) {
  const handleChange = (text: string) => {
    onChangeText(text.replace(/[^a-fA-Fx0-9.,]/g, ''))
  }

  return <TextInput onChangeText={handleChange} {...rest} />
}
