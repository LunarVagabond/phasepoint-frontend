<template>
  <div class="landing">
    <PublicSiteHeader title="Secure ITAD Services" />
    <div v-if="showSubmittedAlert" class="submitted-alert" role="alert">
      Request submitted successfully. We will be in touch.
    </div>
    <header class="landing-hero">
      <div class="hero-bg">
        <img
          src="https://placehold.co/1920x800/0f172a/475569?text=Secure+IT+Asset+Disposition"
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
              src="https://placehold.co/560x360/1e293b/64748b?text=Data+Destruction+%26+Recycling"
              alt=""
              width="560"
              height="360"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section class="section section-why">
        <h2 class="section-heading section-heading-center">Why choose us?</h2>
        <p class="section-lead">We back our words with action: certified processes, clear documentation, and a commitment to sustainability and compliance.</p>
        <div class="cards">
          <article class="card">
            <div class="card-media">
              <img src="https://placehold.co/400x240/1e3a5f/93c5fd?text=Secure+Data+Destruction" alt="" width="400" height="240" loading="lazy" />
            </div>
            <h3 class="card-title">Secure data destruction</h3>
            <p class="card-body">Chain-of-custody tracking, verified sanitization, and certified data wiping or physical destruction so your data never leaves your control until it's gone.</p>
          </article>
          <article class="card">
            <div class="card-media">
              <img src="https://placehold.co/400x240/0f4c3a/6ee7b7?text=Certified+Recycling" alt="" width="400" height="240" loading="lazy" />
            </div>
            <h3 class="card-title">Certified recycling</h3>
            <p class="card-body">R2 and other standards where applicable. We maximize reuse and responsible recycling and keep harmful materials out of the environment.</p>
          </article>
          <article class="card">
            <div class="card-media">
              <img src="https://placehold.co/400x240/312e81/818cf8?text=Compliance+%26+Audit" alt="" width="400" height="240" loading="lazy" />
            </div>
            <h3 class="card-title">Compliance &amp; audit trail</h3>
            <p class="card-body">Documentation and reporting you need for auditors and stakeholders. We make it easy to prove you did the right thing.</p>
          </article>
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
      <div class="footer-links">
        <router-link to="/customer/login">Customer portal</router-link>
        <span class="sep">·</span>
        <router-link to="/employee-portal">Employee portal</router-link>
      </div>
      <p class="footer-copy">Phasepoint — IT Asset Disposition. Secure. Compliant. Sustainable.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PublicSiteHeader from '../components/PublicSiteHeader.vue'

const route = useRoute()
const router = useRouter()
const showSubmittedAlert = ref(Boolean(route.query.submitted))

onMounted(() => {
  if (route.query.submitted) {
    router.replace({ path: '/', query: {} })
  }
})
</script>

<style scoped lang="scss">
@use '../styles/variables' as *;

.landing {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.submitted-alert {
  position: sticky;
  top: 0;
  z-index: 20;
  padding: $space-3 $space-4;
  text-align: center;
  font-weight: 500;
  background: rgba(var(--color-success-rgb, 22, 163, 74), 0.15);
  color: var(--color-success, #16a34a);
  border-bottom: 1px solid rgba(var(--color-success-rgb, 22, 163, 74), 0.3);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.landing-hero {
  position: relative;
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
}

.hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(15, 23, 42, 0.6) 0%, rgba(15, 23, 42, 0.85) 100%);
}

.hero-content {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 800px;
  padding: $space-8 $space-4;
}

.hero-title {
  font-size: clamp(1.75rem, 4vw, 2.75rem);
  font-weight: 700;
  line-height: 1.2;
  color: #fff;
  margin: 0 0 $space-4;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.hero-sub {
  font-size: clamp(1rem, 2vw, 1.25rem);
  color: #e2e8f0;
  line-height: 1.6;
  margin: 0 0 $space-8;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.hero-cta {
  display: flex;
  justify-content: center;
}

.btn {
  display: inline-block;
  padding: $space-3 $space-6;
  border-radius: $radius-md;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.2s, color 0.2s, transform 0.15s;
}
.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
}
.btn-primary:hover {
  background: var(--color-primary-hover);
  color: white;
  transform: translateY(-1px);
}
.btn-lg {
  padding: $space-4 $space-8;
  font-size: $font-size-lg;
}

.landing-main {
  flex: 1;
  width: 100%;
}

.section {
  padding: $space-12 $space-4;
  max-width: 1200px;
  margin: 0 auto;
}

.section-inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-10;
  align-items: center;
}
@media (max-width: 768px) {
  .section-inner {
    grid-template-columns: 1fr;
  }
  .section-media { order: -1; }
}

.section-text .section-body + .section-body {
  margin-top: $space-4;
}

.section-heading {
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 $space-4;
}

.section-heading-center {
  text-align: center;
  margin-bottom: $space-3;
}

.section-lead {
  text-align: center;
  max-width: 560px;
  margin: 0 auto $space-10;
  font-size: $font-size-lg;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.section-body {
  font-size: $font-size-base;
  color: var(--color-text-muted);
  line-height: 1.7;
  margin: 0;
}

.section-media img {
  width: 100%;
  height: auto;
  border-radius: $radius-lg;
  box-shadow: var(--shadow-lg);
}

.section-why {
  background: var(--color-background);
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: $space-8;
}

.card {
  background: var(--color-surface);
  border-radius: $radius-lg;
  overflow: hidden;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border);
  transition: box-shadow 0.2s, transform 0.15s;
}
.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.card-media {
  aspect-ratio: 400 / 240;
  overflow: hidden;
}
.card-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-title {
  font-size: $font-size-lg;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
  padding: $space-4 $space-4 0;
}

.card-body {
  font-size: $font-size-base;
  color: var(--color-text-muted);
  line-height: 1.6;
  margin: 0;
  padding: $space-3 $space-4 $space-4;
}

.section-cta {
  padding: $space-12 $space-4;
}

.cta-block {
  text-align: center;
  max-width: 560px;
  margin: 0 auto;
  padding: $space-10 $space-6;
  background: var(--color-surface);
  border-radius: $radius-lg;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-md);
}

.cta-title {
  font-size: $font-size-xl;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 $space-3;
}

.cta-text {
  font-size: $font-size-base;
  color: var(--color-text-muted);
  margin: 0 0 $space-6;
  line-height: 1.5;
}

.landing-footer {
  text-align: center;
  padding: $space-8 $space-4;
  font-size: $font-size-sm;
  color: var(--color-text-muted);
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
}

.footer-links {
  margin-bottom: $space-2;
}
.landing-footer a {
  color: var(--color-primary);
}
.sep {
  margin: 0 $space-2;
}

.footer-copy {
  margin: 0;
  opacity: 0.9;
}
</style>
