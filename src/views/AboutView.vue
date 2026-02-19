<template>
  <div class="public-page">
    <PublicSiteHeader title="About Us" />
    <EnvironmentBanner />
    <main class="public-main">
      <section class="page-hero">
        <h1>About Phasepoint</h1>
        <p class="hero-subtitle">Secure IT Asset Disposition for the modern enterprise</p>
      </section>

      <section class="page-section">
        <div class="section-content">
          <h2>Our Mission</h2>
          <p>
            Phasepoint exists to make IT asset disposition secure, compliant, and sustainable. We believe that responsible disposal of IT equipment isn't just a requirement—it's an opportunity to protect data, reduce environmental impact, and demonstrate corporate responsibility.
          </p>
          <p>
            Our mission is to provide enterprise-grade ITAD services that combine rigorous security protocols with environmental stewardship, giving organizations the confidence to retire equipment without compromising on compliance or sustainability.
          </p>
        </div>
      </section>

      <section class="page-section">
        <div class="section-content">
          <h2>Our Values</h2>
          <div class="values-grid">
            <div class="value-item">
              <h3>Security First</h3>
              <p>Data security isn't negotiable. Every process is designed with security at its core, ensuring your sensitive information is protected throughout the entire disposition lifecycle.</p>
            </div>
            <div class="value-item">
              <h3>Compliance Excellence</h3>
              <p>We understand the regulatory landscape and ensure every step meets or exceeds industry standards. From GDPR to HIPAA, we've got you covered.</p>
            </div>
            <div class="value-item">
              <h3>Environmental Responsibility</h3>
              <p>Sustainability isn't an afterthought—it's built into every process. We maximize reuse, minimize waste, and provide transparent reporting on environmental impact.</p>
            </div>
            <div class="value-item">
              <h3>Transparency</h3>
              <p>Complete visibility into every step of the process. Real-time tracking, comprehensive documentation, and clear reporting give you confidence in our work.</p>
            </div>
          </div>
        </div>
      </section>

      <section class="page-section">
        <div class="section-content">
          <h2>Why Phasepoint</h2>
          <p>
            Founded with a vision to modernize ITAD, Phasepoint combines cutting-edge technology with proven processes. Our platform provides the transparency and control that modern enterprises demand, while our certified processes ensure compliance and security.
          </p>
          <p>
            We're not just another disposal service—we're your partner in responsible IT asset management. From initial quote to final certificate, we handle every detail so you can focus on what matters most.
          </p>
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
@use '../styles/views/about';
</style>
