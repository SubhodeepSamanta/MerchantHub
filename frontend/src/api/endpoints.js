import client from './client'

export function getErrorMessage(error) {
  return error?.response?.data?.message || 'Something went wrong. Please try again.'
}

export function registerMerchant(data) {
  return client.post('/auth/register', data).then((res) => res.data)
}

export function loginMerchant(data) {
  return client.post('/auth/login', data).then((res) => res.data)
}

export function getCurrentMerchant() {
  return client.get('/merchants/me').then((res) => res.data)
}

export function getWallet() {
  return client.get('/wallet').then((res) => res.data)
}

export function getLedger(page = 0, size = 20) {
  return client.get('/wallet/ledger', { params: { page, size } }).then((res) => res.data)
}

export function exportLedgerCsv() {
  return client.get('/wallet/ledger/export', { responseType: 'blob' }).then((res) => {
    const blob = new Blob([res.data], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'merchanthub-ledger.csv')
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    return res.data
  })
}

export function createPayment(data) {
  return client.post('/payments', data, {
    headers: {
      'Idempotency-Key': crypto.randomUUID()
    }
  }).then((res) => res.data)
}

export function getPayments(page = 0, size = 20, status) {
  const params = { page, size }
  if (status && status !== 'ALL') {
    params.status = status
  }
  return client.get('/payments', { params }).then((res) => res.data)
}

export function getPayment(id) {
  return client.get(`/payments/${id}`).then((res) => res.data)
}

export function refundPayment(id) {
  return client.post(`/payments/${id}/refund`).then((res) => res.data)
}

export function getAdvanceEligibility() {
  return client.get('/advances/eligibility').then((res) => res.data)
}

export function applyForAdvance(amount) {
  return client.post('/advances', { amount }).then((res) => res.data)
}

export function getAdvances() {
  return client.get('/advances').then((res) => res.data)
}

export function getDashboardSummary() {
  return client.get('/dashboard/summary').then((res) => res.data)
}

export function getPublicMerchant(slug) {
  return client.get(`/public/merchants/${slug}`).then((res) => res.data)
}

export function createPublicPayment(slug, data) {
  return client.post(`/public/merchants/${slug}/pay`, data, {
    headers: {
      'Idempotency-Key': crypto.randomUUID()
    }
  }).then((res) => res.data)
}
