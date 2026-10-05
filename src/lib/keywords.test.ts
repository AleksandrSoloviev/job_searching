import { describe, expect, it } from 'vitest'
import { isReactNativeRole } from '@/lib/keywords'

describe('isReactNativeRole', () => {
  it('распознаёт react native, react-native и RN как нативную роль', () => {
    expect(isReactNativeRole('React Native Engineer')).toBe(true)
    expect(isReactNativeRole('Mobile', 'react-native')).toBe(true)
    expect(isReactNativeRole('ReactNative Developer')).toBe(true)
    expect(isReactNativeRole('Senior RN Engineer')).toBe(true)
    expect(isReactNativeRole('Developer (RN)')).toBe(true)
    expect(isReactNativeRole('Разработчик', 'реакт нейтив')).toBe(true)
  })

  it('не считает фронтенд intern/pattern нативной ролью', () => {
    expect(isReactNativeRole('Frontend Engineer')).toBe(false)
    expect(isReactNativeRole('Frontend Intern', 'React TypeScript')).toBe(false)
    expect(isReactNativeRole('Engineer', 'modern pattern matching')).toBe(false)
    expect(isReactNativeRole('React Developer')).toBe(false)
  })
})
