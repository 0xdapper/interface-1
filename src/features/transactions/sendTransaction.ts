import { providers } from 'ethers'
import { getProvider, getSignerManager } from 'src/app/walletContext'
import { ChainId, CHAIN_INFO } from 'src/constants/chains'
import { isFlashbotsSupportedChainId } from 'src/features/providers/flashbotsProvider'
import { logEvent } from 'src/features/telemetry'
import { EventName } from 'src/features/telemetry/constants'
import { transactionActions } from 'src/features/transactions/slice'
import { formatAsHexString } from 'src/features/transactions/swap/utils'
import {
  TransactionDetails,
  TransactionOptions,
  TransactionStatus,
  TransactionTypeInfo
} from 'src/features/transactions/types'
import {
  createTransactionId,
  getSerializableTransactionRequest
} from 'src/features/transactions/utils'
import { SignerManager } from 'src/features/wallet/accounts/SignerManager'
import { Account, AccountType } from 'src/features/wallet/accounts/types'
import { selectFlashbotsEnabled } from 'src/features/wallet/selectors'
import { logger } from 'src/utils/logger'
import { call, put, select } from 'typed-redux-saga'
export interface SendTransactionParams {
  // internal id used for tracking transactions before theyre submitted
  // this is optional as an override in txDetail.id calculation
  txId?: string
  chainId: ChainId
  account: Account
  options: TransactionOptions
  typeInfo: TransactionTypeInfo
}

// A utility for sagas to send transactions
// All outgoing transactions should go through here
export function* sendTransaction(params: SendTransactionParams) {
  const { chainId, account, options } = params
  const request = options.request

  logger.debug('sendTransaction', '', `Sending tx on ${CHAIN_INFO[chainId].label} to ${request.to}`)

  if (account.type === AccountType.Readonly) throw new Error('Account must support signing')

  const isFlashbotsEnabled = yield* select(selectFlashbotsEnabled)
  const isFlashbots = isFlashbotsEnabled && isFlashbotsSupportedChainId(params.chainId)

  // Sign and send the transaction
  const provider = yield* call(getProvider, chainId, isFlashbots)

  const signerManager = yield* call(getSignerManager)
  const { transactionResponse, populatedRequest } = yield* call(
    signAndSendTransaction,
    request,
    account,
    provider,
    signerManager
  )
  logger.debug('sendTransaction', '', 'Tx submitted:', transactionResponse.hash)

  // Register the tx in the store
  yield* call(addTransaction, params, transactionResponse.hash, populatedRequest, isFlashbots)
  return { transactionResponse }
}

export async function signAndSendTransaction(
  request: providers.TransactionRequest,
  account: Account,
  provider: providers.Provider,
  signerManager: SignerManager
) {
  const signer = await signerManager.getSignerForAccount(account)
  const connectedSigner = signer.connect(provider)
  const hexRequest = hexlifyTransaction(request)
  const populatedRequest = await connectedSigner.populateTransaction(hexRequest)
  const signedTx = await connectedSigner.signTransaction(populatedRequest)
  const transactionResponse = await provider.sendTransaction(signedTx)
  return { transactionResponse, populatedRequest }
}

// hexlifyTransaction is idemnpotent so it's safe to call more than once on a singular transaction request
function hexlifyTransaction(transferTxRequest: providers.TransactionRequest) {
  const { value, nonce, gasLimit, gasPrice, maxPriorityFeePerGas, maxFeePerGas } = transferTxRequest
  return {
    ...transferTxRequest,
    nonce: formatAsHexString(nonce),
    value: formatAsHexString(value),
    gasLimit: formatAsHexString(gasLimit),

    // only pass in for legacy chains
    ...(gasPrice ? { gasPrice: formatAsHexString(gasPrice) } : {}),

    // only pass in for eip1559 tx
    ...(maxPriorityFeePerGas
      ? {
          maxPriorityFeePerGas: formatAsHexString(maxPriorityFeePerGas),
          maxFeePerGas: formatAsHexString(maxFeePerGas),
        }
      : {}),
  }
}

function* addTransaction(
  { chainId, typeInfo, account, options, txId }: SendTransactionParams,
  hash: string,
  populatedRequest: providers.TransactionRequest,
  isFlashbots?: boolean
) {
  const id = txId ?? createTransactionId()
  const request = getSerializableTransactionRequest(populatedRequest, chainId)
  const transaction: TransactionDetails = {
    id,
    chainId,
    hash,
    typeInfo,
    isFlashbots,
    from: account.address,
    addedTime: Date.now(),
    status: TransactionStatus.Pending,
    options: {
      ...options,
      request,
    },
  }
  yield* put(transactionActions.addTransaction(transaction))
  yield* call(logEvent, EventName.Transaction, { chainId, ...typeInfo })
}
