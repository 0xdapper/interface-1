import {
  NetInfoNoConnectionState,
  NetInfoState,
  NetInfoStateType,
} from '@react-native-community/netinfo'
import { TradeType } from '@uniswap/sdk-core'
import dayjs from 'dayjs'
import { BigNumber, providers } from 'ethers'
import ERC20_ABI from 'src/abis/erc20.json'
import { Erc20, Weth } from 'src/abis/types'
import WETH_ABI from 'src/abis/weth.json'
import { config } from 'src/config'
import { NATIVE_ADDRESS, SWAP_ROUTER_ADDRESSES } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { DAI, WRAPPED_NATIVE_CURRENCY } from 'src/constants/tokens'
import { AssetType } from 'src/entities/assets'
import { ContractManager } from 'src/features/contracts/ContractManager'
import { AppNotificationType } from 'src/features/notifications/types'
import { finalizeTransaction } from 'src/features/transactions/slice'
import {
  ApproveTransactionInfo,
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'src/features/transactions/types'
import { SignerManager } from 'src/features/wallet/accounts/SignerManager'
import { Account, AccountType } from 'src/features/wallet/accounts/types'
import { WalletConnectEvent } from 'src/features/walletConnect/saga'

export const account: Account = {
  type: AccountType.SignerMnemonic,
  address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  derivationIndex: 0,
  name: 'Test Account',
  timeImportedMs: dayjs().valueOf(),
  mnemonicId: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
}

const mockSigner = new (class {
  signTransaction = jest.fn(() => '0x1234567890abcdef')
  connect = () => this
})()

export const mockSignerManager = {
  getSignerForAccount: async () => mockSigner,
}

const mockFeeData = {
  maxFeePerPrice: BigNumber.from('1000'),
  maxPriorityFeePerGas: BigNumber.from('10000'),
  gasPrice: BigNumber.from('10000'),
}

export const mockProvider = {
  getBalance: jest.fn(() => BigNumber.from('1000000000000000000')),
  getGasPrice: jest.fn(() => BigNumber.from('100000000000')),
  getTransactionCount: jest.fn(() => 1000),
  estimateGas: jest.fn(() => BigNumber.from('30000')),
  sendTransaction: jest.fn(() => ({ hash: '0xabcdef' })),
  detectNetwork: jest.fn(() => ({ name: 'mainnet', chainId: 1 })),
  getTransactionReceipt: jest.fn(() => txReceipt),
  waitForTransaction: jest.fn(() => txReceipt),
  getFeeData: jest.fn(() => mockFeeData),
}

export const mockProviderManager = {
  getProvider: () => mockProvider,
}

export const signerManager = new SignerManager()

export const provider = new providers.JsonRpcProvider()
export const providerManager = {
  getProvider: () => provider,
}

export const mockContractManager = {
  getOrCreateContract: jest.fn(() => mockTokenContract),
}

export const mockTokenContract = {
  balanceOf: jest.fn(() => BigNumber.from('1000000000000000000')),
  populateTransaction: {
    transfer: jest.fn(() => txRequest),
    transferFrom: jest.fn(() => txRequest),
    safeTransferFrom: jest.fn(() => txRequest),
  },
}

export const contractManager = new ContractManager()
contractManager.getOrCreateContract(ChainId.Goerli, DAI.address, provider, ERC20_ABI)
contractManager.getOrCreateContract(
  ChainId.Goerli,
  WRAPPED_NATIVE_CURRENCY[ChainId.Goerli].address,
  provider,
  WETH_ABI
)
export const tokenContract = contractManager.getContract(ChainId.Goerli, DAI.address) as Erc20
export const wethContract = contractManager.getContract(
  ChainId.Goerli,
  WRAPPED_NATIVE_CURRENCY[ChainId.Goerli].address
) as Weth

/**
 * Transactions
 */
export const txRequest: providers.TransactionRequest = {
  from: '0x123',
  to: '0x456',
  value: '0x0',
  data: '0x789',
  nonce: 10,
  gasPrice: mockFeeData.gasPrice,
}

export const txReceipt = {
  transactionHash: '0x123',
  blockHash: '0x123',
  blockNumber: 1,
  transactionIndex: 1,
  confirmations: 1,
  status: 1,
}

export const txResponse = {
  hash: '0x123',
  wait: jest.fn(() => txReceipt),
}

export const txTypeInfo: ApproveTransactionInfo = {
  type: TransactionType.Approve,
  tokenAddress: tokenContract.address,
  spender: SWAP_ROUTER_ADDRESSES[ChainId.Goerli],
}

export const txDetailsPending: TransactionDetails = {
  chainId: ChainId.Mainnet,
  id: '0',
  from: account.address,
  options: {
    request: txRequest,
  },
  typeInfo: txTypeInfo,
  status: TransactionStatus.Pending,
  addedTime: 1487076708000,
  hash: '0x123',
}

export const txDetailsConfirmed: TransactionDetails = {
  ...txDetailsPending,
  status: TransactionStatus.Success,
  receipt: {
    blockHash: txReceipt.blockHash,
    blockNumber: txReceipt.blockNumber,
    transactionIndex: txReceipt.transactionIndex,
    confirmations: txReceipt.confirmations,
    confirmedTime: 1400000000000,
  },
}

export const fiatOnRampTxDetailsPending: TransactionDetails = {
  chainId: ChainId.Mainnet,
  id: '0',
  from: account.address,
  options: {
    request: txRequest,
  },
  typeInfo: txTypeInfo,
  status: TransactionStatus.Pending,
  addedTime: 1487076708000,
  hash: '0x123',
}

export const finalizedTxAction: ReturnType<typeof finalizeTransaction> = {
  payload: { ...txDetailsConfirmed, status: TransactionStatus.Success },
  type: '',
}

export const swapNotification = {
  type: AppNotificationType.Transaction,
  chainId: ChainId.Mainnet,
  txId: 'uid-1234',
  txHash: '0x01',
  txType: TransactionType.Swap,
  txStatus: TransactionStatus.Success,
  inputCurrencyId: `1-${NATIVE_ADDRESS}`,
  outputCurrencyId: '1-0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
  inputCurrencyAmountRaw: '230000000000000000',
  outputCurrencyAmountRaw: '123000000000000000000',
  tradeType: TradeType.EXACT_INPUT,
}

export const transferCurrencyNotification = {
  type: AppNotificationType.Transaction,
  chainId: ChainId.Mainnet,
  txId: 'uid-1234',
  txHash: '0x000',
  txType: TransactionType.Send,
  txStatus: TransactionStatus.Success,
  assetType: AssetType.Currency,
  tokenAddress: '0x4d224452801ACEd8B2F0aebE155379bb5D594381',
  currencyAmountRaw: '1000000000000000000',
  recipient: '0x11E4857Bb9993a50c685A79AFad4E6F65D518DDa',
  // sender: '0x939C8d89EBC11fA45e576215E2353673AD0bA18A',
}

export const transferNFTNotification = {
  type: AppNotificationType.Transaction,
  chainId: ChainId.Mainnet,
  txId: 'uid-1234',
  txHash: '0x000',
  txType: TransactionType.Send,
  txStatus: TransactionStatus.Success,
  assetType: AssetType.ERC1155,
  tokenAddress: '0x7Bd29408f11D2bFC23c34f18275bBf23bB716Bc7',
  tokenId: '4334',
  recipient: '0x11E4857Bb9993a50c685A79AFad4E6F65D518DDa',
  // sender: '0x11E4857Bb9993a50c685A79AFad4E6F65D518DDa',
}

export const wcNotification = {
  type: AppNotificationType.WalletConnect,
  chainId: ChainId.Mainnet,
  event: WalletConnectEvent.Connected,
  dappName: 'Uniswap',
  imageUrl: `${config.uniswapAppUrl}/images/192x192_App_Icon.png`,
}

export const approveNotification = {
  type: AppNotificationType.Transaction,
  chainId: ChainId.Mainnet,
  txId: 'uid-1234',
  txHash: '0x000',
  txType: TransactionType.Approve,
  txStatus: TransactionStatus.Success,
  tokenAddress: '0x4d224452801ACEd8B2F0aebE155379bb5D594381',
  spender: '0x939C8d89EBC11fA45e576215E2353673AD0bA18A',
}

export const unknownNotification = {
  type: AppNotificationType.Transaction,
  chainId: ChainId.Mainnet,
  txId: 'uid-1234',
  txHash: '0x000',
  txType: TransactionType.Unknown,
  txStatus: TransactionStatus.Success,
  tokenAddress: '0x939C8d89EBC11fA45e576215E2353673AD0bA18A',
}

export const networkDown: NetInfoNoConnectionState = {
  isConnected: false,
  type: NetInfoStateType.none,
  isInternetReachable: false,
  details: null,
}

export const networkUp: NetInfoState = {
  isConnected: true,
  type: NetInfoStateType.other,
  isInternetReachable: true,
  details: { isConnectionExpensive: false },
}
