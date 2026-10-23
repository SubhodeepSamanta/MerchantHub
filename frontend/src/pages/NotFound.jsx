import { Link } from 'react-router'
import Button from '../components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <h1 className="text-[20px] font-semibold text-ink">Page not found</h1>
        <p className="text-sm text-muted mt-2">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="mt-6">
          <Link to="/dashboard">
            <Button variant="secondary">Back to dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
