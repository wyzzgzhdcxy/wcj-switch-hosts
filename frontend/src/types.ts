// HostsType represents the type of hosts entry
export type HostsType = 'local' | 'remote' | 'group' | 'folder'

// FolderModeType represents the folder selection mode
export type FolderModeType = 0 | 1 | 2 // 0: 默认; 1: 单选; 2: 多选

export interface IHostsListObject {
  id: string
  title?: string
  on?: boolean
  type?: HostsType

  // remote
  url?: string
  last_refresh?: string
  last_refresh_ms?: number
  refresh_interval?: number // 单位：秒

  // group
  include?: string[]

  // folder
  folder_mode?: FolderModeType
  folder_open?: boolean
  children?: IHostsListObject[]

  is_sys?: boolean

  // tree node data compatibility
  can_select?: boolean
  can_drag?: boolean
  can_drop_before?: boolean
  can_drop_in?: boolean
  can_drop_after?: boolean
  is_collapsed?: boolean

  [key: string]: any
}

export interface IHostsContentObject {
  id: string
  content: string

  [key: string]: any
}

export interface ITrashcanObject {
  data: IHostsListObject
  add_time_ms: number
  parent_id: string | null
}

export interface IHostsHistoryObject {
  id: string
  content: string
  add_time_ms: number
  label?: string
}

export type VersionType = [number, number, number, number]

export interface IHostsBasicData {
  list: IHostsListObject[]
  trashcan: ITrashcanObject[]
  version: VersionType
}

export interface IOperationResult {
  success: boolean
  message?: string
  data?: any
  code?: string | number
}

export interface ICommandRunResult {
  _id?: string
  success: boolean
  stdout: string
  stderr: string
  add_time_ms: number
}

// Actions type for the agent
export interface Actions {
  ping: () => Promise<boolean>
  getBasicData: () => Promise<IHostsBasicData>
  getDataDir: () => Promise<string>
  getDefaultDataDir: () => Promise<string>
  configGet: (key: string) => Promise<string | null>
  configSet: (key: string, value: string) => Promise<void>
  configAll: () => Promise<Record<string, any>>
  getPathOfSystemHosts: () => Promise<string>
  getHostsContent: (id: string) => Promise<string>
  setHostsContent: (id: string, content: string) => Promise<void>
  refreshHosts: (id: string) => Promise<IOperationResult>
  getSystemHosts: () => Promise<string>
  setSystemHosts: (content: string, sudoPassword: string) => Promise<IOperationResult>
  getHistoryList: () => Promise<IHostsHistoryObject[]>
  deleteHistory: (historyID: string) => Promise<void>
  getList: () => Promise<IHostsListObject[]>
  setList: (list: IHostsListObject[]) => Promise<void>
  getItemFromList: (id: string) => Promise<IHostsListObject | null>
  getContentOfList: (id: string) => Promise<string>
  moveToTrashcan: (id: string) => Promise<void>
  moveManyToTrashcan: (ids: string[]) => Promise<void>
  getTrashcanList: () => Promise<ITrashcanObject[]>
  clearTrashcan: () => Promise<void>
  deleteItemFromTrashcan: (id: string) => Promise<void>
  restoreItemFromTrashcan: (id: string) => Promise<void>
  cmdGetHistoryList: () => Promise<ICommandRunResult[]>
  cmdDeleteHistory: (id: string) => Promise<void>
  cmdClearHistory: () => Promise<void>
  cmdFocusMainWindow: () => Promise<void>
  cmdToggleDevTools: () => Promise<void>
  cmdChangeDataDir: (dir: string) => Promise<void>
  openUrl: (url: string) => Promise<void>
  showItemInFolder: (path: string) => Promise<void>
  updateTrayTitle: () => Promise<void>
  checkUpdate: () => Promise<boolean | null>
  downloadUpdate: () => Promise<void>
  installUpdate: () => Promise<void>
  closeMainWindow: () => Promise<void>
  quit: () => Promise<void>
  findShow: () => Promise<void>
  findBy: (keyword: string, isRegexp: boolean, isIgnoreCase: boolean) => Promise<IFindResult[]>
  findAddHistory: (keyword: string) => Promise<void>
  findGetHistory: (limit: number) => Promise<string[]>
  findSetHistory: (history: string[]) => Promise<void>
  findAddReplaceHistory: (keyword: string) => Promise<void>
  findGetReplaceHistory: (limit: number) => Promise<string[]>
  findSetReplaceHistory: (history: string[]) => Promise<void>
  migrateCheck: () => Promise<boolean>
  migrateData: () => Promise<void>
  exportData: () => Promise<string | null>
  importData: () => Promise<boolean | null>
  importDataFromUrl: (url: string) => Promise<boolean | null>
}

export interface IFindResult {
  item_id: string
  item_title: string
  item_type: HostsType
  positions: IFindPosition[]
}

export interface IFindPosition {
  start: number
  end: number
  line: number
  line_pos: number
  end_line: number
  end_line_pos: number
  before: string
  match: string
  after: string
}

// Events type
export interface Agent {
  call(action: string, ...params: any[]): Promise<any>
  broadcast(event: string, ...params: any[]): void
  on(event: string, callback: (...params: any[]) => void): () => void
  off(event: string, callback: (...params: any[]) => void): void
}

// Configs type
export type WriteModeType = null | 'overwrite' | 'append'
export type ThemeType = 'light' | 'dark' | 'system'
export type ProtocolType = 'http' | 'https'
export type DefaultLocaleType = string | undefined

export interface ConfigsType {
  // UI
  left_panel_show: boolean
  left_panel_width: number
  use_system_window_frame: boolean

  // preferences
  write_mode: WriteModeType
  history_limit: number
  locale: DefaultLocaleType
  theme: ThemeType
  choice_mode: FolderModeType
  show_title_on_tray: boolean
  hide_at_launch: boolean
  send_usage_data: boolean
  cmd_after_hosts_apply: string
  remove_duplicate_records: boolean
  hide_dock_icon: boolean
  use_proxy: boolean
  proxy_protocol: ProtocolType
  proxy_host: string
  proxy_port: number
  http_api_on: boolean
  http_api_only_local: boolean
  tray_mini_window: boolean
  multi_chose_folder_switch_all: boolean

  // Legacy key: it now controls background update checks, while the actual
  // download remains a manual action in the UI.
  auto_download_update: boolean

  // other
  env: 'PROD' | 'DEV'
}

declare global {
  interface Window {
    _agent: Agent
  }
}
