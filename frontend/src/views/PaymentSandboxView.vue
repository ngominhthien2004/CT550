<script setup>
import { computed, reactive, ref } from 'vue'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import { navItems } from '../constants/navigation'
import { paymentApi } from '../services/api'

const isNavCollapsed = ref(true)
const loading = ref(false)
const error = ref('')
const result = ref(null)
const confirmation = ref(null)

const form = reactive({
  requestId: '',
  amount: 200000,
  currency: 'VND',
  bankCode: 'VCB',
  bankAccount: '0000000000',
  accountName: 'ILLUWRL ESCROW',
  expiresInMinutes: 15,
})

const feeRows = computed(() => {
  const breakdown = result.value?.breakdown
  if (!breakdown) {
    return []
  }

  return [
    ['Gross amount', `${breakdown.amount} ${breakdown.currency}`],
    ['Platform fee', `${breakdown.platformFeeAmount} ${breakdown.currency} (${Math.round(breakdown.platformFeeRate * 100)}%)`],
    ['Creator net', `${breakdown.creatorNetAmount} ${breakdown.currency}`],
  ]
})

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}

async function createQrIntent() {
  loading.value = true
  error.value = ''
  confirmation.value = null

  try {
    const { data } = await paymentApi.createQrIntent({
      requestId: form.requestId,
      amount: form.amount,
      currency: form.currency,
      bankCode: form.bankCode,
      bankAccount: form.bankAccount,
      accountName: form.accountName,
      expiresInMinutes: form.expiresInMinutes,
      country: 'VN',
    })
    result.value = data
  } catch (err) {
    error.value = err?.response?.data?.message || 'Failed to create QR payment intent'
    result.value = null
  } finally {
    loading.value = false
  }
}

async function simulateConfirm() {
  if (!result.value?.payment?._id) {
    return
  }

  loading.value = true
  error.value = ''

  try {
    const { data } = await paymentApi.simulateBankConfirm(result.value.payment._id, {
      bankTransactionId: `TEST-${Date.now()}`,
    })
    confirmation.value = data
  } catch (err) {
    error.value = err?.response?.data?.message || 'Failed to simulate bank confirmation'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <MainLayoutTemplate :nav-items="navItems" :is-nav-collapsed="isNavCollapsed" site-name="IlluWrl" @toggle-sidebar="toggleLeftNav">
    <section class="payment-sandbox page-block">
      <header class="sandbox-header">
        <div>
          <p class="eyebrow">Payment Sandbox</p>
          <h1>Mock QR Checkout</h1>
        </div>
        <p>Test escrow without real gateway credentials.</p>
      </header>

      <div class="sandbox-grid">
        <form class="sandbox-card" @submit.prevent="createQrIntent">
          <h2>Create QR Intent</h2>
          <label>
            Request ID
            <input v-model="form.requestId" type="text" required placeholder="Mongo request _id" />
          </label>
          <div class="form-grid">
            <label>
              Amount
              <input v-model.number="form.amount" type="number" min="1" required />
            </label>
            <label>
              Currency
              <select v-model="form.currency">
                <option value="VND">VND</option>
                <option value="JPY">JPY</option>
                <option value="USD">USD</option>
              </select>
            </label>
            <label>
              Bank code
              <input v-model="form.bankCode" type="text" required />
            </label>
            <label>
              Bank account
              <input v-model="form.bankAccount" type="text" required />
            </label>
          </div>
          <label>
            Account name
            <input v-model="form.accountName" type="text" required />
          </label>
          <label>
            Expires in minutes
            <input v-model.number="form.expiresInMinutes" type="number" min="1" max="60" />
          </label>

          <p v-if="error" class="state error">{{ error }}</p>
          <button type="submit" :disabled="loading">{{ loading ? 'Working...' : 'Generate QR' }}</button>
        </form>

        <article class="sandbox-card">
          <h2>QR Preview</h2>
          <div v-if="result?.qr" class="qr-preview">
            <img :src="result.qr.qrImageUrl" alt="Mock VietQR payment code" />
            <dl>
              <div><dt>Transfer content</dt><dd>{{ result.qr.transferContent }}</dd></div>
              <div><dt>Bank</dt><dd>{{ result.qr.bankCode }}</dd></div>
              <div><dt>Account</dt><dd>{{ result.qr.bankAccount }}</dd></div>
              <div><dt>Expires</dt><dd>{{ new Date(result.qr.expiresAt).toLocaleString() }}</dd></div>
            </dl>
            <div class="fee-box">
              <div v-for="[label, value] in feeRows" :key="label">
                <span>{{ label }}</span>
                <strong>{{ value }}</strong>
              </div>
            </div>
            <button type="button" class="confirm-btn" :disabled="loading" @click="simulateConfirm">
              Simulate bank confirmation
            </button>
          </div>
          <p v-else class="empty">Generate a QR intent to preview payment details.</p>
        </article>

        <article class="sandbox-card result-card">
          <h2>Escrow Result</h2>
          <div v-if="confirmation?.payment" class="result-box">
            <p><strong>Payment:</strong> {{ confirmation.payment.status }}</p>
            <p><strong>Request payment status:</strong> {{ confirmation.request?.paymentStatus }}</p>
            <p><strong>Provider charge:</strong> {{ confirmation.payment.providerChargeId }}</p>
          </div>
          <p v-else class="empty">After confirmation, payment should move to held escrow.</p>
        </article>
      </div>
    </section>
  </MainLayoutTemplate>
</template>

<style scoped>
.payment-sandbox {
  min-height: calc(100vh - 112px);
  background: #f6f9fd;
  padding: 1rem;
}

.sandbox-header,
.sandbox-grid {
  max-width: 1120px;
  margin: 0 auto;
}

.sandbox-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: end;
  margin-bottom: 1rem;
}

.sandbox-header p:last-child,
.empty,
.state {
  color: #64748b;
  font-size: 0.88rem;
  font-weight: 700;
}

.eyebrow {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.sandbox-grid {
  display: grid;
  grid-template-columns: minmax(280px, 380px) minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
}

.sandbox-card {
  border: 1px solid #d8e1ef;
  border-radius: 12px;
  background: #fff;
  padding: 1rem;
  display: grid;
  gap: 0.8rem;
}

.result-card {
  grid-column: 2;
}

h1 {
  font-size: 2rem;
}

h2 {
  font-size: 1.1rem;
}

label {
  display: grid;
  gap: 0.35rem;
  color: #334155;
  font-size: 0.82rem;
  font-weight: 800;
}

input,
select {
  width: 100%;
  border: 1px solid #d8e1ef;
  border-radius: 8px;
  color: #172033;
  font: inherit;
  font-weight: 600;
  padding: 0.66rem 0.7rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.7rem;
}

button {
  border: none;
  border-radius: 999px;
  background: #0096fa;
  color: #fff;
  font-weight: 900;
  padding: 0.72rem 1rem;
}

button:disabled {
  opacity: 0.55;
}

.confirm-btn {
  background: #0f766e;
}

.state.error {
  color: #dc2626;
}

.qr-preview {
  display: grid;
  gap: 0.8rem;
}

.qr-preview img {
  width: min(280px, 100%);
  border: 1px solid #d8e1ef;
  border-radius: 10px;
  background: #f8fafc;
}

dl {
  display: grid;
  gap: 0.4rem;
  margin: 0;
}

dl div,
.fee-box div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid #edf0f4;
  padding-bottom: 0.35rem;
}

dt,
.fee-box span {
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 800;
}

dd,
.fee-box strong {
  margin: 0;
  color: #172033;
  font-size: 0.85rem;
  font-weight: 900;
  text-align: right;
}

.fee-box {
  border: 1px solid #d8e1ef;
  border-radius: 10px;
  padding: 0.75rem;
  display: grid;
  gap: 0.45rem;
}

.result-box {
  display: grid;
  gap: 0.45rem;
  color: #334155;
}

@media (max-width: 860px) {
  .sandbox-header,
  .sandbox-grid {
    display: grid;
    grid-template-columns: 1fr;
  }

  .result-card {
    grid-column: auto;
  }
}

@media (max-width: 620px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
