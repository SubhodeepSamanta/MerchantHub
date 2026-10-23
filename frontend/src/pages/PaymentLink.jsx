import { useState, useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Copy, Check, Download } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'

export default function PaymentLink() {
  const { merchant } = useAuth()
  const [copied, setCopied] = useState(false)
  const qrRef = useRef(null)

  const slug = (merchant?.slug && merchant.slug !== 'sharma-electronics') ? merchant.slug : 'samanta-electronics'
  const businessName = (merchant?.businessName && merchant.businessName !== 'Sharma Electronics') ? merchant.businessName : (merchant?.businessName || 'Samanta Electronics')

  const paymentUrl = `${window.location.origin}/pay/${slug}`

  const handleCopy = async () => {
    if (!paymentUrl) return
    try {
      await navigator.clipboard.writeText(paymentUrl)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch {
      setCopied(false)
    }
  }

  const handleDownloadQr = () => {
    const canvas = qrRef.current?.querySelector('canvas')
    if (canvas) {
      const url = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = url
      a.download = 'merchanthub-qr.png'
      document.body.appendChild(a)
      a.click()
      a.remove()
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Payment Link"
        description="Share payment link or display QR code at your checkout counter"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-line rounded-md bg-surface p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-ink mb-1.5">
              Public payment URL
            </h2>
            <p className="text-xs text-muted mb-4">
              Permanent payment link for your business. Anyone with this link can pay you directly via UPI.
            </p>

            <div className="flex flex-col gap-2">
              <div className="h-9 px-3 rounded-md border border-line bg-canvas text-xs font-mono text-ink flex items-center select-all overflow-x-auto whitespace-nowrap">
                {paymentUrl || 'Loading payment link...'}
              </div>
              <Button
                variant="secondary"
                onClick={handleCopy}
                disabled={!paymentUrl}
                className="w-full sm:w-auto self-start"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1.5 text-accent" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1.5" />
                    Copy link
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="border-t border-line pt-6 mt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
              How to use
            </h3>
            <ul className="text-[13px] text-muted space-y-2">
              <li>
                <strong className="text-ink font-medium">Digital sharing:</strong> Send via WhatsApp, SMS or email for instant remote payment.
              </li>
              <li>
                <strong className="text-ink font-medium">Shop counter:</strong> Print the QR code on the right and display it for walk-in customers.
              </li>
              <li>
                <strong className="text-ink font-medium">Automatic settlement:</strong> Collected funds reflect in your wallet instantly.
              </li>
            </ul>
          </div>
        </div>

        <div className="border border-line rounded-md bg-surface p-6 flex flex-col items-center justify-center text-center">
          <div
            ref={qrRef}
            className="p-4 bg-white border border-line rounded-md inline-block shadow-xs"
          >
            {paymentUrl ? (
              <QRCodeCanvas
                value={paymentUrl}
                size={200}
                level="M"
                fgColor="#1C1917"
                bgColor="#FFFFFF"
              />
            ) : (
              <div className="w-[200px] h-[200px] bg-neutral-bg animate-pulse rounded" />
            )}
          </div>

          <p className="text-[15px] font-semibold text-ink mt-4">
            {businessName}
          </p>
          <p className="text-xs text-muted font-mono mt-0.5">
            UPI accepted here
          </p>

          <Button
            variant="secondary"
            onClick={handleDownloadQr}
            disabled={!paymentUrl}
            className="mt-5"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Download QR
          </Button>
        </div>
      </div>
    </div>
  )
}
