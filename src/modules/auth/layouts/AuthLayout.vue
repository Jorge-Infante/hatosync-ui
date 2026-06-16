<template>
  <v-main ref="root">
    <v-row no-gutters class="fill-height">
      <!-- Brand panel: visible only on md+ screens -->
      <v-col cols="12" md="5" lg="4" class="d-none d-md-flex brand-panel flex-column justify-space-between pa-10">
        <!-- Ambient gold glow: parallax to the cursor + slow idle breathing (GSAP) -->
        <div class="brand-glow" aria-hidden="true"></div>

        <div class="brand-layer d-flex align-center">
          <div class="brand-stamp mr-3">HS</div>
          <span class="brand-wordmark">HatoSync</span>
        </div>

        <div class="brand-layer">
          <p class="brand-overline mb-4">Sistema de gestión ganadera</p>
          <h2 class="brand-headline mb-4">
            Tu hato, <em>claro</em><br>y al día.
          </h2>
          <p class="brand-sub mb-10">
            Tus fincas, tus animales y tu equipo en un solo lugar — desde el corral o la oficina.
          </p>

          <div
            v-for="(feature, i) in features"
            :key="feature.text"
            class="brand-feature d-flex align-center"
          >
            <span class="brand-feature-index mr-4">{{ String(i + 1).padStart(2, '0') }}</span>
            <v-icon size="20" class="brand-feature-icon mr-3">{{ feature.icon }}</v-icon>
            <span class="brand-feature-text">{{ feature.text }}</span>
          </div>
        </div>

        <span class="brand-layer brand-footer">© {{ currentYear }} HatoSync · Hecho para el campo</span>
      </v-col>

      <!-- Page content -->
      <v-col cols="12" md="7" lg="8" class="d-flex align-center justify-center bg-background">
        <div class="auth-content w-100 pa-6">
          <!-- Compact brand header for mobile -->
          <div class="d-flex d-md-none flex-column align-center mb-8">
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
import { gsap } from 'gsap'

export default {
  name: 'AuthLayout',
  data() {
    return {
      mm: null,
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
  mounted() {
    const root = this.$refs.root?.$el || this.$refs.root
    if (!root) return

    this.mm = gsap.matchMedia()
    this.mm.add(
      {
        reduce: '(prefers-reduced-motion: reduce)',
        isDesktop: '(min-width: 960px)',
      },
      (ctx) => {
        const { reduce, isDesktop } = ctx.conditions

        if (!reduce) {
          // Orchestrated brand entrance
          gsap
            .timeline({ defaults: { ease: 'power3.out' } })
            .from('.brand-glow', { autoAlpha: 0, duration: 1.4 }, 0)
            .from('.brand-stamp', { autoAlpha: 0, scale: 0.6, rotation: -12, duration: 0.7, ease: 'back.out(1.7)' }, 0.1)
            .from('.brand-wordmark', { autoAlpha: 0, x: -16, duration: 0.6 }, '-=0.4')
            .from('.brand-overline', { autoAlpha: 0, y: 14, duration: 0.5 }, '-=0.3')
            .from('.brand-headline', { autoAlpha: 0, y: 28, duration: 0.85, ease: 'expo.out' }, '-=0.3')
            .from('.brand-sub', { autoAlpha: 0, y: 16, duration: 0.6 }, '-=0.55')
            .from('.brand-feature', { autoAlpha: 0, x: -22, duration: 0.6, stagger: 0.12 }, '-=0.3')
            .from('.brand-footer', { autoAlpha: 0, duration: 0.6 }, '-=0.2')
        }

        // Ambient + pointer parallax only where the panel is actually shown
        if (isDesktop && !reduce) {
          gsap.to('.brand-glow', {
            scale: 1.14,
            duration: 6.5,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
          })

          const panel = root.querySelector('.brand-panel')
          const xTo = gsap.quickTo('.brand-glow', 'xPercent', { duration: 0.9, ease: 'power3' })
          const yTo = gsap.quickTo('.brand-glow', 'yPercent', { duration: 0.9, ease: 'power3' })
          const onMove = (e) => {
            const r = panel.getBoundingClientRect()
            xTo(((e.clientX - r.left) / r.width - 0.5) * 26)
            yTo(((e.clientY - r.top) / r.height - 0.5) * 26)
          }
          panel.addEventListener('mousemove', onMove)
          // Returned cleanup runs on mm.revert()
          return () => panel.removeEventListener('mousemove', onMove)
        }
      },
      root
    )
  },
  beforeUnmount() {
    if (this.mm) this.mm.revert()
  },
}
</script>

<style scoped>
.brand-panel {
  position: relative;
  overflow: hidden;
  background:
    /* pasture contour lines */
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='480' height='480'%3E%3Cg fill='none' stroke='%23ffffff' stroke-opacity='0.07' stroke-width='1.3'%3E%3Cpath d='M-20 80 Q 100 30 240 80 T 500 80'/%3E%3Cpath d='M-20 160 Q 100 110 240 160 T 500 160'/%3E%3Cpath d='M-20 240 Q 100 190 240 240 T 500 240'/%3E%3Cpath d='M-20 320 Q 100 270 240 320 T 500 320'/%3E%3Cpath d='M-20 400 Q 100 350 240 400 T 500 400'/%3E%3C/g%3E%3C/svg%3E"),
    linear-gradient(168deg, #11380f 0%, #1b5e20 58%, #2e7d32 100%);
}

/* Ambient gold glow — its own layer so GSAP can drift and breathe it */
.brand-glow {
  position: absolute;
  top: -25%;
  right: -18%;
  width: 75%;
  height: 75%;
  background: radial-gradient(closest-side, rgba(201, 138, 45, 0.30), rgba(201, 138, 45, 0) 72%);
  filter: blur(14px);
  pointer-events: none;
  z-index: 0;
  will-change: transform;
}

/* Content sits above the glow */
.brand-layer {
  position: relative;
  z-index: 1;
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
