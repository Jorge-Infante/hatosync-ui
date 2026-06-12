<template>
  <div>
    <p class="hs-overline rise mb-2">Bienvenido de nuevo</p>
    <h1 class="login-title rise rise-d1 mb-2">Iniciar sesión</h1>
    <p class="text-body-2 text-medium-emphasis rise rise-d2 mb-6">
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
        class="mb-2 rise rise-d3"
        autocomplete="email"
      />
      <v-text-field
        v-model="password"
        :type="showPassword ? 'text' : 'password'"
        label="Contraseña"
        prepend-inner-icon="mdi-lock-outline"
        :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
        :rules="[rules.required]"
        class="mb-4 rise rise-d4"
        autocomplete="current-password"
        @click:append-inner="showPassword = !showPassword"
      />
      <v-btn
        type="submit"
        color="primary"
        block
        size="large"
        append-icon="mdi-arrow-right"
        class="rise rise-d5"
        :loading="loading"
      >
        Iniciar sesión
      </v-btn>
    </v-form>

    <v-divider class="my-6 rise rise-d6" />
    <p class="text-caption text-medium-emphasis rise rise-d6">
      ¿Problemas para entrar? Contacta al administrador de tu finca.
    </p>
  </div>
</template>

<script>
import { mapActions } from 'vuex'
import { getErrorMessage } from '@/api/errors'

export default {
  name: 'LoginPage',
  data() {
    return {
      email: '',
      password: '',
      showPassword: false,
      loading: false,
      error: '',
      rules: {
        required: (v) => !!v || 'Campo requerido',
        email: (v) => /.+@.+\..+/.test(v) || 'Correo inválido',
      },
    }
  },
  methods: {
    ...mapActions('auth', ['login']),
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
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style scoped>
.login-title {
  font-family: var(--hs-font-display);
  font-variation-settings: 'opsz' 144;
  font-weight: 600;
  font-size: 2rem;
  letter-spacing: -0.02em;
  line-height: 1.1;
}
</style>
