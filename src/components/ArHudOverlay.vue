<script setup>
import { computed } from 'vue'

const props = defineProps({
  product: {
    type: Object,
    required: true
  },
  isAnimationPlaying: {
    type: Boolean,
    default: true
  },
  showArrows: {
    type: Boolean,
    default: true
  },
  activeHotspotId: {
    type: String,
    default: null
  },
  isCameraActive: {
    type: Boolean,
    default: false
  },
  cameraAlertMessage: {
    type: String,
    default: ''
  },
  isWebXrSupported: {
    type: Boolean,
    default: false
  },
  isWebXrActive: {
    type: Boolean,
    default: false
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  loadingProgress: {
    type: Number,
    default: 0
  },
  errorMessage: {
    type: String,
    default: ''
  }
})

const emit = defineEmits([
  'close-ar',
  'toggle-animation',
  'toggle-arrows',
  'select-hotspot',
  'toggle-camera',
  'reset-view',
  'launch-webxr',
  'dismiss-camera-alert'
])

const activeHotspot = computed(() => {
  if (!props.product?.hotspots?.length) return null
  if (!props.activeHotspotId) return props.product.hotspots[0]
  return props.product.hotspots.find(h => h.id === props.activeHotspotId) || props.product.hotspots[0]
})

const activeIndex = computed(() => {
  if (!activeHotspot.value) return 0
  return props.product.hotspots.findIndex(h => h.id === activeHotspot.value.id)
})

function selectNextHotspot(direction = 1) {
  if (!props.product?.hotspots?.length) return
  const total = props.product.hotspots.length
  const nextIdx = (activeIndex.value + direction + total) % total
  emit('select-hotspot', props.product.hotspots[nextIdx].id)
}
</script>

<template>
  <div class="ar-hud-overlay">
    <!-- Barra Superior -->
    <header class="hud-top-bar">
      <button class="btn-close-ar" @click="$emit('close-ar')" aria-label="Fechar RA">
        <svg class="top-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
        </svg>
        <span class="btn-close-text">Fechar RA</span>
      </button>

      <!-- Status da Sessão -->
      <div class="status-indicator">
        <span class="status-badge" :class="{ webxr: isWebXrActive, camera: isCameraActive && !isWebXrActive }">
          <span class="badge-dot"></span>
          <span>{{ isWebXrActive ? 'WebXR Ativo' : isCameraActive ? 'Câmera Ativa' : 'Modo 3D' }}</span>
        </span>
      </div>

      <!-- Ações do Topo -->
      <div class="top-actions">
        <!-- Gatilho WebXR Nativo (quando disponível) -->
        <button
          v-if="isWebXrSupported && !isWebXrActive"
          class="hud-icon-btn webxr-btn"
          @click="$emit('launch-webxr')"
          title="Iniciar WebXR Nativo"
          aria-label="Iniciar WebXR Nativo"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
          </svg>
        </button>

        <!-- Botão Toggle de Câmera Real (Webcam / Traseira) -->
        <button
          class="hud-icon-btn camera-toggle-btn"
          :class="{ active: isCameraActive }"
          @click="$emit('toggle-camera')"
          :title="isCameraActive ? 'Desativar Câmera (Fundo 3D)' : 'Ativar Câmera RA'"
          :aria-label="isCameraActive ? 'Desativar Câmera' : 'Ativar Câmera RA'"
        >
          <!-- Ícone quando Câmera está Ativa -->
          <svg v-if="isCameraActive" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <!-- Ícone quando Câmera está Desligada -->
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        <!-- Botão Recentralizar -->
        <button
          class="hud-icon-btn"
          @click="$emit('reset-view')"
          title="Recentralizar Modelo"
          aria-label="Recentralizar Modelo"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </header>

    <!-- Alerta Amigável de Câmera / Permissões -->
    <div v-if="cameraAlertMessage" class="camera-toast" role="status">
      <div class="toast-content">
        <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ cameraAlertMessage }}</span>
      </div>
      <button class="toast-dismiss" @click="$emit('dismiss-camera-alert')" aria-label="Fechar alerta">✕</button>
    </div>

    <!-- Card Informativo do Ponto em Destaque -->
    <section v-if="activeHotspot && !isLoading" class="hotspot-card">
      <div class="card-head">
        <div class="head-info">
          <span class="spot-index">{{ activeHotspot.index }}</span>
          <div>
            <span class="spot-badge">{{ activeHotspot.badge }}</span>
            <h4 class="spot-title">{{ activeHotspot.title }}</h4>
          </div>
        </div>
        <div class="nav-arrows">
          <button class="nav-btn" @click="selectNextHotspot(-1)" aria-label="Ponto Anterior">‹</button>
          <button class="nav-btn" @click="selectNextHotspot(1)" aria-label="Próximo Ponto">›</button>
        </div>
      </div>

      <p class="spot-desc">{{ activeHotspot.description }}</p>

      <!-- Abas de seleção de pontos -->
      <div class="spot-tabs">
        <button
          v-for="hs in product.hotspots"
          :key="hs.id"
          class="tab-item"
          :class="{ current: hs.id === activeHotspot.id }"
          @click="$emit('select-hotspot', hs.id)"
        >
          Ponto {{ hs.index }}
        </button>
      </div>
    </section>

    <!-- Controles Inferiores Acessíveis ao Polegar -->
    <footer class="hud-bottom-bar">
      <div class="controls-deck">
        <!-- Pausar / Iniciar Animação -->
        <button
          class="deck-btn primary"
          :class="{ paused: !isAnimationPlaying }"
          @click="$emit('toggle-animation')"
        >
          <svg v-if="isAnimationPlaying" class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
          <svg v-else class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
          <span>{{ isAnimationPlaying ? 'Pausar Animação' : 'Animar' }}</span>
        </button>

        <!-- Alternar Setas 3D -->
        <button
          class="deck-btn"
          :class="{ active: showArrows }"
          @click="$emit('toggle-arrows')"
        >
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span>{{ showArrows ? 'Setas: Ligadas' : 'Setas: Ocultas' }}</span>
        </button>
      </div>
    </footer>

    <!-- Overlay de Carregamento -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-modal">
        <div class="spinner"></div>
        <div class="load-text">Carregando Modelo 3D</div>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: `${loadingProgress}%` }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ar-hud-overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0.75rem;
  padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
  padding-top: max(0.75rem, env(safe-area-inset-top));
  z-index: 50;
  box-sizing: border-box;
}

.hud-top-bar,
.camera-toast,
.hotspot-card,
.hud-bottom-bar,
.loading-state {
  pointer-events: auto;
}

/* Barra Superior */
.hud-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  background: rgba(14, 26, 92, 0.88);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  padding: 0.45rem 0.75rem;
  border-radius: var(--radius-full);
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.btn-close-ar {
  min-height: 40px;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background-color: var(--brand-blue-dark);
  color: var(--text-white);
  padding: 0.45rem 0.95rem;
  border-radius: var(--radius-full);
  font-size: 0.85rem;
  font-weight: 700;
  transition: background-color var(--transition-fast);
}

.btn-close-ar:active {
  background-color: var(--brand-blue);
}

.top-icon {
  width: 16px;
  height: 16px;
}

.status-indicator {
  display: flex;
  align-items: center;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.1);
  padding: 0.3rem 0.7rem;
  border-radius: var(--radius-full);
  letter-spacing: 0.02em;
}

.status-badge.camera {
  color: #82E6F5;
  background: rgba(0, 94, 255, 0.3);
  border: 1px solid rgba(130, 230, 245, 0.4);
}

.status-badge.webxr {
  color: #34D399;
  background: rgba(16, 185, 129, 0.25);
  border: 1px solid rgba(16, 185, 129, 0.4);
}

.badge-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}

.status-badge.camera .badge-dot {
  box-shadow: 0 0 8px #82E6F5;
}

.top-actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.hud-icon-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  color: var(--text-white);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all var(--transition-fast);
}

.hud-icon-btn svg {
  width: 18px;
  height: 18px;
}

.hud-icon-btn:hover {
  background: rgba(255, 255, 255, 0.22);
}

.hud-icon-btn:active {
  transform: scale(0.95);
}

.camera-toggle-btn.active {
  background: var(--brand-blue);
  border-color: #82E6F5;
  box-shadow: 0 0 12px rgba(0, 94, 255, 0.6);
}

.webxr-btn {
  background: #10B981;
}

/* Toast de Alerta Amigável */
.camera-toast {
  align-self: center;
  max-width: 440px;
  width: 100%;
  background: rgba(14, 26, 92, 0.94);
  border: 1px solid rgba(130, 230, 245, 0.35);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-radius: var(--radius-md);
  padding: 0.65rem 0.9rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: var(--text-white);
  animation: fadeIn 0.3s ease;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  line-height: 1.35;
}

.toast-icon {
  width: 18px;
  height: 18px;
  color: #82E6F5;
  flex-shrink: 0;
}

.toast-dismiss {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  color: var(--text-white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.toast-dismiss:hover {
  background: rgba(255, 255, 255, 0.25);
}

/* Card Informativo */
.hotspot-card {
  align-self: center;
  width: 100%;
  max-width: 420px;
  background: rgba(14, 26, 92, 0.92);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 255, 255, 0.18);
  padding: 0.95rem 1.1rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  margin-top: auto;
  margin-bottom: 0.65rem;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.45rem;
}

.head-info {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.spot-index {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--brand-blue);
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 800;
  flex-shrink: 0;
}

.spot-badge {
  display: block;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #8FB8FF;
  letter-spacing: 0.04em;
}

.spot-title {
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--text-white);
  line-height: 1.2;
}

.nav-arrows {
  display: flex;
  gap: 0.35rem;
}

.nav-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  color: var(--text-white);
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-btn:active {
  background: var(--brand-blue);
}

.spot-desc {
  font-size: 0.82rem;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.88);
  margin-bottom: 0.65rem;
}

.spot-tabs {
  display: flex;
  gap: 0.4rem;
}

.tab-item {
  flex: 1;
  padding: 0.35rem;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.7rem;
  font-weight: 600;
  text-align: center;
  transition: all var(--transition-fast);
}

.tab-item.current {
  background: var(--brand-blue);
  color: var(--text-white);
}

/* Controles Inferiores */
.hud-bottom-bar {
  display: flex;
  justify-content: center;
  width: 100%;
}

.controls-deck {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: 100%;
  max-width: 420px;
}

.deck-btn {
  flex: 1;
  min-height: var(--btn-min-height);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.65rem 0.85rem;
  border-radius: var(--radius-full);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-white);
  background: rgba(14, 26, 92, 0.88);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all var(--transition-fast);
}

.deck-btn:active {
  transform: scale(0.97);
}

.deck-btn.primary {
  background: var(--brand-blue);
  border-color: rgba(255, 255, 255, 0.25);
  box-shadow: 0 4px 14px rgba(0, 94, 255, 0.35);
}

.deck-btn.primary.paused {
  background: #DC2626;
}

.deck-btn.active {
  background: rgba(0, 94, 255, 0.4);
  border-color: #8FB8FF;
}

.btn-icon {
  width: 18px;
  height: 18px;
}

/* Loading State */
.loading-state {
  position: absolute;
  inset: 0;
  background: rgba(14, 26, 92, 0.9);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.loading-modal {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(28, 52, 148, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-md);
  padding: 1.5rem 2rem;
  text-align: center;
  width: 260px;
}

.spinner {
  width: 38px;
  height: 38px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: #8FB8FF;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
  margin-bottom: 0.85rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.load-text {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-white);
  margin-bottom: 0.85rem;
}

.progress-track {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--brand-blue);
  transition: width 0.2s ease;
}

@media (min-width: 768px) {
  .ar-hud-overlay {
    padding: 1.25rem;
  }
  .hud-top-bar {
    padding: 0.5rem 0.9rem;
  }
  .btn-close-text {
    display: inline;
  }
  .deck-btn {
    font-size: 0.9rem;
  }
}
</style>
