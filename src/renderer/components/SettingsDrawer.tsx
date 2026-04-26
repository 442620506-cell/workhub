import { useState } from 'react'
import { IconClose, IconSettings, IconRefresh } from './Icons'
import { defaultConfig, Product, ProjectWithFiles } from '../types'
import DirectoryTree from './DirectoryTree'
import './SettingsDrawer.css'
import './PanelFull.css'

type SettingsTab = 'storage' | 'structure' | 'theme' | 'ai' | 'backup'

interface SettingsDrawerProps {
  onClose?: () => void
  activeTab?: SettingsTab
  products?: Product[]
  projects?: ProjectWithFiles[]
  onSelectProduct?: (id: string) => void
  onSelectProject?: (id: string) => void
  onRefreshScan?: () => Promise<boolean>
}

function SettingsDrawer({ onClose, activeTab = 'storage', products = [], projects = [], onSelectProduct, onSelectProject, onRefreshScan }: SettingsDrawerProps) {
  const [basePath, setBasePath] = useState(defaultConfig.basePath)
  const [defaultFolders, setDefaultFolders] = useState(defaultConfig.defaultFolders.join(', '))
  const [theme, setTheme] = useState('light')
  const [currentTab, setCurrentTab] = useState<SettingsTab>(activeTab)

  const tabs: { key: SettingsTab; label: string }[] = [
    { key: 'storage', label: '存储' },
    { key: 'structure', label: '目录结构' },
    { key: 'theme', label: '主题' },
    { key: 'ai', label: 'AI' },
    { key: 'backup', label: '备份' },
  ]

  return (
    <div className="panel-full">
      <header className="panel-full-header">
        <h2 className="panel-full-title"><IconSettings size={20} /> 设置</h2>
        <button className="panel-full-close" onClick={onClose}><IconClose size={16} /></button>
      </header>

      {/* Tab 切换 */}
      <div className="settings-tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`settings-tab-btn ${currentTab === tab.key ? 'active' : ''}`}
            onClick={() => setCurrentTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="panel-full-body sd-content">
          {currentTab === 'storage' && (
          <div className="settings-section">
            <h4 className="settings-section-title">文件存储</h4>
            <div className="settings-item">
              <span className="settings-label">基础路径</span>
              <div className="settings-path-row">
                <input
                  type="text"
                  className="settings-input-path"
                  value={basePath}
                  onChange={(e) => setBasePath(e.target.value)}
                  placeholder="如：D:/WorkDocuments"
                />
                <button className="btn btn-secondary btn-sm">选择</button>
              </div>
              <div className="settings-hint">项目文件夹将按：{basePath}/项目/{'{年份}/{网省}/{项目名}'}` 结构创建</div>
            </div>
            <div className="settings-item">
              <span className="settings-label">默认子文件夹</span>
              <input
                type="text"
                className="settings-input"
                value={defaultFolders}
                onChange={(e) => setDefaultFolders(e.target.value)}
                placeholder="汇报材料, 申报材料, 历史文件"
              />
              <div className="settings-hint">用逗号分隔多个文件夹名称</div>
            </div>
          </div>
          )}

          {currentTab === 'structure' && (
          <div className="settings-section structure-section">
            <div className="structure-header">
              <h4 className="settings-section-title">目录结构</h4>
              {onRefreshScan && (
                <button className="btn btn-secondary btn-sm refresh-btn" onClick={onRefreshScan}>
                  <IconRefresh size={14} />
                  刷新扫描
                </button>
              )}
            </div>
            <div className="directory-tree-wrapper">
              <DirectoryTree
                basePath={basePath}
                products={products}
                projects={projects}
                onSelectProduct={onSelectProduct || (() => {})}
                onSelectProject={onSelectProject || (() => {})}
              />
            </div>
          </div>
          )}

          {currentTab === 'theme' && (
          <div className="settings-section">
            <h4 className="settings-section-title">外观主题</h4>
            <div className="settings-item">
              <span className="settings-label">外观主题</span>
              <select className="settings-select" value={theme} onChange={e => setTheme(e.target.value)}>
                <option value="light">浅色</option>
                <option value="dark">深色</option>
                <option value="auto">跟随系统</option>
              </select>
            </div>
          </div>
          )}

          {currentTab === 'ai' && (
          <div className="settings-section">
            <h4 className="settings-section-title">AI 模型</h4>
            <div className="settings-item">
              <span className="settings-label">AI 模型配置</span>
              <button className="btn btn-secondary btn-sm">配置</button>
            </div>
          </div>
          )}

          {currentTab === 'backup' && (
          <div className="settings-section">
            <h4 className="settings-section-title">数据备份</h4>
            <div className="settings-item">
              <span className="settings-label">数据备份</span>
              <div className="settings-actions">
                <button className="btn btn-secondary btn-sm">导出</button>
                <button className="btn btn-secondary btn-sm">导入</button>
              </div>
            </div>
          </div>
          )}
        </div>
    </div>
  )
}

export default SettingsDrawer