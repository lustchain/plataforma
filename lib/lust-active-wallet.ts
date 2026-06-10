'use client'

export const LUST_CHAIN_ID_DECIMAL = 6923
export const LUST_CHAIN_ID_HEX = '0x1b0b'
export const LUST_WALLETCONNECT_CHAIN_ID = `eip155:${LUST_CHAIN_ID_DECIMAL}`
export const LUST_RPC_URL = 'https://rpc.lustchain.org'
export const LUST_EXPLORER_URL = 'https://explorer.lustchain.org'

export type LustWalletConnector = '' | 'injected' | 'walletconnect'

export type EthereumRequestArgs = {
  method: string
  params?: unknown[] | Record<string, unknown>
  chainId?: string
}

export type EthereumProvider = {
  request: (args: EthereumRequestArgs, chainId?: string) => Promise<unknown>
  on?: (event: string, handler: (...args: unknown[]) => void) => void
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void
}

type WalletConnectClientLike = {
  request?: (args: {
    topic: string
    chainId: string
    request: {
      method: string
      params?: unknown[] | Record<string, unknown>
    }
  }) => Promise<unknown>
}

type WalletConnectLike = EthereumProvider & {
  client?: WalletConnectClientLike
  signer?: { client?: WalletConnectClientLike }
  session?: { topic?: string; namespaces?: unknown } | null
  setDefaultChain?: (chainId: number | string) => Promise<void> | void
  chainId?: number | string
}

export type ActiveWalletBridge = {
  connector?: LustWalletConnector
  address?: string
  chainId?: string
  provider?: EthereumProvider
} | null

export type ActiveWalletSnapshot = {
  provider: EthereumProvider | null
  providerReady: boolean
  account: string | null
  chainId: string | null
  connector: LustWalletConnector
}

type LustWindow = Window & {
  ethereum?: EthereumProvider
  __LUST_ACTIVE_WALLET__?: ActiveWalletBridge
}

export function normalizeChainId(value?: string | null) {
  return String(value || '').toLowerCase()
}

export function isLustChain(value?: string | null) {
  return normalizeChainId(value) === LUST_CHAIN_ID_HEX
}

export function toHex(value: bigint | number) {
  const normalized = typeof value === 'bigint' ? value : BigInt(value)
  return `0x${normalized.toString(16)}`
}

export function getInjectedEthereum(): EthereumProvider | undefined {
  if (typeof window === 'undefined') return undefined
  return (window as LustWindow).ethereum
}

export function getActiveWalletBridge(): ActiveWalletBridge {
  if (typeof window === 'undefined') return null
  return (window as LustWindow).__LUST_ACTIVE_WALLET__ || null
}

export function getActiveWalletProvider(): EthereumProvider | undefined {
  const bridge = getActiveWalletBridge()

  // Important: when the top header says LUST Wallet / WalletConnect is active,
  // never silently fall back to window.ethereum. That fallback opens MetaMask.
  if (bridge?.connector === 'walletconnect') {
    return bridge.provider
  }

  return bridge?.provider || getInjectedEthereum()
}

export function getErrorMessage(cause: unknown, fallback = 'Request failed') {
  const error = cause as { shortMessage?: unknown; reason?: unknown; message?: unknown }
  const raw = String(error?.shortMessage || error?.reason || error?.message || fallback)

  if (raw.includes('Cannot read properties of undefined') && raw.includes('includes')) {
    return 'WalletConnect did not route the request to LUST Chain. Disconnect LUST Wallet in the top button, reconnect it, and try once more.'
  }

  return raw
}

function buildRequestArgs(method: string, params?: unknown[] | Record<string, unknown>, chainId?: string): EthereumRequestArgs {
  return {
    method,
    ...(params !== undefined ? { params } : {}),
    ...(chainId ? { chainId } : {}),
  }
}

function looksLikeWalletConnect(provider: EthereumProvider) {
  const candidate = provider as WalletConnectLike
  return Boolean(candidate.session || candidate.client || candidate.signer?.client || candidate.setDefaultChain)
}

async function forceWalletConnectLustChain(provider: WalletConnectLike) {
  try {
    // WalletConnect v2 expects CAIP-2 ids for chain-specific routing.
    // Example: eip155:6923, not just 6923.
    await provider.setDefaultChain?.(LUST_WALLETCONNECT_CHAIN_ID)
  } catch {
    try {
      await provider.setDefaultChain?.(LUST_CHAIN_ID_DECIMAL)
    } catch {
      // Some provider builds do not expose setDefaultChain.
    }
  }

  try {
    if (!provider.chainId) provider.chainId = LUST_WALLETCONNECT_CHAIN_ID
  } catch {
    // chainId may be read-only in some builds.
  }
}

async function requestViaWalletConnectClient(
  provider: WalletConnectLike,
  method: string,
  params?: unknown[] | Record<string, unknown>,
) {
  const client = provider.client || provider.signer?.client
  const topic = provider.session?.topic

  if (!client?.request || !topic) {
    throw new Error('WalletConnect client is not ready yet.')
  }

  return client.request({
    topic,
    chainId: LUST_WALLETCONNECT_CHAIN_ID,
    request: {
      method,
      ...(params !== undefined ? { params } : {}),
    },
  })
}

export async function requestFromActiveWallet(
  provider: EthereumProvider,
  method: string,
  params?: unknown[] | Record<string, unknown>,
) {
  const bridge = getActiveWalletBridge()
  const isWalletConnect = bridge?.connector === 'walletconnect' || looksLikeWalletConnect(provider)

  if (!isWalletConnect) {
    return provider.request(buildRequestArgs(method, params))
  }

  const wcProvider = provider as WalletConnectLike
  await forceWalletConnectLustChain(wcProvider)

  // Best route for WalletConnect v2: send directly to the approved session topic
  // and explicit eip155:6923 chain. This avoids MetaMask and avoids undefined
  // routing errors from some EthereumProvider wrappers.
  try {
    return await requestViaWalletConnectClient(wcProvider, method, params)
  } catch (firstCause) {
    // Fallbacks for provider builds that do not expose client.request.
    try {
      return await provider.request(buildRequestArgs(method, params), LUST_WALLETCONNECT_CHAIN_ID)
    } catch {
      try {
        return await provider.request(buildRequestArgs(method, params, LUST_WALLETCONNECT_CHAIN_ID))
      } catch {
        try {
          return await provider.request(buildRequestArgs(method, params))
        } catch {
          throw firstCause
        }
      }
    }
  }
}

export async function readActiveWalletSnapshot(): Promise<ActiveWalletSnapshot> {
  if (typeof window === 'undefined') {
    return { provider: null, providerReady: false, account: null, chainId: null, connector: '' }
  }

  const bridge = getActiveWalletBridge()

  if (bridge?.connector === 'walletconnect') {
    return {
      provider: bridge.provider || null,
      providerReady: Boolean(bridge.provider),
      account: bridge.address || null,
      chainId: bridge.chainId || LUST_CHAIN_ID_HEX,
      connector: 'walletconnect',
    }
  }

  if (bridge?.address && bridge?.provider) {
    return {
      provider: bridge.provider,
      providerReady: true,
      account: bridge.address,
      chainId: bridge.chainId || null,
      connector: bridge.connector || '',
    }
  }

  const eth = getInjectedEthereum()
  if (!eth) {
    return { provider: null, providerReady: false, account: null, chainId: null, connector: '' }
  }

  try {
    const [accounts, currentChainId] = (await Promise.all([
      eth.request({ method: 'eth_accounts' }),
      eth.request({ method: 'eth_chainId' }),
    ])) as [string[], string]

    return {
      provider: eth,
      providerReady: true,
      account: accounts?.[0] || null,
      chainId: currentChainId || null,
      connector: accounts?.[0] ? 'injected' : '',
    }
  } catch {
    return { provider: eth, providerReady: true, account: null, chainId: null, connector: 'injected' }
  }
}

export async function rpcCall(method: string, params: unknown[] = []) {
  const response = await fetch(LUST_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
  })

  if (!response.ok) throw new Error(`RPC HTTP ${response.status}`)

  const data = (await response.json()) as { result?: unknown; error?: { message?: string } }
  if (data.error) throw new Error(data.error.message || 'RPC error')
  return data.result
}

export async function getLegacyGasPrice() {
  try {
    const raw = await rpcCall('eth_gasPrice')
    if (typeof raw === 'string') {
      const value = BigInt(raw)
      if (value > 0n) return value
    }
  } catch {
    // fallback below
  }

  return 1_000_000_000n
}

export function withGasBuffer(value: bigint, fallback: bigint) {
  const base = value > 0n ? value : fallback
  return (base * 125n) / 100n + 25_000n
}

export async function estimateGasWithFallback(
  tx: Record<string, unknown>,
  fallbackGasLimit: bigint,
) {
  try {
    const raw = await rpcCall('eth_estimateGas', [tx])
    if (typeof raw === 'string') {
      const gas = BigInt(raw)
      if (gas > 0n) return withGasBuffer(gas, fallbackGasLimit)
    }
  } catch {
    // Custom LUST nodes or contract reverts can reject estimation. Use fixed safe limit.
  }

  return withGasBuffer(0n, fallbackGasLimit)
}

export async function switchProviderToLust(provider: EthereumProvider) {
  const bridge = getActiveWalletBridge()

  if (bridge?.connector === 'walletconnect' || looksLikeWalletConnect(provider)) {
    await forceWalletConnectLustChain(provider as WalletConnectLike)
    return LUST_CHAIN_ID_HEX
  }

  try {
    await requestFromActiveWallet(provider, 'wallet_switchEthereumChain', [{ chainId: LUST_CHAIN_ID_HEX }])
  } catch {
    await requestFromActiveWallet(provider, 'wallet_addEthereumChain', [
      {
        chainId: LUST_CHAIN_ID_HEX,
        chainName: 'LUST Chain',
        nativeCurrency: { name: 'LUST', symbol: 'LUST', decimals: 18 },
        rpcUrls: [LUST_RPC_URL],
        blockExplorerUrls: [LUST_EXPLORER_URL],
      },
    ])
  }

  try {
    const nextChainId = await requestFromActiveWallet(provider, 'eth_chainId')
    return typeof nextChainId === 'string' ? nextChainId : LUST_CHAIN_ID_HEX
  } catch {
    return LUST_CHAIN_ID_HEX
  }
}
