import { useState, useMemo, useEffect } from 'react'
import { IconReview, IconClose, IconArrowLeft, IconArrowRight, IconRefresh, IconCopy, IconSave, IconSparkles } from './Icons'
import { Product, ProjectWithFiles } from '../types'
import './WorkReview.css'
import './PanelFull.css'

interface WeeklyReportRecord {
  id: string
  weekRange: string
  startDate: string
  endDate: string
  content: string
  createdAt: string
}

// 工时数据结构（支持手动编辑）
interface HoursRow {
  id: string
  name: string
  type: 'product' | 'project'
  color: string
  workCode?: string
  dailyHours: number[]
  weekTotal: number
}

type TabType = 'weekly' | 'hours'

interface WorkReviewProps {
  products: Product[]
  projects: ProjectWithFiles[]
  onClose?: () => void
  activeTab?: TabType
  onTabChange?: (tab: TabType) => void
}

function getWeekRange(date: Date): { start: Date; end: Date; startStr: string; endStr: string } {
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  const start = new Date(date.setDate(diff))
  const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000)
  const formatDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return { start, end, startStr: formatDate(start), endStr: formatDate(end) }
}

function WorkReview({
  products,
  projects,
  onClose,
  activeTab: initialTab = 'weekly',
  onTabChange
}: WorkReviewProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    onTabChange?.(tab)
  }

  // 周报生成相关状态
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [selectedTargets, setSelectedTargets] = useState<string[]>([])
  const [generatedReport, setGeneratedReport] = useState('')
  const [historicalReports, setHistoricalReports] = useState<WeeklyReportRecord[]>([])
  const [viewingReport, setViewingReport] = useState<WeeklyReportRecord | null>(null)

  // 工时看板状态
  const [hoursRows, setHoursRows] = useState<HoursRow[]>([])
  const [isGeneratingHours, setIsGeneratingHours] = useState(false)

  // 计算当前周范围
  const weekRange = useMemo(() => getWeekRange(currentWeek), [currentWeek])

  // 生成本周日期列表（周一到周日）
  const weekDates = useMemo(() => {
    const dates: string[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekRange.start.getTime() + i * 24 * 60 * 60 * 1000)
      dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
    }
    return dates
  }, [weekRange])

  const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

  // 构建目标列表（产品+项目）
  const allTargets = useMemo(() => {
    const targets: Array<{ id: string; name: string; type: 'product' | 'project'; color: string; workCode?: string }> = []
    products.forEach(p => targets.push({ id: p.id, name: p.name, type: 'product', color: p.color, workCode: p.workCode }))
    projects.filter(p => p.id !== 'personal').forEach(p => targets.push({ id: p.id, name: p.name, type: 'project', color: p.color, workCode: p.workCode }))
    return targets
  }, [products, projects])

  // 初始化选中所有目标
  useEffect(() => {
    if (selectedTargets.length === 0) {
      setSelectedTargets(allTargets.map(t => t.id))
    }
  }, [allTargets])

  // 初始化工时看板（所有项目初始化为0）
  useEffect(() => {
    const initialRows: HoursRow[] = allTargets.map(target => ({
      id: target.id,
      name: target.name,
      type: target.type,
      color: target.color,
      workCode: target.workCode,
      dailyHours: [0, 0, 0, 0, 0, 0, 0],
      weekTotal: 0
    }))
    setHoursRows(initialRows)
  }, [allTargets])

  // 切换周
  const handlePrevWeek = () => {
    setCurrentWeek(new Date(currentWeek.getTime() - 7 * 24 * 60 * 60 * 1000))
    setGeneratedReport('')
  }
  const handleNextWeek = () => {
    setCurrentWeek(new Date(currentWeek.getTime() + 7 * 24 * 60 * 60 * 1000))
    setGeneratedReport('')
  }

  // 切换目标选择
  const handleToggleTarget = (targetId: string) => {
    setSelectedTargets(prev =>
      prev.includes(targetId)
        ? prev.filter(id => id !== targetId)
        : [...prev, targetId]
    )
    setGeneratedReport('')
  }

  // 生成周报（按产品/项目输出工作内容，不含工时和日期）
  const handleGenerateReport = () => {
    let report = '本周工作总结\n\n'

    selectedTargets.forEach(targetId => {
      const target = allTargets.find(t => t.id === targetId)
      if (!target) return

      // 获取该目标本周的记录
      let records: Array<{ content: string; date: string }> = []
      if (target.type === 'product') {
        const product = products.find(p => p.id === targetId)
        records = (product?.records || [])
          .filter(r => r.date >= weekRange.startStr && r.date <= weekRange.endStr)
          .map(r => ({ content: r.content, date: r.date }))
      } else {
        const project = projects.find(p => p.id === targetId)
        records = (project?.records || [])
          .filter(r => r.date >= weekRange.startStr && r.date <= weekRange.endStr)
          .map(r => ({ content: r.content, date: r.date }))
      }

      // 提取纯文本内容
      const extractText = (html: string) => {
        let text = html.replace(/<[^>]*>/g, '')
        text = text.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
        return text
      }

      const workItems = records.map(r => extractText(r.content)).filter(c => c.length > 0)

      if (workItems.length > 0) {
        report += `${target.name}：\n`
        workItems.forEach(item => {
          report += `- ${item}\n`
        })
        report += '\n'
      }
    })

    setGeneratedReport(report)
  }

  // 保存周报
  const handleSaveReport = () => {
    if (!generatedReport) return
    const newReport: WeeklyReportRecord = {
      id: `hr${Date.now()}`,
      weekRange: `${weekRange.startStr} ~ ${weekRange.endStr}`,
      startDate: weekRange.startStr,
      endDate: weekRange.endStr,
      content: generatedReport,
      createdAt: new Date().toISOString()
    }
    setHistoricalReports(prev => [newReport, ...prev])
    setGeneratedReport('')
  }

  // 删除历史周报
  const handleDeleteReport = (reportId: string) => {
    setHistoricalReports(prev => prev.filter(r => r.id !== reportId))
    if (viewingReport?.id === reportId) setViewingReport(null)
  }

  // AI生成工时看板
  const handleAIGenerateHours = async () => {
    setIsGeneratingHours(true)

    // 模拟AI分析过程（延迟1秒）
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 收集本周所有项目的工作记录
    const weekRecords: Map<string, Array<{ content: string; date: string }>> = new Map()

    allTargets.forEach(target => {
      let records: Array<{ content: string; date: string }> = []
      if (target.type === 'product') {
        const product = products.find(p => p.id === target.id)
        records = (product?.records || [])
          .filter(r => r.date >= weekRange.startStr && r.date <= weekRange.endStr)
      } else {
        const project = projects.find(p => p.id === target.id)
        records = (project?.records || [])
          .filter(r => r.date >= weekRange.startStr && r.date <= weekRange.endStr)
      }
      weekRecords.set(target.id, records)
    })

    // 计算每个项目每天的工时（AI模拟算法，使用整数）
    const newRows: HoursRow[] = allTargets.map(target => {
      const records = weekRecords.get(target.id) || []
      const dailyHours: number[] = [0, 0, 0, 0, 0, 0, 0]

      // 按日期分配工时（整数估算）
      records.forEach(record => {
        const dayIndex = weekDates.indexOf(record.date)
        if (dayIndex >= 0 && dayIndex < 7) {
          // AI估算：根据工作内容复杂度估算工时（全部整数）
          let hours = 1
          if (record.content.includes('完成') || record.content.includes('上线') || record.content.includes('发布')) {
            hours = 3
          } else if (record.content.includes('设计') || record.content.includes('编制') || record.content.includes('开发')) {
            hours = 2
          } else if (record.content.includes('对接') || record.content.includes('沟通') || record.content.includes('确认')) {
            hours = 2
          } else if (record.content.includes('优化') || record.content.includes('调整') || record.content.includes('迭代')) {
            hours = 2
          }
          dailyHours[dayIndex] += hours
        }
      })

      // 计算周合计
      const weekTotal = dailyHours.reduce((sum, h) => sum + h, 0)

      return {
        id: target.id,
        name: target.name,
        type: target.type,
        color: target.color,
        workCode: target.workCode,
        dailyHours,
        weekTotal
      }
    })

    // 调整工时使周一到周五每天至少8小时（允许超额）
    const currentDailyTotals = [0, 0, 0, 0, 0, 0, 0]
    for (let i = 0; i < 7; i++) {
      currentDailyTotals[i] = newRows.reduce((sum, row) => sum + row.dailyHours[i], 0)
    }

    // 调整周一到周五：不足8小时则补充，超过则保持（允许超额）
    for (let dayIdx = 0; dayIdx < 5; dayIdx++) {
      const minTotal = 8
      const currentTotal = currentDailyTotals[dayIdx]

      if (currentTotal < minTotal) {
        // 不足8小时，补充差额
        const shortage = minTotal - currentTotal
        const projectsWithRecords = newRows.filter(row => row.weekTotal > 0)
        if (projectsWithRecords.length > 0) {
          // 按整数分配差额
          const hoursPerProject = Math.floor(shortage / projectsWithRecords.length)
          let extraHours = shortage - hoursPerProject * projectsWithRecords.length
          projectsWithRecords.forEach((row, idx) => {
            row.dailyHours[dayIdx] += hoursPerProject + (idx < extraHours ? 1 : 0)
          })
        }
        currentDailyTotals[dayIdx] = minTotal
      }
      // 超过8小时则保持原样（允许超额）
    }

    // 重新计算每个项目的周合计
    newRows.forEach(row => {
      row.weekTotal = row.dailyHours.reduce((sum, h) => sum + h, 0)
    })

    setHoursRows(newRows)
    setIsGeneratingHours(false)
  }

  // 计算每日合计和周合计
  const dailyTotals = useMemo(() => {
    return weekDays.map((_, i) => hoursRows.reduce((sum, row) => sum + row.dailyHours[i], 0))
  }, [hoursRows])

  const weekTotal = useMemo(() => dailyTotals.reduce((sum, h) => sum + h, 0), [dailyTotals])

  return (
    <div className="panel-full">
      <header className="panel-full-header">
        <h2 className="panel-full-title"><IconReview size={20} /> 工作复盘</h2>
        <button className="panel-full-close" onClick={onClose}><IconClose size={16} /></button>
      </header>

      {/* Tab 导航 */}
      <div className="wr-tabs">
        <button className={`wr-tab ${activeTab === 'weekly' ? 'active' : ''}`} onClick={() => handleTabChange('weekly')}>周报生成</button>
        <button className={`wr-tab ${activeTab === 'hours' ? 'active' : ''}`} onClick={() => handleTabChange('hours')}>周工时看板</button>
      </div>

      <div className="panel-full-body wr-content">
        {/* 周报生成 */}
        {activeTab === 'weekly' && (
          <div className="wr-weekly">
            {/* 周范围选择 */}
            <div className="week-selector">
              <button className="week-nav-btn" onClick={handlePrevWeek}><IconArrowLeft size={14} /> 上一周</button>
              <span className="week-range-display">{weekRange.startStr} ~ {weekRange.endStr}</span>
              <button className="week-nav-btn" onClick={handleNextWeek}>下一周 <IconArrowRight size={14} /></button>
            </div>

            {/* 目标选择 */}
            <div className="project-selector">
              <span className="selector-label">选择产品/项目：</span>
              <div className="project-checkboxes">
                {allTargets.map(target => (
                  <label key={target.id} className={`project-checkbox ${selectedTargets.includes(target.id) ? 'selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={selectedTargets.includes(target.id)}
                      onChange={() => handleToggleTarget(target.id)}
                    />
                    <span className={`checkbox-dot ${target.color}`}></span>
                    <span className="checkbox-name">{target.name}</span>
                    <span className="checkbox-type">{target.type === 'product' ? '产品' : '项目'}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 生成的周报内容 */}
            <div className="report-content-area">
              <div className="report-header">
                <span className="report-label">周报内容：</span>
                <button className="generate-btn" onClick={handleGenerateReport}><IconRefresh size={14} /> 生成周报</button>
              </div>
              <textarea
                className="report-textarea"
                value={generatedReport}
                onChange={e => setGeneratedReport(e.target.value)}
                placeholder="点击'生成周报'按钮自动生成..."
              />
              <div className="report-actions">
                <button className="action-btn" onClick={() => navigator.clipboard.writeText(generatedReport)} disabled={!generatedReport}><IconCopy size={14} /> 复制</button>
                <button className="action-btn save-btn" onClick={handleSaveReport} disabled={!generatedReport}><IconSave size={14} /> 保存记录</button>
              </div>
            </div>

            {/* 历史周报列表 */}
            <div className="historical-reports">
              <span className="history-label">历史周报记录：</span>
              <div className="history-table">
                <div className="history-header">
                  <span className="col-range">周范围</span>
                  <span className="col-created">创建时间</span>
                  <span className="col-action">操作</span>
                </div>
                {historicalReports.map(report => (
                  <div key={report.id} className="history-row">
                    <span className="col-range">{report.weekRange}</span>
                    <span className="col-created">{report.createdAt}</span>
                    <span className="col-action">
                      <button className="view-btn" onClick={() => setViewingReport(report)}>查看</button>
                      <button className="delete-btn" onClick={() => handleDeleteReport(report.id)}>删除</button>
                    </span>
                  </div>
                ))}
                {historicalReports.length === 0 && (
                  <div className="history-empty">暂无历史记录</div>
                )}
              </div>
            </div>

            {/* 查看历史周报弹窗 */}
            {viewingReport && (
              <div className="view-report-modal" onClick={() => setViewingReport(null)}>
                <div className="view-report-content" onClick={e => e.stopPropagation()}>
                  <div className="view-header">
                    <span className="view-title">{viewingReport.weekRange}</span>
                    <button className="view-close" onClick={() => setViewingReport(null)}><IconClose size={14} /></button>
                  </div>
                  <textarea className="view-textarea" value={viewingReport.content} readOnly />
                  <div className="view-actions">
                    <button onClick={() => navigator.clipboard.writeText(viewingReport.content)}><IconCopy size={14} /> 复制</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 周工时看板 */}
        {activeTab === 'hours' && (
          <div className="wr-hours">
            {/* 周范围选择 */}
            <div className="week-selector">
              <button className="week-nav-btn" onClick={handlePrevWeek}><IconArrowLeft size={14} /> 上一周</button>
              <span className="week-range-display">{weekRange.startStr} ~ {weekRange.endStr}</span>
              <button className="week-nav-btn" onClick={handleNextWeek}>下一周 <IconArrowRight size={14} /></button>
            </div>

            {/* AI生成按钮 */}
            <div className="hours-actions">
              <button
                className="ai-generate-btn"
                onClick={handleAIGenerateHours}
                disabled={isGeneratingHours}
              >
                <IconSparkles size={14} />
                {isGeneratingHours ? 'AI分析中...' : 'AI生成工时'}
              </button>
              <span className="hours-hint">AI根据项目记录估算每日工时（整数），周一至周五至少8小时，允许超额</span>
            </div>

            {/* 工时表格 */}
            <div className="hours-table-wrapper">
              <table className="hours-table">
                <thead>
                  <tr>
                    <th className="col-project">产品/项目</th>
                    <th className="col-code">工时代码</th>
                    {weekDays.map((day, i) => (
                      <th key={i} className={`col-day ${i < 5 ? 'workday' : 'weekend'}`}>
                        <span className="day-name">{day}</span>
                        <span className="day-date">{weekDates[i].slice(5)}</span>
                      </th>
                    ))}
                    <th className="col-total">周合计</th>
                  </tr>
                </thead>
                <tbody>
                  {hoursRows.map(row => (
                    <tr key={row.id}>
                      <td className="col-project">
                        <span className={`project-dot ${row.color}`}></span>
                        <span className="project-name">{row.name}</span>
                      </td>
                      <td className="col-code">{row.workCode || '-'}</td>
                      {row.dailyHours.map((hours, i) => (
                        <td key={i} className={`col-day ${i < 5 ? 'workday' : 'weekend'}`}>
                          {hours > 0 ? (
                            <span className="hours-value">{hours}</span>
                          ) : (
                            <span className="hours-empty">-</span>
                          )}
                        </td>
                      ))}
                      <td className="col-total">
                        {row.weekTotal > 0 ? (
                          <span className="total-value">{row.weekTotal}</span>
                        ) : (
                          <span className="total-empty">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="col-project foot-label">每日合计</td>
                    <td className="col-code"></td>
                    {dailyTotals.map((total, i) => (
                      <td key={i} className={`col-day ${i < 5 ? 'workday' : 'weekend'}`}>
                        <span className={`day-total ${i < 5 && total >= 8 ? 'standard' : ''}`}>
                          {total > 0 ? total : '-'}
                        </span>
                        {i < 5 && total < 8 && total > 0 && (
                          <span className="day-status">不足</span>
                        )}
                      </td>
                    ))}
                    <td className="col-total">
                      <span className="week-total">{weekTotal > 0 ? weekTotal : '-'}</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default WorkReview