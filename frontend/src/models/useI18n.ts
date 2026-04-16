/**
 * @author: oldj
 * @homepage: https://oldj.net
 */

import { i18n_atom, lang_atom, locale_atom } from '../stores/i18n'
import { useAtom } from 'jotai'
import type { LocaleName } from '../i18n'

export default function useI18n() {
  const [locale, setLocale] = useAtom(locale_atom)
  const [i18n] = useAtom(i18n_atom)
  const [lang] = useAtom(lang_atom)

  return {
    locale,
    setLocale: (locale?: LocaleName) => {
      const newLocale = locale || 'en'
      setLocale(newLocale)
      localStorage.setItem('locale', newLocale)
    },
    i18n,
    lang,
  }
}