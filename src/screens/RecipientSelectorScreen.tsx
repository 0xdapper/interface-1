import React from 'react'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { SheetScreen } from 'src/components/layout/SheetScreen'
import { RecipientSelect } from 'src/components/RecipientSelect/RecipientSelect'
import { Screens } from 'src/screens/Screens'

export function RecipientSelectoScreen({
  navigation,
  route: {
    params: { setSelectedRecipient, chainId },
  },
}: AppStackScreenProp<Screens.RecipientSelector>) {
  return (
    <SheetScreen>
      <RecipientSelect
        chainId={chainId}
        setRecipientAddress={(recipient) => {
          setSelectedRecipient(recipient)
          navigation.goBack()
        }}
      />
    </SheetScreen>
  )
}
