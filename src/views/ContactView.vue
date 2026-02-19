<template>
  <div class="public-page">
    <PublicSiteHeader title="Contact Us" />
    <EnvironmentBanner />
    <main class="public-main">
      <section class="page-hero">
        <h1>Contact Us</h1>
        <p class="hero-subtitle">Get in touch with our team to discuss your ITAD needs</p>
      </section>

      <section class="page-section">
        <div class="section-content">
          <div class="contact-grid">
            <div class="contact-info">
              <h2>Get in Touch</h2>
              <div class="contact-item">
                <h3>Email</h3>
                <p><a href="mailto:info@phasepoint.com">info@phasepoint.com</a></p>
                <p><a href="mailto:sales@phasepoint.com">sales@phasepoint.com</a></p>
              </div>
              <div class="contact-item">
                <h3>Phone</h3>
                <p><a href="tel:+15551234567">(555) 123-4567</a></p>
                <p class="contact-note">Monday - Friday, 8am - 6pm EST</p>
              </div>
              <div class="contact-item">
                <h3>Support</h3>
                <p><a href="mailto:support@phasepoint.com">support@phasepoint.com</a></p>
                <p class="contact-note">24/7 support for existing customers</p>
              </div>
            </div>
            <div class="contact-form-section">
              <h2>Request a Quote</h2>
              <form class="contact-form" @submit.prevent="handleSubmit">
                <div class="form-group">
                  <label for="name">Name</label>
                  <input id="name" v-model="form.name" type="text" required />
                </div>
                <div class="form-group">
                  <label for="email">Email</label>
                  <input id="email" v-model="form.email" type="email" required />
                </div>
                <div class="form-group">
                  <label for="company">Company</label>
                  <input id="company" v-model="form.company" type="text" />
                </div>
                <div class="form-group">
                  <label for="phone">Phone</label>
                  <input id="phone" v-model="form.phone" type="tel" />
                </div>
                <div class="form-group">
                  <label for="message">Message</label>
                  <textarea id="message" v-model="form.message" rows="5" required></textarea>
                </div>
                <button type="submit" class="btn-primary" :disabled="submitting">
                  {{ submitting ? 'Sending...' : 'Send Message' }}
                </button>
                <p v-if="submitSuccess" class="form-success">Thank you! We'll be in touch soon.</p>
                <p v-if="submitError" class="form-error">{{ submitError }}</p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer class="public-footer">
      <div class="footer-content">
        <div class="footer-section">
          <h3 class="footer-heading">Company</h3>
          <nav class="footer-nav">
            <router-link to="/about">About</router-link>
            <router-link to="/services">Services</router-link>
            <router-link to="/compliance">Compliance</router-link>
            <router-link to="/contact">Contact</router-link>
          </nav>
        </div>
        <div class="footer-section">
          <h3 class="footer-heading">Resources</h3>
          <nav class="footer-nav">
            <router-link to="/resources">Resources</router-link>
            <router-link to="/customer/register">Get Started</router-link>
            <router-link to="/login">Access Portal</router-link>
          </nav>
        </div>
        <div class="footer-section">
          <h3 class="footer-heading">Legal</h3>
          <nav class="footer-nav">
            <router-link to="/terms">Terms of Service</router-link>
            <a href="#" @click.prevent>Privacy Policy</a>
          </nav>
        </div>
        <div class="footer-section">
          <h3 class="footer-heading">Contact</h3>
          <p class="footer-contact">Email: info@phasepoint.com</p>
          <p class="footer-contact">Phone: (555) 123-4567</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p class="footer-copy">Phasepoint — IT Asset Disposition. Secure. Compliant. Sustainable.</p>
        <p class="footer-copyright">&copy; 2026 Phasepoint. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import EnvironmentBanner from '../components/EnvironmentBanner.vue'
import PublicSiteHeader from '../components/PublicSiteHeader.vue'
import { useNotifications } from '../composables/useNotifications'

const form = ref({
  name: '',
  email: '',
  company: '',
  phone: '',
  message: ''
})

const submitting = ref(false)
const submitSuccess = ref(false)
const submitError = ref('')

async function handleSubmit() {
  submitting.value = true
  submitError.value = ''
  submitSuccess.value = false

  try {
    const { submitContactForm } = await import('../api')
    await submitContactForm({
      name: form.value.name,
      email: form.value.email,
      company: form.value.company || undefined,
      phone: form.value.phone || undefined,
      message: form.value.message,
    })
    submitSuccess.value = true
    form.value = { name: '', email: '', company: '', phone: '', message: '' }
    const { success: showSuccess } = useNotifications()
    showSuccess('Thank you! We\'ll be in touch soon.')
  } catch (e) {
    submitError.value = e instanceof Error ? e.message : 'Failed to send message. Please try again.'
    const { error: showError } = useNotifications()
    showError(submitError.value)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
@use '../styles/views/contact';
</style>
