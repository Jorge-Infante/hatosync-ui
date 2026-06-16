<template>
  <div ref="root">
    <CowMascot :state="cowState" class="login-cow mb-4" />

    <p class="hs-overline login-overline mb-2">Bienvenido de nuevo</p>
    <h1 class="login-title mb-2">
      <span class="login-title-inner">Iniciar sesión</span>
    </h1>
    <p class="text-body-2 text-medium-emphasis login-subtitle mb-6">
      Ingresa con tu correo para administrar tu hato.
    </p>

    <v-alert
      v-if="error"
      type="error"
      class="mb-4"
      closable
      @click:close="error = ''"
    >
      {{ error }}
    </v-alert>

    <v-form ref="form" @submit.prevent="handleLogin">
      <v-text-field
        v-model="email"
        type="email"
        label="Correo electrónico"
        prepend-inner-icon="mdi-email-outline"
        :rules="[rules.required, rules.email]"
        class="mb-2 login-field"
        autocomplete="email"
      />
      <v-text-field
        v-model="password"
        :type="showPassword ? 'text' : 'password'"
        label="Contraseña"
        prepend-inner-icon="mdi-lock-outline"
        :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
        :rules="[rules.required]"
        class="mb-4 login-field"
        autocomplete="current-password"
        @update:focused="passwordFocused = $event"
        @click:append-inner="showPassword = !showPassword"
      />
      <v-btn
        type="submit"
        color="primary"
        block
        size="large"
        append-icon="mdi-arrow-right"
        class="login-submit"
        :loading="loading"
      >
        Iniciar sesión
      </v-btn>
    </v-form>

    <v-divider class="my-6 login-foot" />
    <p class="text-caption text-medium-emphasis login-foot">
      ¿Problemas para entrar? Contacta al administrador de tu finca.
    </p>
  </div>
</template>

<script>
import { mapActions } from 'vuex'
import { gsap } from 'gsap'
import { getErrorMessage } from '@/api/errors'
import CowMascot from '@/modules/auth/components/CowMascot.vue'

export default {
  name: 'LoginPage',
  components: { CowMascot },
  data() {
    return {
      email: '',
      password: '',
      showPassword: false,
      passwordFocused: false,
      loading: false,
      error: '',
      mm: null,
      rules: {
        required: (v) => !!v || 'Campo requerido',
        email: (v) => /.+@.+\..+/.test(v) || 'Correo inválido',
      },
    }
  },
  computed: {
    // The cow covers its eyes while the password is hidden, and peeks (side-eye)
    // when it's revealed. showPassword keeps the peek even if the toggle click
    // steals focus from the field.
    cowState() {
      const engaged = this.passwordFocused || this.showPassword
      if (!engaged) return 'forward'
      return this.showPassword ? 'peek' : 'away'
    },
  },
  mounted() {
    // Orchestrated entrance via GSAP. matchMedia auto-reverts and honors
    // prefers-reduced-motion; selectors are scoped to this component root.
    this.mm = gsap.matchMedia()
    this.mm.add(
      { reduce: '(prefers-reduced-motion: reduce)' },
      (ctx) => {
        if (ctx.conditions.reduce) return // leave content at its natural visible state

        gsap
          .timeline({ defaults: { ease: 'power3.out' } })
          .from('.login-cow', { autoAlpha: 0, scale: 0.6, y: 12, duration: 0.7, ease: 'back.out(1.6)' })
          .from('.login-overline', { autoAlpha: 0, y: 14, duration: 0.5 }, '-=0.35')
          .from('.login-title-inner', { yPercent: 120, duration: 0.85, ease: 'expo.out' }, '-=0.3')
          .from('.login-subtitle', { autoAlpha: 0, y: 12, duration: 0.5 }, '-=0.55')
          .from('.login-field', { autoAlpha: 0, y: 20, duration: 0.6, stagger: 0.12 }, '-=0.3')
          .from('.login-submit', { autoAlpha: 0, y: 20, scale: 0.98, duration: 0.6 }, '-=0.25')
          .from('.login-foot', { autoAlpha: 0, y: 10, duration: 0.5, stagger: 0.1 }, '-=0.3')
      },
      this.$refs.root
    )
  },
  beforeUnmount() {
    if (this.mm) this.mm.revert()
  },
  methods: {
    ...mapActions('auth', ['login']),
    shake() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const form = this.$refs.root.querySelector('form')
      if (!form) return
      gsap.fromTo(
        form,
        { x: -10 },
        { x: 0, duration: 0.6, ease: 'elastic.out(1, 0.35)', clearProps: 'x' }
      )
    },
    async handleLogin() {
      const { valid } = await this.$refs.form.validate()
      if (!valid) return

      this.loading = true
      this.error = ''
      try {
        await this.login({ email: this.email, password: this.password })
        this.$router.push(this.$route.query.redirect || '/livestock')
      } catch (e) {
        this.error = getErrorMessage(e, 'Error al iniciar sesión')
        this.shake()
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style scoped>
.login-cow {
  /* transform-origin near the feet so the entrance pop feels grounded */
  transform-origin: 50% 90%;
}

.login-title {
  font-family: var(--hs-font-display);
  font-variation-settings: 'opsz' 144;
  font-weight: 600;
  font-size: 2rem;
  letter-spacing: -0.02em;
  line-height: 1.1;
  /* Mask the serif title so it can slide up from below (editorial reveal) */
  overflow: hidden;
  padding-bottom: 0.06em;
}
.login-title-inner {
  display: inline-block;
  will-change: transform;
}
</style>
