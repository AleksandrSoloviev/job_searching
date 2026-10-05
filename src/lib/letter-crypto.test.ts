import { beforeEach, describe, expect, it } from 'vitest'
import {
  decryptLetter,
  encryptLetter,
  isCiphertextEnvelope,
  SECRET_KEY_NAME,
  writeSecretKey,
} from '@/lib/letter-crypto'

const createTestPassphrase = (): string => `test-${crypto.randomUUID()}`

describe('letter-crypto', () => {
  beforeEach(() => {
    localStorage.removeItem(SECRET_KEY_NAME)
  })

  it('шифрует и расшифровывает одним тестовым ключом', async () => {
    writeSecretKey(createTestPassphrase())

    const envelope = await encryptLetter('Текст письма', 'acme')

    expect(isCiphertextEnvelope(envelope)).toBe(true)
    expect(envelope.startsWith('enc.v1.')).toBe(true)
    await expect(decryptLetter(envelope, 'acme')).resolves.toBe('Текст письма')
  })

  it('не расшифровывает конверт другой компании из-за AAD', async () => {
    writeSecretKey(createTestPassphrase())

    const envelope = await encryptLetter('Текст письма', 'acme')

    await expect(decryptLetter(envelope, 'other')).resolves.toBeNull()
  })

  it('без ключа не шифрует и не расшифровывает', async () => {
    await expect(encryptLetter('Текст', 'acme')).rejects.toThrow('NO_SECRET_KEY')
    await expect(
      decryptLetter('enc.v1.YQ.YQ.YQ', 'acme'),
    ).resolves.toBeNull()
  })

  it('пустое письмо остаётся пустой строкой', async () => {
    writeSecretKey(createTestPassphrase())

    await expect(encryptLetter('   ', 'acme')).resolves.toBe('')
  })
})
