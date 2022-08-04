import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ICloudMnemonicBackup } from 'src/features/CloudBackup/types'

export interface CloudBackupState {
  backupsFound: ICloudMnemonicBackup[]
}

export const initialCloudBackupState: Readonly<CloudBackupState> = {
  backupsFound: [],
}
export const PIN_LENGTH = 6

const slice = createSlice({
  name: 'cloudBackup',
  initialState: initialCloudBackupState,
  reducers: {
    foundCloudBackup: (state, action: PayloadAction<{ backup: ICloudMnemonicBackup }>) => {
      const { backup } = action.payload
      let duplicateBackup = state.backupsFound.some((b) => b.mnemonicId === backup.mnemonicId)
      if (!duplicateBackup) state.backupsFound.push(backup)
    },
    clearCloudBackups: (state) => {
      state.backupsFound = []
    },
  },
})

export const { foundCloudBackup, clearCloudBackups } = slice.actions
export const { reducer: cloudBackupReducer, actions: cloudBackupActions } = slice
