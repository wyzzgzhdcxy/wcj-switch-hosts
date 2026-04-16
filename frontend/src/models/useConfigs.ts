/**
 * @author: oldj
 * @homepage: https://oldj.net
 */

import { actions } from '../core/agent'
import { configs_atom } from '../stores/configs'
import { useAtom } from 'jotai'
import type { ConfigsType } from '../types'

export default function useConfigs() {
  const [configs, setConfigs] = useAtom(configs_atom)

  const loadConfigs = async () => {
    setConfigs(await actions.configAll() as ConfigsType)
  }

  const updateConfigs = async (kv: Partial<ConfigsType>) => {
    if (!configs) return
    let new_configs = { ...configs, ...kv }
    setConfigs(new_configs)
    // Update each config key
    for (const [key, value] of Object.entries(kv)) {
      await actions.configSet(key, String(value))
    }
  }

  return {
    configs,
    loadConfigs,
    updateConfigs,
  }
}