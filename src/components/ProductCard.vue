<script setup>
defineProps({
  product: {
    type: Object,
    required: true
  }
})

defineEmits(['view-ar'])
</script>

<template>
  <article class="product-card">
    <!-- Imagem Real do Produto -->
    <div class="product-image-wrap">
      <img
        :src="product.imageUrl"
        :alt="product.name"
        class="product-real-photo"
        loading="lazy"
      />
    </div>

    <!-- Informações Essenciais -->
    <div class="product-details">
      <div class="title-row">
        <h3 class="product-title">{{ product.name }}</h3>
        <span class="volume-badge">{{ product.volume }}</span>
      </div>

      <p class="product-description">{{ product.description }}</p>
    </div>

    <!-- Ação Principal -->
    <div class="card-action">
      <button
        class="btn-view-ar"
        @click="$emit('view-ar', product)"
        :aria-label="`Ver ${product.name} em Realidade Aumentada`"
      >
        <svg class="ar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
        </svg>
        <span>Ver em RA</span>
      </button>
    </div>
  </article>
</template>

<style scoped>
.product-card {
  width: 100%;
  background-color: var(--surface-card-light);
  background-image: var(--card-gradient);
  border-radius: var(--radius-card);
  border: 1px solid var(--card-border);
  box-shadow: var(--shadow-card);
  padding: 1.6rem 1.4rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1.25rem;
  transition: transform var(--transition-normal), box-shadow var(--transition-normal);
  box-sizing: border-box;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-card-hover);
}

/* Área da Foto Real */
.product-image-wrap {
  width: 100%;
  height: 195px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.25rem;
}

.product-real-photo {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 14px 22px rgba(14, 26, 92, 0.18));
  transition: transform var(--transition-normal);
}

.product-card:hover .product-real-photo {
  transform: scale(1.04);
}

/* Informações */
.product-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.title-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
}

.product-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--text-navy);
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.volume-badge {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--brand-blue-dark);
  background-color: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(0, 94, 255, 0.18);
  padding: 0.25rem 0.6rem;
  border-radius: var(--radius-sm);
  white-space: nowrap;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(14, 26, 92, 0.05);
}

.product-description {
  font-size: 0.92rem;
  line-height: 1.5;
  color: var(--text-muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0;
}

/* Botão de Ação */
.card-action {
  margin-top: 0.25rem;
}

.btn-view-ar {
  width: 100%;
  min-height: var(--btn-min-height);
  background-color: var(--brand-blue);
  color: var(--text-white);
  border-radius: var(--radius-md);
  padding: 0.8rem 1.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  box-shadow: var(--shadow-button);
  transition: background-color var(--transition-fast), transform var(--transition-fast);
}

.btn-view-ar:hover {
  background-color: var(--bg-royal-mid);
}

.btn-view-ar:active {
  transform: scale(0.98);
}

.ar-icon {
  width: 20px;
  height: 20px;
  stroke: var(--text-white);
}

/* Desktop */
@media (min-width: 769px) {
  .product-card {
    padding: 2rem 1.8rem;
  }
  .product-image-wrap {
    height: 220px;
  }
  .product-title {
    font-size: 1.5rem;
  }
  .product-description {
    font-size: 0.96rem;
  }
}
</style>
