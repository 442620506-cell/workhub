import React, { useState } from 'react'
import './PersonalSection.css'

interface PersonalRecord {
  id: string
  date: string
  content: string
  createdAt: string
}

// 模拟个人记录
const mockPersonalRecords: PersonalRecord[] = [
  { id: 'pr1', date: '04/21', content: '整理个人学习资料，复习Python基础', createdAt: '2026-04-21 20:00' },
  { id: 'pr2', date: '04/20', content: '完成健身计划打卡', createdAt: '2026-04-20 18:00' },
]

function PersonalSection() {
  const [collapsed, setCollapsed] = useState(false)
  const [records, setRecords] = useState<PersonalRecord[]>(mockPersonalRecords)
  const [isAdding, setIsAdding] = useState(false)
  const [newContent, setNewContent] = useState('')

  const handleAddRecord = () => {
    if (newContent.trim()) {
      const today = new Date()
      const dateStr = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`
      const newRecord: PersonalRecord = {
        id: `pr${Date.now()}`,
        date: dateStr,
        content: newContent,
        createdAt: new Date().toISOString(),
      }
      setRecords(prev => [newRecord, ...prev])
      setNewContent('')
      setIsAdding(false)
    }
  }

  // 按日期分组
  const groupedRecords = records.reduce((acc, record) => {
    if (!acc[record.date]) {
      acc[record.date] = []
    }
    acc[record.date].push(record)
    return acc
  }, {} as Record<string, PersonalRecord[]>)

  const sortedDates = Object.keys(groupedRecords).sort((a, b) => {
    const [aMonth, aDay] = a.split('/')
    const [bMonth, bDay] = b.split('/')
    return new Date(2026, parseInt(bMonth) - 1, parseInt(bDay)).getTime() - new Date(2026, parseInt(aMonth) - 1, parseInt(aDay)).getTime()
  })

  return (
    <div className={`section personal-section ${collapsed ? 'collapsed' : ''}`}>
      <div className="section-header" onClick={() => setCollapsed(!collapsed)}>
        <div className="header-left">
          <span className="collapse-icon">{collapsed ? '▶' : '▼'}</span>
          <span className="section-name">个人事项</span>
        </div>
        <div className="header-actions">
          <button className="action-btn" onClick={(e) => { e.stopPropagation(); setIsAdding(true) }}>
            + 添加
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="section-content">
          {isAdding && (
            <div className="add-record-panel">
              <textarea
                className="record-input"
                placeholder="输入个人事项..."
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

export default PersonalSection