import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ChainId } from 'src/constants/chains'
import { NativeCurrency } from 'src/features/tokenLists/NativeCurrency'
import { currencyId } from 'src/utils/currencyId'

export enum CurrencyField {
  INPUT,
  OUTPUT,
}

export interface SwapFormState {
  exactCurrencyField: CurrencyField
  exactAmount: string
  [CurrencyField.INPUT]: {
    currencyId: string
    chainId: number
  } | null
  [CurrencyField.OUTPUT]: {
    currencyId: string
    chainId: number
  } | null
}

// Represents the active swap form
export const initialSwapFormState: Readonly<SwapFormState> = {
  exactCurrencyField: CurrencyField.INPUT,
  exactAmount: '',
  [CurrencyField.INPUT]: {
    currencyId: currencyId(NativeCurrency.onChain(ChainId.Rinkeby)),
    chainId: ChainId.Rinkeby,
  },
  [CurrencyField.OUTPUT]: null,
}

// using `createSlice` for convenience -- slice is not added to root reducer
const slice = createSlice({
  name: 'swap',
  initialState: initialSwapFormState,
  reducers: {
    /**
     * Sets currency at `field` to the given currency
     * If input/output currencies would be the same, it swaps the order
     * If network would change, unsets the dependent field
     */
    selectCurrency: (
      state,
      action: PayloadAction<{ field: CurrencyField; currencyId: string; chainId: number }>
    ) => {
      const { field, chainId } = action.payload

      const nonExactField =
        field === CurrencyField.INPUT ? CurrencyField.OUTPUT : CurrencyField.INPUT

      // swap order if tokens are the same
      if (action.payload.currencyId === state[nonExactField]?.currencyId) {
        state.exactCurrencyField = field
        state[nonExactField] = state[field]
      }

      // change independent field if network changed
      if (chainId !== state[nonExactField]?.chainId) {
        state.exactCurrencyField = field
        state[nonExactField] = null
      }

      state[field] = {
        currencyId: action.payload.currencyId,
        chainId,
      }
    },
    /** Switches input and output currencies */
    switchCurrencySides: (state) => {
      state.exactCurrencyField =
        state.exactCurrencyField === CurrencyField.INPUT
          ? CurrencyField.OUTPUT
          : CurrencyField.INPUT
      ;[state[CurrencyField.INPUT], state[CurrencyField.OUTPUT]] = [
        state[CurrencyField.OUTPUT],
        state[CurrencyField.INPUT],
      ]
    },
    /** Processes a new typed value for the given `field` */
    enterExactAmount: (
      state,
      action: PayloadAction<{ field: CurrencyField; exactAmount: string }>
    ) => {
      const { field, exactAmount } = action.payload
      state.exactCurrencyField = field
      state.exactAmount = exactAmount
    },
  },
})

export const { selectCurrency, switchCurrencySides, enterExactAmount } = slice.actions
export const { reducer: swapFormReducer, actions: swapFormActions } = slice
