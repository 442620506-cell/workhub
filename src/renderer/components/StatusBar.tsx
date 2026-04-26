import React from 'react'
import './StatusBar.css'

interface StatusBarProps {
  projectCount?: number
  currentView?: string
  branch?: string
  version?: string
}

const Icons = {
  Branch: () => (
    <svg viewBox="0 0 24 24">
      <path d="M6 3v12" />
      <path d="M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
      <path d="M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
      <path d="M6 12a3 3 0 0 0 3 3h3a3 3 0 0 1 3 3" />
    </svg>
  ),
  Folder: () => (
    <svg viewBox="0 0 24 24">
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.5L9 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
}

function StatusBar({
  projectCount = 0,
  currentView = '项目视图',
  branch = 'main',
  version = 'v1.0.0'
}: StatusBarProps) {
  const currentTime = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

  return (
    <footer className="status-bar">
      {/* 左侧区域 */}
      <div className="status-bar-left">
        <div className="status-bar-item" title="当前分支">
          <span className="status-bar-item-icon"><Icons.Branch /></span>
          <span>{branch}</span>
        </div>
        <div className="status-bar-divider" />
        <div className="status-bar-item" title="项目数量">
          <span className="status-bar-item-icon"><Icons.Folder /></span>
          <span>{projectCount} 个项目</span>
        </div>
        <div className="status-bar-divider" />
        <div className="status-bar-item active" title="当前视图">
          <span>{currentView}</span>
        </div>
      </div>

      {/* 右侧区域 */}
      <div className="status-bar-right">
        <div className="status-bar-item success" title="同步状态">
          <span className="status-bar-item-icon"><Icons.Check /></span>
          <span>已同步</span>
        </div>
        <div className="status-bar-divider" />
        <div className="status-bar-item" title="当前时间">
          <span className="status-bar-item-icon"><Icons.Clock /></span>
          <span>{currentTime}</span>
        </div>
        <div className="status-bar-divider" />
        <span className="status-bar-version">{version}</span>
      </div>
    </footer>
  )
}

export default StatusBar