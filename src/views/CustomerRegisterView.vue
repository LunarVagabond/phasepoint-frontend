<template>
  <div class="customer-auth-page">
    <PublicSiteHeader title="Customer Onboarding" />
    <main class="customer-auth-main">
      <section class="auth-card">
        <h2 class="auth-title">Create Your Account</h2>
        <p class="auth-subtitle">Register your organization to submit ITAD requests from the secure customer portal.</p>
        <form class="auth-form" @submit.prevent="onSubmit">
          <div class="form-field">
            <label for="company-name">
              <span class="required-indicator">*</span>
              Company name
            </label>
            <input
              id="company-name"
              v-model="companyName"
              placeholder="Company or organization"
              required
              :class="getInputClass('companyName')"
              @input="validateCompanyName"
              @blur="touched.companyName = true"
            />
            <p v-if="errors.companyName && touched.companyName" class="field-error">{{ errors.companyName }}</p>
          </div>
          
          <div class="form-field">
            <label for="username">
              <span class="required-indicator">*</span>
              Username
            </label>
            <input
              id="username"
              v-model="username"
              placeholder="Choose a username"
              autocomplete="username"
              required
              :class="getInputClass('username')"
              @input="validateUsername"
              @blur="touched.username = true"
              pattern="[a-zA-Z0-9_-]+"
            />
            <p v-if="errors.username && touched.username" class="field-error">{{ errors.username }}</p>
            <p v-else-if="touched.username && !errors.username && username.trim()" class="field-hint">
              Username must be at least 3 characters and contain only letters, numbers, underscores, and hyphens.
            </p>
          </div>
          
          <div class="form-field">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="email"
              placeholder="name@company.com"
              type="email"
              autocomplete="email"
              :class="getInputClass('email')"
              @input="validateEmail"
              @blur="touched.email = true"
            />
            <p v-if="errors.email && touched.email" class="field-error">{{ errors.email }}</p>
            <p v-else-if="touched.email && !errors.email && email.trim()" class="field-hint">Valid email address</p>
          </div>
          
          <div class="form-field">
            <label for="phone">Phone</label>
            <input
              id="phone"
              v-model="phone"
              placeholder="(555) 555-5555"
              type="tel"
              :class="getInputClass('phone')"
              @input="formatPhone"
              @blur="touched.phone = true"
            />
            <p v-if="errors.phone && touched.phone" class="field-error">{{ errors.phone }}</p>
            <p v-else-if="touched.phone && !errors.phone && phone.trim()" class="field-hint">Phone number formatted</p>
          </div>
          
          <div class="form-field">
            <label for="password">
              <span class="required-indicator">*</span>
              Password
            </label>
            <input
              id="password"
              v-model="password"
              placeholder="Create a password"
              type="password"
              autocomplete="new-password"
              required
              :class="getInputClass('password')"
              @input="validatePassword"
              @blur="touched.password = true"
            />
            <p v-if="errors.password && touched.password" class="field-error">{{ errors.password }}</p>
            <p v-else-if="touched.password && !errors.password && password.length > 0" class="field-hint">
              Password meets requirements ({{ password.length }}/8 characters minimum)
            </p>
          </div>
          
          <div class="form-field">
            <label for="confirm-password">
              <span class="required-indicator">*</span>
              Confirm Password
            </label>
            <input
              id="confirm-password"
              v-model="confirmPassword"
              placeholder="Confirm your password"
              type="password"
              autocomplete="new-password"
              required
              :class="getInputClass('confirmPassword')"
              @input="validateConfirmPassword"
              @blur="touched.confirmPassword = true"
            />
            <p v-if="errors.confirmPassword && touched.confirmPassword" class="field-error">{{ errors.confirmPassword }}</p>
            <p v-else-if="touched.confirmPassword && !errors.confirmPassword && confirmPassword.length > 0" class="field-hint">
              Passwords match
            </p>
          </div>
          
          <button class="auth-submit" :disabled="loading || !isFormValid">
            {{ loading ? 'Creating...' : 'Create account' }}
          </button>
          <p v-if="error" class="auth-error">{{ error }}</p>
          <p class="auth-meta">
            Already registered?
            <router-link to="/customer/login">Sign in</router-link>
          </p>
        </form>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { registerCustomer } from '../api'
import PublicSiteHeader from '../components/PublicSiteHeader.vue'

const router = useRouter()
const companyName = ref('')
const username = ref('')
const email = ref('')
const phone = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')

const errors = ref({
  companyName: '',
  username: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
})

const touched = ref({
  companyName: false,
  username: false,
  email: false,
  phone: false,
  password: false,
  confirmPassword: false,
})

function getInputClass(fieldName: string): string {
  if (!touched.value[fieldName as keyof typeof touched.value]) {
    return ''
  }
  const hasError = errors.value[fieldName as keyof typeof errors.value]
  let hasValue = false
  
  if (fieldName === 'password') {
    hasValue = password.value.length > 0
  } else if (fieldName === 'confirmPassword') {
    hasValue = confirmPassword.value.length > 0
  } else if (fieldName === 'email' || fieldName === 'phone') {
    hasValue = (fieldName === 'email' ? email.value : phone.value).trim().length > 0
  } else {
    hasValue = (fieldName === 'companyName' ? companyName.value : username.value).trim().length > 0
  }
  
  if (hasError) {
    return 'input-error'
  }
  if (hasValue && !hasError) {
    return 'input-valid'
  }
  return ''
}

function validateCompanyName() {
  errors.value.companyName = ''
  const value = companyName.value.trim()
  if (!value) {
    errors.value.companyName = 'Company name is required.'
    return false
  }
  // Allow letters, numbers, spaces, underscores, hyphens, apostrophes, periods
  if (!/^[a-zA-Z0-9\s_\-'\.]+$/.test(value)) {
    errors.value.companyName = 'Company name contains invalid characters. Only letters, numbers, spaces, underscores, hyphens, apostrophes, and periods are allowed.'
    return false
  }
  return true
}

function validateUsername() {
  errors.value.username = ''
  const value = username.value.trim()
  if (!value) {
    errors.value.username = 'Username is required.'
    return false
  }
  if (value.length < 3) {
    errors.value.username = 'Username must be at least 3 characters long.'
    return false
  }
  // Only alphanumeric, underscore, hyphen - no spaces
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
    errors.value.username = 'Username may only contain letters, numbers, underscores, and hyphens.'
    return false
  }
  return true
}

function validateEmail() {
  errors.value.email = ''
  const value = email.value.trim()
  if (!value) {
    return true // Email is optional
  }
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if (!emailPattern.test(value)) {
    errors.value.email = 'Please enter a valid email address.'
    return false
  }
  return true
}

function formatPhone() {
  errors.value.phone = ''
  let value = phone.value
  
  // Remove all non-digit characters
  const digitsOnly = value.replace(/\D/g, '')
  
  if (digitsOnly.length === 0) {
    phone.value = ''
    return true
  }
  
  // Format as XXX-XXX-XXXX
  if (digitsOnly.length <= 3) {
    phone.value = digitsOnly
  } else if (digitsOnly.length <= 6) {
    phone.value = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3)}`
  } else if (digitsOnly.length <= 10) {
    phone.value = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`
  } else if (digitsOnly.length === 11 && digitsOnly[0] === '1') {
    // Handle 11-digit numbers starting with 1 (US country code)
    phone.value = `${digitsOnly.slice(1, 4)}-${digitsOnly.slice(4, 7)}-${digitsOnly.slice(7)}`
  } else {
    // Too many digits, keep only first 10
    phone.value = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 10)}`
  }
  
  // Validate if phone is provided
  if (digitsOnly.length > 0 && digitsOnly.length !== 10 && (digitsOnly.length !== 11 || digitsOnly[0] !== '1')) {
    errors.value.phone = 'Please enter a valid 10-digit phone number.'
    return false
  }
  
  return true
}

function validatePassword() {
  errors.value.password = ''
  const value = password.value
  if (!value) {
    errors.value.password = 'Password is required.'
    return false
  }
  if (value.length < 8) {
    errors.value.password = 'Password must be at least 8 characters long.'
    return false
  }
  // If confirm password is already filled, re-validate it
  if (confirmPassword.value && touched.value.confirmPassword) {
    validateConfirmPassword()
  }
  return true
}

function validateConfirmPassword() {
  errors.value.confirmPassword = ''
  const value = confirmPassword.value
  if (!value) {
    errors.value.confirmPassword = 'Please confirm your password.'
    return false
  }
  if (value !== password.value) {
    errors.value.confirmPassword = 'Passwords do not match.'
    return false
  }
  return true
}

const isFormValid = computed(() => {
  return (
    validateCompanyName() &&
    validateUsername() &&
    validateEmail() &&
    formatPhone() &&
    validatePassword() &&
    validateConfirmPassword()
  )
})

async function onSubmit() {
  // Clear previous errors
  error.value = ''
  errors.value = {
    companyName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  }
  
  // Mark all fields as touched
  touched.value = {
    companyName: true,
    username: true,
    email: true,
    phone: true,
    password: true,
    confirmPassword: true,
  }
  
  // Validate all fields
  const valid = isFormValid.value
  if (!valid) {
    error.value = 'Please correct the errors above before submitting.'
    return
  }
  
  loading.value = true
  try {
    // Format phone for submission (remove formatting, keep digits only)
    const phoneDigits = phone.value.replace(/\D/g, '')
    const formattedPhone = phoneDigits.length === 10 
      ? `${phoneDigits.slice(0, 3)}-${phoneDigits.slice(3, 6)}-${phoneDigits.slice(6)}`
      : phoneDigits.length === 11 && phoneDigits[0] === '1'
      ? `${phoneDigits.slice(1, 4)}-${phoneDigits.slice(4, 7)}-${phoneDigits.slice(7)}`
      : phoneDigits
    
    await registerCustomer({
      company_name: companyName.value.trim(),
      username: username.value.trim(),
      password: password.value,
      email: email.value.trim() || undefined,
      phone: formattedPhone || undefined,
    })
    await router.push('/customer-portal')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Registration failed.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
@use '../styles/variables' as *;

.customer-auth-page {
  min-height: 100vh;
  background: linear-gradient(180deg, var(--color-background) 0%, var(--color-surface) 100%);
}

.customer-auth-main {
  max-width: 1100px;
  margin: 0 auto;
  padding: $space-12 $space-4;
}

.auth-card {
  max-width: 620px;
  margin: 0 auto;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: $radius-lg;
  box-shadow: var(--shadow-md);
  padding: $space-8;
}

.auth-title {
  margin: 0 0 $space-2;
  font-size: $font-size-2xl;
}

.auth-subtitle {
  margin: 0 0 $space-6;
  color: var(--color-text-muted);
}

.auth-form {
  display: grid;
  grid-template-columns: 1fr;
  gap: $space-4;
}

.form-field {
  display: grid;
  gap: $space-1;
}

.form-field label {
  font-weight: 500;
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: $space-1;
}

.required-indicator {
  color: var(--color-error);
  font-weight: 600;
}

.auth-form input {
  width: 100%;
  padding: $space-3 $space-4;
  border: 1px solid var(--color-border);
  border-radius: $radius-md;
  background: var(--color-surface);
  color: var(--color-text);
  font-family: inherit;
  font-size: $font-size-base;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb, 37, 99, 235), 0.1);
  }
  
  &.input-error {
    border-color: var(--color-error);
    box-shadow: 0 0 0 3px rgba(var(--color-error-rgb, 239, 68, 68), 0.1);
  }
  
  &.input-valid {
    border-color: var(--color-success, #10b981);
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }
}

.field-error {
  margin: 0;
  color: var(--color-error);
  font-size: $font-size-sm;
}

.field-hint {
  margin: 0;
  color: var(--color-text-muted);
  font-size: $font-size-sm;
}

.valid-indicator {
  color: var(--color-success, #10b981);
  margin-left: $space-1;
}

.auth-submit {
  margin-top: $space-2;
  background: var(--color-primary);
  color: #fff;
  border: none;
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s ease;
  
  &:hover:not(:disabled) {
    opacity: 0.9;
  }
}

.auth-submit:disabled {
  opacity: 0.75;
  cursor: not-allowed;
}

.auth-error {
  margin: 0;
  color: var(--color-error);
  font-weight: 500;
}

.auth-meta {
  margin: $space-2 0 0;
  color: var(--color-text-muted);
  text-align: center;
}
</style>
