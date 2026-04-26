import React, { useState, useRef } from 'react'
import ProjectChecklist from './ProjectChecklist'
import RichTextEditor from './RichTextEditor'
import { IconFolder, IconClose, IconChevronRight, IconChevronDown, IconFile, IconFileText, IconFileSpreadsheet, IconFilePresentation, IconFileImage, IconPlus, IconFocus, IconLinked, IconFilePdf, IconAttach } from './Icons'
import { ProjectWithFiles, Folder, FileItem, defaultConfig, AttachedFile, Product } from '../types'
import './ContentArea.css'
import { open } from '@tauri-apps/plugin-shell'

interface WorkRecord {
  id: string
  projectId: string
  content: string
  time: string
  date: string
  files: AttachedFile[]
  linkedTodoIds?: string[]
  needsFollowUp?: boolean
}

interface DayRecords {
  date: string
  weekday: string
  records: WorkRecord[]
}

// 生成模拟文件夹结构
export const generateMockFolders = (basePath: string, projectName: string): Folder[] => {
  const defaultFolders = ['汇报材料', '申报材料', '历史文件']
  const mockFiles: Record<string, FileItem[]> = {
    '汇报材料': [
      { id: 'f1', name: '项目汇报PPT', type: 'ppt', extension: '.pptx', size: 2500000, sizeDisplay: '2.5MB', date: '2026-04-20', fullPath: `${basePath}/${projectName}/汇报材料/项目汇报PPT.pptx` },
      { id: 'f2', name: '汇报大纲', type: 'doc', extension: '.docx', size: 50000, sizeDisplay: '50KB', date: '2026-04-18', fullPath: `${basePath}/${projectName}/汇报材料/汇报大纲.docx` },
    ],
    '申报材料': [
      { id: 'f3', name: '申报材料', type: 'pdf', extension: '.pdf', size: 1200000, sizeDisplay: '1.2MB', date: '2026-04-15', fullPath: `${basePath}/${projectName}/申报材料/申报材料.pdf` },
      { id: 'f4', name: '附件清单', type: 'xls', extension: '.xlsx', size: 80000, sizeDisplay: '80KB', date: '2026-04-15', fullPath: `${basePath}/${projectName}/申报材料/附件清单.xlsx` },
    ],
    '历史文件': [],
  }

  const iconTypes: Record<string, 'report' | 'document' | 'history' | 'default'> = {
    '汇报材料': 'report',
    '申报材料': 'document',
    '历史文件': 'history',
  }

  return defaultFolders.map((folderName, index) => ({
    id: `folder_${index}`,
    name: folderName,
    path: folderName,
    fullPath: `${basePath}/${projectName}/${folderName}`,
    iconType: iconTypes[folderName] || 'default',
    files: mockFiles[folderName] || [],
  }))
}

interface ContentAreaProps {
  products: Product[]
  projects: ProjectWithFiles[]
  setProjects: React.Dispatch<React.SetStateAction<ProjectWithFiles[]>>
  viewType?: 'date' | 'project'
  onViewTypeChange?: (viewType: 'date' | 'project') => void
  focusedProjectId?: string | null
  onFocusedProjectChange?: (projectId: string | null) => void
  selectedProductId?: string | null
  onSelectedProductChange?: (productId: string | null) => void
}

const currentYear = '2026'

const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

// 文件类型图标组件映射
const FileTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'pdf': return <IconFile size={14} />
    case 'doc': return <IconFileText size={14} />
    case 'xls': return <IconFileSpreadsheet size={14} />
    case 'ppt': return <IconFilePresentation size={14} />
    case 'img': return <IconFileImage size={14} />
    default: return <IconFile size={14} />
  }
}

type ViewType = 'project' | 'date'

const today = new Date()
const formatDate = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`

const mockRecords: WorkRecord[] = [
  { id: 'r1', projectId: 'p1', content: '完成申报材料初稿，整理附件资料', time: '09:30', date: '4/21', files: [{ id: 'f1', name: '申报材料.pdf', type: 'pdf', path: 'D:/WorkDocuments/项目A/申报材料/申报材料.pdf' }] },
  { id: 'r2', projectId: 'p1', content: '审核反馈修改，提交第二版', time: '10:30', date: '4/21', files: [{ id: 'f2', name: '修改说明.docx', type: 'doc', path: 'D:/WorkDocuments/项目A/申报材料/修改说明.docx' }] },
  { id: 'r3', projectId: 'p1', content: '协调审批流程', time: '14:00', date: '4/22', files: [] },
  { id: 'r4', projectId: 'p1', content: '准备汇报材料', time: '15:30', date: '4/22', files: [] },
  { id: 'r5', projectId: 'p2', content: '与张三确认进度，整理会议纪要', time: '09:00', date: '4/21', files: [] },
  { id: 'r6', projectId: 'p2', content: '现场调研，收集项目资料', time: '11:00', date: '4/21', files: [] },
  { id: 'r7', projectId: 'p2', content: '编写需求文档', time: '09:30', date: '4/22', files: [] },
  { id: 'r8', projectId: 'p3', content: '收集项目资料，准备汇报材料', time: '10:00', date: '4/21', files: [] },
  { id: 'r9', projectId: 'personal', content: '整理学习资料，复习技术文档', time: '20:00', date: '4/22', files: [] },
]

function ContentArea({ products, projects, setProjects, viewType = 'project', onViewTypeChange, focusedProjectId, onFocusedProjectChange, selectedProductId, onSelectedProductChange }: ContentAreaProps) {
  const [records, setRecords] = useState<WorkRecord[]>(mockRecords)
  const [selectedProject, setSelectedProject] = useState<string>('p1')
  const [editorContent, setEditorContent] = useState('')
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editFiles, setEditFiles] = useState<AttachedFile[]>([])

  // 项目管理弹窗
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectProvince, setNewProjectProvince] = useState('浙江')

  // 项目清单弹窗
  const [showProjectChecklist, setShowProjectChecklist] = useState(false)
  const [checklistProjectId, setChecklistProjectId] = useState<string | null>(null)

  // 项目视图折叠状态
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set())
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [expandedDateGroups, setExpandedDateGroups] = useState<Set<string>>(new Set())
  const [projectViewDate, setProjectViewDate] = useState<string>('all') // 'all' 或具体日期
  const [focusDateFilter, setFocusDateFilter] = useState<string>('all') // 专注模式日期筛选

  // 编辑中的记录（在项目列表中直接编辑）
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null)
  const [inlineEditContent, setInlineEditContent] = useState('')

  // 编辑区高度（可拖动）
  const [editorHeight, setEditorHeight] = useState(180)
  const isDraggingEditorRef = useRef(false)

  // 待办-记录关联状态
  const [showCreateTodoModal, setShowCreateTodoModal] = useState(false)
  const [sourceRecordId, setSourceRecordId] = useState<string | null>(null)
  const [newTodoText, setNewTodoText] = useState('')
  const [newTodoDueDate, setNewTodoDueDate] = useState(new Date().toISOString().slice(0, 10))
  const [newTodoPriority, setNewTodoPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [todos, setTodos] = useState<{id: string, text: string, sourceRecordId?: string, completed: boolean, dueDate: string, priority: string}[]>([])

  // 文件引用状态
  const [showFileSelectorModal, setShowFileSelectorModal] = useState(false)
  const [selectedRefProject, setSelectedRefProject] = useState<string | null>(null)
  const [selectedRefFolder, setSelectedRefFolder] = useState<string | null>(null)
  const [selectedRefFile, setSelectedRefFile] = useState<FileItem | null>(null)

  const handleToggleCollapse = (projectId: string) => {
    setCollapsedProjects(prev => {
      const newSet = new Set(prev)
      if (newSet.has(projectId)) {
        newSet.delete(projectId)
      } else {
        newSet.add(projectId)
      }
      return newSet
    })
  }

  const handleToggleExpand = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev)
      if (newSet.has(projectId)) {
        newSet.delete(projectId)
      } else {
        newSet.add(projectId)
      }
      return newSet
    })
  }

  const handleToggleDateGroup = (projectId: string, date: string) => {
    const key = `${projectId}-${date}`
    setExpandedDateGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }

  const handleOpenProjectChecklist = (projectId: string) => {
    setChecklistProjectId(projectId)
    setShowProjectChecklist(true)
  }

  // 在项目列表中直接编辑
  const handleInlineEdit = (record: WorkRecord) => {
    setInlineEditingId(record.id)
    setInlineEditContent(record.content)
    setEditFiles(record.files)
  }

  const handleInlineSave = () => {
    if (inlineEditingId && inlineEditContent.trim()) {
      setRecords(prev => prev.map(r =>
        r.id === inlineEditingId ? { ...r, content: inlineEditContent, files: editFiles } : r
      ))
      setInlineEditingId(null)
      setInlineEditContent('')
      setEditFiles([])
    }
  }

  const handleInlineCancel = () => {
    setInlineEditingId(null)
    setInlineEditContent('')
    setEditFiles([])
  }

  // 从记录创建待办
  const handleCreateTodoFromRecord = (record: WorkRecord) => {
    setSourceRecordId(record.id)
    setNewTodoText(record.content.replace(/<[^>]+>/g, '').slice(0, 50)) // 提取纯文本前50字
    setNewTodoDueDate(new Date().toISOString().slice(0, 10))
    setNewTodoPriority('medium')
    setShowCreateTodoModal(true)
  }

  // 确认创建待办
  const handleConfirmCreateTodo = () => {
    if (sourceRecordId && newTodoText.trim()) {
      const newTodo = {
        id: `todo_${Date.now()}`,
        text: newTodoText.trim(),
        sourceRecordId,
        completed: false,
        dueDate: newTodoDueDate,
        priority: newTodoPriority
      }
      setTodos(prev => [...prev, newTodo])
      // 更新记录的关联待办ID
      setRecords(prev => prev.map(r =>
        r.id === sourceRecordId ? { ...r, linkedTodoIds: [...(r.linkedTodoIds || []), newTodo.id] } : r
      ))
      setShowCreateTodoModal(false)
      setSourceRecordId(null)
      setNewTodoText('')
    }
  }

  // 取消创建待办
  const handleCancelCreateTodo = () => {
    setShowCreateTodoModal(false)
    setSourceRecordId(null)
    setNewTodoText('')
  }

  // 待办完成时生成记录
  const handleTodoComplete = (todoId: string) => {
    const todo = todos.find(t => t.id === todoId)
    if (todo && !todo.completed) {
      setTodos(prev => prev.map(t =>
        t.id === todoId ? { ...t, completed: true } : t
      ))
      // 如果待办来源于记录，生成完成记录
      if (todo.sourceRecordId) {
        const now = new Date()
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
        const dateStr = formatDate(now)
        const sourceRecord = records.find(r => r.id === todo.sourceRecordId)
        const completionRecord: WorkRecord = {
          id: `r${Date.now()}`,
          projectId: sourceRecord?.projectId || 'p1',
          content: `<p>完成待办: ${todo.text}</p>`,
          time: timeStr,
          date: dateStr,
          files: [],
          linkedTodoIds: [todoId]
        }
        setRecords(prev => [...prev, completionRecord])
      }
    }
  }

  // 打开文件选择器弹窗
  const handleOpenFileSelector = () => {
    setSelectedRefProject(null)
    setSelectedRefFolder(null)
    setSelectedRefFile(null)
    setShowFileSelectorModal(true)
  }

  // 选择项目后展开文件夹列表
  const handleSelectRefProject = (projectId: string) => {
    setSelectedRefProject(projectId)
    setSelectedRefFolder(null)
    setSelectedRefFile(null)
  }

  // 选择文件夹后展示文件列表
  const handleSelectRefFolder = (folderId: string) => {
    setSelectedRefFolder(folderId)
    setSelectedRefFile(null)
  }

  // 确认选择文件并插入引用
  const handleConfirmFileRef = () => {
    if (selectedRefFile) {
      // 创建文件引用标签并追加到编辑内容
      const fileRefHtml = `<span class="file-tag" data-file-path="${selectedRefFile.fullPath}" data-file-name="${selectedRefFile.name}">📎 ${selectedRefFile.name}</span>&nbsp;`
      setEditorContent(prev => prev + fileRefHtml)
      setShowFileSelectorModal(false)
      setSelectedRefProject(null)
      setSelectedRefFolder(null)
      setSelectedRefFile(null)
    }
  }

  // 取消选择文件
  const handleCancelFileRef = () => {
    setShowFileSelectorModal(false)
    setSelectedRefProject(null)
    setSelectedRefFolder(null)
    setSelectedRefFile(null)
  }

  // 截断文件名显示
  const truncateFileName = (name: string, maxLen: number = 6) => {
    if (name.length <= maxLen) return name
    return name.slice(0, maxLen) + '...'
  }

  // 移除HTML标签，只保留文本内容
  const stripHtml = (html: string) => {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  // 打开文件
  const handleOpenFile = async (filePath: string) => {
    try {
      await open(filePath)
    } catch (error) {
      console.error('Failed to open file:', error)
    }
  }

  // 编辑区拖动处理
  const handleEditorDragStart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('drag start triggered')
    isDraggingEditorRef.current = true
  }

  // 添加全局拖动监听
  React.useEffect(() => {
    const handleEditorDrag = (e: MouseEvent) => {
      if (!isDraggingEditorRef.current) return
      console.log('mouse move while dragging')
      // 最大高度为右侧区域的75%
      const maxHeight = window.innerHeight * 0.75
      // 最小高度为180px，保证底部编辑区基本内容可见（约6行）
      const minHeight = 180
      // 向上拖动：e.clientY变小，编辑区高度变大
      // 向下拖动：e.clientY变大，编辑区高度变小
      const newHeight = Math.max(minHeight, Math.min(maxHeight, window.innerHeight - e.clientY))
      console.log('newHeight:', newHeight)
      setEditorHeight(newHeight)
    }

    const handleEditorDragEnd = () => {
      console.log('drag end, isDragging:', isDraggingEditorRef.current)
      isDraggingEditorRef.current = false
    }

    window.addEventListener('mousemove', handleEditorDrag)
    window.addEventListener('mouseup', handleEditorDragEnd)
    return () => {
      window.removeEventListener('mousemove', handleEditorDrag)
      window.removeEventListener('mouseup', handleEditorDragEnd)
    }
  }, [])

  // 监听文件标签点击事件（来自 RichTextEditor）
  React.useEffect(() => {
    const handleOpenFileRef = (e: CustomEvent) => {
      const filePath = e.detail?.path
      if (filePath) {
        handleOpenFile(filePath)
      }
    }
    window.addEventListener('open-file-ref', handleOpenFileRef as EventListener)
    return () => {
      window.removeEventListener('open-file-ref', handleOpenFileRef as EventListener)
    }
  }, [])

  // 获取项目视图可选的日期列表
  const getAvailableDates = () => {
    const dateSet = new Set<string>()
    records.forEach(r => dateSet.add(r.date))
    return Array.from(dateSet).sort((a, b) => {
      const [am, ad] = a.split('/')
      const [bm, bd] = b.split('/')
      return new Date(2026, parseInt(bm) - 1, parseInt(bd)).getTime() - new Date(2026, parseInt(am) - 1, parseInt(ad)).getTime()
    })
  }

  // 按日期筛选的记录（项目视图）
  const getFilteredProjectRecords = (projectId: string) => {
    const projectRecords = records.filter(r => {
      if (r.projectId !== projectId) return false
      if (projectViewDate !== 'all' && r.date !== projectViewDate) return false
      return true
    })
    const dateMap = new Map<string, WorkRecord[]>()
    projectRecords.forEach(r => {
      if (!dateMap.has(r.date)) dateMap.set(r.date, [])
      dateMap.get(r.date)!.push(r)
    })
    return Array.from(dateMap.entries()).sort((a, b) => {
      const [am, ad] = a[0].split('/')
      const [bm, bd] = b[0].split('/')
      return new Date(2026, parseInt(bm) - 1, parseInt(bd)).getTime() - new Date(2026, parseInt(am) - 1, parseInt(ad)).getTime()
    })
  }

  // 专注模式日期筛选记录
  const getFocusModeRecords = (projectId: string) => {
    const projectRecords = records.filter(r => {
      if (r.projectId !== projectId) return false
      if (focusDateFilter !== 'all' && r.date !== focusDateFilter) return false
      return true
    })
    const dateMap = new Map<string, WorkRecord[]>()
    projectRecords.forEach(r => {
      if (!dateMap.has(r.date)) dateMap.set(r.date, [])
      dateMap.get(r.date)!.push(r)
    })
    return Array.from(dateMap.entries()).sort((a, b) => {
      const [am, ad] = a[0].split('/')
      const [bm, bd] = b[0].split('/')
      return new Date(2026, parseInt(bm) - 1, parseInt(bd)).getTime() - new Date(2026, parseInt(am) - 1, parseInt(ad)).getTime()
    })
  }

  const visibleProjects = projects.filter(p => p.visible)
  const regularProjects = visibleProjects.filter(p => p.id !== 'personal')
  const personalProject = projects.find(p => p.id === 'personal')

  const getProject = (id: string) => projects.find(p => p.id === id)

  // 获取所有日期
  const getAllDates = (): DayRecords[] => {
    const dateMap = new Map<string, DayRecords>()
    records.forEach(r => {
      if (!dateMap.has(r.date)) {
        const [month, day] = r.date.split('/')
        const d = new Date(2026, parseInt(month) - 1, parseInt(day))
        dateMap.set(r.date, { date: r.date, weekday: weekdays[d.getDay()], records: [] })
      }
      dateMap.get(r.date)!.records.push(r)
    })
    return Array.from(dateMap.values()).sort((a, b) => {
      const [am, ad] = a.date.split('/')
      const [bm, bd] = b.date.split('/')
      return new Date(2026, parseInt(bm) - 1, parseInt(bd)).getTime() - new Date(2026, parseInt(am) - 1, parseInt(ad)).getTime()
    })
  }

  // 添加新记录
  const handleAddRecord = () => {
    if (editorContent.trim() && editorContent !== '<br>') {
      const now = new Date()
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      const dateStr = formatDate(now)

      setRecords(prev => [...prev, {
        id: `r${Date.now()}`,
        projectId: selectedProject,
        content: editorContent,
        time: timeStr,
        date: dateStr,
        files: attachedFiles
      }])
      setEditorContent('')
      setAttachedFiles([])
    }
  }

  // 添加新项目
  const handleAddProject = () => {
    if (newProjectName.trim()) {
      const colors: ProjectWithFiles['color'][] = ['blue', 'green', 'purple', 'red']
      const year = currentYear
      const fullPath = `${defaultConfig.basePath}/${year}/${newProjectProvince}/${newProjectName}`
      const now = new Date().toISOString().split('T')[0]
      setProjects(prev => [...prev, {
        id: `p${Date.now()}`,
        name: newProjectName,
        province: newProjectProvince,
        year: year,
        color: colors[Math.floor(Math.random() * colors.length)],
        visible: true,
        fullPath: fullPath,
        folders: generateMockFolders(`${defaultConfig.basePath}/${year}/${newProjectProvince}`, newProjectName),
        createdAt: now,
        updatedAt: now
      }])
      setNewProjectName('')
      setShowProjectModal(false)
    }
  }

  // 隐藏/恢复项目
  const handleToggleProject = (projectId: string) => {
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, visible: !p.visible } : p
    ))
  }

  // 编辑相关
  const handleClickEdit = (record: WorkRecord) => {
    setEditingId(record.id)
    setEditContent(record.content)
    setEditFiles(record.files)
  }

  const handleSaveEdit = () => {
    if (editingId && editContent.trim()) {
      setRecords(prev => prev.map(r =>
        r.id === editingId ? { ...r, content: editContent, files: editFiles } : r
      ))
      setEditingId(null)
      setEditContent('')
      setEditFiles([])
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditContent('')
    setEditFiles([])
  }

  const handleDeleteRecord = (recordId: string) => {
    setRecords(prev => prev.filter(r => r.id !== recordId))
    setEditingId(null)
  }

  // 模拟粘贴文件
  const handlePasteFile = () => {
    const mockFile: AttachedFile = {
      id: `f${Date.now()}`,
      name: `文件_${Date.now()}.pdf`,
      type: 'pdf'
    }
    setAttachedFiles(prev => [...prev, mockFile])
  }

  const handleAddFileInEdit = () => {
    const mockFile: AttachedFile = {
      id: `f${Date.now()}`,
      name: `文件_${Date.now()}.docx`,
      type: 'doc'
    }
    setEditFiles(prev => [...prev, mockFile])
  }

  const removeAttachedFile = (fileId: string) => setAttachedFiles(prev => prev.filter(f => f.id !== fileId))
  const removeEditFile = (fileId: string) => setEditFiles(prev => prev.filter(f => f.id !== fileId))

  // 按项目分组记录
  const getProjectRecords = (projectId: string) => {
    const projectRecords = records.filter(r => r.projectId === projectId)
    const dateMap = new Map<string, WorkRecord[]>()
    projectRecords.forEach(r => {
      if (!dateMap.has(r.date)) dateMap.set(r.date, [])
      dateMap.get(r.date)!.push(r)
    })
    return Array.from(dateMap.entries()).sort((a, b) => {
      const [am, ad] = a[0].split('/')
      const [bm, bd] = b[0].split('/')
      return new Date(2026, parseInt(bm) - 1, parseInt(bd)).getTime() - new Date(2026, parseInt(am) - 1, parseInt(ad)).getTime()
    })
  }

  // 进入项目专注模式
  const handleEnterFocusMode = (projectId: string) => {
    setFocusDateFilter('all') // 重置筛选
    onFocusedProjectChange?.(projectId)
  }

  // 退出项目专注模式
  const handleExitFocusMode = () => {
    onFocusedProjectChange?.(null)
  }

  // 获取专注模式可选日期
  const getFocusAvailableDates = (projectId: string) => {
    const dateSet = new Set<string>()
    records.filter(r => r.projectId === projectId).forEach(r => dateSet.add(r.date))
    return Array.from(dateSet).sort((a, b) => {
      const [am, ad] = a.split('/')
      const [bm, bd] = b.split('/')
      return new Date(2026, parseInt(bm) - 1, parseInt(bd)).getTime() - new Date(2026, parseInt(am) - 1, parseInt(ad)).getTime()
    })
  }

  return (
    <>
      <main className="content-area">
      {/* 产品/项目详情页 - 统一专注模式 */}
      {(selectedProductId || focusedProjectId) && (
        (() => {
          // 确定当前专注的目标
          const isProduct = !!selectedProductId
          const targetId = isProduct ? selectedProductId! : focusedProjectId!

          // 获取目标信息
          const product = isProduct ? products.find(p => p.id === targetId) : null
          const project = !isProduct ? projects.find(p => p.id === targetId) : null

          if (!product && !project) return null

          // 获取目标名称、颜色、描述等
          const targetName = isProduct ? product!.name : project!.name
          const targetColor = isProduct ? product!.color : project!.color
          const targetInfo = isProduct
            ? `${product!.startYear}${product!.endYear ? `-${product!.endYear}` : '至今'}${product!.description ? ` · ${product!.description}` : ''}`
            : project!.province

          // 获取目标记录
          const targetRecords = isProduct
            ? (product!.records || [])
            : records.filter(r => r.projectId === targetId)

          // 获取专注模式日期筛选记录
          const getTargetFocusRecords = () => {
            const filteredRecords = targetRecords.filter(r => {
              if (focusDateFilter !== 'all' && r.date !== focusDateFilter) return false
              return true
            })
            const dateMap = new Map<string, WorkRecord[]>()
            filteredRecords.forEach(r => {
              if (!dateMap.has(r.date)) dateMap.set(r.date, [])
              dateMap.get(r.date)!.push(r)
            })
            return Array.from(dateMap.entries()).sort((a, b) => {
              const [am, ad] = a[0].split('/')
              const [bm, bd] = b[0].split('/')
              return new Date(2026, parseInt(bm) - 1, parseInt(bd)).getTime() - new Date(2026, parseInt(am) - 1, parseInt(ad)).getTime()
            })
          }

          // 获取可选日期列表
          const getTargetAvailableDates = () => {
            const dateSet = new Set<string>()
            targetRecords.forEach(r => dateSet.add(r.date))
            return Array.from(dateSet).sort((a, b) => {
              const [am, ad] = a.split('/')
              const [bm, bd] = b.split('/')
              return new Date(2026, parseInt(bm) - 1, parseInt(bd)).getTime() - new Date(2026, parseInt(am) - 1, parseInt(ad)).getTime()
            })
          }

          // 退出专注模式
          const handleExit = () => {
            if (isProduct) {
              onSelectedProductChange?.(null)
            } else {
              onFocusedProjectChange?.(null)
            }
          }

          return (
            <>
              {/* 工具栏 */}
              <div className="toolbar">
                <div className="focus-mode-header">
                  <button className="back-btn" onClick={handleExit}>
                    <IconChevronRight size={14} /> 返回
                  </button>
                  <span className={`dot ${targetColor}`}></span>
                  <span className="focus-project-name">{targetName}</span>
                  <span className="focus-project-province">{targetInfo}</span>
                </div>
                <div className="focus-date-filter">
                  <span className="filter-label">日期：</span>
                  <button
                    className={`filter-btn ${focusDateFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setFocusDateFilter('all')}
                  >
                    全部
                  </button>
                  {getTargetAvailableDates().map(date => (
                    <button
                      key={date}
                      className={`filter-btn ${focusDateFilter === date ? 'active' : ''}`}
                      onClick={() => setFocusDateFilter(date)}
                    >
                      {date}
                    </button>
                  ))}
                </div>
              </div>

              {/* 内容区 */}
              <div className="records-area focus-mode-records">
                {/* 产品文件夹区域（仅产品模式显示） */}
                {isProduct && product!.folders && product!.folders.length > 0 && (
                  <div className="product-folders-section">
                    <div className="section-label">产品文档</div>
                    <div className="product-folders-list">
                      {product!.folders.map(folder => (
                        <div key={folder.id} className="product-folder-item">
                          <div className="folder-header">
                            <IconFolder size={14} />
                            <span className="folder-name">{folder.name}</span>
                            <span className="folder-count">{folder.files.length}</span>
                          </div>
                          {folder.files.length > 0 && (
                            <div className="folder-files">
                              {folder.files.map(file => (
                                <div
                                  key={file.id}
                                  className="product-file-item clickable"
                                  onClick={() => handleOpenFile(file.fullPath)}
                                >
                                  <span className="file-icon">
                                    <FileTypeIcon type={file.type} />
                                  </span>
                                  <span className="file-name">{file.name}</span>
                                  <span className="file-ext">{file.extension}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 工作记录区域 */}
                <div className="focus-records-section">
                  <div className="section-label">工作记录</div>
                  {getTargetFocusRecords().length === 0 ? (
                    <div className="empty-hint">暂无记录</div>
                  ) : (
                    getTargetFocusRecords().map(([date, recs]) => {
                      const dateKey = `${targetId}-${date}`
                      const isDateExpanded = expandedDateGroups.has(dateKey)
                      return (
                        <div key={date} className="date-group focus-date-group">
                          <div
                            className="date-group-header"
                            onClick={() => handleToggleDateGroup(targetId, date)}
                          >
                            <span className="expand-toggle">
                              {isDateExpanded ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
                            </span>
                            <span className="date-group-label">{date}</span>
                            <span className="date-group-count">{recs.length}</span>
                          </div>
                          {isDateExpanded && (
                            <div className="date-group-records focus-records">
                              {recs.map(record => (
                                <div key={record.id} className={`record-focus-item ${inlineEditingId === record.id ? 'editing' : ''}`}>
                                  {inlineEditingId === record.id ? (
                                    <RichTextEditor
                                      className="mini"
                                      content={inlineEditContent}
                                      onContentChange={setInlineEditContent}
                                      attachedFiles={editFiles}
                                      onFileClick={(f) => { if (f.path) handleOpenFile(f.path); }}
                                      onFileRef={handleOpenFileSelector}
                                      onSubmit={handleInlineSave}
                                      onCancel={handleInlineCancel}
                                      submitHint="Ctrl+Enter 保存"
                                    />
                                  ) : (
                                    <div
                                      className="record-focus-content"
                                      onClick={() => handleInlineEdit(record)}
                                      onContextMenu={(e) => { e.preventDefault(); handleCreateTodoFromRecord(record); }}
                                    >
                                      <div className="record-focus-meta">
                                        <span className="record-focus-time">{record.time}</span>
                                        {record.linkedTodoIds && record.linkedTodoIds.length > 0 && (
                                          <span className="record-linked-badge" title="已关联待办">
                                            <IconLinked size={12} />
                                          </span>
                                        )}
                                      </div>
                                      <div className="record-focus-text" dangerouslySetInnerHTML={{ __html: record.content }} />
                                      {record.files.length > 0 && (
                                        <div className="record-focus-files">
                                          {record.files.map(f => (
                                            <span
                                              key={f.id}
                                              className="file-tag clickable"
                                              onClick={(e) => { e.stopPropagation(); if (f.path) handleOpenFile(f.path); }}
                                            >
                                              📎 {f.name}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </>
          )
        })()
      )}

      {/* 项目详情页（原有逻辑） */}
      {!selectedProductId && !focusedProjectId && (
        <>
        {/* 工具栏 */}
        <div className="toolbar">
          {/* 全局模式工具栏 */}
          <>
            <div className="view-switcher">
              <button className={`switch-btn ${viewType === 'project' ? 'active' : ''}`} onClick={() => onViewTypeChange?.('project')}>项目视图</button>
              <button className={`switch-btn ${viewType === 'date' ? 'active' : ''}`} onClick={() => onViewTypeChange?.('date')}>日期视图</button>
            </div>
            {viewType === 'project' && (
              <div className="date-filter-bar">
                <span className="filter-label">日期：</span>
                <button
                  className={`filter-btn ${projectViewDate === 'all' ? 'active' : ''}`}
                  onClick={() => setProjectViewDate('all')}
                >
                  全部
                </button>
                {getAvailableDates().map(date => (
                  <button
                    key={date}
                    className={`filter-btn ${projectViewDate === date ? 'active' : ''}`}
                    onClick={() => setProjectViewDate(date)}
                  >
                    {date}
                  </button>
                ))}
              </div>
            )}
          </>
        </div>

        {/* 内容区 - 根据视图切换 */}
        <div className="records-area">
          {viewType === 'date' ? (
            // 日期视图
            getAllDates().map(day => (
            <section key={day.date} className="day-section">
              <header className="day-header">
                <span className="day-date">{day.date}</span>
                <span className="day-weekday">{day.weekday}</span>
              </header>
              <div className="day-records">
                {day.records.map(record => {
                  const project = getProject(record.projectId)
                  return (
                    <div key={record.id} className={`record-item ${editingId === record.id ? 'editing' : ''}`}>
                      {editingId === record.id ? (
                        <div className="edit-form">
                          <textarea className="edit-field" value={editContent} onChange={e => setEditContent(e.target.value)} autoFocus
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit(); } if (e.key === 'Escape') handleCancelEdit(); }} />
                          <div className="edit-files">
                            {editFiles.map(f => <span key={f.id} className="file-tag"><FileTypeIcon type={f.type} /> {f.name}<button className="remove-file" onClick={() => removeEditFile(f.id)}><IconClose size={12} /></button></span>)}
                            <button className="add-file-btn" onClick={handleAddFileInEdit}><IconAttach size={14} /></button>
                          </div>
                          <div className="edit-actions">
                            <button className="btn save" onClick={handleSaveEdit}>保存</button>
                            <button className="btn cancel" onClick={handleCancelEdit}>取消</button>
                            <button className="btn delete" onClick={() => handleDeleteRecord(record.id)}>删除</button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="record-content"
                          onClick={() => handleClickEdit(record)}
                          onContextMenu={(e) => { e.preventDefault(); handleCreateTodoFromRecord(record); }}
                        >
                          <div className="record-meta">
                            <span className="record-time">{record.time}</span>
                            <span className={`record-project ${project?.color}`}><span className="dot"></span>{project?.name}</span>
                            {record.linkedTodoIds && record.linkedTodoIds.length > 0 && (
                              <span className="record-linked-badge" title="已关联待办">
                                <IconLinked size={12} />
                              </span>
                            )}
                          </div>
                          <div className="record-text" dangerouslySetInnerHTML={{ __html: record.content }} />
                          {record.files.length > 0 && (
                            <div className="record-files">{record.files.map(f => <span key={f.id} className="file-link"><FileTypeIcon type={f.type} /> {f.name}</span>)}</div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          ))
        ) : (
          // 项目视图 - 紧凑展示
          <>
            {/* 项目列表 - 紧凑模式 */}
            <div className="project-list-compact">
              {regularProjects.map(project => {
                const totalRecords = records.filter(r => r.projectId === project.id).length
                const isExpanded = expandedProjects.has(project.id)
                const projectRecords = getFilteredProjectRecords(project.id)
                return (
                  <div key={project.id} className="project-compact-item">
                    <div
                      className="project-compact-header"
                      onClick={() => handleToggleExpand(project.id)}
                    >
                      <span className="expand-toggle">
                        {isExpanded ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
                      </span>
                      <span className={`dot ${project.color}`}></span>
                      <span className="project-compact-name">{project.name}</span>
                      <span className="project-compact-count">{totalRecords}</span>
                      <button
                        className="focus-btn-inline"
                        onClick={(e) => { e.stopPropagation(); handleEnterFocusMode(project.id); }}
                        title="进入专注模式"
                      >
                        <IconFocus size={12} />
                        <span>专注</span>
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="project-compact-records">
                        {projectRecords.map(([date, recs]) => {
                          const dateKey = `${project.id}-${date}`
                          const isDateExpanded = expandedDateGroups.has(dateKey)
                          return (
                            <div key={dateKey} className="date-group-compact">
                              <div
                                className="date-group-header-compact"
                                onClick={() => handleToggleDateGroup(project.id, date)}
                              >
                                <span className="expand-toggle-small">
                                  {isDateExpanded ? <IconChevronDown size={10} /> : <IconChevronRight size={10} />}
                                </span>
                                <span className="date-label-compact">{date}</span>
                                <span className="date-count-compact">{recs.length}</span>
                              </div>
                              {isDateExpanded && (
                                <div className="date-records-compact">
                                  {recs.map(record => {
                                    const isEditing = inlineEditingId === record.id
                                    return (
                                      <div key={record.id} className={`record-compact-item ${isEditing ? 'editing' : ''}`}>
                                        {isEditing ? (
                                          <RichTextEditor
                                            className="mini"
                                            content={inlineEditContent}
                                            onContentChange={setInlineEditContent}
                                            attachedFiles={editFiles}
                                            onFileClick={(f) => { if (f.path) handleOpenFile(f.path); }}
                                            onFileRef={handleOpenFileSelector}
                                            onSubmit={handleInlineSave}
                                            submitHint="Ctrl+Enter 保存"
                                          />
                                        ) : (
                                          <div
                                            className="record-inline-view"
                                            onClick={() => handleInlineEdit(record)}
                                          >
                                            <span className="record-compact-time">{record.time}</span>
                                            <span className="record-compact-text">{stripHtml(record.content)}</span>
                                            {record.files.length > 0 && (
                                              <div className="record-files-inline">
                                                {record.files.slice(0, 2).map(f => (
                                                  <span key={f.id} className="file-tag-inline">
                                                    <FileTypeIcon type={f.type} />
                                                    {truncateFileName(f.name)}
                                                  </span>
                                                ))}
                                                {record.files.length > 2 && (
                                                  <span className="file-tag-inline more">+{record.files.length - 2}</span>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
              {/* 个人事项 */}
              {personalProject && personalProject.visible && (
                <div className="project-compact-item personal">
                  <div
                    className="project-compact-header"
                    onClick={() => handleToggleExpand('personal')}
                  >
                    <span className="expand-toggle">
                      {expandedProjects.has('personal') ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
                    </span>
                    <span className="dot orange"></span>
                    <span className="project-compact-name">{personalProject.name}</span>
                    <span className="project-compact-count">{records.filter(r => r.projectId === 'personal').length}</span>
                    <button
                      className="focus-btn-inline"
                      onClick={(e) => { e.stopPropagation(); handleEnterFocusMode('personal'); }}
                      title="进入专注模式"
                    >
                      <IconFocus size={12} />
                      <span>专注</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* 输入区 - 固定在底部，富文本编辑，可拖动 */}
      <div className="input-bar-fixed" style={{ height: editorHeight }}>
        <div className="editor-drag-handle" onMouseDown={handleEditorDragStart}>
          <span className="drag-line"></span>
        </div>

        <RichTextEditor
          showProjectSelector={!selectedProductId && !focusedProjectId}
          projects={visibleProjects}
          selectedProject={selectedProject}
          onProjectChange={setSelectedProject}
          content={editorContent}
          onContentChange={setEditorContent}
          attachedFiles={attachedFiles}
          onFileClick={(f) => { if (f.path) handleOpenFile(f.path); }}
          onFileRemove={removeAttachedFile}
          onFileAdd={handlePasteFile}
          onFileRef={handleOpenFileSelector}
          onSubmit={handleAddRecord}
          submitHint="Ctrl+Enter 发送"
          placeholder="记录工作内容..."
        />
      </div>
      </>
      )}

      {/* 项目管理弹窗 */}
      {showProjectModal && (
        <div className="modal-overlay" onClick={() => setShowProjectModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <header className="modal-header">
              <h3>项目管理</h3>
              <button className="modal-close" onClick={() => setShowProjectModal(false)}><IconClose size={16} /></button>
            </header>
            <div className="modal-body">
              <div className="project-list">
                {projects.filter(p => p.id !== 'personal').map(p => (
                  <div key={p.id} className="project-row">
                    <span className={`dot ${p.color}`}></span>
                    <span className="row-name">{p.name}</span>
                    <span className="row-province">{p.province}</span>
                    <button className={`toggle-btn ${p.visible ? 'hide' : 'show'}`} onClick={() => handleToggleProject(p.id)}>
                      {p.visible ? '隐藏' : '显示'}
                    </button>
                  </div>
                ))}
              </div>
              <div className="add-project-form">
                <input className="form-input" placeholder="项目名称" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} />
                <select className="form-select" value={newProjectProvince} onChange={e => setNewProjectProvince(e.target.value)}>
                  <option value="浙江">浙江</option>
                  <option value="江苏">江苏</option>
                  <option value="安徽">安徽</option>
                  <option value="上海">上海</option>
                </select>
                <button className="btn add" onClick={handleAddProject}>添加项目</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>

      {/* 项目清单弹窗 */}
      {showProjectChecklist && checklistProjectId && (
        <ProjectChecklist
          projectId={checklistProjectId}
          onClose={() => setShowProjectChecklist(false)}
        />
      )}

      {/* 创建待办弹窗 */}
      {showCreateTodoModal && (
        <div className="modal-overlay" onClick={handleCancelCreateTodo}>
          <div className="create-todo-modal" onClick={e => e.stopPropagation()}>
            <header className="modal-header">
              <h3>创建跟进待办</h3>
              <button className="modal-close" onClick={handleCancelCreateTodo}><IconClose size={16} /></button>
            </header>
            <div className="modal-body">
              <div className="form-field">
                <label>待办内容</label>
                <input
                  className="form-input"
                  value={newTodoText}
                  onChange={e => setNewTodoText(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>截止日期</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newTodoDueDate}
                    onChange={e => setNewTodoDueDate(e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label>优先级</label>
                  <select
                    className="form-select"
                    value={newTodoPriority}
                    onChange={e => setNewTodoPriority(e.target.value as 'high' | 'medium' | 'low')}
                  >
                    <option value="high">高</option>
                    <option value="medium">中</option>
                    <option value="low">低</option>
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button className="btn cancel" onClick={handleCancelCreateTodo}>取消</button>
                <button className="btn primary" onClick={handleConfirmCreateTodo}>创建</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 文件选择器弹窗 */}
      {showFileSelectorModal && (
        <div className="modal-overlay" onClick={handleCancelFileRef}>
          <div className="file-selector-modal" onClick={e => e.stopPropagation()}>
            <header className="modal-header">
              <h3>引用文档</h3>
              <button className="modal-close" onClick={handleCancelFileRef}><IconClose size={16} /></button>
            </header>
            <div className="modal-body">
              <div className="file-selector-project-list">
                {projects.filter(p => p.folders.length > 0).map(p => (
                  <button
                    key={p.id}
                    className={`file-selector-project-btn ${selectedRefProject === p.id ? 'active' : ''}`}
                    onClick={() => handleSelectRefProject(p.id)}
                  >
                    <span className={`dot ${p.color}`}></span>
                    {p.name}
                  </button>
                ))}
              </div>
              {selectedRefProject && (
                <div className="file-selector-folder-list">
                  {projects.find(p => p.id === selectedRefProject)?.folders.map(f => (
                    <button
                      key={f.id}
                      className={`file-selector-folder-btn ${selectedRefFolder === f.id ? 'active' : ''}`}
                      onClick={() => handleSelectRefFolder(f.id)}
                    >
                      <IconFolder size={14} /> {f.name}
                    </button>
                  ))}
                </div>
              )}
              {selectedRefFolder && (
                <div className="file-selector-file-list">
                  {(() => {
                    const project = projects.find(p => p.id === selectedRefProject)
                    const folder = project?.folders.find(f => f.id === selectedRefFolder)
                    const files = folder?.files || []
                    return files.length > 0 ? (
                      files.map(file => (
                        <button
                          key={file.id}
                          className={`file-selector-file-btn ${selectedRefFile?.id === file.id ? 'active' : ''}`}
                          onClick={() => setSelectedRefFile(file)}
                        >
                          <FileTypeIcon type={file.type} /> {file.name}{file.extension}
                        </button>
                      ))
                    ) : (
                      <div className="file-selector-empty">该文件夹无文件</div>
                    )
                  })()}
                </div>
              )}
              <div className="form-actions">
                <button className="btn cancel" onClick={handleCancelFileRef}>取消</button>
                <button className="btn primary" disabled={!selectedRefFile} onClick={handleConfirmFileRef}>引用</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ContentArea