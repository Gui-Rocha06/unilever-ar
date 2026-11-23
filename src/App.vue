<script setup>
import { ref } from 'vue'
import HeaderBar from './components/HeaderBar.vue'
import ProductCard from './components/ProductCard.vue'
import ArViewer from './components/ArViewer.vue'
import { PRODUCTS } from './data/products.js'

const products = ref(PRODUCTS)
const activeProductForAr = ref(null)

function openArViewer(product) {
  activeProductForAr.value = product
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function closeArViewer() {
  activeProductForAr.value = null
}
</script>

<template>
  <div class="app-layout">
    <!-- Header Corporativo Unilever -->
    <HeaderBar
      :in-ar-mode="!!activeProductForAr"
      :active-product-name="activeProductForAr ? activeProductForAr.name : ''"
      @close-ar="closeArViewer"
    />

    <!-- Catálogo de Produtos (Mobile-First) -->
    <main v-if="!activeProductForAr" class="main-content">
      <div class="container">
        <!-- Seção de Abertura / Instruções -->
        <section class="hero-section">
          <h1 class="hero-title">
            Embalagens Sustentáveis em <span>Realidade Aumentada</span>
          </h1>
          <p class="hero-description">
            Conheça as inovações em sustentabilidade e design circular da Unilever. Selecione um produto abaixo e clique em <strong>Ver em RA</strong> para projetar em 3D no seu espaço diretamente pelo navegador.
          </p>
        </section>

        <!-- Grid de Produtos (1 coluna mobile, 2 colunas desktop) -->
        <section class="catalog-section" aria-label="Produtos para Visualização em Realidade Aumentada">
          <div class="products-grid">
            <ProductCard
              v-for="prod in products"
              :key="prod.id"
              :product="prod"
              @view-ar="openArViewer"
            />
          </div>
        </section>
      </div>
    </main>

    <!-- Visualizador WebAR / 3D com Câmera e HUD -->
    <ArViewer
      v-else
      :product="activeProductForAr"
      @close-ar="closeArViewer"
    />
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-navy-primary);
  background-image: var(--bg-gradient);
  background-attachment: fixed;
  background-repeat: no-repeat;
  background-size: cover;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1.5rem 1.15rem 3rem;
}

.container {
  width: 100%;
  max-width: 980px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

/* Seção Hero */
.hero-section {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  padding: 0.5rem 0.25rem 0;
}

.hero-title {
  font-size: 1.75rem;
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: -0.025em;
  color: var(--text-white);
}

.hero-title span {
  color: #82E6F5;
}

.hero-description {
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--text-light-muted);
  max-width: 680px;
}

.hero-description strong {
  color: #82E6F5;
  font-weight: 600;
}

/* Grid Mobile-First: 1 coluna no mobile */
.catalog-section {
  width: 100%;
}

.products-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Telas maiores / Desktop: 2 colunas */
@media (min-width: 769px) {
  .main-content {
    padding: 3rem 1.5rem 4.5rem;
  }
  .container {
    gap: 2.25rem;
  }
  .hero-title {
    font-size: 2.4rem;
  }
  .hero-description {
    font-size: 1.05rem;
  }
  .products-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.75rem;
  }
}
</style>
