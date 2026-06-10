import type { BrowserProvider } from 'ethers'

export const LUST_CHAIN_ID_DECIMAL = 6923
export const LUST_CHAIN_ID_HEX = '0x1b0b'

type EthereumProvider = {
  request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>
}

function getEthereum(): EthereumProvider | undefined {
  if (typeof window === 'undefined') return undefined

  const maybeWindow = window as unknown as {
    ethereum?: EthereumProvider
  }

  return maybeWindow.ethereum
}

export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error

  if (error && typeof error === 'object') {
    const maybeError = error as {
      message?: string
      shortMessage?: string
      reason?: string
      code?: number | string
      info?: {
        error?: {
          message?: string
        }
      }
    }

    if (maybeError.shortMessage) return maybeError.shortMessage
    if (maybeError.reason) return maybeError.reason
    if (maybeError.info?.error?.message) return maybeError.info.error.message
    if (maybeError.message) return maybeError.message
  }

  return 'Transaction failed. Please try again.'
}

export async function isLustChain(provider: BrowserProvider): Promise<boolean> {
  try {
    const network = await provider.getNetwork()
    return Number(network.chainId) === LUST_CHAIN_ID_DECIMAL
  } catch {
    return false
  }
}

export async function switchToLustChain(): Promise<void> {
  const ethereum = getEthereum()

  if (!ethereum?.request) {
    throw new Error('Wallet not found.')
  }

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: LUST_CHAIN_ID_HEX }],
    })
  } catch (error) {
    const err = error as { code?: number }

    if (err?.code === 4902) {
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: LUST_CHAIN_ID_HEX,
            chainName: 'LUST Chain',
            nativeCurrency: {
              name: 'LUST',
              symbol: 'LUST',
              decimals: 18,
            },
            rpcUrls: ['https://rpc.lustchain.org'],
            blockExplorerUrls: ['https://explorer.lustchain.org'],
          },
        ],
      })
      return
    }

    throw error
  }
}
