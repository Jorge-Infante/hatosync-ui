import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

/**
 * HatoSync design system — "editorial de campo".
 *
 * Single source of truth for colors and component defaults.
 * Warm paper background, deep pine greens, clay/ochre semantic accents.
 * Pages/components must rely on these defaults instead of repeating
 * variant/density/rounded props everywhere.
 */
const hatosyncLight = {
  dark: false,
  colors: {
    primary: '#2E7D32', // brand green
    'primary-darken-1': '#1B5E20',
    secondary: '#3F5847', // eucalyptus ink: secondary actions/text
    accent: '#C98A2D', // hay/ochre: highlights, chips, counters
    background: '#F5F3EB', // warm paper — not cold grey
    surface: '#FDFCF8', // warm white surfaces
    'on-background': '#222B23',
    'on-surface': '#222B23',
    success: '#3E8E48',
    warning: '#C98A2D',
    error: '#B3402F', // terracotta
    info: '#38678C',
  },
  variables: {
    // Green-tinted hairline borders instead of neutral grey
    'border-color': '#2E5233',
    'border-opacity': 0.14,
  },
}

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'hatosyncLight',
    themes: { hatosyncLight },
  },
  defaults: {
    // Buttons: flat, rounded, no uppercase
    VBtn: {
      rounded: 'lg',
      elevation: 0,
      class: 'text-none font-weight-medium',
    },
    // Form inputs: outlined + comfortable everywhere
    VTextField: { variant: 'outlined', density: 'comfortable', color: 'primary', rounded: 'lg' },
    VTextarea: { variant: 'outlined', density: 'comfortable', color: 'primary', rounded: 'lg' },
    VSelect: { variant: 'outlined', density: 'comfortable', color: 'primary', rounded: 'lg' },
    VAutocomplete: { variant: 'outlined', density: 'comfortable', color: 'primary', rounded: 'lg' },
    VCombobox: { variant: 'outlined', density: 'comfortable', color: 'primary', rounded: 'lg' },
    VFileInput: { variant: 'outlined', density: 'comfortable', color: 'primary', rounded: 'lg' },
    VCheckbox: { color: 'primary' },
    VRadioGroup: { color: 'primary' },
    VSwitch: { color: 'primary', inset: true },
    // Surfaces: flat cards with green-tinted hairline border instead of shadows
    VCard: { rounded: 'xl', elevation: 0, border: true },
    VAlert: { variant: 'tonal', rounded: 'lg', density: 'comfortable' },
    VChip: { rounded: 'lg' },
    VAppBar: { flat: true, color: 'surface', border: 'b' },
    VNavigationDrawer: { color: 'surface' },
    VDialog: { scrim: '#1B2B1D' },
    VTooltip: { location: 'top' },
  },
})
