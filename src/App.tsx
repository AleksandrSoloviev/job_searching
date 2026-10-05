export const App = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-semibold">Трекер целевых компаний</h1>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-slate-700">
          Каркас приложения готов. Список компаний, письма и импорт появятся
          после инфраструктуры.
        </p>
        <p className="mt-3 text-sm text-slate-500">
          Данные хранятся в браузере. Серверной базы нет.
        </p>
      </main>
    </div>
  )
}
