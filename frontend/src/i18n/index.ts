/**
 * index
 * @author: oldj
 * @homepage: https://oldj.net
 */

import en from './languages/en'
import zh from './languages/zh'
import zh_hant from './languages/zh-hant'
import fr from './languages/fr'
import de from './languages/de'
import ja from './languages/ja'
import tr from './languages/tr'
import ko from './languages/ko'
import pl from './languages/pl'
import type { LanguageDict, LanguageKey } from './languages/zh'

export const languages: Record<string, LanguageDict> = {
  en,
  zh,
  cn: zh,
  'zh-CN': zh,
  zh_hant: zh_hant || zh,
  'zh-TW': zh_hant || zh,
  fr: fr || en,
  de: de || en,
  ja: ja || en,
  tr: tr || en,
  ko: ko || en,
  pl: pl || en,
}

export type LocaleName = keyof typeof languages

export class I18N {
  locale: LocaleName
  lang: LanguageDict

  constructor(locale: LocaleName = 'en') {
    this.locale = locale

    const _this = this

    this.lang = new Proxy(
      {},
      {
        get(obj: any, key: LanguageKey) {
          return _this.trans(key)
        },
      },
    ) as LanguageDict
  }

  trans(key: LanguageKey, words?: string[]): string {
    const lang = languages[this.locale] || languages.en

    let s: string = ''

    if (key in lang) {
      s = (lang as any)[key].toString()
    }

    if (words) {
      words.map((w, idx) => {
        const reg = new RegExp(`\\{\\s*${idx}\\s*}`)
        s = s.replace(reg, w)
      })
    }

    return s
  }
}