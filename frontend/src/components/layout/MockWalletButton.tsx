import { Wallet, LogOut } from 'lucide-react'
import { useStore } from '../../state/store'
import { shortAddress } from '../../utils/formatters'

export function MockWalletButton() {
  const { wallet, connect, disconnect } = useStore()
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
  return (
    <button type="button" onClick={connect} className="cta cta-ghost !px-4 !py-2 text-sm">
      <Wallet size={15} />
      <span>Connect</span>
    </button>
  )
}
