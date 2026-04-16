/**
 * useHostsData hook - wraps agent calls for hosts data management
 */

import { useAtom } from 'jotai'
import { hosts_data_atom, current_hosts_atom } from '../stores/hosts_data'
import { actions } from '../core/agent'
import type { IHostsBasicData, IHostsListObject } from '../types'

export default function useHostsData() {
  const [hosts_data, setHostsData] = useAtom(hosts_data_atom)
  const [current_hosts, setCurrentHosts] = useAtom(current_hosts_atom)

  const loadHostsData = async () => {
    setHostsData(await actions.getBasicData())
  }

  const setList = async (list: IHostsListObject[]) => {
    // Filter out system hosts from the list
    list = list.filter((i) => !i.is_sys)

    let data: IHostsBasicData = {
      list,
      trashcan: hosts_data.trashcan,
      version: [1, 0, 0, 0],
    }

    setHostsData(data)
    await actions.setList(list)
    await actions.updateTrayTitle()
  }

  const isHostsInTrashcan = (id: string): boolean => {
    return hosts_data.trashcan.findIndex((i) => i.data.id === id) > -1
  }

  const isReadOnly = (hosts?: IHostsListObject | null): boolean => {
    hosts = hosts || current_hosts

    if (!hosts) {
      return true
    }

    if (hosts.id === '0') {
      return true // system hosts
    }

    if (hosts.type && ['group', 'remote', 'folder', 'trashcan'].includes(hosts.type)) {
      return true
    }

    if (isHostsInTrashcan(hosts.id)) {
      return true
    }

    return false
  }

  return {
    hosts_data,
    setHostsData,
    loadHostsData,

    setList,

    current_hosts,
    setCurrentHosts,

    isHostsInTrashcan,
    isReadOnly,
  }
}