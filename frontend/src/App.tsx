import React, { useState, useEffect, useCallback, useRef } from 'react'
import * as App from '../wailsjs/go/main/App'
import HostsEditor from './HostsEditor'

// Types - matching the Go backend structures
interface HostsListObject {
  id: string
  title?: string
  on?: boolean
  type?: string
  url?: string
  last_refresh?: string
  last_refresh_ms?: number
  refresh_interval?: number
  include?: string[]
  folder_mode?: number
  folder_open?: boolean
  children?: HostsListObject[]
  is_sys?: boolean
  content?: string
}

interface TrashcanObject {
  id: string
  data?: HostsListObject
  add_time_ms: number
  parent_id?: string
}

interface HostsBasicData {
  list: HostsListObject[]
  trashcan: TrashcanObject[]
  version: number[]
}

interface HostsHistoryObject {
  id: string
  content: string
  add_time_ms: number
  label?: string
}

interface OperationResult {
  success: boolean
  message?: string
  code?: string
  data?: any
}

// Icons as simple SVG components
const IconDeviceDesktop = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
    <line x1="8" y1="21" x2="16" y2="21"></line>
    <line x1="12" y1="17" x2="12" y2="21"></line>
  </svg>
)

const IconFileText = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
  </svg>
)

const IconFolder = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
  </svg>
)

const IconStack2 = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"></rect>
    <rect x="14" y="3" width="7" height="7"></rect>
    <rect x="14" y="14" width="7" height="7"></rect>
    <rect x="3" y="14" width="7" height="7"></rect>
  </svg>
)

const IconTrash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
)

const IconWorld = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
  </svg>
)

const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
)

const IconEdit = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
)

const IconSettings = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
)

const IconChevronRight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="9,18 15,12 9,6"></polygon>
  </svg>
)

const IconHistory = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
)

const IconUpload = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="17 8 12 3 7 8"></polyline>
    <line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>
)

const IconDownload = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
)

const IconInfo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
)

const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
)

const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
)

const IconRefresh = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10"></polyline>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
  </svg>
)

const IconMinus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
)

// Get icon by type
const getItemIcon = (type: string) => {
  switch (type) {
    case 'folder':
      return <IconFolder />
    case 'remote':
      return <IconWorld />
    case 'group':
      return <IconStack2 />
    case 'system':
      return <IconDeviceDesktop />
    case 'trashcan':
      return <IconTrash />
    default:
      return <IconFileText />
  }
}

interface TreeNodeProps {
  data: HostsListObject
  selected: boolean
  onSelect: (id: string, shiftKey?: boolean, metaKey?: boolean) => void
  onToggle: (id: string, on: boolean) => void
  onToggleFolder: (item: HostsListObject) => void
  onEdit: (item: HostsListObject) => void
  onContextMenu: (e: React.MouseEvent, item: HostsListObject) => void
  onDragStart: (e: React.DragEvent, id: string) => void
  onDragOver: (e: React.DragEvent, id: string) => void
  onDrop: (e: React.DragEvent, id: string) => void
  onDragEnd: () => void
  dragSourceId: string | null
  dropTargetId: string | null
  dropWhere: string | null
  level: number
  isTrash?: boolean
  trashMap?: Map<string, TrashcanObject>
  selectedIds: string[]
}

const TreeNode: React.FC<TreeNodeProps> = ({
  data, selected, onSelect, onToggle, onToggleFolder, onEdit, onContextMenu,
  onDragStart, onDragOver, onDrop, onDragEnd, dragSourceId, dropTargetId, dropWhere,
  level, isTrash, trashMap, selectedIds
}) => {
  const isFolder = data.type === 'folder' || data.type === 'group'
  const hasChildren = data.children && data.children.length > 0
  const isInTrash = trashMap?.has(data.id)
  const isSelected = selectedIds.includes(data.id)
  const isDragSource = dragSourceId === data.id
  const isDropTarget = dropTargetId === data.id

  const handleArrowClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isFolder) {
      onToggleFolder(data)
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    onSelect(data.id, e.shiftKey, e.metaKey || e.ctrlKey)
  }

  const getDropClass = () => {
    if (!isDropTarget) return ''
    if (dropWhere === 'before') return 'drop-before'
    if (dropWhere === 'after') return 'drop-after'
    if (dropWhere === 'in') return 'drop-in'
    return ''
  }

  return (
    <div className="tree-node-wrapper">
      <div
        className={`tree-node ${selected ? 'selected' : ''} ${isSelected ? 'multi-selected' : ''} ${isInTrash ? 'in-trash' : ''} ${isDragSource ? 'drag-source' : ''} ${getDropClass()}`}
        onClick={handleClick}
        onContextMenu={(e) => onContextMenu(e, data)}
        draggable={!isTrash && !data.is_sys}
        onDragStart={(e) => onDragStart(e, data.id)}
        onDragOver={(e) => onDragOver(e, data.id)}
        onDrop={(e) => onDrop(e, data.id)}
        onDragEnd={onDragEnd}
      >
        <div className="tree-node-content">
          <div className="ln_header">
            <span className="arrow" onClick={handleArrowClick}>
              {isFolder && hasChildren ? (
                <span className={data.folder_open ? '' : 'collapsed'}>
                  <IconChevronRight />
                </span>
              ) : null}
            </span>
          </div>
          <div className="icon">
            {getItemIcon(data.is_sys ? 'system' : (data.type || 'file'))}
          </div>
          <span className="title">{data.title || 'Untitled'}</span>
        </div>
        <div className="status">
          {!isTrash && !data.is_sys && (
            <>
              <div className="edit">
                <span className="edit-btn" onClick={(e) => { e.stopPropagation(); onEdit(data); }} title="Edit">
                  <IconEdit />
                </span>
              </div>
              <label className="switch" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={data.on || false}
                  onChange={(e) => onToggle(data.id, e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </>
          )}
        </div>
      </div>
      {hasChildren && data.folder_open && data.children?.map((child) => (
        <TreeNode
          key={child.id}
          data={child}
          selected={selected}
          onSelect={onSelect}
          onToggle={onToggle}
          onToggleFolder={onToggleFolder}
          onEdit={onEdit}
          onContextMenu={onContextMenu}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onDragEnd={onDragEnd}
          dragSourceId={dragSourceId}
          dropTargetId={dropTargetId}
          dropWhere={dropWhere}
          level={level + 1}
          isTrash={isTrash}
          trashMap={trashMap}
          selectedIds={selectedIds}
        />
      ))}
    </div>
  )
}

// Context Menu Component
interface ContextMenuProps {
  x: number
  y: number
  item: HostsListObject | null
  onClose: () => void
  onEdit: () => void
  onMoveToTrashcan: () => void
  onRefresh: () => void
  onToggle: () => void
  isOn: boolean
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, item, onClose, onEdit, onMoveToTrashcan, onRefresh, onToggle, isOn }) => {
  if (!item) return null

  return (
    <div className="context-menu-overlay" onClick={onClose}>
      <div className="context-menu" style={{ left: x, top: y }} onClick={(e) => e.stopPropagation()}>
        <div className="context-menu-item" onClick={onEdit}>
          <IconEdit /> <span>Edit</span>
        </div>
        <div className="context-menu-item" onClick={onToggle}>
          {isOn ? <IconMinus /> : <IconCheck />} <span>{isOn ? 'Turn Off' : 'Turn On'}</span>
        </div>
        {item.type === 'remote' && (
          <div className="context-menu-item" onClick={onRefresh}>
            <IconRefresh /> <span>Refresh</span>
          </div>
        )}
        <div className="context-menu-divider"></div>
        <div className="context-menu-item danger" onClick={onMoveToTrashcan}>
          <IconTrash /> <span>Move to Trashcan</span>
        </div>
      </div>
    </div>
  )
}

// Edit Dialog Component
interface EditDialogProps {
  item: HostsListObject | null
  isAdd: boolean
  onClose: () => void
  onSave: (item: HostsListObject) => void
  onMoveToTrashcan?: (id: string) => void
  t: (key: string) => string
}

const EditDialog: React.FC<EditDialogProps> = ({ item, isAdd, onClose, onSave, onMoveToTrashcan, t }) => {
  const [title, setTitle] = useState(item?.title || '')
  const [type, setType] = useState(item?.type || 'local')
  const [url, setUrl] = useState(item?.url || '')
  const [refreshInterval, setRefreshInterval] = useState(item?.refresh_interval || 0)
  const [folderMode, setFolderMode] = useState(item?.folder_mode || 0)

  const handleSave = () => {
    const newItem: HostsListObject = {
      id: item?.id || `item_${Date.now()}`,
      title,
      type: type as HostsListObject['type'],
      url,
      refresh_interval: refreshInterval,
      folder_mode: folderMode as HostsListObject['folder_mode'],
      on: item?.on || false,
    }
    onSave(newItem)
  }

  const handleMoveToTrashcan = () => {
    if (item?.id && onMoveToTrashcan) {
      onMoveToTrashcan(item.id)
      onClose()
    }
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog edit-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>{isAdd ? t('hosts_add') : t('hosts_edit')}</h3>
          <button className="close-btn" onClick={onClose}><IconX /></button>
        </div>
        <div className="dialog-content">
          <div className="form-group">
            <label>{t('hosts_type')}</label>
            <div className="radio-group">
              {['local', 'remote', 'folder', 'group'].map((typeKey) => (
                <label key={typeKey} className="radio-label">
                  <input
                    type="radio"
                    name="type"
                    value={typeKey}
                    checked={type === typeKey}
                    onChange={(e) => setType(e.target.value)}
                    disabled={!isAdd}
                  />
                  {getItemIcon(typeKey)} <span>{typeKey}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>{t('hosts_title')}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('untitled')}
              maxLength={50}
            />
          </div>
          {type === 'remote' && (
            <>
              <div className="form-group">
                <label>URL</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={t('url_placeholder')}
                />
              </div>
              <div className="form-group">
                <label>{t('auto_refresh')}</label>
                <select value={refreshInterval} onChange={(e) => setRefreshInterval(parseInt(e.target.value))}>
                  <option value="0">{t('never')}</option>
                  <option value="60">1 {t('minute')}</option>
                  <option value="300">5 {t('minutes')}</option>
                  <option value="900">15 {t('minutes')}</option>
                  <option value="3600">1 {t('hour')}</option>
                  <option value="86400">24 {t('hours')}</option>
                  <option value="604800">7 {t('days')}</option>
                </select>
              </div>
            </>
          )}
          {type === 'folder' && (
            <div className="form-group">
              <label>{t('choice_mode')}</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input type="radio" name="folderMode" value="0" checked={folderMode === 0} onChange={() => setFolderMode(0)} />
                  <span>{t('choice_mode_default')}</span>
                </label>
                <label className="radio-label">
                  <input type="radio" name="folderMode" value="1" checked={folderMode === 1} onChange={() => setFolderMode(1)} />
                  <span>{t('choice_mode_single')}</span>
                </label>
                <label className="radio-label">
                  <input type="radio" name="folderMode" value="2" checked={folderMode === 2} onChange={() => setFolderMode(2)} />
                  <span>{t('choice_mode_multiple')}</span>
                </label>
              </div>
            </div>
          )}
        </div>
        <div className="dialog-footer">
          {!isAdd && onMoveToTrashcan && (
            <button className="btn danger" onClick={handleMoveToTrashcan}>
              {t('move_to_trashcan')}
            </button>
          )}
          <div style={{ flex: 1 }}></div>
          <button className="btn" onClick={onClose}>{t('btn_cancel')}</button>
          <button className="btn primary" onClick={handleSave}>{t('btn_ok')}</button>
        </div>
      </div>
    </div>
  )
}

// Preferences Dialog
interface PrefDialogProps {
  onClose: () => void
  configs: Record<string, any>
  onConfigChange: (key: string, value: any) => void
  t: (key: string) => string
  locale: string
  onLocaleChange: (locale: string) => void
}

const PrefDialog: React.FC<PrefDialogProps> = ({ onClose, configs, onConfigChange, t, locale, onLocaleChange }) => {
  const [activeTab, setActiveTab] = useState('general')

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog pref-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>{t('preferences')}</h3>
          <button className="close-btn" onClick={onClose}><IconX /></button>
        </div>
        <div className="pref-container">
          <div className="pref-sidebar">
            <div className={`pref-tab ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>
              {t('general')}
            </div>
            <div className={`pref-tab ${activeTab === 'advanced' ? 'active' : ''}`} onClick={() => setActiveTab('advanced')}>
              {t('advanced')}
            </div>
          </div>
          <div className="pref-content">
            {activeTab === 'general' && (
              <div className="pref-section">
                <div className="form-group">
                  <label>{t('language')}</label>
                  <select value={locale} onChange={(e) => onLocaleChange(e.target.value)}>
                    <option value="en">English</option>
                    <option value="zh">中文</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('theme')}</label>
                  <select value={configs.theme || 'light'} onChange={(e) => onConfigChange('theme', e.target.value)}>
                    <option value="light">{t('theme_light')}</option>
                    <option value="dark">{t('theme_dark')}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('write_mode')}</label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input type="radio" name="writeMode" value="append" checked={configs.write_mode === 'append'} onChange={() => onConfigChange('write_mode', 'append')} />
                      <span>{t('append')}</span>
                    </label>
                    <label className="radio-label">
                      <input type="radio" name="writeMode" value="overwrite" checked={configs.write_mode === 'overwrite'} onChange={() => onConfigChange('write_mode', 'overwrite')} />
                      <span>{t('overwrite')}</span>
                    </label>
                  </div>
                </div>
                <div className="form-group">
                  <label>{t('choice_mode')}</label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input type="radio" name="choiceMode" value="0" checked={configs.choice_mode === 0 || configs.choice_mode === '0'} onChange={() => onConfigChange('choice_mode', 0)} />
                      <span>{t('choice_mode_default')}</span>
                    </label>
                    <label className="radio-label">
                      <input type="radio" name="choiceMode" value="1" checked={configs.choice_mode === 1} onChange={() => onConfigChange('choice_mode', 1)} />
                      <span>{t('choice_mode_single')}</span>
                    </label>
                    <label className="radio-label">
                      <input type="radio" name="choiceMode" value="2" checked={configs.choice_mode === 2} onChange={() => onConfigChange('choice_mode', 2)} />
                      <span>{t('choice_mode_multiple')}</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'advanced' && (
              <div className="pref-section">
                <div className="form-group">
                  <label>{t('commands_title')}</label>
                  <textarea
                    value={configs.cmd_after_hosts_apply || ''}
                    onChange={(e) => onConfigChange('cmd_after_hosts_apply', e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={configs.remove_duplicate_records} onChange={(e) => onConfigChange('remove_duplicate_records', e.target.checked)} />
                    <span>{t('remove_duplicate_records')}</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="dialog-footer">
          <button className="btn primary" onClick={onClose}>{t('close')}</button>
        </div>
      </div>
    </div>
  )
}

// History Dialog
interface HistoryDialogProps {
  onClose: () => void
  t: (key: string) => string
}

const HistoryDialog: React.FC<HistoryDialogProps> = ({ onClose, t }) => {
  const [history, setHistory] = useState<HostsHistoryObject[]>([])
  const [selectedHistory, setSelectedHistory] = useState<HostsHistoryObject | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const list = await (App.GetHistoryList() as Promise<HostsHistoryObject[]>)
      setHistory(list || [])
      if (list && list.length > 0) {
        setSelectedHistory(list[list.length - 1])
      }
    } catch (err) {
      console.error('Failed to load history:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (ms: number) => {
    return new Date(ms).toLocaleString()
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog history-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3><IconHistory /> {t('system_hosts_history')}</h3>
          <button className="close-btn" onClick={onClose}><IconX /></button>
        </div>
        <div className="history-container">
          <div className="history-list">
            {loading ? (
              <div className="loading">{t('loading')}</div>
            ) : history.length === 0 ? (
              <div className="empty">{t('no_record')}</div>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  className={`history-item ${selectedHistory?.id === item.id ? 'selected' : ''}`}
                  onClick={() => setSelectedHistory(item)}
                >
                  <div className="history-time">{formatDate(item.add_time_ms)}</div>
                  <div className="history-info">{item.content.split('\n').length} lines</div>
                </div>
              ))
            )}
          </div>
          <div className="history-preview">
            <textarea readOnly value={selectedHistory?.content || ''} />
          </div>
        </div>
        <div className="dialog-footer">
          <button className="btn" onClick={onClose}>{t('close')}</button>
        </div>
      </div>
    </div>
  )
}

// About Dialog
interface AboutDialogProps {
  onClose: () => void
  t: (key: string) => string
}

const AboutDialog: React.FC<AboutDialogProps> = ({ onClose, t }) => {
  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog about-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>{t('about')}</h3>
          <button className="close-btn" onClick={onClose}><IconX /></button>
        </div>
        <div className="about-content">
          <div className="about-logo">{getItemIcon('file')}</div>
          <h2>SwitchHosts</h2>
          <p>Version 1.0.0</p>
          <p className="about-desc">{t('about_desc') || 'A hosts management tool'}</p>
        </div>
        <div className="dialog-footer">
          <button className="btn primary" onClick={onClose}>{t('close')}</button>
        </div>
      </div>
    </div>
  )
}

// Main App Component
function AppComponent() {
  const [hostsData, setHostsData] = useState<HostsBasicData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [status, setStatus] = useState('')
  const [theme, setTheme] = useState('light')
  const [locale, setLocale] = useState('en')
  const [configs, setConfigs] = useState<Record<string, any>>({})
  const [i18n, setI18n] = useState<Record<string, string>>({})
  const [leftPanelShow, setLeftPanelShow] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [showTrashcan, setShowTrashcan] = useState(false)
  const [trashcanItems, setTrashcanItems] = useState<TrashcanObject[]>([])
  const [trashMap, setTrashMap] = useState<Map<string, TrashcanObject>>(new Map())
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 })
  const [contextMenuItem, setContextMenuItem] = useState<HostsListObject | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editItem, setEditItem] = useState<HostsListObject | null>(null)
  const [isAddMode, setIsAddMode] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [dragSourceId, setDragSourceId] = useState<string | null>(null)
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)
  const [dropWhere, setDropWhere] = useState<string | null>(null)

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedContentRef = useRef<string>('')

  const t = useCallback((key: string): string => {
    return i18n[key] || key
  }, [i18n])

  // Auto-save effect
  useEffect(() => {
    if (content === lastSavedContentRef.current) return
    if (selectedId === null) return // System hosts, skip auto-save for now

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    saveTimerRef.current = setTimeout(async () => {
      const idToSave = selectedId || '0'
      try {
        await (App.SetHostsContent(idToSave, content) as Promise<void>)
        lastSavedContentRef.current = content
        setStatus(t('success'))
        setTimeout(() => setStatus(''), 2000)
      } catch (err) {
        console.error('Auto-save error:', err)
      }
    }, 1000)

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [content, selectedId, t])

  useEffect(() => {
    init()
  }, [])

  useEffect(() => {
    document.body.className = `theme-${theme}`
  }, [theme])

  const init = async () => {
    try {
      const [data, cfg, i18nData, loc] = await Promise.all([
        App.GetBasicData() as Promise<HostsBasicData>,
        App.GetAllConfig() as Promise<Record<string, any>>,
        App.GetI18n() as Promise<Record<string, string>>,
        App.GetLocale() as Promise<string>,
      ])
      setHostsData(data)
      setConfigs(cfg)
      setI18n(i18nData)
      setLocale(loc)
      setTheme(cfg.theme || 'light')
      setLeftPanelShow(cfg.left_panel_show !== false)
      setSelectedId(null)
      loadContent('0')
      setLoading(false)
    } catch (err) {
      console.error('Init error:', err)
      setStatus(`Error: ${err}`)
      setLoading(false)
    }
  }

  const loadContent = async (id: string) => {
    try {
      const content = await (App.GetHostsContent(id) as Promise<string>)
      setContent(content)
    } catch (err) {
      console.error('Failed to get content:', err)
    }
  }

  const flattenIds = (list: HostsListObject[]): string[] => {
    let ids: string[] = []
    for (const item of list) {
      ids.push(item.id)
      if (item.children) {
        ids = ids.concat(flattenIds(item.children))
      }
    }
    return ids
  }

  const handleSelect = (id: string, shiftKey?: boolean, metaKey?: boolean) => {
    if (metaKey) {
      setSelectedIds(prev => {
        if (prev.includes(id)) {
          return prev.filter(i => i !== id)
        } else {
          return [...prev, id]
        }
      })
    } else if (shiftKey && selectedIds.length > 0) {
      const flatIds = flattenIds(hostsData?.list || [])
      const lastSelected = selectedIds[selectedIds.length - 1]
      const lastIdx = flatIds.indexOf(lastSelected)
      const currentIdx = flatIds.indexOf(id)
      const start = Math.min(lastIdx, currentIdx)
      const end = Math.max(lastIdx, currentIdx)
      setSelectedIds(flatIds.slice(start, end + 1))
    } else {
      setSelectedIds([id])
    }
    setSelectedId(id)
    loadContent(id)
    setShowAddMenu(false)
    setShowContextMenu(false)
  }

  const handleSelectSystemHosts = () => {
    setSelectedId(null)
    setSelectedIds([])
    loadContent('0')
  }

  const handleToggle = async (id: string, on: boolean) => {
    try {
      await App.ToggleItem(id, on)
      const data = await (App.GetBasicData() as Promise<HostsBasicData>)
      setHostsData(data)
      // Apply hosts changes immediately
      const result = await (App.ApplyHosts() as Promise<OperationResult>)
      if (result.success) {
        setStatus(t('hosts_updated'))
        setTimeout(() => setStatus(''), 2000)
      } else {
        setStatus(result.message || t('fail'))
      }
    } catch (err) {
      console.error('Toggle error:', err)
    }
  }

  const handleToggleFolder = (item: HostsListObject) => {
    if ((item.type === 'folder' || item.type === 'group') && hostsData) {
      item.folder_open = !item.folder_open
      setHostsData({ ...hostsData })
    }
  }

  const handleEdit = (item: HostsListObject) => {
    setEditItem(item)
    setIsAddMode(false)
    setShowEditDialog(true)
    setShowContextMenu(false)
  }

  const handleApplyHosts = async () => {
    if (!hostsData) return
    setStatus(t('loading'))
    try {
      const result = await (App.ApplyHosts() as Promise<OperationResult>)
      if (result.success) {
        setStatus(t('hosts_updated'))
      } else {
        setStatus(result.message || t('fail'))
      }
    } catch (err) {
      setStatus(`Error: ${err}`)
    }
  }

  const handleAddItem = async (type: string) => {
    setEditItem({
      id: '',
      title: t('untitled'),
      type: type as HostsListObject['type'],
      on: false,
    })
    setIsAddMode(true)
    setShowEditDialog(true)
    setShowAddMenu(false)
  }

  const handleSaveEditItem = async (item: HostsListObject) => {
    try {
      if (isAddMode) {
        await (App.AddItem('', item as any) as Promise<void>)
      } else {
        await (App.UpdateItem(item as any) as Promise<void>)
      }
      const data = await (App.GetBasicData() as Promise<HostsBasicData>)
      setHostsData(data)
      setShowEditDialog(false)
      handleSelect(item.id)
    } catch (err) {
      console.error('Save item error:', err)
    }
  }

  const handleMoveToTrashcan = async (id?: string) => {
    const idsToTrash = id ? [id] : selectedIds
    try {
      for (const id of idsToTrash) {
        await (App.MoveToTrashcan(id) as Promise<void>)
      }
      const data = await (App.GetBasicData() as Promise<HostsBasicData>)
      setHostsData(data)
      handleSelectSystemHosts()
      setStatus(t('success'))
      setSelectedIds([])
    } catch (err) {
      setStatus(`Error: ${err}`)
    }
  }

  const handleOpenTrashcan = async () => {
    try {
      const list = await (App.GetTrashcanList() as Promise<TrashcanObject[]>)
      setTrashcanItems(list)
      const map = new Map<string, TrashcanObject>()
      list.forEach(item => {
        if (item.data?.id) map.set(item.data.id, item)
      })
      setTrashMap(map)
      setShowTrashcan(true)
    } catch (err) {
      console.error('Open trashcan error:', err)
    }
  }

  const handleRestoreItem = async (id: string) => {
    try {
      await (App.RestoreFromTrashcan(id) as Promise<void>)
      const list = await (App.GetTrashcanList() as Promise<TrashcanObject[]>)
      setTrashcanItems(list)
      const data = await (App.GetBasicData() as Promise<HostsBasicData>)
      setHostsData(data)
      setStatus(t('restore') + ': ' + t('success'))
    } catch (err) {
      setStatus(`Error: ${err}`)
    }
  }

  const handleDeleteFromTrashcan = async (id: string) => {
    try {
      await (App.DeleteFromTrashcan(id) as Promise<void>)
      const list = await (App.GetTrashcanList() as Promise<TrashcanObject[]>)
      setTrashcanItems(list)
    } catch (err) {
      setStatus(`Error: ${err}`)
    }
  }

  const handleClearTrashcan = async () => {
    try {
      await (App.ClearTrashcan() as Promise<void>)
      setTrashcanItems([])
      setStatus(t('trashcan_clear') + ': ' + t('success'))
    } catch (err) {
      setStatus(`Error: ${err}`)
    }
  }

  const handleConfigChange = async (key: string, value: any) => {
    try {
      await (App.SetConfig(key, value) as Promise<void>)
      setConfigs({ ...configs, [key]: value })
      if (key === 'locale') {
        setLocale(value)
        const i18nData = await (App.GetI18n() as Promise<Record<string, string>>)
        setI18n(i18nData)
      }
      if (key === 'theme') {
        setTheme(value)
      }
    } catch (err) {
      console.error('Config change error:', err)
    }
  }

  const handleContextMenu = (e: React.MouseEvent, item: HostsListObject) => {
    e.preventDefault()
    setContextMenuPos({ x: e.clientX, y: e.clientY })
    setContextMenuItem(item)
    setShowContextMenu(true)
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDragSourceId(id)
  }

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    if (!dragSourceId || dragSourceId === id) return

    setDropTargetId(id)
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    const y = e.clientY - rect.top
    const h = rect.height
    const h4 = h / 4

    if (y < h4) {
      setDropWhere('before')
    } else if (y > h - h4) {
      setDropWhere('after')
    } else {
      setDropWhere('in')
    }
  }

  const handleDrop = async (e: React.DragEvent, id: string) => {
    e.preventDefault()
    if (!dragSourceId || !dropWhere) return

    try {
      await (App.MoveItem(dragSourceId, id, dropWhere) as Promise<void>)
      const data = await (App.GetBasicData() as Promise<HostsBasicData>)
      setHostsData(data)
    } catch (err) {
      console.error('Move error:', err)
    }

    setDragSourceId(null)
    setDropTargetId(null)
    setDropWhere(null)
  }

  const handleDragEnd = () => {
    setDragSourceId(null)
    setDropTargetId(null)
    setDropWhere(null)
  }

  const handleRefreshRemote = async (id: string) => {
    try {
      setStatus(t('loading'))
      const result = await (App.RefreshRemoteHosts(id) as Promise<OperationResult>)
      if (result.success) {
        setStatus(t('success'))
        const data = await (App.GetBasicData() as Promise<HostsBasicData>)
        setHostsData(data)
      } else {
        setStatus(result.message || t('fail'))
      }
    } catch (err) {
      setStatus(`Error: ${err}`)
    }
  }

  const handleExport = async () => {
    try {
      const data = await (App.ExportData() as Promise<string>)
      if (data) {
        const blob = new Blob([data], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `switchhosts_backup_${Date.now()}.json`
        a.click()
        URL.revokeObjectURL(url)
        setStatus(t('export_done'))
      }
    } catch (err) {
      setStatus(`Error: ${err}`)
    }
  }

  const handleImport = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string
          await (App.ImportData(text) as Promise<void>)
          const data = await (App.GetBasicData() as Promise<HostsBasicData>)
          setHostsData(data)
          setStatus(t('import_done'))
        } catch (err) {
          setStatus(`Error: ${err}`)
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const getCurrentItem = (): HostsListObject | null => {
    if (!hostsData) return null
    if (selectedId === null) return null
    if (!selectedId) return null
    const find = (list: HostsListObject[]): HostsListObject | null => {
      for (const item of list) {
        if (item.id === selectedId) return item
        if (item.children) {
          const found = find(item.children)
          if (found) return found
        }
      }
      return null
    }
    return find(hostsData.list)
  }

  const isReadOnly = selectedId === null || getCurrentItem()?.is_sys === true
  const isCurrentSystemHosts = selectedId === null

  const renderHostsList = () => {
    if (!hostsData?.list) return null
    return hostsData.list.map((item) => (
      <TreeNode
        key={item.id}
        data={item}
        selected={selectedId === item.id}
        onSelect={handleSelect}
        onToggle={handleToggle}
        onToggleFolder={handleToggleFolder}
        onEdit={handleEdit}
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
        dragSourceId={dragSourceId}
        dropTargetId={dropTargetId}
        dropWhere={dropWhere}
        level={0}
        trashMap={trashMap}
        selectedIds={selectedIds}
      />
    ))
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-text">{t('loading')}</div>
      </div>
    )
  }

  const currentItem = getCurrentItem()
  const lineCount = content ? content.split('\n').length : 0
  const byteCount = content ? content.length : 0

  return (
    <div id="app">
      {/* TopBar */}
      <div className="topbar">
        <div className="topbar-left">
          <button className="icon-btn" onClick={() => setLeftPanelShow(!leftPanelShow)} title="Toggle sidebar">
            {leftPanelShow ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            )}
          </button>
          <button className="icon-btn" onClick={() => setShowAddMenu(!showAddMenu)} title={t('hosts_add')} style={{ position: 'relative' }}>
            <IconPlus />
          </button>
          {showAddMenu && (
            <div className="add-menu">
              <div className="add-menu-item" onClick={() => handleAddItem('local')}>
                {getItemIcon('local')} <span>{t('local')}</span>
              </div>
              <div className="add-menu-item" onClick={() => handleAddItem('remote')}>
                {getItemIcon('remote')} <span>{t('remote')}</span>
              </div>
              <div className="add-menu-item" onClick={() => handleAddItem('folder')}>
                {getItemIcon('folder')} <span>{t('folder')}</span>
              </div>
              <div className="add-menu-item" onClick={() => handleAddItem('group')}>
                {getItemIcon('group')} <span>{t('group')}</span>
              </div>
            </div>
          )}
          <button className="icon-btn" onClick={handleExport} title={t('export')}>
            <IconUpload />
          </button>
          <button className="icon-btn" onClick={handleImport} title={t('import')}>
            <IconDownload />
          </button>
          <button className="icon-btn" onClick={() => setShowAbout(true)} title={t('about')}>
            <IconInfo />
          </button>
        </div>

        <div className="topbar-title">
          <span className="hosts-icon">
            {isCurrentSystemHosts ? getItemIcon('system') : getItemIcon(currentItem?.type || 'file')}
          </span>
          <span className="hosts-title">
            {isCurrentSystemHosts ? t('system_hosts') : (currentItem?.title || t('system_hosts'))}
          </span>
          {isReadOnly && <span className="read-only-badge">{t('read_only')}</span>}
        </div>

        <div className="topbar-right">
          <button className="icon-btn" onClick={() => setShowHistory(true)} title={t('show_history')}>
            <IconHistory />
          </button>
          <button className="icon-btn" onClick={handleOpenTrashcan} title={t('trashcan')}>
            <IconTrash />
          </button>
          <button className="icon-btn" onClick={() => setShowSettings(true)} title={t('settings')}>
            <IconSettings />
          </button>
        </div>
      </div>

      <div className="main-container">
        {/* Left Panel */}
        <div className={`left-panel ${leftPanelShow ? '' : 'hidden'}`}>
          <div className="left-panel-content">
            {/* System Hosts */}
            <div
              className={`system-hosts-item ${isCurrentSystemHosts ? 'selected' : ''}`}
              onClick={handleSelectSystemHosts}
            >
              <span className="icon">{getItemIcon('system')}</span>
              <span className="text">{t('system_hosts')}</span>
            </div>

            {renderHostsList()}

            {/* Trashcan indicator */}
            {hostsData?.trashcan && hostsData.trashcan.length > 0 && (
              <div className="trashcan-indicator" onClick={handleOpenTrashcan}>
                <IconTrash /> {t('trashcan')} ({hostsData.trashcan.length})
              </div>
            )}
          </div>
        </div>

        {/* Main Panel */}
        <div className={`main-panel ${leftPanelShow ? '' : 'expanded'}`}>
          {/* Editor */}
          <div className="editor-container">
            <HostsEditor
              content={content}
              onChange={setContent}
              readOnly={isReadOnly}
            />
          </div>

          {/* Status Bar */}
          <div className="statusbar">
            <span>{lineCount} {lineCount > 1 ? t('lines') : t('line')}</span>
            <span>{byteCount} bytes</span>
            <span className="right">{isReadOnly ? t('read_only') : ''}</span>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {showContextMenu && contextMenuItem && (
        <ContextMenu
          x={contextMenuPos.x}
          y={contextMenuPos.y}
          item={contextMenuItem}
          onClose={() => setShowContextMenu(false)}
          onEdit={() => handleEdit(contextMenuItem)}
          onMoveToTrashcan={() => handleMoveToTrashcan(contextMenuItem.id)}
          onRefresh={() => handleRefreshRemote(contextMenuItem.id)}
          onToggle={() => handleToggle(contextMenuItem.id, !contextMenuItem.on)}
          isOn={contextMenuItem.on || false}
        />
      )}

      {/* Edit Dialog */}
      {showEditDialog && editItem && (
        <EditDialog
          item={editItem}
          isAdd={isAddMode}
          onClose={() => setShowEditDialog(false)}
          onSave={handleSaveEditItem}
          onMoveToTrashcan={handleMoveToTrashcan}
          t={t}
        />
      )}

      {/* Preferences Dialog */}
      {showSettings && (
        <PrefDialog
          onClose={() => setShowSettings(false)}
          configs={configs}
          onConfigChange={handleConfigChange}
          t={t}
          locale={locale}
          onLocaleChange={(l) => handleConfigChange('locale', l)}
        />
      )}

      {/* History Dialog */}
      {showHistory && (
        <HistoryDialog onClose={() => setShowHistory(false)} t={t} />
      )}

      {/* About Dialog */}
      {showAbout && (
        <AboutDialog onClose={() => setShowAbout(false)} t={t} />
      )}

      {/* Trashcan Dialog */}
      {showTrashcan && (
        <div className="dialog-overlay">
          <div className="dialog trashcan-dialog">
            <h3>{t('trashcan')}</h3>
            <div className="trashcan-list">
              {trashcanItems.length === 0 ? (
                <div className="empty">{t('no_record')}</div>
              ) : (
                trashcanItems.map((item) => (
                  <div key={item.data?.id || Math.random().toString()} className="trashcan-item">
                    <span>{item.data?.title || item.data?.id || 'Unknown'}</span>
                    <div className="trashcan-actions">
                      <button onClick={() => handleRestoreItem(item.data?.id || '')}>{t('restore')}</button>
                      <button onClick={() => handleDeleteFromTrashcan(item.data?.id || '')}>{t('delete')}</button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="dialog-footer">
              <button onClick={handleClearTrashcan} disabled={trashcanItems.length === 0}>
                {t('trashcan_clear')}
              </button>
              <button onClick={() => setShowTrashcan(false)}>{t('close')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Status Toast */}
      {status && (
        <div className="status-toast">{status}</div>
      )}
    </div>
  )
}

export default AppComponent