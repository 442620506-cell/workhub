import React from 'react'
import './Sidebar.css'

type MenuItem = 'home' | 'products' | 'projects' | 'review' | 'settings'

interface SidebarProps {
  activeItem: MenuItem
  onItemChange: (item: MenuItem) => void
  isPanelOpen: boolean
  onTogglePanel: () => void
  onOpenWorkReview?: () => void
  onOpenSettings?: () => void
}

// SVG图标组件 - VS Code风格
const Icons = {
  Home: () => (
    <svg viewBox="0 0 24 24">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9,22 9,12 15,12 15,22" />
    </svg>
  ),
  Todo: () => (
    <svg viewBox="0 0 24 24">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  Files: () => (
    <svg viewBox="0 0 24 24">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Products: () => (
    <svg viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  Review: () => (
    <svg viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
}

function Sidebar({ activeItem, onItemChange, isPanelOpen, onTogglePanel }: SidebarProps) {
  const topItems = [
    { id: 'home' as MenuItem, icon: Icons.Home, title: '首页' },
    { id: 'products' as MenuItem, icon: Icons.Products, title: '产品' },
    { id: 'projects' as MenuItem, icon: Icons.Files, title: '项目' },
    { id: 'review' as MenuItem, icon: Icons.Review, title: '复盘' },
  ]

  const bottomItems = [
    { id: 'settings' as MenuItem, icon: Icons.Settings, title: '设置' },
  ]

  const handleClick = (item: MenuItem) => {
    if (activeItem === item && isPanelOpen) {
      onTogglePanel()
    } else {
      onItemChange(item)
      if (!isPanelOpen) {
        onTogglePanel()
      }
    }
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        {topItems.map(item => (
          <button
            key={item.id}
            className={`sidebar-item ${activeItem === item.id ? 'active selected' : ''}`}
            onClick={() => handleClick(item.id)}
            title={item.title}
          >
            <span className="sidebar-icon">
              <item.icon />
            </span>
          </button>
        ))}
      </div>
      <div className="sidebar-bottom">
        {bottomItems.map(item => (
          <button
            key={item.id}
            className={`sidebar-item ${activeItem === item.id ? 'active selected' : ''}`}
            onClick={() => handleClick(item.id)}
            title={item.title}
          >
            <span className="sidebar-icon">
              <item.icon />
            </span>
          </button>
        ))}
      </div>
    </aside>
  )
}

export default Sidebar