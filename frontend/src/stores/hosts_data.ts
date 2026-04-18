/**
 * Hosts data store using Jotai
 */

import { atom } from 'jotai'
import type { IHostsBasicData, IHostsListObject, VersionType } from '../types'

const default_version: VersionType = [0, 0, 0, 0]

export const hosts_data_atom = atom<IHostsBasicData>({
  list: [],
  trashcan: [],
  version: default_version,
})

export const current_hosts_atom = atom<IHostsListObject | null>(null)