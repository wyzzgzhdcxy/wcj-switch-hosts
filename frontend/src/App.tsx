import React, { useState, useEffect, useCallback, useRef } from 'react'
import * as App from '../wailsjs/go/main/App'
import { hosts } from '../wailsjs/go/models'

// Icons as simple SVG components (matching wcj-switch-hosts ItemIcon)
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

const IconFolder = ({ open }: { open?: boolean }) => (
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

// Get icon by type (matching wcj-switch-hosts ItemIcon)
const getItemIcon = (type: string, isCollapsed?: boolean) => {
  switch (type) {
    case 'folder':
      return <IconFolder open={!isCollapsed} />
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
  data: hosts.HostsListObject
  selected: boolean
  onSelect: (id: string) => void
  onToggle: (id: string, on: boolean) => void
  onToggleFolder: (item: hosts.HostsListObject) => void
  onEdit: (item: hosts.HostsListObject) => void
  level: number
  isTrash?: boolean
  trashMap?: Map<string, hosts.TrashcanObject>
}

const TreeNode: React.FC<TreeNodeProps> = ({
  data, selected, onSelect, onToggle, onToggleFolder, onEdit, level, isTrash, trashMap
}) => {
  const isFolder = data.type === 'folder' || data.type === 'group'
  const hasChildren = data.children && data.children.length > 0
  const isInTrash = trashMap?.has(data.id)

  const handleArrowClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isFolder) {
      onToggleFolder(data)
    }
  }

  return (
    <div className="tree-node-wrapper">
      <div
        className={`tree-node ${selected ? 'selected' : ''} ${isInTrash ? 'in-trash' : ''}`}
        onClick={() => onSelect(data.id)}
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
            {getItemIcon(data.is_sys ? 'system' : (data.type || 'file'), data.folder_open)}
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
          level={level + 1}
          isTrash={isTrash}
          trashMap={trashMap}
        />
      ))}
    </div>
  )
}

function AppComponent() {
  const [hostsData, setHostsData] = useState<hosts.HostsBasicData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [theme, setTheme] = useState('light')
  const [locale, setLocale] = useState('en')
  const [configs, setConfigs] = useState<Record<string, any>>({})
  const [i18n, setI18n] = useState<Record<string, string>>({})
  const [leftPanelShow, setLeftPanelShow] = useState(true)
  const [leftPanelWidth] = useState(270)
  const [showSettings, setShowSettings] = useState(false)
  const [showTrashcan, setShowTrashcan] = useState(false)
  const [trashcanItems, setTrashcanItems] = useState<hosts.TrashcanObject[]>([])
  const [trashMap, setTrashMap] = useState<Map<string, hosts.TrashcanObject>>(new Map())
  const [showAddMenu, setShowAddMenu] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const t = useCallback((key: string) => i18n[key] || key, [i18n])

  useEffect(() => {
    init()
  }, [])

  useEffect(() => {
    document.body.className = `theme-${theme}`
  }, [theme])

  const init = async () => {
    try {
      const [data, cfg, i18nData, loc] = await Promise.all([
        App.GetBasicData(),
        App.GetAllConfig(),
        App.GetI18n(),
        App.GetLocale(),
      ])
      const hostsBasicData = hosts.HostsBasicData.createFrom(data)
      setHostsData(hostsBasicData)
      setConfigs(cfg)
      setI18n(i18nData)
      setLocale(loc)
      setTheme(cfg.theme || 'light')
      setLeftPanelShow(cfg.left_panel_show !== false)

      // Select system hosts by default (null means system hosts)
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
      const content = await App.GetHostsContent(id)
      setContent(content)
    } catch (err) {
      console.error('Failed to get content:', err)
    }
  }

  const handleSelect = (id: string) => {
    setSelectedId(id)
    loadContent(id)
    setShowAddMenu(false)
  }

  const handleSelectSystemHosts = () => {
    setSelectedId(null)  // null means system hosts
    loadContent('0')
  }

  const handleToggle = async (id: string, on: boolean) => {
    try {
      await App.ToggleItem(id, on)
      const data = await App.GetBasicData()
      setHostsData(hosts.HostsBasicData.createFrom(data))
    } catch (err) {
      console.error('Toggle error:', err)
    }
  }

  const handleToggleFolder = (item: hosts.HostsListObject) => {
    if (item.type === 'folder' && hostsData) {
      item.folder_open = !item.folder_open
      setHostsData(hosts.HostsBasicData.createFrom({
        list: hostsData.list,
        trashcan: hostsData.trashcan,
        version: hostsData.version
      }))
    }
  }

  const handleEdit = (item: hosts.HostsListObject) => {
    // For now, just select the item - edit dialog can be added later
    handleSelect(item.id)
  }

  const handleSaveContent = async () => {
    const idToSave = selectedId === null ? '0' : selectedId
    if (!idToSave) return
    setSaving(true)
    try {
      await App.SetHostsContent(idToSave, content)
      setStatus(t('success'))
      setTimeout(() => setStatus(''), 2000)
    } catch (err) {
      setStatus(`Error: ${err}`)
    } finally {
      setSaving(false)
    }
  }

  const handleApplyHosts = async () => {
    if (!hostsData) return
    setSaving(true)
    setStatus(t('loading'))
    try {
      let finalContent = ''
      const collectContent = async (items: hosts.HostsListObject[]) => {
        for (const item of items) {
          if (item.on) {
            const itemContent = await App.GetHostsContent(item.id)
            if (itemContent) {
              finalContent += `# === ${item.title || item.id} ===\n${itemContent}\n\n`
            }
          }
          if (item.children) {
            await collectContent(item.children)
          }
        }
      }
      await collectContent(hostsData.list)

      const result = await App.SetSystemHosts(finalContent.trim(), '')
      if (result.success) {
        setStatus(t('hosts_updated'))
      } else {
        setStatus(result.message || t('fail'))
      }
    } catch (err) {
      setStatus(`Error: ${err}`)
    } finally {
      setSaving(false)
    }
  }

  const handleAddItem = async (type: string) => {
    const newId = `item_${Date.now()}`
    const newItem = hosts.HostsListObject.createFrom({
      id: newId,
      title: t('untitled'),
      type: type,
      on: false,
    })
    if (type === 'folder') {
      newItem.children = []
      newItem.folder_open = true
    }
    try {
      await App.AddItem('', newItem)
      const data = await App.GetBasicData()
      setHostsData(hosts.HostsBasicData.createFrom(data))
      handleSelect(newId)
    } catch (err) {
      console.error('Add item error:', err)
    }
    setShowAddMenu(false)
  }

  const handleDeleteItem = async () => {
    if (!selectedId) return
    try {
      await App.MoveToTrashcan(selectedId)
      const data = await App.GetBasicData()
      setHostsData(hosts.HostsBasicData.createFrom(data))
      handleSelectSystemHosts()
      setStatus(t('success'))
    } catch (err) {
      setStatus(`Error: ${err}`)
    }
  }

  const handleOpenTrashcan = async () => {
    try {
      const list = await App.GetTrashcanList()
      const items = list.map((item: any) => hosts.TrashcanObject.createFrom(item))
      setTrashcanItems(items)
      const map = new Map<string, hosts.TrashcanObject>()
      items.forEach(item => {
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
      await App.RestoreFromTrashcan(id)
      const list = await App.GetTrashcanList()
      setTrashcanItems(list.map((item: any) => hosts.TrashcanObject.createFrom(item)))
      const data = await App.GetBasicData()
      setHostsData(hosts.HostsBasicData.createFrom(data))
      setStatus(t('restore') + ': ' + t('success'))
    } catch (err) {
      setStatus(`Error: ${err}`)
    }
  }

  const handleDeleteFromTrashcan = async (id: string) => {
    try {
      await App.DeleteItem(id)
      const list = await App.GetTrashcanList()
      setTrashcanItems(list.map((item: any) => hosts.TrashcanObject.createFrom(item)))
    } catch (err) {
      setStatus(`Error: ${err}`)
    }
  }

  const handleClearTrashcan = async () => {
    try {
      await App.ClearTrashcan()
      setTrashcanItems([])
      setStatus(t('trashcan_clear') + ': ' + t('success'))
    } catch (err) {
      setStatus(`Error: ${err}`)
    }
  }

  const handleConfigChange = async (key: string, value: any) => {
    try {
      await App.SetConfig(key, value)
      setConfigs({ ...configs, [key]: value })
      if (key === 'locale') {
        setLocale(value)
        const i18nData = await App.GetI18n()
        setI18n(i18nData)
      }
      if (key === 'theme') {
        setTheme(value)
      }
    } catch (err) {
      console.error('Config change error:', err)
    }
  }

  const getCurrentItem = (): hosts.HostsListObject | null => {
    if (!hostsData) return null
    if (selectedId === null) {
      return null  // System hosts
    }
    if (!selectedId) return null
    const find = (list: hosts.HostsListObject[]): hosts.HostsListObject | null => {
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

  const isReadOnly = selectedId === null || getCurrentItem()?.is_sys
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
        level={0}
        trashMap={trashMap}
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
          <button className="icon-btn" onClick={handleOpenTrashcan} title={t('trashcan')}>
            <IconTrash />
          </button>
          <button className="icon-btn" onClick={() => setShowSettings(!showSettings)} title={t('settings')}>
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
          {/* Toolbar */}
          <div className="toolbar">
            <button onClick={handleSaveContent} disabled={saving || isReadOnly}>
              {t('save')}
            </button>
            <button onClick={handleApplyHosts} disabled={saving} className="primary">
              {t('apply')}
            </button>
            <div style={{ flex: 1 }} />
            {selectedId && (
              <button onClick={handleDeleteItem} className="danger">
                {t('delete')}
              </button>
            )}
          </div>

          {/* Editor */}
          <div className="editor-container">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('type_hosts_content')}
              className={`hosts-editor ${isReadOnly ? 'read-only' : ''}`}
              spellCheck={false}
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

      {/* Settings Panel */}
      {showSettings && (
        <div className="settings-overlay" onClick={() => setShowSettings(false)}>
          <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
            <div className="settings-header">
              <IconSettings />
              <h3>{t('preferences')}</h3>
            </div>

            <div className="settings-content">
              <div className="settings-section">
                <label>{t('language')}</label>
                <select value={locale} onChange={(e) => handleConfigChange('locale', e.target.value)}>
                  <option value="en">English</option>
                  <option value="zh">中文</option>
                </select>
              </div>

              <div className="settings-section">
                <label>{t('theme')}</label>
                <select value={theme} onChange={(e) => handleConfigChange('theme', e.target.value)}>
                  <option value="light">{t('theme_light')}</option>
                  <option value="dark">{t('theme_dark')}</option>
                </select>
              </div>

              <div className="settings-section">
                <label>{t('write_mode')}</label>
                <select
                  value={configs.write_mode || 'append'}
                  onChange={(e) => handleConfigChange('write_mode', e.target.value)}
                >
                  <option value="append">{t('append')}</option>
                  <option value="overwrite">{t('overwrite')}</option>
                </select>
              </div>

              <div className="settings-section">
                <label>{t('choice_mode')}</label>
                <select
                  value={configs.choice_mode || 2}
                  onChange={(e) => handleConfigChange('choice_mode', parseInt(e.target.value))}
                >
                  <option value="0">{t('choice_mode_default')}</option>
                  <option value="1">{t('choice_mode_single')}</option>
                  <option value="2">{t('choice_mode_multiple')}</option>
                </select>
              </div>
            </div>

            <div className="settings-footer">
              <button onClick={() => setShowSettings(false)}>
                {t('close')}
              </button>
            </div>
          </div>
        </div>
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