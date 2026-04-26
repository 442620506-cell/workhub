import React, { useState } from 'react'
import { IconEdit, IconTodo, IconFolder, IconSettings, IconClose } from './Icons'
import './HeaderBar.css'

interface HeaderBarProps {
  onNewRecord?: () => void
  onOpenTodo?: () => void
  onOpenFiles?: () => void
  onOpenSettings?: () => void
}

function HeaderBar({ onNewRecord, onOpenTodo, onOpenFiles, onOpenSettings }: HeaderBarProps) {
  const [isInputVisible, setInputVisible] = useState(false)
  const [inputContent, setInputContent] = useState('')

  const handleAddRecord = () => {
    setInputVisible(true)
  }

  const handleContentSubmit = () => {
    if (inputContent.trim()) {
      console.log('提交内容:', inputContent)
      setInputContent('')
      setInputVisible(false)
    }
  }

  return (
    <header className="header-bar">
      {/* 功能按钮区 - 居中 */}
      <div className="header-actions">
        <button className="header-btn" onClick={handleAddRecord}>
          <span className="btn-icon-svg"><IconEdit size={16} /></span>
          新建记录
        </button>
        <button className="header-btn" onClick={onOpenTodo}>
          <span className="btn-icon-svg"><IconTodo size={16} /></span>
          待办
        </button>
        <button className="header-btn" onClick={onOpenFiles}>
          <span className="btn-icon-svg"><IconFolder size={16} /></span>
          文件
        </button>
        <button className="header-btn" onClick={onOpenSettings}>
          <span className="btn-icon-svg"><IconSettings size={16} /></span>
          设置
        </button>
      </div>

      {/* 内容输入区 */}
      {isInputVisible && (
        <div className="input-panel">
          <div className="input-panel-header">
            <span className="input-panel-title">新建记录</span>
            <button className="close-btn-svg" onClick={() => setInputVisible(false)}><IconClose size={16} /></button>
          </div>
          <textarea
            className="input-textarea"
            placeholder="在此输入内容，支持粘贴会议纪要、任务描述等..."
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            autoFocus
          />
          <div className="input-panel-actions">
            <button className="btn btn-secondary" onClick={() => setInputVisible(false)}>取消</button>
            <button className="btn btn-primary" onClick={handleContentSubmit}>创建</button>
          </div>
        </div>
      )}
    </header>
  )
}

export default HeaderBar