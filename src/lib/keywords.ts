export const BUILTIN_FRONTEND_KEYWORDS = [
  'frontend',
  'front-end',
  'фронтенд',
  'react',
  'typescript',
  'javascript',
  'js',
  'ts',
  'html',
  'css',
  'next.js',
  'nextjs',
  'vue',
  'angular',
  'svelte',
  'tailwind',
] as const

const REACT_NATIVE_PHRASE = /react[\s-]*native/i
const REACT_NATIVE_RU = /реакт[\s-]*нейтив/i
const REACT_NATIVE_TOKEN = /(^|[^a-z0-9а-яё])rn([^a-z0-9а-яё]|$)/i

export const isReactNativeRole = (title: string, summary = ''): boolean => {
  const haystack = `${title} ${summary}`

  return (
    REACT_NATIVE_PHRASE.test(haystack) ||
    REACT_NATIVE_RU.test(haystack) ||
    REACT_NATIVE_TOKEN.test(haystack)
  )
}
