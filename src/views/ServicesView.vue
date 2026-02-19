<template>
  <div class="public-page">
    <PublicSiteHeader title="Services" />
    <EnvironmentBanner />
    <main class="public-main">
      <section class="page-hero">
        <h1>Our Services</h1>
        <p class="hero-subtitle">Comprehensive ITAD solutions for secure, compliant asset disposition</p>
      </section>

      <section class="page-section">
        <div class="section-content">
          <h2>Data Destruction</h2>
          <p>
            Certified data destruction ensures your sensitive information is permanently and securely removed from all storage media. We offer multiple methods to meet your specific needs:
          </p>
          <ul class="service-list">
            <li><strong>Software-based wiping:</strong> DoD 5220.22-M certified data wiping for reusable devices</li>
            <li><strong>Physical destruction:</strong> Shredding, crushing, or degaussing for devices that cannot be wiped</li>
            <li><strong>Certification:</strong> Complete documentation including certificates of destruction</li>
            <li><strong>Chain of custody:</strong> Full tracking from pickup to final destruction</li>
          </ul>
        </div>
      </section>

      <section class="page-section">
        <div class="section-content">
          <h2>Certified Recycling</h2>
          <p>
            R2-certified recycling processes ensure responsible handling of electronic waste. We maximize reuse and minimize environmental impact:
          </p>
          <ul class="service-list">
            <li><strong>Asset evaluation:</strong> Assessment for resale value and reuse potential</li>
            <li><strong>Refurbishment:</strong> Professional refurbishment of functional equipment</li>
            <li><strong>Material recovery:</strong> Responsible extraction and recycling of valuable materials</li>
            <li><strong>Environmental compliance:</strong> R2 and e-Stewards certified processes</li>
          </ul>
        </div>
      </section>

      <section class="page-section">
        <div class="section-content">
          <h2>Asset Recovery & Resale</h2>
          <p>
            Maximize the value of your retired IT equipment through our asset recovery program:
          </p>
          <ul class="service-list">
            <li><strong>Market evaluation:</strong> Assessment of resale value based on current market conditions</li>
            <li><strong>Secure resale:</strong> Data-sanitized equipment sold through verified channels</li>
            <li><strong>Revenue sharing:</strong> Transparent reporting and fair revenue distribution</li>
            <li><strong>Complete documentation:</strong> Records of all transactions for your records</li>
          </ul>
        </div>
      </section>

      <section class="page-section">
        <div class="section-content">
          <h2>Pickup & Logistics</h2>
          <p>
            Secure, scheduled pickup services nationwide. We handle all logistics from scheduling to delivery:
          </p>
          <ul class="service-list">
            <li><strong>Scheduled pickups:</strong> One-time or recurring service options</li>
            <li><strong>Secure transport:</strong> Chain-of-custody tracking throughout transit</li>
            <li><strong>Flexible scheduling:</strong> Accommodate your timeline and requirements</li>
            <li><strong>Real-time tracking:</strong> Monitor your assets from pickup to final disposition</li>
          </ul>
        </div>
      </section>

      <section class="page-section">
        <div class="section-content">
          <h2>Compliance & Documentation</h2>
          <p>
            Complete documentation package for audits and compliance requirements:
          </p>
          <ul class="service-list">
            <li><strong>Certificates of destruction:</strong> Detailed records for each asset</li>
            <li><strong>Chain of custody reports:</strong> Complete audit trail</li>
            <li><strong>Compliance reports:</strong> Regulatory compliance documentation</li>
            <li><strong>Environmental impact reports:</strong> Sustainability metrics and outcomes</li>
          </ul>
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
import EnvironmentBanner from '../components/EnvironmentBanner.vue'
import PublicSiteHeader from '../components/PublicSiteHeader.vue'
</script>

<style scoped lang="scss">
@use '../styles/views/services';
</style>
