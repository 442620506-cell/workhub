import React from 'react'
import './DateSection.css'

interface Project {
  id: string
  name: string
  province: string
  visible: boolean
  collapsed: boolean
}

interface DateRecord {
  date: string
  projectId: string
  projectName: string
  content: string
}

// 模拟按日期的数据
const mockDateRecords: DateRecord[] = [
  { date: '04/21', projectId: 'p1', projectName: '项目A', content: '完成申报材料初稿' },
  { date: '04/21', projectId: 'p2', projectName: '项目B', content: '整理会议纪要' },
  { date: '04/21', projectId: 'personal', projectName: '个人事项', content: '健身打卡' },
  { date: '04/20', projectId: 'p1', projectName: '项目A', content: '收集项目资料' },
  { date: '04/20', projectId: 'p2', projectName: '项目B', content: '与客户沟通需求' },
  { date: '04/19', projectId: 'p1', projectName: '项目A', content: '项目启动会议' },
]

interface DateSectionProps {
  projects: Project[]
}

function DateSection({ projects }: DateSectionProps) {
  // 生成最近7天的日期
  const generateRecentDates = () => {
    const dates: string[] = []
    for (let i = 0; i < 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      dates.push(`${month}/${day}`)
    }
    return dates
  }

  const recentDates = generateRecentDates()

  // 按日期获取记录
  const getRecordsByDate = (date: string) => {
    return mockDateRecords.filter(r => r.date === date)
  }

  const getWeekday = (dateStr: string): string => {
    const [month, day] = dateStr.split('/')
    const date = new Date(2026, parseInt(month) - 1, parseInt(day))
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekdays[date.getDay()]
  }

  return (
    <div className="date-section">
      {recentDates.map(date => {
        const records = getRecordsByDate(date)
        return (
          <div key={date} className="date-block">
            <div className="date-header">
              <span className="date-text">{date}</span>
              <span className="weekday">{getWeekday(date)}</span>
              {date === '04/21' && <span className="today-badge">今天</span>}
            </div>
            <div className="date-content">
              {records.length > 0 ? (
                records.map((record, idx) => (
                  <div key={idx} className="date-record">
                    <span className="record-project">{record.projectName}</span>
                    <span className="record-content">{record.content}</span>
                  </div>
                ))
              ) : (
                <div className="empty-date">暂无记录</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default DateSection