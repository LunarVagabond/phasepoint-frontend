<template>
  <div class="landing">
    <PublicSiteHeader v-if="!isAuthenticated" title="Secure ITAD Services" />
    <SiteHeader v-else :policy-only="false" />
    <EnvironmentBanner />
    <div v-if="showSubmittedAlert" class="submitted-alert" role="alert">
      Request submitted successfully. We will be in touch.
    </div>
    <header class="landing-hero">
      <div class="hero-bg">
        <img
          src="/images/hero.jpg"
          alt=""
          class="hero-img"
          width="1920"
          height="800"
          loading="eager"
        />
        <div class="hero-overlay" />
      </div>
      <div class="hero-content">
        <h1 class="hero-title">Secure ITAD as if your data and the planet depend on it. They do.</h1>
        <p class="hero-sub">Beyond disposal—we handle data destruction, certified recycling, and full compliance so you can offload responsibility and focus on what's next.</p>
        <div class="hero-cta">
          <router-link to="/customer/register" class="btn btn-primary">Get started</router-link>
        </div>
      </div>
    </header>

    <main class="landing-main">
      <section class="section section-trust">
        <h2 class="section-heading section-heading-center">Trusted ITAD Services</h2>
        <div class="trust-metrics">
          <div class="metric">
            <div class="metric-value">100%</div>
            <div class="metric-label">Data Destruction Success Rate</div>
          </div>
          <div class="metric">
            <div class="metric-value">R2</div>
            <div class="metric-label">Certified</div>
          </div>
          <div class="metric">
            <div class="metric-value">ISO</div>
            <div class="metric-label">Compliant</div>
          </div>
          <div class="metric">
            <div class="metric-value">24/7</div>
            <div class="metric-label">Support</div>
          </div>
        </div>
        <div class="certifications">
          <a href="https://sustainableelectronics.org/r2/" target="_blank" rel="noopener noreferrer" class="cert-badge">R2 Certified</a>
          <a href="https://e-stewards.org/" target="_blank" rel="noopener noreferrer" class="cert-badge">e-Stewards</a>
          <a href="https://www.iso.org/iso-14001-environmental-management.html" target="_blank" rel="noopener noreferrer" class="cert-badge">ISO 14001</a>
        </div>
      </section>

      <section class="section section-intro">
        <div class="section-inner">
          <div class="section-text">
            <h2 class="section-heading">What is ITAD?</h2>
            <p class="section-body">
              <strong>IT Asset Disposition (ITAD)</strong> is the secure, compliant process of retiring and disposing of IT equipment—laptops, phones, servers, and more. As upgrade cycles shorten and e-waste grows, responsible disposition isn't optional: it's a requirement for data security, environmental responsibility, and regulatory compliance.
            </p>
            <p class="section-body">
              We take the entire burden off your shoulders: from chain-of-custody and data sanitization to certified recycling and documentation. You get peace of mind; we handle the rest.
            </p>
          </div>
          <div class="section-media">
            <img
              src="/images/card-recycling.png"
              alt="Data destruction and recycling"
              width="560"
              height="360"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section class="section section-process">
        <h2 class="section-heading section-heading-center">How It Works</h2>
        <p class="section-lead">Our streamlined process ensures secure, compliant ITAD from start to finish.</p>
        <div class="process-steps">
          <div class="process-step">
            <div class="step-number">1</div>
            <h3 class="step-title">Request Pickup or Quote</h3>
            <p class="step-description">Submit your request through our portal. We'll provide a quote and schedule pickup at your convenience.</p>
          </div>
          <div class="process-step">
            <div class="step-number">2</div>
            <h3 class="step-title">Secure Chain-of-Custody Tracking</h3>
            <p class="step-description">Every asset is tracked from pickup to final disposition. Real-time visibility ensures nothing is lost.</p>
          </div>
          <div class="process-step">
            <div class="step-number">3</div>
            <h3 class="step-title">Data Destruction & Certification</h3>
            <p class="step-description">Certified data wiping or physical destruction with complete documentation for your records.</p>
          </div>
          <div class="process-step">
            <div class="step-number">4</div>
            <h3 class="step-title">Certified Recycling</h3>
            <p class="step-description">Responsible recycling that maximizes reuse and minimizes environmental impact. R2 certified processes.</p>
          </div>
          <div class="process-step">
            <div class="step-number">5</div>
            <h3 class="step-title">Complete Audit Trail & Documentation</h3>
            <p class="step-description">Full documentation package including certificates of destruction, chain of custody, and compliance reports.</p>
          </div>
        </div>
      </section>

      <section class="section section-why">
        <h2 class="section-heading section-heading-center">Why choose us?</h2>
        <p class="section-lead">We back our words with action: certified processes, clear documentation, and a commitment to sustainability and compliance.</p>
        <div class="cards-carousel" :class="`cards-per-view-${cardsPerView}`" @mouseenter="isPaused = true" @mouseleave="isPaused = false">
          <div class="cards-track" ref="carouselTrack" :style="{ transform: `translateX(-${carouselOffset}px)` }">
            <article class="card">
              <div class="card-media">
                <img src="/images/Lock.png" alt="Secure data destruction" width="400" height="240" loading="lazy" />
              </div>
              <h3 class="card-title">Secure data destruction</h3>
              <p class="card-body">Chain-of-custody tracking, verified sanitization, and certified data wiping or physical destruction so your data never leaves your control until it's gone.</p>
            </article>
            <article class="card">
              <div class="card-media">
                <img src="/images/Recycling.png" alt="Certified recycling" width="400" height="240" loading="lazy" />
              </div>
              <h3 class="card-title">Certified recycling</h3>
              <p class="card-body">R2 and other standards where applicable. We maximize reuse and responsible recycling and keep harmful materials out of the environment.</p>
            </article>
            <article class="card">
              <div class="card-media">
                <img src="/images/card-compliance.jpg" alt="Compliance and audit trail" width="400" height="240" loading="lazy" />
              </div>
              <h3 class="card-title">Compliance &amp; audit trail</h3>
              <p class="card-body">Documentation and reporting you need for auditors and stakeholders. We make it easy to prove you did the right thing.</p>
            </article>
            <article class="card">
              <div class="card-media">
                <div class="card-icon">📊</div>
              </div>
              <h3 class="card-title">Real-time tracking</h3>
              <p class="card-body">Portal visibility into every asset's journey. Track status, location, and disposition progress in real-time.</p>
            </article>
            <article class="card">
              <div class="card-media">
                <div class="card-icon">🛡️</div>
              </div>
              <h3 class="card-title">Compliance expertise</h3>
              <p class="card-body">GDPR, HIPAA, PCI-DSS, SOC 2—we understand the regulations that matter to your industry and ensure full compliance.</p>
            </article>
            <article class="card">
              <div class="card-media">
                <div class="card-icon">🌱</div>
              </div>
              <h3 class="card-title">Environmental impact</h3>
              <p class="card-body">Reduce your carbon footprint with certified recycling. Track sustainability metrics and demonstrate your commitment.</p>
            </article>
            <article class="card">
              <div class="card-media">
                <div class="card-icon">💰</div>
              </div>
              <h3 class="card-title">Cost savings</h3>
              <p class="card-body">Recover value from resale while reducing liability. Our asset recovery program maximizes your return on retired equipment.</p>
            </article>
          </div>
          <div class="carousel-controls">
            <button type="button" class="carousel-btn" @click="previousCard" @mouseenter="isPaused = true" @mouseleave="isPaused = false" aria-label="Previous card">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <button type="button" class="carousel-btn" @click="nextCard" @mouseenter="isPaused = true" @mouseleave="isPaused = false" aria-label="Next card">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </section>

      <section class="section section-use-cases">
        <h2 class="section-heading section-heading-center">Built for Your Industry</h2>
        <p class="section-lead">We serve organizations across industries with specialized compliance and security needs.</p>
        <div class="use-cases">
          <div class="use-case use-case--healthcare">
            <div class="use-case-header">
              <span class="use-case-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M10.5 20.5v-4a1 1 0 0 0-1-1h-4a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1h4a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-4a1 1 0 0 0-1 1v4a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                </svg>
              </span>
              <h3 class="use-case-title">Healthcare</h3>
            </div>
            <p class="use-case-description">HIPAA-compliant data destruction for medical devices, workstations, and servers. Complete audit trails for regulatory compliance.</p>
          </div>
          <div class="use-case use-case--finance">
            <div class="use-case-header">
              <span class="use-case-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 2v20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <path d="M17 6.5c0-2-2.2-3.5-5-3.5s-5 1.5-5 3.5S9.2 10 12 10s5 1.5 5 3.5S14.8 17 12 17s-5-1.5-5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <h3 class="use-case-title">Finance</h3>
            </div>
            <p class="use-case-description">PCI-DSS compliant disposal with enhanced security protocols. Protect sensitive financial data with certified destruction.</p>
          </div>
          <div class="use-case use-case--enterprise">
            <div class="use-case-header">
              <span class="use-case-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M3 21h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <path d="M5 21V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                  <path d="M9 9h2M9 13h2M13 9h2M13 13h2M11 21v-4h2v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </span>
              <h3 class="use-case-title">Enterprise</h3>
            </div>
            <p class="use-case-description">Large-scale IT refresh programs. Handle thousands of assets with efficiency, security, and complete documentation.</p>
          </div>
          <div class="use-case use-case--education">
            <div class="use-case-header">
              <span class="use-case-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 4 2.5 8.5 12 13l9.5-4.5L12 4Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                  <path d="M5 10.5V16c0 1.5 3 3 7 3s7-1.5 7-3v-5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <h3 class="use-case-title">Education</h3>
            </div>
            <p class="use-case-description">Campus-wide equipment upgrades. Secure disposal of student and faculty devices with FERPA compliance.</p>
          </div>
        </div>
      </section>

      <section class="section section-faq">
        <h2 class="section-heading section-heading-center">Frequently Asked Questions</h2>
        <div class="faq-list">
          <details class="faq-item">
            <summary class="faq-question">How long does the process take?</summary>
            <div class="faq-answer">
              <p>Typical turnaround is 7-14 business days from pickup to final documentation. Rush services are available for urgent needs.</p>
            </div>
          </details>
          <details class="faq-item">
            <summary class="faq-question">What certifications do you have?</summary>
            <div class="faq-answer">
              <p>We are R2 certified and e-Stewards certified, with ISO 14001 environmental management. All processes meet or exceed industry standards.</p>
            </div>
          </details>
          <details class="faq-item">
            <summary class="faq-question">How do you ensure data security?</summary>
            <div class="faq-answer">
              <p>Every device undergoes certified data wiping using DoD 5220.22-M standards, or physical destruction for devices that cannot be wiped. Complete chain-of-custody tracking ensures your data never leaves your control until it's securely destroyed.</p>
            </div>
          </details>
          <details class="faq-item">
            <summary class="faq-question">What happens to my equipment?</summary>
            <div class="faq-answer">
              <p>After secure data destruction, equipment is evaluated for resale value. Functional devices are refurbished and resold. Non-functional equipment is responsibly recycled through R2-certified facilities, with materials recovered for reuse.</p>
            </div>
          </details>
        </div>
      </section>

      <section class="section section-cta">
        <div class="cta-block">
          <h2 class="cta-title">Ready to offload the burden?</h2>
          <p class="cta-text">Request a quote for secure, compliant ITAD. We'll get back to you quickly.</p>
          <router-link to="/customer/register" class="btn btn-primary btn-lg">Create customer account</router-link>
        </div>
      </section>
    </main>

    <footer class="landing-footer">
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
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getMe } from '../api'
import EnvironmentBanner from '../components/EnvironmentBanner.vue'
import PublicSiteHeader from '../components/PublicSiteHeader.vue'
import SiteHeader from '../components/SiteHeader.vue'

const route = useRoute()
const router = useRouter()
const showSubmittedAlert = ref(Boolean(route.query.submitted))
const isAuthenticated = ref(false)
const userType = ref<'CUSTOMER' | 'EMPLOYEE' | null>(null)

const currentCardIndex = ref(0)
const carouselTrack = ref<HTMLElement | null>(null)
const totalCards = 7
let autoScrollInterval: number | null = null
const isPaused = ref(false)

const viewportWidth = ref(typeof window === 'undefined' ? 1024 : window.innerWidth)

const cardsPerView = computed(() => {
  const w = viewportWidth.value
  if (w >= 1024) return 3
  if (w >= 768) return 2
  return 1
})

const carouselOffset = computed(() => {
  if (!carouselTrack.value) return 0
  const cardElement = carouselTrack.value.querySelector('.card') as HTMLElement
  if (!cardElement) return 0
  const cardWidth = cardElement.offsetWidth
  const gap = 24 // $space-6 = 24px
  const index = currentCardIndex.value
  return index * (cardWidth + gap)
})

function nextCard() {
  const index = currentCardIndex.value
  const perView = cardsPerView.value
  
  // Mobile: show 1 card at a time, wrap at end
  if (perView === 1) {
    if (index < totalCards - 1) {
      currentCardIndex.value = index + 1
    } else {
      currentCardIndex.value = 0
    }
    return
  }
  
  // Tablet: show 2 cards, then 1, then wrap
  if (perView === 2) {
    if (index < totalCards - 2) {
      currentCardIndex.value = index + 1
    } else if (index === totalCards - 2) {
      currentCardIndex.value = totalCards - 1
    } else {
      currentCardIndex.value = 0
    }
    return
  }
  
  // Desktop: show 3 cards, then 2, then wrap (skip single card view)
  if (index < totalCards - 3) {
    currentCardIndex.value = index + 1
  } else if (index === totalCards - 3) {
    currentCardIndex.value = totalCards - 2
  } else if (index === totalCards - 2) {
    currentCardIndex.value = 0
  } else {
    currentCardIndex.value = 0
  }
}

function previousCard() {
  const index = currentCardIndex.value
  const perView = cardsPerView.value
  
  // Mobile: wrap from beginning to end
  if (perView === 1) {
    if (index === 0) {
      currentCardIndex.value = totalCards - 1
    } else {
      currentCardIndex.value = index - 1
    }
    return
  }
  
  // Tablet: reverse logic for 2 cards
  if (perView === 2) {
    if (index === 0) {
      currentCardIndex.value = totalCards - 1
    } else {
      currentCardIndex.value = index - 1
    }
    return
  }
  
  // Desktop: reverse logic
  if (index === 0) {
    currentCardIndex.value = totalCards - 2
  } else if (index === totalCards - 2) {
    currentCardIndex.value = totalCards - 3
  } else {
    currentCardIndex.value = index - 1
  }
}

function startAutoScroll() {
  if (autoScrollInterval) return
  autoScrollInterval = window.setInterval(() => {
    if (!isPaused.value) {
      nextCard()
    }
  }, 3000) // Auto-scroll every 3 seconds
}

function stopAutoScroll() {
  if (autoScrollInterval) {
    clearInterval(autoScrollInterval)
    autoScrollInterval = null
  }
}

function handleResize() {
  viewportWidth.value = window.innerWidth
}

onMounted(async () => {
  if (route.query.submitted) {
    router.replace({ path: '/', query: {} })
  }
  
  // Check if user is authenticated to show appropriate header
  // Router guard will redirect authenticated users, but this handles edge cases
  try {
    const me = await getMe()
    isAuthenticated.value = true
    userType.value = me.user_type
  } catch {
    // Not authenticated, show public header
    isAuthenticated.value = false
  }
  
  window.addEventListener('resize', handleResize)
  handleResize()
  
  // Start auto-scroll
  startAutoScroll()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  stopAutoScroll()
})
</script>

