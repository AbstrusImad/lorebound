import { useState } from 'react'
import { Wallet, LogOut, AlertTriangle } from 'lucide-react'
import { useStore } from '../../state/store'
import { shortAddress } from '../../utils/formatters'
import { hasInjectedWallet, FAUCET } from '../../genlayer/genlayerClient'

// Real wallet connect only. With an injected provider it requests accounts and
// signs live Bradbury transactions. With no provider it states that no wallet
// was detected and links the faucet, never synthesizing a demo address.

export function WalletButton() {
  const { wallet, connect, disconnect } = useStore()
  const [noWallet, setNoWallet] = useState(false)

  if (wallet) {
    return (
      <button
        type="button"
        onClick={disconnect}
        className="rune-chip inline-flex items-center gap-2 hover:border-rune transition-colors"
        title="Disconnect wallet"
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--success-mint)' }} />
        <span className="text-bone/80">{shortAddress(wallet)}</span>
        <LogOut size={12} />
      </button>
    )
  }

  if (noWallet) {
    return (
      <a
        href={FAUCET}
        target="_blank"
        rel="noreferrer"
        className="rune-chip inline-flex items-center gap-2 hover:border-rune transition-colors"
        title="No wallet detected. Open the testnet faucet."
        style={{ color: 'var(--myth-gold)', borderColor: 'var(--myth-gold)' }}
      >
        <AlertTriangle size={13} />
        <span>No wallet detected</span>
      </a>
    )
  }

  return (
    <button
      type="button"
      onClick={async () => {
        if (!hasInjectedWallet()) {
          setNoWallet(true)
          return
        }
        const res = await connect()
        if (!res.ok) setNoWallet(true)
      }}
      className="cta cta-ghost !px-4 !py-2 text-sm"
    >
      <Wallet size={15} />
      <span>Connect</span>
    </button>
  )
}
