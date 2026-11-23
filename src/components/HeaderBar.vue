<script setup>
defineProps({
  inArMode: {
    type: Boolean,
    default: false
  },
  activeProductName: {
    type: String,
    default: ''
  }
})

defineEmits(['close-ar'])
</script>

<template>
  <header class="header-bar">
    <div class="header-inner">
      <div class="brand-group">
        <a href="/" class="logo-link" title="Unilever">
          <img
            src="/logo-unilever.png"
            alt="Unilever Logo"
            class="unilever-logo"
            loading="eager"
          />
        </a>
        <div class="brand-divider"></div>
        <div class="brand-meta">
          <span class="brand-name">Unilever</span>
          <span class="brand-tag">WebAR</span>
        </div>
      </div>

      <div class="header-status">
        <div v-if="inArMode" class="status-pill active">
          <span class="status-dot"></span>
          <span class="status-text">{{ activeProductName }}</span>
        </div>
        <div v-else class="status-pill">
          <span class="status-dot green"></span>
          <span class="status-text">WebAR Interativo</span>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header-bar {
  width: 100%;
  background-color: var(--bg-navy-primary);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 40;
}

.header-inner {
  max-width: 1080px;
  margin: 0 auto;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.brand-group {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.logo-link {
  display: flex;
  align-items: center;
  line-height: 1;
}

.unilever-logo {
  height: 38px;
  width: auto;
  object-fit: contain;
}

.brand-divider {
  width: 1px;
  height: 24px;
  background-color: rgba(255, 255, 255, 0.2);
}

.brand-meta {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
}

.brand-name {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-white);
  letter-spacing: -0.01em;
}

.brand-tag {
  font-size: 0.75rem;
  font-weight: 600;
  color: #8FB8FF;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.35rem 0.75rem;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-white);
}

.status-pill.active {
  background: rgba(0, 94, 255, 0.25);
  border-color: var(--brand-blue);
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #34D399;
}

.status-dot.green {
  background: #10B981;
}

@media (min-width: 768px) {
  .header-inner {
    padding: 0.9rem 1.5rem;
  }
  .unilever-logo {
    height: 44px;
  }
  .brand-name {
    font-size: 1.15rem;
  }
}
</style>
