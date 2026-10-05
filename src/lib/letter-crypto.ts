export const SECRET_KEY_NAME = 'sKey'

const ENVELOPE_PATTERN =
  /^enc\.v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/
const PBKDF2_ITERATIONS = 210_000
const SALT_BYTES = 16
const IV_BYTES = 12

export const isCiphertextEnvelope = (value: string): boolean =>
  ENVELOPE_PATTERN.test(value)

export const readSecretKey = (): string | null => {
  const value = localStorage.getItem(SECRET_KEY_NAME)

  if (value === null || value.trim() === '') {
    return null
  }

  return value
}

export const writeSecretKey = (value: string): void => {
  const trimmed = value.trim()

  if (trimmed === '') {
    localStorage.removeItem(SECRET_KEY_NAME)
    return
  }

  localStorage.setItem(SECRET_KEY_NAME, trimmed)
}

export const clearSecretKey = (): void => {
  localStorage.removeItem(SECRET_KEY_NAME)
}

const toBase64Url = (bytes: Uint8Array): string => {
  let binary = ''

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '')
}

const toArrayBufferBytes = (bytes: Uint8Array): Uint8Array<ArrayBuffer> => {
  const copy = new Uint8Array(bytes.length)
  copy.set(bytes)
  return copy
}

const fromBase64Url = (value: string): Uint8Array<ArrayBuffer> => {
  const padded = value.replaceAll('-', '+').replaceAll('_', '/')
  const pad =
    padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  const binary = atob(padded + pad)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

const deriveAesKey = async (
  secret: string,
  salt: Uint8Array<ArrayBuffer>,
): Promise<CryptoKey> => {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      iterations: PBKDF2_ITERATIONS,
      salt,
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export const encryptLetter = async (
  plaintext: string,
  companyId: string,
): Promise<string> => {
  if (plaintext.trim() === '') {
    return ''
  }

  const secret = readSecretKey()

  if (secret === null) {
    throw new Error('NO_SECRET_KEY')
  }

  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES))
  const key = await deriveAesKey(secret, salt)
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
      additionalData: new TextEncoder().encode(companyId),
    },
    key,
    new TextEncoder().encode(plaintext),
  )

  return `enc.v1.${toBase64Url(salt)}.${toBase64Url(iv)}.${toBase64Url(new Uint8Array(ciphertext))}`
}

export const decryptLetter = async (
  envelope: string,
  companyId: string,
): Promise<string | null> => {
  const secret = readSecretKey()

  if (secret === null || !isCiphertextEnvelope(envelope)) {
    return null
  }

  const parts = envelope.split('.')
  const saltPart = parts[2]
  const ivPart = parts[3]
  const ctPart = parts[4]

  if (!saltPart || !ivPart || !ctPart) {
    return null
  }

  try {
    const salt = toArrayBufferBytes(fromBase64Url(saltPart))
    const iv = toArrayBufferBytes(fromBase64Url(ivPart))
    const ciphertext = toArrayBufferBytes(fromBase64Url(ctPart))
    const key = await deriveAesKey(secret, salt)
    const plaintext = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
        additionalData: new TextEncoder().encode(companyId),
      },
      key,
      ciphertext,
    )

    return new TextDecoder().decode(plaintext)
  } catch {
    return null
  }
}
