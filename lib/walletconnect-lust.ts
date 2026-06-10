'use client'

import { EthereumProvider } from '@walletconnect/ethereum-provider'
import { withBasePath } from '@/lib/site'

const LUST_CHAIN_ID = 6923
const LUST_CHAIN_ID_HEX = '0x1b0b'
const LUST_WALLETCONNECT_CHAIN_ID = `eip155:${LUST_CHAIN_ID}`
const LUST_RPC_URL = 'https://rpc.lustchain.org'
const LUST_EXPLORER_URL = 'https://explorer.lustchain.org'
const LUST_WALLET_URL = 'https://wallet.lustchain.org'

const DEFAULT_PROJECT_ID = 'bfc7a39282888507c8c1dca6d8b2dbfe'
const STORAGE_KEY = 'lust_wc_connected_v1'

type WalletConnectProvider = {
  connect: () => Promise<unknown>
  disconnect: () => Promise<void>
  request: (args: { method: string; params?: unknown[] | object; chainId?: string }, chainId?: string) => Promise<any>
  on?: (event: string, handler: (...args: any[]) => void) => void
  removeListener?: (event: string, handler: (...args: any[]) => void) => void
  setDefaultChain?: (chainId: number | string) => Promise<void> | void
  chainId?: number | string
  session?: any
  client?: any
  signer?: any
}

export type WalletConnectState = {
  connected: boolean
  address: string
  chainId: string
}

let providerPromise: Promise<WalletConnectProvider> | null = null

function getProjectId() {
  return process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || DEFAULT_PROJECT_ID
}

function getMetadata() {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://lustchain.github.io/lust-platform-v2'

  return {
    name: 'LUST Chain',
    description: 'Official LUST Chain website',
    url: origin,
    icons: [`${origin}${withBasePath('/icon.png')}`],
  }
}

async function forceLustDefaultChain(provider: WalletConnectProvider) {
  try {
    await provider.setDefaultChain?.(LUST_CHAIN_ID)
  } catch {
    try {
      await provider.setDefaultChain?.(LUST_WALLETCONNECT_CHAIN_ID)
    } catch {
      // Some WalletConnect provider builds do not expose this helper.
    }
  }

  try {
    if (!provider.chainId) provider.chainId = LUST_CHAIN_ID
  } catch {
    // chainId may be read-only.
  }
}

export function buildLustWalletConnectUrl(uri: string) {
  const returnUrl =
    typeof window !== 'undefined' ? window.location.href : 'https://lustchain.github.io/lust-platform-v2/'

  return `${LUST_WALLET_URL}/wc?uri=${encodeURIComponent(uri)}&returnUrl=${encodeURIComponent(
    returnUrl,
  )}`
}

export function shouldResumeWalletConnect() {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function markWalletConnectConnected() {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {}
}

function clearWalletConnectConnected() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
}

function decimalChainToHex(ref?: string) {
  const value = Number.parseInt(ref || '', 10)
  if (!Number.isFinite(value)) return ''
  return `0x${value.toString(16)}`
}

function inferStateFromSession(session: any): WalletConnectState {
  const namespaces = session?.namespaces || session?.session?.namespaces || {}
  const accounts = Array.isArray(namespaces?.eip155?.accounts) ? namespaces.eip155.accounts : []
  const first = accounts[0]

  if (!first || typeof first !== 'string') {
    return { connected: false, address: '', chainId: '' }
  }

  const parts = first.split(':')
  if (parts.length < 3) {
    return { connected: false, address: '', chainId: '' }
  }

  const [, reference, address] = parts

  return {
    connected: Boolean(address),
    address: address || '',
    chainId: decimalChainToHex(reference),
  }
}

async function readWalletConnectState(provider: WalletConnectProvider): Promise<WalletConnectState> {
  await forceLustDefaultChain(provider)

  let address = ''
  let chainId = ''

  try {
    const accounts = (await provider.request({ method: 'eth_accounts' }, LUST_WALLETCONNECT_CHAIN_ID)) as string[]
    address = Array.isArray(accounts) ? accounts[0] || '' : ''
  } catch {
    // no-op
  }

  try {
    const nextChainId = (await provider.request({ method: 'eth_chainId' }, LUST_WALLETCONNECT_CHAIN_ID)) as string
    chainId = typeof nextChainId === 'string' ? nextChainId : ''
  } catch {
    // no-op
  }

  const inferred = inferStateFromSession(provider.session)

  return {
    connected: Boolean(address || inferred.address),
    address: address || inferred.address,
    chainId: chainId || inferred.chainId || LUST_CHAIN_ID_HEX,
  }
}

async function waitForWalletConnectState(
  provider: WalletConnectProvider,
  attempts = 8,
  delayMs = 300,
): Promise<WalletConnectState> {
  for (let i = 0; i < attempts; i += 1) {
    const state = await readWalletConnectState(provider)
    if (state.connected) return state
    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }
  return readWalletConnectState(provider)
}

export async function getWalletConnectProvider() {
  if (typeof window === 'undefined') {
    throw new Error('WalletConnect is only available in the browser.')
  }

  if (!providerPromise) {
    providerPromise = EthereumProvider.init({
      projectId: getProjectId(),
      metadata: getMetadata(),
      showQrModal: false,
      chains: [LUST_CHAIN_ID],
      optionalChains: [LUST_CHAIN_ID],
      methods: [
        'eth_accounts',
        'eth_requestAccounts',
        'eth_chainId',
        'eth_sendTransaction',
        'personal_sign',
        'eth_sign',
        'eth_signTypedData',
        'eth_signTypedData_v3',
        'eth_signTypedData_v4',
        'wallet_switchEthereumChain',
        'wallet_addEthereumChain',
      ],
      optionalMethods: [
        'wallet_watchAsset',
      ],
      events: ['accountsChanged', 'chainChanged'],
      optionalEvents: ['accountsChanged', 'chainChanged'],
      rpcMap: {
        [LUST_CHAIN_ID]: LUST_RPC_URL,
      },
    }) as Promise<WalletConnectProvider>
  }

  const provider = await providerPromise
  await forceLustDefaultChain(provider)
  return provider
}

export async function getWalletConnectState(): Promise<WalletConnectState> {
  try {
    const provider = await getWalletConnectProvider()
    return await readWalletConnectState(provider)
  } catch {
    return {
      connected: false,
      address: '',
      chainId: '',
    }
  }
}

export async function connectWalletConnect(
  onDisplayUri?: (uri: string, launchUrl: string) => void,
) {
  const provider = await getWalletConnectProvider()
  await forceLustDefaultChain(provider)

  const handleDisplayUri = (uri: string) => {
    const launchUrl = buildLustWalletConnectUrl(uri)
    onDisplayUri?.(uri, launchUrl)
  }

  provider.on?.('display_uri', handleDisplayUri)

  try {
    await provider.connect()
    await forceLustDefaultChain(provider)
    const state = await waitForWalletConnectState(provider)
    if (state.connected) markWalletConnectConnected()
    return state
  } finally {
    provider.removeListener?.('display_uri', handleDisplayUri)
  }
}

export async function disconnectWalletConnect() {
  try {
    const provider = await getWalletConnectProvider()
    await provider.disconnect()
  } finally {
    clearWalletConnectConnected()
  }
}

export async function switchWalletConnectToLust() {
  const provider = await getWalletConnectProvider()
  await forceLustDefaultChain(provider)

  // The LUST Wallet session is created for eip155:6923 already. Returning the
  // chain here is safer than asking WalletConnect to switch and accidentally
  // triggering a browser wallet fallback.
  return LUST_CHAIN_ID_HEX
}

export async function subscribeWalletConnect(
  listener: (state: WalletConnectState) => void,
): Promise<() => void> {
  const provider = await getWalletConnectProvider()

  const emit = async () => {
    const state = await readWalletConnectState(provider)
    if (state.connected) {
      markWalletConnectConnected()
    } else {
      clearWalletConnectConnected()
    }
    listener(state)
  }

  const handleConnect = () => {
    void emit()
  }

  const handleDisconnect = () => {
    clearWalletConnectConnected()
    listener({
      connected: false,
      address: '',
      chainId: '',
    })
  }

  const handleAccountsChanged = () => {
    void emit()
  }

  const handleChainChanged = () => {
    void emit()
  }

  provider.on?.('connect', handleConnect)
  provider.on?.('disconnect', handleDisconnect)
  provider.on?.('accountsChanged', handleAccountsChanged)
  provider.on?.('chainChanged', handleChainChanged)

  await emit()

  return () => {
    provider.removeListener?.('connect', handleConnect)
    provider.removeListener?.('disconnect', handleDisconnect)
    provider.removeListener?.('accountsChanged', handleAccountsChanged)
    provider.removeListener?.('chainChanged', handleChainChanged)
  }
}
