<template>
  <div>
    <template v-if="items.length">
      <!-- Main viewer -->
      <button type="button" class="gallery-main" @click="openLightbox(active)">
        <v-img :src="items[active].url" cover class="gallery-main__img" />
        <span class="gallery-main__zoom"><v-icon size="18">mdi-magnify-plus-outline</v-icon></span>
        <span v-if="items[active].caption" class="gallery-main__caption">{{ items[active].caption }}</span>
      </button>

      <!-- Thumbnails -->
      <div v-if="items.length > 1" class="gallery-thumbs">
        <button
          v-for="(item, i) in items"
          :key="item.key"
          type="button"
          class="gallery-thumb"
          :class="{ 'gallery-thumb--active': i === active }"
          @click="active = i"
        >
          <v-img :src="item.url" cover />
        </button>
      </div>
    </template>

    <!-- Empty -->
    <div v-else class="gallery-empty">
      <v-icon size="46" color="primary">{{ fallbackIcon }}</v-icon>
      <p class="gallery-empty__text">Sin fotos todavía</p>
    </div>

    <!-- Lightbox -->
    <v-dialog v-model="lightbox" max-width="960">
      <div class="lightbox">
        <v-btn icon="mdi-close" variant="text" color="white" class="lightbox__close" @click="lightbox = false" />
        <v-btn
          v-if="items.length > 1"
          icon="mdi-chevron-left"
          variant="text"
          color="white"
          class="lightbox__nav lightbox__nav--prev"
          @click="step(-1)"
        />
        <v-img v-if="items[active]" :src="items[active].url" max-height="82vh" contain />
        <v-btn
          v-if="items.length > 1"
          icon="mdi-chevron-right"
          variant="text"
          color="white"
          class="lightbox__nav lightbox__nav--next"
          @click="step(1)"
        />
        <div class="lightbox__bar">
          <span class="lightbox__caption">{{ (items[active] && items[active].caption) || name }}</span>
          <span class="lightbox__count">{{ active + 1 }} / {{ items.length }}</span>
        </div>
      </div>
    </v-dialog>
  </div>
</template>

<script>
import { API_ORIGIN } from '@/api/client'

export default {
  name: 'AnimalGallery',
  props: {
    photos: { type: Array, default: () => [] },
    name: { type: String, default: '' },
    fallbackIcon: { type: String, default: 'mdi-cow' },
  },
  data() {
    return {
      active: 0,
      lightbox: false,
    }
  },
  computed: {
    items() {
      return (this.photos || []).map((photo) => ({
        key: photo.id,
        caption: photo.caption,
        url: photo.image && photo.image.startsWith('http') ? photo.image : `${API_ORIGIN}${photo.image}`,
      }))
    },
  },
  watch: {
    photos() {
      this.active = 0
    },
  },
  methods: {
    openLightbox(i) {
      this.active = i
      this.lightbox = true
    },
    step(direction) {
      const count = this.items.length
      this.active = (this.active + direction + count) % count
    },
  },
}
</script>

<style scoped>
.gallery-main {
  display: block;
  width: 100%;
  position: relative;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(46, 82, 51, 0.16);
  cursor: zoom-in;
  background: rgba(46, 125, 50, 0.04);
}
.gallery-main__img {
  aspect-ratio: 4 / 3;
}
.gallery-main__zoom {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #fff;
  background: rgba(27, 43, 29, 0.5);
  opacity: 0;
  transition: opacity 0.2s ease;
}
.gallery-main:hover .gallery-main__zoom {
  opacity: 1;
}
.gallery-main__caption {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 18px 14px 8px;
  font-size: 0.78rem;
  color: #fff;
  text-align: left;
  background: linear-gradient(transparent, rgba(20, 30, 24, 0.65));
}

.gallery-thumbs {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  overflow-x: auto;
  padding-bottom: 2px;
}
.gallery-thumb {
  flex: none;
  width: 62px;
  height: 62px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid transparent;
  opacity: 0.7;
  transition: opacity 0.2s ease, border-color 0.2s ease;
}
.gallery-thumb:hover {
  opacity: 1;
}
.gallery-thumb--active {
  opacity: 1;
  border-color: rgb(var(--v-theme-primary));
}

.gallery-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  aspect-ratio: 4 / 3;
  border-radius: 18px;
  border: 1.5px dashed rgba(46, 82, 51, 0.3);
  background: rgba(46, 125, 50, 0.03);
}
.gallery-empty__text {
  font-size: 0.82rem;
  color: rgba(34, 43, 35, 0.55);
  margin: 0;
}

.lightbox {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.lightbox__close {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 2;
}
.lightbox__nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
}
.lightbox__nav--prev {
  left: 4px;
}
.lightbox__nav--next {
  right: 4px;
}
.lightbox__bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  color: #fff;
  background: linear-gradient(transparent, rgba(20, 30, 24, 0.6));
}
.lightbox__caption {
  font-size: 0.85rem;
}
.lightbox__count {
  font-size: 0.78rem;
  opacity: 0.8;
  flex: none;
}

@media (prefers-reduced-motion: reduce) {
  .gallery-main__zoom,
  .gallery-thumb {
    transition: none;
  }
}
</style>
