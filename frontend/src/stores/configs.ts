/**
 * @author: oldj
 * @homepage: https://oldj.net
 */

import { atom } from 'jotai'
import type { ConfigsType } from '../types'

export const configs_atom = atom<ConfigsType | null>(null)