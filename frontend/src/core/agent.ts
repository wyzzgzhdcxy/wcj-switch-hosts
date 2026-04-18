/**
 * Agent - wraps Wails bindings to match the source project interface
 */

import * as WailsApp from '../../wailsjs/go/main/App'
import type { Actions, Agent, IHostsBasicData, IHostsListObject, IOperationResult, IHostsHistoryObject, ITrashcanObject, IFindResult } from '../types'

// Create actions object that matches the source project's interface
export const actions: Actions = {
  ping: async () => {
    return true
  },

  getBasicData: async () => {
    const data = await WailsApp.GetBasicData()
    return data as unknown as IHostsBasicData
  },

  getDataDir: async () => {
    return WailsApp.GetDataDir()
  },

  getDefaultDataDir: async () => {
    return WailsApp.GetDefaultDataDir()
  },

  configGet: async (key: string) => {
    const val = await WailsApp.GetConfig(key)
    return val as string | null
  },

  configSet: async (key: string, value: string) => {
    await WailsApp.SetConfig(key, value)
  },

  configAll: async () => {
    return await WailsApp.GetAllConfig() as Record<string, string>
  },

  getPathOfSystemHosts: async () => {
    return WailsApp.GetSystemHostsPath()
  },

  getHostsContent: async (id: string) => {
    return WailsApp.GetHostsContent(id)
  },

  setHostsContent: async (id: string, content: string) => {
    await WailsApp.SetHostsContent(id, content)
  },

  refreshHosts: async (id: string) => {
    return await WailsApp.RefreshRemoteHosts(id) as IOperationResult
  },

  getSystemHosts: async () => {
    return WailsApp.GetSystemHosts()
  },

  setSystemHosts: async (content: string, sudoPassword: string) => {
    return await WailsApp.SetSystemHosts(content, sudoPassword) as IOperationResult
  },

  getHistoryList: async () => {
    return await WailsApp.GetHistoryList() as IHostsHistoryObject[]
  },

  deleteHistory: async (historyID: string) => {
    await WailsApp.DeleteHistory(historyID)
  },

  getList: async () => {
    const data = await WailsApp.GetBasicData()
    return (data as unknown as IHostsBasicData).list
  },

  setList: async (list: IHostsListObject[]) => {
    await WailsApp.SetList(list as any[])
  },

  getItemFromList: async (id: string) => {
    return await WailsApp.GetItem(id) as IHostsListObject | null
  },

  getContentOfList: async (id: string) => {
    return WailsApp.GetHostsContent(id)
  },

  moveToTrashcan: async (id: string) => {
    await WailsApp.MoveToTrashcan(id)
  },

  moveManyToTrashcan: async (ids: string[]) => {
    for (const id of ids) {
      await WailsApp.MoveToTrashcan(id)
    }
  },

  getTrashcanList: async () => {
    return await WailsApp.GetTrashcanList() as ITrashcanObject[]
  },

  clearTrashcan: async () => {
    await WailsApp.ClearTrashcan()
  },

  deleteItemFromTrashcan: async (id: string) => {
    await WailsApp.DeleteFromTrashcan(id)
  },

  restoreItemFromTrashcan: async (id: string) => {
    await WailsApp.RestoreFromTrashcan(id)
  },

  cmdGetHistoryList: async () => {
    return []
  },

  cmdDeleteHistory: async (_id: string) => {
    // Not implemented in Wails version
  },

  cmdClearHistory: async () => {
    // Not implemented in Wails version
  },

  cmdFocusMainWindow: async () => {
    // Not implemented in Wails version
  },

  cmdToggleDevTools: async () => {
    // Not implemented in Wails version
  },

  cmdChangeDataDir: async (_dir: string) => {
    // Not implemented in Wails version
  },

  openUrl: async (url: string) => {
    await WailsApp.OpenURL(url)
  },

  showItemInFolder: async (path: string) => {
    await WailsApp.ShowItemInFolder(path)
  },

  updateTrayTitle: async () => {
    // Not implemented in Wails version
  },

  checkUpdate: async () => {
    return await WailsApp.CheckUpdate() as boolean | null
  },

  downloadUpdate: async () => {
    await WailsApp.DownloadUpdate()
  },

  installUpdate: async () => {
    await WailsApp.InstallUpdate()
  },

  closeMainWindow: async () => {
    // Not implemented in Wails version
  },

  quit: async () => {
    await WailsApp.Quit()
  },

  findShow: async () => {
    // Not implemented in Wails version
  },

  findBy: async (keyword: string, isRegexp: boolean, isIgnoreCase: boolean) => {
    return await WailsApp.FindBy(keyword, isRegexp, isIgnoreCase) as IFindResult[]
  },

  findAddHistory: async (keyword: string) => {
    await WailsApp.AddFindHistory(keyword)
  },

  findGetHistory: async (limit: number) => {
    return await WailsApp.GetFindHistory(limit)
  },

  findSetHistory: async (_history: string[]) => {
    // Not implemented in Wails version
  },

  findAddReplaceHistory: async (keyword: string) => {
    await WailsApp.AddReplaceHistory(keyword)
  },

  findGetReplaceHistory: async (limit: number) => {
    return await WailsApp.GetReplaceHistory(limit)
  },

  findSetReplaceHistory: async (_history: string[]) => {
    // Not implemented in Wails version
  },

  migrateCheck: async () => {
    return WailsApp.CheckMigration()
  },

  migrateData: async () => {
    await WailsApp.MigrateData()
  },

  exportData: async () => {
    const data = await WailsApp.ExportData()
    return data
  },

  importData: async () => {
    // This needs file picker - will be handled separately
    return null
  },

  importDataFromUrl: async (url: string) => {
    await WailsApp.ImportDataFromURL(url)
    return true
  },
}

// Create a simple agent that wraps actions
const agentImpl: Agent = {
  call: async (action: string, ...params: any[]) => {
    const fn = (actions as any)[action]
    if (typeof fn === 'function') {
      return fn(...params)
    }
    throw new Error(`Unknown action: ${action}`)
  },
  broadcast: (_event: string, ..._params: any[]) => {
    // Events are handled differently in Wails
  },
  on: (_event: string, _callback: (...params: any[]) => void) => {
    return () => {}
  },
  off: (_event: string, _callback: (...params: any[]) => void) => {
  },
}

export const agent = agentImpl
