import React, { useState } from 'react'
import {
  IconPlus, IconClock, IconPriorityHigh, IconPriorityMedium, IconPriorityLow,
  IconCheck, IconChevronRight, IconChevronDown, IconClose
} from './Icons'
import { Product, ProjectWithFiles } from '../types'
import './TodoPanel.css'

interface Todo {
  id: string
  text: string
  linkedProductId?: string
  linkedProjectId?: string
  assignee?: string
  dueDate: string
  dueTime?: string
  category: 'meeting' | 'material' | 'document' | 'approval' | 'coordination' | 'other'
  status: 'todo' | 'inProgress' | 'done' | 'archived'
  priority: 'high' | 'medium' | 'low'
  completed: boolean
  isOverdue: boolean
  isToday: boolean
}

interface TodoPanelProps {
  products: Product[]
  projects: ProjectWithFiles[]
  onAddRecord?: (targetId: string, targetType: 'product' | 'project', content: string, files: never[]) => void
}

const todayStr = new Date().toISOString().slice(0, 10)
const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

const mockTodos: Todo[] = [
  { id: '1', text: '完成项目申报材料', linkedProjectId: 'p_ye1', assignee: '张三', dueDate: todayStr, dueTime: '17:00', category: 'material', status: 'inProgress', priority: 'high', completed: false, isOverdue: false, isToday: true },
  { id: '2', text: '整理会议纪要', linkedProjectId: 'p_jl1', assignee: '李四', dueDate: tomorrowStr, category: 'document', status: 'todo', priority: 'medium', completed: false, isOverdue: false, isToday: false },
  { id: '3', text: '提交周报', dueDate: yesterdayStr, dueTime: '18:00', category: 'document', status: 'todo', priority: 'high', completed: false, isOverdue: true, isToday: false },
  { id: '4', text: '审批合同', linkedProductId: 'prod1', assignee: '王五', dueDate: todayStr, dueTime: '14:00', category: 'approval', status: 'todo', priority: 'high', completed: false, isOverdue: false, isToday: true },
  { id: '5', text: '协调资源分配', linkedProjectId: 'p_kf1', dueDate: tomorrowStr, category: 'coordination', status: 'todo', priority: 'medium', completed: false, isOverdue: false, isToday: false },
]

const categoryLabels: Record<Todo['category'], string> = {
  meeting: '会议',
  material: '材料',
  document: '文档',
  approval: '审批',
  coordination: '协调',
  other: '其他'
}

const categoryColors: Record<Todo['category'], string> = {
  meeting: 'purple',
  material: 'blue',
  document: 'green',
  approval: 'red',
  coordination: 'orange',
  other: 'gray'
}

const priorityIcons: Record<Todo['priority'], React.ReactNode> = {
  high: <IconPriorityHigh size={10} />,
  medium: <IconPriorityMedium size={10} />,
  low: <IconPriorityLow size={10} />
}

const priorityColors: Record<Todo['priority'], string> = {
  high: 'rgba(var(--red-5), 1)',
  medium: 'rgba(var(--yellow-5), 1)',
  low: 'rgba(var(--green-5), 1)'
}

function TodoPanel({ products, projects, onAddRecord }: TodoPanelProps) {
  const [todos, setTodos] = useState<Todo[]>(mockTodos)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTodoText, setNewTodoText] = useState('')
  const [newTodoPriority, setNewTodoPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [newTodoCategory, setNewTodoCategory] = useState<Todo['category']>('document')
  const [newTodoDueDate, setNewTodoDueDate] = useState(todayStr)
  const [newTodoDueTime, setNewTodoDueTime] = useState('')
  const [newTodoLinkedType, setNewTodoLinkedType] = useState<'none' | 'product' | 'project'>('none')
  const [newTodoLinkedId, setNewTodoLinkedId] = useState<string>('')

  const todayTodos = todos.filter(t => t.isToday)
  const overdueTodos = todos.filter(t => t.isOverdue && !t.isToday)
  const upcomingTodos = todos.filter(t => !t.isToday && !t.isOverdue)

  const getLinkedName = (todo: Todo) => {
    if (todo.linkedProductId) {
      return products.find(p => p.id === todo.linkedProductId)?.name || ''
    }
    if (todo.linkedProjectId) {
      return projects.find(p => p.id === todo.linkedProjectId)?.name || ''
    }
    return null
  }

  const handleToggle = (id: string) => {
    const todo = todos.find(t => t.id === id)
    if (!todo) return

    const wasCompleted = todo.completed
    setTodos(prev => prev.map(t =>
      t.id === id ? { ...t, completed: !t.completed, status: t.completed ? 'todo' : 'done' } : t
    ))

    // 完成待办时，自动添加记录到关联的产品/项目
    if (!wasCompleted && (todo.linkedProductId || todo.linkedProjectId)) {
      const content = `完成待办：${todo.text}`
      if (todo.linkedProductId) {
        onAddRecord?.(todo.linkedProductId, 'product', content, [])
      } else if (todo.linkedProjectId) {
        onAddRecord?.(todo.linkedProjectId, 'project', content, [])
      }
    }
  }

  const handleAddTodo = () => {
    if (!newTodoText.trim()) return

    const isToday = newTodoDueDate === todayStr
    const isOverdue = newTodoDueDate < todayStr

    const newTodo: Todo = {
      id: `todo_${Date.now()}`,
      text: newTodoText.trim(),
      linkedProductId: newTodoLinkedType === 'product' ? newTodoLinkedId : undefined,
      linkedProjectId: newTodoLinkedType === 'project' ? newTodoLinkedId : undefined,
      dueDate: newTodoDueDate,
      dueTime: newTodoDueTime || undefined,
      category: newTodoCategory,
      status: 'todo',
      priority: newTodoPriority,
      completed: false,
      isOverdue,
      isToday
    }

    setTodos(prev => [...prev, newTodo])
    setShowAddModal(false)
    setNewTodoText('')
    setNewTodoDueTime('')
    setNewTodoLinkedType('none')
    setNewTodoLinkedId('')
  }

  const formatDueDate = (date: string, time?: string) => {
    const d = new Date(date)
    const month = d.getMonth() + 1
    const day = d.getDate()
    const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
    return `${month}/${day} ${weekday}${time ? ` ${time}` : ''}`
  }

  return (
    <div className="todo-panel">
      {/* 新建任务按钮 */}
      <button className="add-task-btn" onClick={() => setShowAddModal(true)}>
        <IconPlus size={14} /> 新建任务
      </button>

      {/* 新建待办弹窗 */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>新建待办</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <IconClose size={14} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <label>待办内容</label>
                <input
                  type="text"
                  value={newTodoText}
                  onChange={e => setNewTodoText(e.target.value)}
                  placeholder="输入待办内容"
                  autoFocus
                />
              </div>
              <div className="form-row">
                <label>优先级</label>
                <div className="select-btn-group">
                  <button
                    className={`select-btn ${newTodoPriority === 'high' ? 'active' : ''}`}
                    onClick={() => setNewTodoPriority('high')}
                  >
                    <span style={{ color: 'rgb(239, 68, 68)' }}><IconPriorityHigh size={10} /></span> 高
                  </button>
                  <button
                    className={`select-btn ${newTodoPriority === 'medium' ? 'active' : ''}`}
                    onClick={() => setNewTodoPriority('medium')}
                  >
                    <span style={{ color: 'rgb(234, 179, 8)' }}><IconPriorityMedium size={10} /></span> 中
                  </button>
                  <button
                    className={`select-btn ${newTodoPriority === 'low' ? 'active' : ''}`}
                    onClick={() => setNewTodoPriority('low')}
                  >
                    <span style={{ color: 'rgb(34, 197, 94)' }}><IconPriorityLow size={10} /></span> 低
                  </button>
                </div>
              </div>
              <div className="form-row">
                <label>类型</label>
                <div className="select-btn-group">
                  {(['document', 'material', 'meeting', 'approval', 'coordination', 'other'] as Todo['category'][]).map(cat => (
                    <button
                      key={cat}
                      className={`select-btn ${newTodoCategory === cat ? 'active' : ''}`}
                      onClick={() => setNewTodoCategory(cat)}
                    >
                      {categoryLabels[cat]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-row">
                <label>截止日期</label>
                <input
                  type="date"
                  value={newTodoDueDate}
                  onChange={e => setNewTodoDueDate(e.target.value)}
                />
              </div>
              <div className="form-row">
                <label>截止时间</label>
                <input
                  type="time"
                  value={newTodoDueTime}
                  onChange={e => setNewTodoDueTime(e.target.value)}
                  placeholder="可选"
                />
              </div>
              <div className="form-row">
                <label>关联目标</label>
                <select
                  value={newTodoLinkedType}
                  onChange={e => {
                    setNewTodoLinkedType(e.target.value as 'none' | 'product' | 'project')
                    setNewTodoLinkedId('')
                  }}
                >
                  <option value="none">无关联</option>
                  <option value="product">关联产品</option>
                  <option value="project">关联项目</option>
                </select>
              </div>
              {newTodoLinkedType === 'product' && (
                <div className="form-row">
                  <label>选择产品</label>
                  <select
                    value={newTodoLinkedId}
                    onChange={e => setNewTodoLinkedId(e.target.value)}
                  >
                    <option value="">请选择</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {newTodoLinkedType === 'project' && (
                <div className="form-row">
                  <label>选择项目</label>
                  <select
                    value={newTodoLinkedId}
                    onChange={e => setNewTodoLinkedId(e.target.value)}
                  >
                    <option value="">请选择</option>
                    {projects.filter(p => p.id !== 'personal').map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.province} {p.year})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleAddTodo}>创建</button>
            </div>
          </div>
        </div>
      )}

      {/* 逾期任务 */}
      {overdueTodos.length > 0 && (
        <div className="todo-section overdue">
          <div className="section-header">
            <span className="section-label overdue-label">逾期 {overdueTodos.length}</span>
          </div>
          <div className="todo-list">
            {overdueTodos.map(todo => (
              <div key={todo.id} className={`todo-item overdue ${todo.completed ? 'completed' : ''}`} onClick={() => handleToggle(todo.id)}>
                <span className={`check ${todo.completed ? 'done' : ''}`}></span>
                <span className="text">{todo.text}</span>
                <span className="meta overdue-time">{formatDueDate(todo.dueDate, todo.dueTime)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 今日任务 */}
      <div className="todo-section today">
        <div className="section-header">
          <span className="section-label">今日 {todayTodos.length}</span>
        </div>
        <div className="todo-list">
          {todayTodos.length > 0 ? (
            todayTodos.map(todo => (
              <div key={todo.id} className={`todo-item ${todo.priority} ${todo.completed ? 'completed' : ''}`} onClick={() => handleToggle(todo.id)}>
                <span className="priority-svg" style={{ color: priorityColors[todo.priority] }}>{priorityIcons[todo.priority]}</span>
                <span className={`check ${todo.completed ? 'done' : ''}`}></span>
                <div className="content">
                  <span className="text">{todo.text}</span>
                  <div className="tags">
                    {getLinkedName(todo) && <span className="tag project">{getLinkedName(todo)}</span>}
                    <span className={`tag category ${categoryColors[todo.category]}`}>{categoryLabels[todo.category]}</span>
                    {todo.dueTime && <span className="tag time-svg"><IconClock size={12} /> {todo.dueTime}</span>}
                    {todo.assignee && <span className="tag assignee">@{todo.assignee}</span>}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty">今日无待办</div>
          )}
        </div>
      </div>

      {/* 未来任务 */}
      {upcomingTodos.length > 0 && (
        <div className="todo-section upcoming">
          <div className="section-header">
            <span className="section-label">未来 {upcomingTodos.length}</span>
          </div>
          <div className="todo-list">
            {upcomingTodos.map(todo => (
              <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`} onClick={() => handleToggle(todo.id)}>
                <span className={`check ${todo.completed ? 'done' : ''}`}></span>
                <span className="text">{todo.text}</span>
                <span className="meta">{formatDueDate(todo.dueDate)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default TodoPanel