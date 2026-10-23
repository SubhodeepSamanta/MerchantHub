import { formatINR } from './utils/format'

export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-80 bg-surface border border-line rounded-md p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">Wallet balance</p>
        <p className="mt-2 font-mono text-2xl tabular-nums">{formatINR(124500)}</p>
        <span className="mt-3 inline-block text-xs px-2 py-0.5 rounded bg-success-bg text-success-text">SUCCESS</span>
        <button className="mt-6 w-full bg-accent hover:bg-accent-hover text-white text-sm font-medium py-2 rounded-md transition-colors duration-150">
          Collect payment
        </button>
      </div>
    </div>
  )
}