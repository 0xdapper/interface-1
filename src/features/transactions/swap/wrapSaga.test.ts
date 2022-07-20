import { CurrencyAmount } from '@uniswap/sdk-core'
import { testSaga } from 'redux-saga-test-plan'
import { getProviderManager } from 'src/app/walletContext'
import { ChainId } from 'src/constants/chains'
import { NativeCurrency } from 'src/features/tokenLists/NativeCurrency'
import { sendTransaction } from 'src/features/transactions/sendTransaction'
import { getWethContract, Params, wrap } from 'src/features/transactions/swap/wrapSaga'
import { TransactionType, WrapTransactionInfo } from 'src/features/transactions/types'
import { account, provider, providerManager, wethContract } from 'src/test/fixtures'

const wrapTxInfo: WrapTransactionInfo = {
  type: TransactionType.Wrap,
  unwrapped: false,
  currencyAmountRaw: '200000',
}

const unwrapTxInfo: WrapTransactionInfo = {
  ...wrapTxInfo,
  unwrapped: true,
}

const params: Params = {
  txId: '1',
  account,
  inputCurrencyAmount: CurrencyAmount.fromRawAmount(
    NativeCurrency.onChain(ChainId.Rinkeby),
    '200000'
  ),
}

const transaction = {
  from: account.address,
  to: '0xabc',
  data: '0x01',
}

describe(wrap, () => {
  it('successfully wrap native eth', () => {
    testSaga(wrap, params)
      .next()
      .call(getProviderManager)
      .next(providerManager)
      .call(getWethContract, ChainId.Rinkeby, provider)
      .next(wethContract)
      .call(wethContract.populateTransaction.deposit, {
        value: `0x30d40`,
      })
      .next(transaction)
      .call(sendTransaction, {
        txId: '1',
        chainId: ChainId.Rinkeby,
        account: params.account,
        typeInfo: wrapTxInfo,
        options: { request: transaction },
      })
      .next()
      .isDone()
  })

  it('successfully unwraps to native eth', () => {
    const unwrapParams: Params = {
      ...params,
      inputCurrencyAmount: CurrencyAmount.fromRawAmount(
        NativeCurrency.onChain(ChainId.Rinkeby).wrapped,
        '200000'
      ),
    }
    testSaga(wrap, unwrapParams)
      .next()
      .call(getProviderManager)
      .next(providerManager)
      .call(getWethContract, ChainId.Rinkeby, provider)
      .next(wethContract)
      .call(wethContract.populateTransaction.withdraw, `0x30d40`)
      .next(transaction)
      .call(sendTransaction, {
        txId: '1',
        chainId: ChainId.Rinkeby,
        account: params.account,
        typeInfo: unwrapTxInfo,
        options: { request: transaction },
      })
      .next()
      .isDone()
  })
})
