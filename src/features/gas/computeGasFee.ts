import { BigNumber, FixedNumber, providers } from 'ethers'
import { ChainId } from 'src/constants/chains'
import { GAS_FAST_MULTIPLIER, GAS_URGENT_MULTIPLIER } from 'src/constants/gas'
import { suggestFees } from 'src/features/gas/feeSuggestion'
import { FeeInfo, FeeInfo1559, FeeInfoLegacy, FeeType } from 'src/features/gas/types'
import { logger } from 'src/utils/logger'
import { fixedNumberToInt } from 'src/utils/number'

// Using a const list of 1559 chains to save a network request for each fee calculation
// Must be kept up to date if more chains adopt 1559
const EIP_1559_CHAINS = [
  ChainId.Mainnet,
  ChainId.Ropsten,
  // TODO: removed until figure out why EIP-1559 gas estimation fails
  // ChainId.Rinkeby,
  ChainId.Goerli,
]

export async function computeGasFee(
  chainId: ChainId,
  tx: providers.TransactionRequest,
  provider: providers.JsonRpcProvider,
  fallbackGasEstimate?: string
): Promise<FeeInfo> {
  const gasLimit = await estimateGasOrUseFallback(tx, provider, fallbackGasEstimate)

  try {
    if (EIP_1559_CHAINS.includes(chainId)) {
      const feeInfo = await computeGasFee1559(provider, gasLimit)
      return feeInfo
    } else {
      const feeInfo = await computeGasFeeLegacy(provider, gasLimit)
      return feeInfo
    }
  } catch (error) {
    logger.error('computeGasFee', '', 'Cannot compute fee', error)
    throw new Error('Cannot compute fee')
  }
}

async function estimateGasOrUseFallback(
  tx: providers.TransactionRequest,
  provider: providers.JsonRpcProvider,
  fallbackGasEstimate?: string
) {
  try {
    return await provider.estimateGas(tx)
  } catch (error) {
    if (fallbackGasEstimate) {
      logger.info(
        'computeGasFee',
        '',
        `Cannot estimate gas, using estimate from router as fallback: ${fallbackGasEstimate}`
      )
      return BigNumber.from(fallbackGasEstimate)
    }

    logger.error(
      'computeGasFee',
      '',
      'Cannot estimate gas and no fallback provided, likely invalid tx',
      error
    )
    throw new Error('Cannot estimate gas')
  }
}

async function computeGasFee1559(
  provider: providers.JsonRpcProvider,
  gasLimit: BigNumber
): Promise<FeeInfo1559> {
  const { baseFeeSuggestion, currentBaseFee, priorityFeeSuggestions } = await suggestFees(provider)
  const normalFeePerGas = baseFeeSuggestion.add(priorityFeeSuggestions.normal)
  const fastFeePerGas = baseFeeSuggestion.add(priorityFeeSuggestions.fast)
  const urgentFeePerGas = baseFeeSuggestion.add(priorityFeeSuggestions.urgent)
  const normalFee = normalFeePerGas.mul(gasLimit)
  const fastFee = fastFeePerGas.mul(gasLimit)
  const urgentFee = urgentFeePerGas.mul(gasLimit)
  return {
    type: FeeType.Eip1559,
    gasLimit: gasLimit.toString(),
    fee: {
      normal: normalFee.toString(),
      fast: fastFee.toString(),
      urgent: urgentFee.toString(),
    },
    feeDetails: {
      currentBaseFeePerGas: currentBaseFee.toString(),
      maxBaseFeePerGas: baseFeeSuggestion.toString(),
      maxPriorityFeePerGas: {
        normal: priorityFeeSuggestions.normal.toString(),
        fast: priorityFeeSuggestions.fast.toString(),
        urgent: priorityFeeSuggestions.urgent.toString(),
      },
    },
  }
}

async function computeGasFeeLegacy(
  provider: providers.JsonRpcProvider,
  gasLimit: BigNumber
): Promise<FeeInfoLegacy> {
  const gasPrice = await provider.getGasPrice()
  const normalFee = FixedNumber.from(gasPrice.mul(gasLimit))
  const fastFee = normalFee.mulUnsafe(FixedNumber.from(`${GAS_FAST_MULTIPLIER}`))
  const urgentFee = normalFee.mulUnsafe(FixedNumber.from(`${GAS_URGENT_MULTIPLIER}`))
  return {
    type: FeeType.Legacy,
    gasPrice: gasPrice.toString(),
    gasLimit: gasLimit.toString(),
    fee: {
      normal: fixedNumberToInt(normalFee),
      fast: fixedNumberToInt(fastFee),
      urgent: fixedNumberToInt(urgentFee),
    },
  }
}
