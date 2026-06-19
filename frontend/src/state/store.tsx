import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react'
import type { ChainProposal, ContractStats, World } from '../types'
import {
  connectWallet,
  disconnectWallet,
  fetchProposals,
  fetchStats,
  fetchWorlds,
  fetchWorldState,
  describeGenLayerError
} from '../genlayer/genlayerClient'

// The store holds the live, on-chain state of Lorebound. The world, its rules,
// artifacts, proposals (the trials / verdicts) and the contract stats are all
// read from the deployed Bradbury contract on mount and on a slow poll. Nothing
// is persisted locally and nothing is fabricated: a failed read surfaces an
// error state, never invented content.

// Slow background refresh interval. Reads are paused while a transaction is in
// flight so a live evaluation is never disturbed.
const POLL_MS = 120000

interface StoreValue {
  world: World | null
  proposals: ChainProposal[]
  stats: ContractStats | null
  loading: boolean
  error: string | null
  wallet: string | null
  refresh: () => Promise<void>
  setTxInFlight: (v: boolean) => void
  connect: () => Promise<{ ok: boolean; error?: string }>
  disconnect: () => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [world, setWorld] = useState<World | null>(null)
  const [proposals, setProposals] = useState<ChainProposal[]>([])
  const [stats, setStats] = useState<ContractStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [wallet, setWallet] = useState<string | null>(null)

  const txInFlight = useRef(false)
  const initialised = useRef(false)

  const loadFromChain = useCallback(async (showLoading: boolean) => {
    if (txInFlight.current) return
    if (showLoading) setLoading(true)
    try {
      const worlds = await fetchWorlds(0)
      if (!worlds || worlds.length === 0) {
        throw new Error('No worlds found on chain yet.')
      }
      const target = worlds[0]
      const [fullWorld, props, contractStats] = await Promise.all([
        fetchWorldState(target.worldId),
        fetchProposals(target.worldId, 0),
        fetchStats().catch(() => null)
      ])
      setWorld(fullWorld)
      setProposals(props)
      if (contractStats) setStats(contractStats)
      setError(null)
    } catch (err) {
      setError(describeGenLayerError(err))
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    await loadFromChain(true)
  }, [loadFromChain])

  const setTxInFlight = useCallback((v: boolean) => {
    txInFlight.current = v
    // When a transaction settles, pull the latest chain state immediately.
    if (!v) void loadFromChain(false)
  }, [loadFromChain])

  // Initial read on mount.
  useEffect(() => {
    if (initialised.current) return
    initialised.current = true
    void loadFromChain(true)
  }, [loadFromChain])

  // Slow background poll, paused while a transaction is in flight.
  useEffect(() => {
    const id = window.setInterval(() => {
      void loadFromChain(false)
    }, POLL_MS)
    return () => window.clearInterval(id)
  }, [loadFromChain])

  const connect = useCallback(async () => {
    const res = await connectWallet()
    if (res.ok && res.address) {
      setWallet(res.address)
      return { ok: true }
    }
    return { ok: false, error: res.error }
  }, [])

  const disconnect = useCallback(() => {
    disconnectWallet()
    setWallet(null)
  }, [])

  const value = useMemo<StoreValue>(
    () => ({
      world,
      proposals,
      stats,
      loading,
      error,
      wallet,
      refresh,
      setTxInFlight,
      connect,
      disconnect
    }),
    [world, proposals, stats, loading, error, wallet, refresh, setTxInFlight, connect, disconnect]
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

// Reduced motion is driven purely by the system preference now that the
// Settings toggle is gone.
export function useReducedMotion(): boolean {
  const [system, setSystem] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setSystem(mq.matches)
    const handler = () => setSystem(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return system
}
