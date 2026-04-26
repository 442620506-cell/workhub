import React, { useState } from 'react'
import {
  IconChecklist, IconClose, IconImport, IconUpload, IconCheck, IconClock,
  IconInProgress, IconPending, IconTrash, IconFileSpreadsheet,
  IconPriorityHigh, IconPriorityMedium, IconPriorityLow
} from './Icons'
import './ProjectChecklist.css'

interface ChecklistItem {
  id: string
  content: string
  status: 'pending' | 'inProgress' | 'completed'
  assignee?: string
  dueDate?: string
  priority?: 'high' | 'medium' | 'low'
}

const mockChecklist: ChecklistItem[] = [
  { id: 'c1', content: '完成项目申报材料', status: 'completed', assignee: '张三', dueDate: '2026-04-25', priority: 'high' },
  { id: 'c2', content: '协调审批流程', status: 'inProgress', assignee: '李四', dueDate: '2026-04-28', priority: 'high' },
  { id: 'c3', content: '准备汇报PPT', status: 'pending', assignee: '王五', dueDate: '2026-04-30', priority: 'medium' },
  { id: 'c4', content: '整理附件资料', status: 'pending', priority: 'low' },
]

interface ProjectChecklistProps {
  projectId: string
  onClose: () => void
}

function ProjectChecklist({ projectId, onClose }: ProjectChecklistProps) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(mockChecklist)
  const [newItemContent, setNewItemContent] = useState('')
  const [showImportModal, setShowImportModal] = useState(false)

  const statusLabels = {
    pending: '待处理',
    inProgress: '进行中',
    completed: '已完成'
  }

  const statusColors = {
    pending: 'orange',
    inProgress: 'blue',
    completed: 'green'
  }

  const priorityIcons = {
    high: <IconPriorityHigh size={10} />,
    medium: <IconPriorityMedium size={10} />,
    low: <IconPriorityLow size={10} />
  }

  const priorityColors = {
    high: 'var(--danger)',
    medium: 'var(--warning)',
    low: 'var(--success)'
  }

  const statusIcons = {
    completed: <IconCheck size={16} />,
    inProgress: <IconInProgress size={16} />,
    pending: <IconPending size={16} />
  }

  const statusIconColors = {
    completed: 'var(--success)',
    inProgress: 'var(--primary)',
    pending: 'var(--warning)'
  }

  const handleAddItem = () => {
    if (newItemContent.trim()) {
      setChecklist(prev => [...prev, {
        id: `c${Date.now()}`,
        content: newItemContent,
        status: 'pending'
      }])
      setNewItemContent('')
    }
  }

  const handleToggleStatus = (id: string) => {
    setChecklist(prev => prev.map(item =>
      item.id === id ? {
        ...item,
        status: item.status === 'pending' ? 'inProgress' :
                item.status === 'inProgress' ? 'completed' : 'pending'
      } : item
    ))
  }

  const handleDeleteItem = (id: string) => {
    setChecklist(prev => prev.filter(item => item.id !== id))
  }

  // 模拟Excel导入
  const handleImportExcel = () => {
    const importedItems: ChecklistItem[] = [
      { id: `c${Date.now()}`, content: '导入任务1：审核合同', status: 'pending', priority: 'high' },
      { id: `c${Date.now()+1}`, content: '导入任务2：整理文档', status: 'pending', priority: 'medium' },
      { id: `c${Date.now()+2}`, content: '导入任务3：提交报告', status: 'pending', priority: 'low' },
    ]
    setChecklist(prev => [...prev, ...importedItems])
    setShowImportModal(false)
  }

  const pendingCount = checklist.filter(i => i.status === 'pending').length
  const inProgressCount = checklist.filter(i => i.status === 'inProgress').length
  const completedCount = checklist.filter(i => i.status === 'completed').length

  return (
    <div className="checklist-overlay" onClick={onClose}>
      <div className="checklist-modal" onClick={e => e.stopPropagation()}>
        <header className="checklist-header">
          <h2><IconChecklist size={20} /> 项目清单</h2>
          <button className="checklist-close-svg" onClick={onClose}><IconClose size={16} /></button>
        </header>

        <div className="checklist-stats">
          <span className="stat-item pending">待处理 {pendingCount}</span>
          <span className="stat-item progress">进行中 {inProgressCount}</span>
          <span className="stat-item done">已完成 {completedCount}</span>
        </div>

        <div className="checklist-actions">
          <button className="import-btn" onClick={() => setShowImportModal(true)}>
            <IconImport size={14} /> 导入Excel
          </button>
          <button className="export-btn">
            <IconUpload size={14} /> 导出Excel
          </button>
        </div>

        <div className="checklist-add">
          <input
            className="checklist-input"
            placeholder="添加新任务..."
            value={newItemContent}
            onChange={e => setNewItemContent(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAddItem() }}
          />
          <button className="add-btn" onClick={handleAddItem}>添加</button>
        </div>

        <div className="checklist-body">
          {checklist.map(item => (
            <div key={item.id} className={`checklist-row ${item.status}`}>
              <div className="row-status-svg" onClick={() => handleToggleStatus(item.id)} style={{ color: statusIconColors[item.status] }}>
                {statusIcons[item.status]}
              </div>
              <div className="row-content">
                <span className="row-text">{item.content}</span>
                <div className="row-meta">
                  {item.priority && (
                    <span className="priority-svg" style={{ color: priorityColors[item.priority] }}>
                      {priorityIcons[item.priority]}
                    </span>
                  )}
                  {item.assignee && <span className="assignee">@{item.assignee}</span>}
                  {item.dueDate && <span className="due">{item.dueDate}</span>}
                </div>
              </div>
              <button className="row-delete-svg" onClick={() => handleDeleteItem(item.id)}>
                <IconTrash size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 导入弹窗 */}
      {showImportModal && (
        <div className="import-modal" onClick={e => e.stopPropagation()}>
          <h3><IconImport size={16} /> 导入Excel清单</h3>
          <div className="import-area">
            <div className="import-drop">
              <span className="import-icon-svg"><IconFileSpreadsheet size={48} /></span>
              <span className="import-text">拖放Excel文件或点击选择</span>
              <button className="import-select-btn">选择文件</button>
            </div>
          </div>
          <div className="import-preview">
            <p className="preview-hint">预览导入数据（示例）:</p>
            <div className="preview-table">
              <div className="preview-row">
                <span>审核合同</span>
                <span>高</span>
                <span>张三</span>
              </div>
              <div className="preview-row">
                <span>整理文档</span>
                <span>中</span>
                <span>李四</span>
              </div>
            </div>
          </div>
          <div className="import-actions">
            <button className="cancel-btn" onClick={() => setShowImportModal(false)}>取消</button>
            <button className="confirm-btn" onClick={handleImportExcel}>确认导入</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectChecklist