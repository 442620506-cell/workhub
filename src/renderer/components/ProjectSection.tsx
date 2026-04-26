import React, { useState } from 'react'
import {
  IconChevronRight, IconChevronDown, IconPlus, IconEdit, IconChecklist, IconClose
} from './Icons'
import './ProjectSection.css'

interface Project {
  id: string
  name: string
  province: string
  visible: boolean
  collapsed: boolean
}

interface WorkRecordItem {
  id: string
  date: string
  content: string
  createdAt: string
}

// 模拟记录数据
const mockRecords: WorkRecordItem[] = [
  { id: 'r1', date: '04/21', content: '完成申报材料初稿，等待审核', createdAt: '2026-04-21 10:00' },
  { id: 'r2', date: '04/21', content: '与张三沟通进度安排', createdAt: '2026-04-21 14:00' },
  { id: 'r3', date: '04/20', content: '收集项目资料，整理文件夹', createdAt: '2026-04-20 09:00' },
]

interface ProjectSectionProps {
  project: Project
  collapsed: boolean
  onToggleCollapse: () => void
}

function ProjectSection({ project, collapsed, onToggleCollapse }: ProjectSectionProps) {
  const [records, setRecords] = useState<WorkRecordItem[]>(mockRecords)
  const [isAdding, setIsAdding] = useState(false)
  const [newContent, setNewContent] = useState('')

  const handleAddRecord = () => {
    if (newContent.trim()) {
      const today = new Date()
      const dateStr = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`
      const newRecord: WorkRecordItem = {
        id: `r${Date.now()}`,
        date: dateStr,
        content: newContent,
        createdAt: new Date().toISOString(),
      }
      setRecords(prev => [newRecord, ...prev])
      setNewContent('')
      setIsAdding(false)
      // TODO: 自动解析生成任务
    }
  }

  // 按日期分组
  const groupedRecords = records.reduce((acc, record) => {
    if (!acc[record.date]) {
      acc[record.date] = []
    }
    acc[record.date].push(record)
    return acc
  }, {} as Record<string, WorkRecordItem[]>)

  const sortedDates = Object.keys(groupedRecords).sort((a, b) => {
    const [aMonth, aDay] = a.split('/')
    const [bMonth, bDay] = b.split('/')
    return new Date(2026, parseInt(bMonth) - 1, parseInt(bDay)).getTime() - new Date(2026, parseInt(aMonth) - 1, parseInt(aDay)).getTime()
  })

  return (
    <div className={`section project-section ${collapsed ? 'collapsed' : ''}`}>
      <div className="section-header" onClick={onToggleCollapse}>
        <div className="header-left">
          <span className="collapse-icon-svg">{collapsed ? <IconChevronRight size={12} /> : <IconChevronDown size={12} />}</span>
          <span className="project-name">{project.name}</span>
          <span className="project-province">{project.province}</span>
        </div>
        <div className="header-actions">
          <button className="action-btn" onClick={(e) => { e.stopPropagation(); setIsAdding(true) }}>
            <IconPlus size={12} /> 添加
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="section-content">
          {/* 新增记录输入框 */}
          {isAdding && (
            <div className="add-record-panel">
              <textarea
                className="record-input"
                placeholder="输入工作记录内容..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                autoFocus
              />
              <div className="add-actions">
                <button className="btn btn-default" onClick={() => setIsAdding(false)}>取消</button>
                <button className="btn btn-primary" onClick={handleAddRecord}>添加</button>
              </div>
            </div>
          )}

          {/* 按日期展示记录 */}
          {sortedDates.map(date => (
            <div key={date} className="date-group">
              <div className="date-label">
                <span>{date}</span>
                <span className="weekday">{getWeekday(date)}</span>
              </div>
              <div className="records-list">
                {groupedRecords[date].map(record => (
                  <div key={record.id} className="record-item">
                    <div className="record-content">{record.content}</div>
                    <div className="record-actions">
                      <button className="record-btn-svg" title="编辑"><IconEdit size={12} /></button>
                      <button className="record-btn-svg" title="创建任务"><IconChecklist size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function getWeekday(dateStr: string): string {
  const [month, day] = dateStr.split('/')
  const date = new Date(2026, parseInt(month) - 1, parseInt(day))
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return weekdays[date.getDay()]
}

export default ProjectSection