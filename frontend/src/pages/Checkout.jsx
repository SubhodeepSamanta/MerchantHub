import { useParams } from 'react-router'

export default function Checkout() {
  const { slug } = useParams()

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] bg-surface border border-line rounded-md p-6 text-center">
        <p className="text-sm text-muted">Checkout for {slug}</p>
      </div>
    </div>
  )
}
