/**
 * Código de chapeta QR — espejo EXACTO de apps/tags/services.py del backend.
 *
 * Formato: 8 chars aleatorios Crockford Base32 (sin I, L, O, U) + 1 de
 * verificación (suma ponderada por posición, módulo 31 primo). El QR codifica
 * `HS:` + código. Validar en cliente da feedback inmediato al digitar a mano;
 * la validación real siempre la repite el servidor.
 */
export const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
export const CODE_LENGTH = 9
export const PAYLOAD_PREFIX = 'HS:'
// Módulo PRIMO (31), NO 32: con 32 los pesos pares dejaban pasar ~4% de los
// errores de un carácter. Debe coincidir con CHECKSUM_MODULUS del backend.
export const CHECKSUM_MODULUS = 31

export function checksumChar(body) {
  let total = 0
  for (let i = 0; i < body.length; i += 1) {
    total += ALPHABET.indexOf(body[i]) * (i + 1)
  }
  return ALPHABET[total % CHECKSUM_MODULUS]
}

/** Normaliza lo que digitó/escaneó el usuario: mayúsculas, sin guiones ni espacios. */
export function cleanCode(raw) {
  return String(raw || '').toUpperCase().replace(/[-\s]/g, '')
}

export function isValidCode(raw) {
  const code = cleanCode(raw)
  if (code.length !== CODE_LENGTH) return false
  for (const char of code) {
    if (!ALPHABET.includes(char)) return false
  }
  return checksumChar(code.slice(0, CODE_LENGTH - 1)) === code[CODE_LENGTH - 1]
}

/** Agrupación humano-legible: 7Q4KM2XNC → 7Q4K-M2XN-C. */
export function formatCode(raw) {
  const code = cleanCode(raw)
  if (code.length !== CODE_LENGTH) return code
  return `${code.slice(0, 4)}-${code.slice(4, 8)}-${code[8]}`
}
