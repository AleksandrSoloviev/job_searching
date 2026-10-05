import { useState } from 'react'
import {
  clearSecretKey,
  readSecretKey,
  writeSecretKey,
} from '@/lib/letter-crypto'

type DecryptKeyFieldProps = {
  onKeyChange: () => void
}

export const DecryptKeyField = ({ onKeyChange }: DecryptKeyFieldProps) => {
  const [draft, setDraft] = useState('')
  const [hasKey, setHasKey] = useState(() => readSecretKey() !== null)

  const handleSave = () => {
    writeSecretKey(draft)
    setDraft('')
    setHasKey(readSecretKey() !== null)
    onKeyChange()
  }

  const handleClear = () => {
    clearSecretKey()
    setDraft('')
    setHasKey(false)
    onKeyChange()
  }

  return (
    <section
      aria-labelledby="decrypt-key-heading"
      className="space-y-3 rounded-md border border-slate-200 bg-white p-4"
    >
      <h2 id="decrypt-key-heading" className="text-lg font-semibold">
        Ключ расшифровки писем
      </h2>
      <p className="text-sm text-slate-600">
        Приложение читает ключ только из localStorage по имени sKey. Значение не
        уходит в каталог, экспорт и репозиторий.
      </p>
      <p className="text-sm text-slate-600" aria-live="polite">
        {hasKey ? 'Ключ в этом браузере задан.' : 'Ключ не задан.'}
      </p>
      <div className="space-y-1">
        <label htmlFor="decrypt-key" className="text-sm font-medium">
          Ключ
        </label>
        <input
          id="decrypt-key"
          type="password"
          autoComplete="off"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value)
          }}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleSave}
          className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          Сохранить ключ
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          Удалить ключ
        </button>
      </div>
    </section>
  )
}
