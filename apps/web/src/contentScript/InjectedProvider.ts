/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { ethErrors } from 'eth-rpc-errors'
import { ethers } from 'ethers'
import EventEmitter from 'eventemitter3'
import {
  AccountResponse,
  BaseDappRequest,
  BaseDappResponse,
  ChangeChainRequest,
  ChangeChainResponse,
  ConnectRequest,
  ConnectResponse,
  DappRequestType,
  DappResponseType,
  GetAccountRequest,
  SendTransactionRequest,
  SendTransactionResponse,
  SignMessageRequest,
  SignMessageResponse,
  SignTransactionRequest,
  SignTransactionResponse,
  SignTypedDataRequest,
  SignTypedDataResponse,
  TransactionRejectedResponse,
} from 'src/background/features/dappRequests/dappRequestTypes'
import {
  BaseExtensionRequest,
  DappToExtensionRequestType,
  ExtensionChainChange,
  ExtensionRequestType,
} from 'src/types/requests'
import { serializeError } from 'utilities/src/errors'
import { logger } from 'utilities/src/logger/logger'
import { ONE_HOUR_MS } from 'utilities/src/time/time'
import { v4 as uuidv4 } from 'uuid'
import { chainIdtoHexadecimalString } from 'wallet/src/features/chains/utils'

export type EthersSendCallback = (error: unknown, response: unknown) => void

// https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1193.md#request
interface RequestArguments {
  readonly method: string
  readonly params?: readonly unknown[] | object
}

// https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1193.md#rpc-errors
interface ProviderRpcError extends Error {
  code: number
  data?: unknown
}

// https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1193.md#connect-1
interface ProviderConnectInfo {
  readonly chainId: string
}

interface SwitchEthereumChainParameter {
  chainId: string
}

export interface JsonRpcRequest {
  jsonrpc: string
  method: string
  params: any[]
  id: number
}

export interface JsonRpcResponse {
  jsonrpc: string
  id: number
  result?: any
  error?: {
    code: number
    message: string
    data?: any
  }
}

const messages = {
  errors: {
    disconnected: (): string => 'Uniswap Wallet: Disconnected from chain. Attempting to connect.',
    invalidRequestArgs: (): string =>
      `Uniswap Wallet: Expected a single, non-array, object argument.`,
    invalidRequestMethod: (): string => `Uniswap Wallet: 'args.method' must be a non-empty string.`,
    invalidRequestParams: (): string =>
      `Uniswap Wallet: 'args.params' must be an object or array if provided.`,
  },
}

export interface BaseProviderState {
  isConnected: boolean
}

export class InjectedProvider extends EventEmitter {
  state!: BaseProviderState

  protected static _defaultState: BaseProviderState = {
    isConnected: false,
  }

  /**
   * The chain ID of the currently connected Ethereum chain.
   */
  chainId?: string

  /**
   * The user's currently selected Ethereum address.
   */
  publicKey: string | null

  /**
   * Boolean indicating that the provider is Uniswap Wallet.
   */
  isUniswapWallet: boolean

  /**
   * Boolean to spoof MetaMask
   */
  isMetaMask: boolean

  /**
   * Ethereum JSON RPC provider.
   */
  provider?: ethers.providers.JsonRpcProvider

  constructor() {
    super()

    this.setState({
      ...InjectedProvider._defaultState,
    })

    this.isMetaMask = true
    this.isUniswapWallet = true
    this.publicKey = null

    this.initExtensionToDappOneWayListener()
    this.initExtensionToDappRoundtripListener()
  }

  /**
   * Initialize a listener for messages posted from the Uniswap Wallet extension.
   */
  initExtensionToDappOneWayListener = (): void => {
    const handleDappRequest = async (event: MessageEvent<BaseExtensionRequest>): Promise<void> => {
      const messageData = event.data
      switch (messageData?.type) {
        case ExtensionRequestType.SwitchChain: {
          const request = messageData as ExtensionChainChange
          const chainId = chainIdtoHexadecimalString(request.chainId)
          this.chainId = chainId
          this.provider = new ethers.providers.JsonRpcProvider(request.providerUrl)
          this.emit('chainChanged', chainId)
          break
        }
        case ExtensionRequestType.Disconnect: {
          await this.handleDisconnectAccount()
        }
      }
    }

    // This listener isn't removed because it's needed for the lifetime of the app
    // TODO: Check for active tab when listening to events
    window.addEventListener('message', handleDappRequest)
  }

  /**
   * Initialize a listener for messages posted from the Uniswap Wallet extension that also require a response
   */
  initExtensionToDappRoundtripListener = (): void => {
    const handleRoundTripRequest = (event: MessageEvent<BaseExtensionRequest>): void => {
      const request = event.data as BaseExtensionRequest
      switch (request?.type) {
        case ExtensionRequestType.GetConnectionStatus: {
          const response = {
            type: DappToExtensionRequestType.ConnectionStatus,
            connected: this.publicKey !== null,
          }

          window.postMessage(response)
        }
      }
    }

    // This listener isn't removed because it's needed for the lifetime of the app
    // TODO: Check for active tab when listening to events
    window.addEventListener('message', handleRoundTripRequest)
  }

  setState = (updatedState: BaseProviderState): void => {
    this.state = updatedState
    Object.freeze(this.state)
  }

  //
  // Public methods
  //

  /**
   * Returns whether the provider can process RPC requests. (does not imply wallet is connected to dApp)
   */
  isConnected = (): boolean => {
    return this.state.isConnected
  }

  // Deprecated EIP-1193 method
  enable = async (): Promise<unknown> => {
    return this.request({ method: 'eth_requestAccounts' })
  }

  // Deprecated EIP-1193 method
  send = (
    methodOrRequest: string | RequestArguments,
    paramsOrCallback: Array<unknown> | EthersSendCallback
  ): Promise<unknown> | void => {
    if (typeof methodOrRequest === 'string' && typeof paramsOrCallback !== 'function') {
      return this.request({
        method: methodOrRequest,
        params: paramsOrCallback,
      })
    } else if (typeof methodOrRequest === 'object' && typeof paramsOrCallback === 'function') {
      return this.sendAsync(methodOrRequest, paramsOrCallback)
    }
    return Promise.reject(new Error('Unsupported function parameters'))
  }

  // Deprecated EIP-1193 method still in use by some DApps
  sendAsync = (
    request: RequestArguments & { id?: number; jsonrpc?: string },
    callback: (error: unknown, response: unknown) => void
  ): Promise<unknown> | void => {
    return this.request(request).then(
      (response) =>
        callback(null, {
          result: response,
          id: request.id,
          jsonrpc: request.jsonrpc,
        }),
      (error) => callback(error, null)
    )
  }

  request = async (args: RequestArguments): Promise<JsonRpcResponse> => {
    if (!args || typeof args !== 'object' || Array.isArray(args)) {
      throw ethErrors.rpc.invalidRequest({
        message: messages.errors.invalidRequestArgs(),
        data: args,
      })
    }

    const { method, params } = args

    if (typeof method !== 'string' || method.length === 0) {
      throw ethErrors.rpc.invalidRequest({
        message: messages.errors.invalidRequestMethod(),
        data: args,
      })
    }

    if (
      params !== undefined &&
      !Array.isArray(params) &&
      (typeof params !== 'object' || params === null)
    ) {
      throw ethErrors.rpc.invalidRequest({
        message: messages.errors.invalidRequestParams(),
        data: args,
      })
    }

    // type of map with string as key
    const functionMap: { [key: string]: any } = {
      eth_accounts: this.handleEthAccounts,
      eth_requestAccounts: this.handleEthRequestAccounts,
      eth_chainId: () => this.chainId,
      net_version: () =>
        // eslint-disable-next-line radix
        this.chainId ? `${parseInt(this.chainId)}` : undefined,
      eth_getBalance: (address: string) => this.provider?.getBalance(address),
      eth_getCode: (address: string) => this.provider?.getCode(address),
      eth_getStorageAt: (address: string, position: string) =>
        this.provider?.getStorageAt(address, position),
      eth_getTransactionCount: (address: string) => this.provider?.getTransactionCount(address),
      eth_blockNumber: () => this.provider?.getBlockNumber(),
      eth_getBlockByNumber: (block: number) => this.provider?.getBlock(block),
      eth_call: (transaction: any) => this.provider?.call(transaction),
      eth_gasPrice: () => this.provider?.getGasPrice(),
      eth_estimateGas: (transaction: any) => this.provider?.estimateGas(transaction),
      eth_getTransactionByHash: (hash: string) => this.provider?.getTransaction(hash),
      eth_getTransactionReceipt: (hash: string) => this.provider?.getTransactionReceipt(hash),
      eth_sign: (_address: string, _message: string) => {
        // Backpack mentioned this is a significant security risk because it can be used to
        // sign transactions.
        // TODO maybe enable this with a large warning in the UI?
        throw new Error('Uniswap Wallet does not support eth_sign due to security concerns')
      },
      personal_sign: (messageHex: string, _address: string) =>
        this.handleEthSignMessage(messageHex),
      eth_signTransaction: (transaction: any) => this.handleEthSignTransaction(transaction),
      eth_sendTransaction: (transaction: any) => this.handleEthSendTransaction(transaction),
      wallet_switchEthereumChain: (switchRequest: SwitchEthereumChainParameter) =>
        this.handleWalletSwitchEthereumChain(switchRequest),
      eth_signTypedData_v4: (address: string, typedData: any) =>
        this.handleEthSignTypedData(address, typedData),
    }

    const func = functionMap[method]
    if (func === undefined) {
      throw ethErrors.rpc.invalidRequest({
        message: messages.errors.invalidRequestMethod(),
        data: args,
      })
    }

    // eslint-disable-next-line no-async-promise-executor
    return new Promise<JsonRpcResponse>(async (resolve, reject) => {
      let rpcResult
      try {
        rpcResult = await func(...(<[]>(params ? params : [])))
      } catch (error) {
        logger.error('RPC response error', {
          tags: {
            file: 'InjectedProvider',
            function: 'request',
            error: serializeError(error),
          },
        })
        return reject(error)
      }
      return resolve(rpcResult)
    })
  }

  /**
   * Update local state and emit required event for connect.
   * Not used by Uniswap dApp
   * https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1193.md#connect
   */
  handleConnect = async (chainId: string): Promise<void> => {
    this.chainId = chainId
    if (!this.state.isConnected) {
      try {
        const handleConnectRequest: ConnectRequest = {
          type: DappRequestType.Connect,
          requestId: uuidv4(),
          chainId,
        }
        const { providerUrl } = await sendRequestAsync<ConnectResponse>(
          handleConnectRequest,
          DappResponseType.ConnectResponse
        )

        this.provider = new ethers.providers.JsonRpcProvider(providerUrl)
        this.setState({ ...this.state, isConnected: true })
      } catch (error) {
        throw new Error('Failed to connect to wallet')
      }
    }
    this.emit('connect', { chainId } as ProviderConnectInfo)
  }

  /**
   * Update local state and emit required event for chain change.
   */
  handleChainChanged = async (chainId: string): Promise<void> => {
    const changeChainRequest: ChangeChainRequest = {
      type: DappRequestType.ChangeChain,
      requestId: uuidv4(),
      chainId,
    }

    const { chainId: newChainId, providerUrl } = await sendRequestAsync<ChangeChainResponse>(
      changeChainRequest,
      DappResponseType.ChainChangeResponse
    )

    this.provider = new ethers.providers.JsonRpcProvider(providerUrl)
    this.chainId = newChainId
    logger.info('UniswapInjectedProvider', 'chain changed', newChainId)

    // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1193.md#chainchanged
    this.emit('chainChanged', chainId)
  }

  /**
   * Emit the required event for a change of accounts.
   */
  handleAccountsChanged = async (accounts: unknown[]): Promise<void> => {
    this.emit('accountsChanged', accounts)
  }

  /**
   * Handle eth_accounts requests
   */
  handleEthAccounts = async (): Promise<string[]> => {
    if (this.isConnected() && this.publicKey) {
      return [this.publicKey]
    }
    return []
  }

  /**
   * Handle eth_requestAccounts requests
   */
  handleEthRequestAccounts = async (): Promise<string[]> => {
    // Send request to the RPC API.
    if (!this.publicKey) {
      const getAccountRequest: GetAccountRequest = {
        type: DappRequestType.GetAccount,
        requestId: uuidv4(),
      }
      const { accountAddress, chainId, providerUrl } = await sendRequestAsync<AccountResponse>(
        getAccountRequest,
        DappResponseType.AccountResponse
      )
      this.publicKey = accountAddress

      // TODO: Remove this once we have a better way to handle the connection state.
      this.setState({ ...this.state, isConnected: true })
      this.chainId = chainId
      this.provider = new ethers.providers.JsonRpcProvider(providerUrl)
      this.emit('connect', { chainId } as ProviderConnectInfo)
    }
    return [this.publicKey]
  }

  /**
   * Handle eth_sign, eth_signTypedData, personal_sign RPC requests.
   */
  handleEthSignMessage = async (messageHex: string): Promise<string | undefined> => {
    if (!this.publicKey) {
      throw new Error('Wallet not connected')
    }

    const request: SignMessageRequest = {
      type: DappRequestType.SignMessage,
      requestId: uuidv4(),
      messageHex: ethers.utils.toUtf8String(messageHex),
    }

    const response: SignMessageResponse = await sendRequestAsync(
      request,
      DappResponseType.SignMessageResponse
    )
    return response?.signature
  }

  /**
   * Handle eth_signTransaction RPC requests.
   */
  handleEthSignTransaction = async (transaction: unknown): Promise<string | undefined> => {
    if (!this.publicKey) {
      throw new Error('Wallet not connected')
    }

    const request: SignTransactionRequest = {
      type: DappRequestType.SignTransaction,
      requestId: uuidv4(),
      transaction: adaptTransactionForEthers(transaction),
    }
    const response: SignTransactionResponse = await sendRequestAsync(
      request,
      DappResponseType.SignTransactionResponse
    )
    return response.signedTransactionHash
  }

  /**
   * Handle eth_sendTransaction RPC requests.
   *
   * // TODO: Unit tests for provider injection methods
   * @returns transaction hash
   */
  handleEthSendTransaction = async (transaction: unknown): Promise<string | undefined> => {
    if (!this.publicKey) {
      throw new Error('Wallet not connected')
    }

    const request: SendTransactionRequest = {
      type: DappRequestType.SendTransaction,
      requestId: uuidv4(),
      transaction: adaptTransactionForEthers(transaction),
    }

    const response = await sendRequestAsync<SendTransactionResponse | TransactionRejectedResponse>(
      request,
      DappResponseType.SendTransactionResponse
    )

    if (response.type === DappResponseType.TransactionRejected) {
      throw new Error('Transaction rejected')
    }
    return response?.transaction?.hash
  }

  handleWalletSwitchEthereumChain = async (
    switchRequest: SwitchEthereumChainParameter
  ): Promise<null> => {
    if (!this.publicKey) {
      throw new Error('Wallet not connected')
    }

    const changeChainRequest: ChangeChainRequest = {
      type: DappRequestType.ChangeChain,
      requestId: uuidv4(),
      chainId: switchRequest.chainId,
    }

    const { providerUrl } = await sendRequestAsync<ChangeChainResponse>(
      changeChainRequest,
      DappResponseType.ChainChangeResponse
    )

    this.provider = new ethers.providers.JsonRpcProvider(providerUrl)
    this.chainId = switchRequest.chainId
    return null
  }

  /**
   * Signed typed data using eth_signTypedData_v4
   *
   * @param address address to sign typed data with
   * @param typedData typed data to sign
   * @returns
   */
  handleEthSignTypedData = async (_address: any, typedData: any): Promise<string> => {
    if (!this.publicKey) {
      throw new Error('Wallet not connected')
    }

    const request: SignTypedDataRequest = {
      type: DappRequestType.SignTypedData,
      requestId: uuidv4(),
      typedData,
    }

    const response = await sendRequestAsync<SignTypedDataResponse>(
      request,
      DappResponseType.SignTypedDataResponse
    )

    return response.signature
  }

  handleDisconnectAccount = async (): Promise<void> => {
    this.publicKey = null
    this.emit('accountsChanged', [])
  }

  /**
   * Handle case where all chains are disconnected from provider
   */
  _handleDisconnected = async (): Promise<void> => {
    if (this.isConnected()) {
      // Reset public state
      this.publicKey = null
      // Reset private state

      this.setState({
        ...InjectedProvider._defaultState,
      })
    }

    // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1193.md#disconnect
    this.emit('disconnect', {
      code: 4900,
      message: 'User disconnected',
    } as ProviderRpcError)
  }
}

/**
 * Adapt a transaction object to be compatible with ethers.js
 */
function adaptTransactionForEthers(transaction: any): any {
  transaction.gasLimit = transaction.gas
  delete transaction.gas
  return transaction
}

/**
 *
 * @param request ContentScriptRequest sent to background service-worker
 * @param responseType type of ContentScriptResponse (can include TransactionRejected)
 * @returns
 */
function sendRequestAsync<T extends BaseDappResponse>(
  request: BaseDappRequest,
  responseType: T['type'],
  timeoutMs = ONE_HOUR_MS
): Promise<T> {
  return new Promise((resolve, reject) => {
    // TOOD(EXT-276): improve transaction timeout logic
    const timeout = setTimeout(() => {
      window.removeEventListener('message', handleDappRequest)
      reject('Request timed out')
    }, timeoutMs)

    const handleDappRequest = (event: MessageEvent<any>): void => {
      const messageData = event.data
      if (
        (messageData?.type === responseType ||
          messageData?.type === DappResponseType.TransactionRejected) &&
        messageData?.requestId === request.requestId
      ) {
        resolve(messageData)
        // need to remove just this specific window listener
        window.removeEventListener('message', handleDappRequest)
        clearTimeout(timeout)
      }
    }

    window.addEventListener('message', handleDappRequest)
    window.postMessage(request)
  })
}
