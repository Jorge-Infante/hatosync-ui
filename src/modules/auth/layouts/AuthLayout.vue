<template>
  <v-main>
    <v-row no-gutters class="fill-height">
      <!-- Brand panel: visible only on md+ screens -->
      <v-col cols="12" md="5" lg="4" class="d-none d-md-flex brand-panel flex-column justify-space-between pa-10">
        <div class="d-flex align-center rise">
          <div class="brand-stamp mr-3">HS</div>
          <span class="brand-wordmark">HatoSync</span>
        </div>

        <div>
          <p class="brand-overline rise rise-d1 mb-4">Sistema de gestión ganadera</p>
          <h2 class="brand-headline rise rise-d2 mb-4">
            Tu hato, <em>claro</em><br>y al día.
          </h2>
          <p class="brand-sub rise rise-d3 mb-10">
            Tus fincas, tus animales y tu equipo en un solo lugar — desde el corral o la oficina.
          </p>

          <div
            v-for="(feature, i) in features"
            :key="feature.text"
            class="brand-feature d-flex align-center rise"
            :class="`rise-d${i + 4}`"
          >
            <span class="brand-feature-index mr-4">{{ String(i + 1).padStart(2, '0') }}</span>
            <v-icon size="20" class="brand-feature-icon mr-3">{{ feature.icon }}</v-icon>
            <span class="brand-feature-text">{{ feature.text }}</span>
          </div>
        </div>

        <span class="brand-footer rise rise-d6">© {{ currentYear }} HatoSync · Hecho para el campo</span>
      </v-col>

      <!-- Page content -->
      <v-col cols="12" md="7" lg="8" class="d-flex align-center justify-center bg-background">
        <div class="auth-content w-100 pa-6">
          <!-- Compact brand header for mobile -->
          <div class="d-flex d-md-none flex-column align-center mb-8 rise">
            <div class="brand-stamp brand-stamp--mobile mb-3">HS</div>
            <span class="brand-wordmark brand-wordmark--mobile">HatoSync</span>
          </div>

          <router-view />
        </div>
      </v-col>
    </v-row>
  </v-main>
</template>

<script>
export default {
  name: 'AuthLayout',
  data() {
    return {
      features: [
        { icon: 'mdi-cow', text: 'Inventario completo de tu hato' },
        { icon: 'mdi-calendar-heart', text: 'Control reproductivo por eventos' },
        { icon: 'mdi-account-group', text: 'Multifinca y trabajo en equipo' },
      ],
    }
  },
  computed: {
    currentYear() {
      return new Date().getFullYear()
    },
  },
}
</script>

<style scoped>
.brand-panel {
  position: relative;
  background:
    radial-gradient(120% 90% at 85% -10%, rgba(201, 138, 45, 0.18) 0%, transparent 55%),
    /* pasture contour lines */
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='480' height='480'%3E%3Cg fill='none' stroke='%23ffffff' stroke-opacity='0.07' stroke-width='1.3'%3E%3Cpath d='M-20 80 Q 100 30 240 80 T 500 80'/%3E%3Cpath d='M-20 160 Q 100 110 240 160 T 500 160'/%3E%3Cpath d='M-20 240 Q 100 190 240 240 T 500 240'/%3E%3Cpath d='M-20 320 Q 100 270 240 320 T 500 320'/%3E%3Cpath d='M-20 400 Q 100 350 240 400 T 500 400'/%3E%3C/g%3E%3C/svg%3E"),
    linear-gradient(168deg, #11380f 0%, #1b5e20 58%, #2e7d32 100%);
}

/* Cattle-brand stamp: circled monogram with a dashed iron ring */
.brand-stamp {
  width: 46px;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid rgba(255, 255, 255, 0.85);
  border-radius: 50%;
  outline: 1px dashed rgba(255, 255, 255, 0.35);
  outline-offset: 4px;
  color: #fff;
  font-family: var(--hs-font-display);
  font-weight: 600;
  font-style: italic;
  font-size: 1.15rem;
  letter-spacing: 0.02em;
  flex: none;
}
.brand-stamp--mobile {
  border-color: #2e7d32;
  outline-color: rgba(46, 125, 50, 0.4);
  color: #2e7d32;
}

.brand-wordmark {
  font-family: var(--hs-font-display);
  font-weight: 600;
  font-size: 1.45rem;
  letter-spacing: -0.01em;
  color: #fff;
}
.brand-wordmark--mobile {
  color: #2e7d32;
  font-size: 1.3rem;
}

.brand-overline {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.55);
}

.brand-headline {
  font-family: var(--hs-font-display);
  font-variation-settings: 'opsz' 144;
  font-weight: 600;
  font-size: clamp(2.2rem, 3.2vw, 2.9rem);
  line-height: 1.08;
  letter-spacing: -0.02em;
  color: #fff;
}
.brand-headline em {
  font-style: italic;
  color: #e8c98a; /* hay gold accent */
}

.brand-sub {
  font-size: 1rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.78);
  max-width: 34ch;
}

.brand-feature {
  padding: 14px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.14);
}
.brand-feature:last-child {
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
}
.brand-feature-index {
  font-family: var(--hs-font-display);
  font-style: italic;
  font-size: 0.85rem;
  color: rgba(232, 201, 138, 0.9);
}
.brand-feature-icon {
  color: rgba(255, 255, 255, 0.8);
}
.brand-feature-text {
  font-size: 0.92rem;
  color: rgba(255, 255, 255, 0.92);
}

.brand-footer {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.45);
}

.auth-content {
  max-width: 440px;
}
</style>
