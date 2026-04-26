import { useState, useRef, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Product, ProjectWithFiles, QuickTask, WorkRecord, AttachedFile, HistoryFile, FileItem } from '../types'
import { IconChevronRight, IconChevronDown, IconFile, IconFileText, IconFileSpreadsheet, IconFilePresentation, IconFilePdf, IconPin, IconPinOff, IconClose, IconStar, IconStarOff } from './Icons'
import RichTextEditor from './RichTextEditor'
import { analyzeProductFileEvolution } from '../services/fileRelationService'
import './GlobalOverview.css'

// 文件类型图标组件
const FileTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'pdf': return <IconFilePdf size={14} />
    case 'doc': return <IconFileText size={14} />
    case 'xls': return <IconFileSpreadsheet size={14} />
    case 'ppt': return <IconFilePresentation size={14} />
    default: return <IconFile size={14} />
  }
}

// 打开文件
const handleOpenFile = async (filePath: string) => {
  try {
    await invoke('open_file', { path: filePath })
  } catch (error) {
    console.error('Failed to open file:', error)
  }
}

interface GlobalOverviewProps {
  products: Product[]
  projects: ProjectWithFiles[]
  quickTasks: QuickTask[]
  onSelectProduct: (id: string) => void
  onSelectProject: (id: string) => void
  showFileRelation?: boolean
  onAddRecord?: (targetId: string, targetType: 'product' | 'project', content: string, files: AttachedFile[]) => void
  onUpdateRecord?: (targetId: string, targetType: 'product' | 'project', recordId: string, content: string, files: AttachedFile[]) => void
  onAddTodo?: (title: string, priority: string) => void
  // 专注模式参数
  focusedTargetId?: string | null
  focusedTargetType?: 'product' | 'project'
  onExitFocus?: () => void
  // 历史文件更新回调
  onAddHistoryFile?: (file: FileItem, targetId: string, targetType: 'product' | 'project') => void
}

// 按日期分组记录（降序）
const groupRecordsByDate = (records: WorkRecord[]): [string, WorkRecord[]][] => {
  const dateMap = new Map<string, WorkRecord[]>()
  records.forEach(record => {
    if (!dateMap.has(record.date)) dateMap.set(record.date, [])
    dateMap.get(record.date)!.push(record)
  })
  return Array.from(dateMap.entries()).sort((a, b) => {
    return b[0].localeCompare(a[0])
  })
}

// 格式化日期显示
const formatDateDisplay = (dateStr: string) => {
  if (dateStr.includes('/')) return dateStr
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

// 提取记录纯文本（去掉文件标签及其内容）
const extractRecordText = (htmlContent: string): string => {
  // 先去掉文件标签（整个span及其内容）
  let text = htmlContent.replace(/<span[^>]*class="[^"]*file-tag[^"]*"[^>]*>.*?<\/span>/gi, '')
  // 去掉其他HTML标签
  text = text.replace(/<[^>]*>/g, '')
  // 清理多余空白和&nbsp;
  text = text.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
  return text
}

// 从HTML内容中提取文件标签信息
const extractFileTagsFromContent = (htmlContent: string): Array<{name: string, path: string, type: string}> => {
  const files: Array<{name: string, path: string, type: string}> = []
  const regex = /<span[^>]*class="[^"]*file-tag[^"]*"[^>]*data-file-path="([^"]*)"[^>]*data-file-name="([^"]*)"[^>]*data-file-type="([^"]*)"[^>]*>.*?<\/span>/gi
  let match
  while ((match = regex.exec(htmlContent)) !== null) {
    files.push({
      path: match[1],
      name: match[2],
      type: match[3]
    })
  }
  return files
}

function GlobalOverview({
  products,
  projects,
  quickTasks,
  onSelectProduct,
  onSelectProject,
  showFileRelation = false,
  onAddRecord,
  onUpdateRecord,
  onAddTodo,
  focusedTargetId,
  focusedTargetType,
  onExitFocus,
  onAddHistoryFile,
}: GlobalOverviewProps) {
  // 判断是否为专注模式
  const isFocusMode = !!focusedTargetId && !!focusedTargetType

  // 获取专注目标信息
  const focusedProduct = isFocusMode && focusedTargetType === 'product'
    ? products.find(p => p.id === focusedTargetId)
    : null
  const focusedProject = isFocusMode && focusedTargetType === 'project'
    ? projects.find(p => p.id === focusedTargetId)
    : null

  // 历史文件状态（最近打开的文件）
  const [historyFiles, setHistoryFiles] = useState<HistoryFile[]>([])
  const MAX_HISTORY_FILES = 10

  // 加载历史文件（从 localStorage）
  useEffect(() => {
    const savedHistory = localStorage.getItem('workhub-history-files')
    if (savedHistory) {
      try {
        setHistoryFiles(JSON.parse(savedHistory))
      } catch (e) {
        console.error('Failed to load history files:', e)
      }
    }
  }, [])

  // 保存历史文件到 localStorage
  useEffect(() => {
    localStorage.setItem('workhub-history-files', JSON.stringify(historyFiles))
  }, [historyFiles])

  // 监听添加文件到历史记录的事件（从新建文本文件保存时触发）
  useEffect(() => {
    const handleAddFileToHistory = (e: CustomEvent) => {
      const { file, targetId, targetType, targetName } = e.detail
      addToHistory(file, targetId, targetType, targetName)
    }
    window.addEventListener('add-file-to-history', handleAddFileToHistory as EventListener)
    return () => {
      window.removeEventListener('add-file-to-history', handleAddFileToHistory as EventListener)
    }
  }, [])

  // 添加文件到历史记录
  const addToHistory = (file: FileItem, targetId: string, targetType: 'product' | 'project', targetName: string) => {
    const now = new Date().toISOString()
    const existingIndex = historyFiles.findIndex(h => h.fileId === file.id)

    if (existingIndex >= 0) {
      // 更新已存在的历史记录
      setHistoryFiles(prev => {
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          lastOpenedAt: now,
          openCount: updated[existingIndex].openCount + 1
        }
        // 按置顶和最近打开时间排序
        return updated.sort((a, b) => {
          if (a.pinned !== b.pinned) return b.pinned ? 1 : -1
          return b.lastOpenedAt.localeCompare(a.lastOpenedAt)
        })
      })
    } else {
      // 添加新的历史记录
      const newHistory: HistoryFile = {
        id: `history_${Date.now()}`,
        fileId: file.id,
        name: file.name,
        type: file.type,
        extension: file.extension,
        fullPath: file.fullPath,
        targetId,
        targetType,
        targetName,
        openedAt: now,
        lastOpenedAt: now,
        openCount: 1,
        pinned: false
      }
      setHistoryFiles(prev => {
        const updated = [newHistory, ...prev.filter(h => !h.pinned)].slice(0, MAX_HISTORY_FILES)
        // 置顶的文件保持在列表中
        const pinned = prev.filter(h => h.pinned)
        return [...pinned, ...updated.filter(h => !h.pinned)].slice(0, MAX_HISTORY_FILES)
      })
    }
  }

  // 删除历史记录
  const removeFromHistory = (historyId: string) => {
    setHistoryFiles(prev => prev.filter(h => h.id !== historyId))
  }

  // 置顶/取消置顶
  const togglePinHistory = (historyId: string) => {
    setHistoryFiles(prev => {
      const updated = prev.map(h =>
        h.id === historyId ? { ...h, pinned: !h.pinned } : h
      )
      // 按置顶和最近打开时间排序
      return updated.sort((a, b) => {
        if (a.pinned !== b.pinned) return b.pinned ? 1 : -1
        return b.lastOpenedAt.localeCompare(a.lastOpenedAt)
      })
    })
  }

  // 获取当前目标的历史文件
  const getTargetHistoryFiles = (targetId: string) => {
    return historyFiles.filter(h => h.targetId === targetId)
  }

  // 编辑状态
  const [editingRecord, setEditingRecord] = useState<WorkRecord | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editFiles, setEditFiles] = useState<AttachedFile[]>([])
  const [editTargetId, setEditTargetId] = useState<string>('')
  const [editTargetType, setEditTargetType] = useState<'product' | 'project'>('product')

  // 新建记录状态
  const [newRecordContent, setNewRecordContent] = useState('')
  const [newRecordFiles, setNewRecordFiles] = useState<AttachedFile[]>([])
  // 专注模式下默认目标是当前专注目标（初始值）
  const [newRecordTarget, setNewRecordTarget] = useState<string>(products[0]?.id || '')
  const [newRecordTargetType, setNewRecordTargetType] = useState<'product' | 'project'>('product')

  // 当进入/切换专注模式时，同步目标状态
  useEffect(() => {
    if (isFocusMode && focusedTargetId && focusedTargetType) {
      setNewRecordTarget(focusedTargetId)
      setNewRecordTargetType(focusedTargetType)
    }
  }, [isFocusMode, focusedTargetId, focusedTargetType])

  // 折叠状态
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [expandedDateGroups, setExpandedDateGroups] = useState<Set<string>>(new Set())

  // 编辑区高度
  const [editorHeight, setEditorHeight] = useState(180)
  const isDraggingEditorRef = useRef(false)
  const editorContainerRef = useRef<HTMLDivElement>(null)
  const fileDropRef = useRef<HTMLDivElement>(null)
  const [isDraggingFile, setIsDraggingFile] = useState(false)

  const activeProjects = projects.filter(p => p.visible && p.id !== 'personal')

  // 切换组展开/收起
  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupId)) newSet.delete(groupId)
      else newSet.add(groupId)
      return newSet
    })
  }

  // 切换日期组展开/收起
  const toggleDateGroup = (dateKey: string) => {
    setExpandedDateGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(dateKey)) newSet.delete(dateKey)
      else newSet.add(dateKey)
      return newSet
    })
  }

  // 渲染日期分组的记录（可复用）
  const renderDateGroups = (records: WorkRecord[], targetId: string, targetType: 'product' | 'project') => {
    const dateGroups = groupRecordsByDate(records)
    if (dateGroups.length === 0) {
      return <div className="empty-hint">暂无记录</div>
    }

    return dateGroups.map(([date, recs]) => {
      const groupId = `${targetType}-${targetId}`
      const dateKey = `${groupId}-${date}`
      const isDateExpanded = expandedDateGroups.has(dateKey) || dateGroups.length === 1

      return (
        <div key={dateKey} className="date-group">
          <div
            className="date-group-header clickable"
            onClick={() => toggleDateGroup(dateKey)}
          >
            <span className="expand-toggle-small">
              {isDateExpanded ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
            </span>
            <span className="date-label">{formatDateDisplay(date)}</span>
            <span className="date-count">{recs.length}</span>
          </div>
          {isDateExpanded && (
            <div className="date-records">
              {recs.map(record => {
                // 从内容中提取文件标签
                const contentFiles = extractFileTagsFromContent(record.content)
                const displayFiles = record.files && record.files.length > 0 ? record.files : contentFiles

                return (
                  <div
                    key={record.id}
                    className="record-item clickable"
                    onClick={() => handleRecordClick(record, targetId, targetType)}
                  >
                    <div className="record-main-row">
                      <span className="record-time">{record.time}</span>
                      <span className="record-text">
                        {extractRecordText(record.content).slice(0, 80)}
                        {extractRecordText(record.content).length > 80 && '...'}
                      </span>
                    </div>
                    {displayFiles && displayFiles.length > 0 && (
                      <div className="record-files-inline">
                        {displayFiles.slice(0, 3).map((file, idx) => (
                          <div
                            key={file.id || `content-file-${idx}`}
                            className="file-row-mini"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (file.path) handleOpenFile(file.path)
                            }}
                          >
                            <span className="file-icon"><FileTypeIcon type={file.type || 'doc'} /></span>
                            <span className="file-name">{file.name}</span>
                          </div>
                        ))}
                        {displayFiles.length > 3 && (
                          <span className="files-more">+{displayFiles.length - 3}</span>
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
    })
  }

  // 点击记录进入编辑模式
  const handleRecordClick = (record: WorkRecord, targetId: string, targetType: 'product' | 'project') => {
    setEditingRecord(record)
    setEditContent(record.content)
    setEditFiles(record.files || [])
    setEditTargetId(targetId)
    setEditTargetType(targetType)
  }

  // 保存编辑
  const handleSaveEdit = () => {
    if (editingRecord && editContent.trim()) {
      onUpdateRecord?.(editTargetId, editTargetType, editingRecord.id, editContent, editFiles)
      setEditingRecord(null)
      setEditContent('')
      setEditFiles([])
    }
  }

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingRecord(null)
    setEditContent('')
    setEditFiles([])
  }

  // 添加新记录 - 带内容的提交
  const handleAddRecordWithContent = (content: string, files: AttachedFile[]) => {
    if (content.trim()) {
      onAddRecord?.(newRecordTarget, newRecordTargetType, content, files)
      setNewRecordContent('')
      setNewRecordFiles([])
    }
  }

  // 添加新记录 - 不带内容的提交（fallback）
  const handleAddRecord = () => {
    if (newRecordContent.trim()) {
      onAddRecord?.(newRecordTarget, newRecordTargetType, newRecordContent, newRecordFiles)
      setNewRecordContent('')
      setNewRecordFiles([])
    }
  }

  // 保存编辑 - 带内容
  const handleSaveEditWithContent = (content: string, files: AttachedFile[]) => {
    if (editingRecord && content.trim()) {
      onUpdateRecord?.(editTargetId, editTargetType, editingRecord.id, content, files)
      setEditingRecord(null)
      setEditContent('')
      setEditFiles([])
    }
  }

  // 编辑区拖动处理
  const handleEditorDragStart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    isDraggingEditorRef.current = true
  }

  useEffect(() => {
    const handleEditorDrag = (e: MouseEvent) => {
      if (!isDraggingEditorRef.current || !editorContainerRef.current) return
      const container = editorContainerRef.current.parentElement
      if (!container) return
      const containerRect = container.getBoundingClientRect()
      const maxHeight = containerRect.height - 60
      const minHeight = 120
      const newHeight = Math.max(minHeight, Math.min(maxHeight, containerRect.bottom - e.clientY))
      setEditorHeight(newHeight)
    }

    const handleEditorDragEnd = () => {
      isDraggingEditorRef.current = false
    }

    window.addEventListener('mousemove', handleEditorDrag)
    window.addEventListener('mouseup', handleEditorDragEnd)
    return () => {
      window.removeEventListener('mousemove', handleEditorDrag)
      window.removeEventListener('mouseup', handleEditorDragEnd)
    }
  }, [])

  // 文件拖入处理
  useEffect(() => {
    const dropArea = fileDropRef.current
    if (!dropArea) return

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault()
      setIsDraggingFile(true)
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      setIsDraggingFile(false)
    }

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      setIsDraggingFile(false)

      const files = e.dataTransfer?.files
      if (files && files.length > 0) {
        const newFiles: AttachedFile[] = Array.from(files).map(file => ({
          id: `file_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          name: file.name,
          type: file.name.split('.').pop() || 'unknown',
          size: file.size,
          path: file.path || ''
        }))

        if (editingRecord) {
          setEditFiles(prev => [...prev, ...newFiles])
        } else {
          setNewRecordFiles(prev => [...prev, ...newFiles])
        }
      }
    }

    dropArea.addEventListener('dragenter', handleDragEnter)
    dropArea.addEventListener('dragleave', handleDragLeave)
    dropArea.addEventListener('dragover', handleDragOver)
    dropArea.addEventListener('drop', handleDrop)

    return () => {
      dropArea.removeEventListener('dragenter', handleDragEnter)
      dropArea.removeEventListener('dragleave', handleDragLeave)
      dropArea.removeEventListener('dragover', handleDragOver)
      dropArea.removeEventListener('drop', handleDrop)
    }
  }, [editingRecord])

  // 构建列表数据：产品及其关联项目
  // 显示所有产品，不管有没有项目关联
  const productsWithProjects = products

  // 目标选择列表（产品+项目+个人事项）
  const targetOptions = [
    ...products.map(p => ({ id: p.id, name: p.name, color: p.color, type: 'product' as const })),
    ...activeProjects.filter(p => p.id !== 'personal').map(p => ({ id: p.id, name: p.name, color: p.color, type: 'project' as const })),
    { id: 'personal', name: '个人事项', color: 'orange', type: 'project' as const }
  ]

  // 获取目标名称
  const getTargetName = (targetId: string, targetType: 'product' | 'project') => {
    if (targetType === 'product') {
      return products.find(p => p.id === targetId)?.name || ''
    }
    return projects.find(p => p.id === targetId)?.name || ''
  }

  return (
    <div className="global-overview">
      {/* 文件关联展开区域 - 仅非专注模式 */}
      {!isFocusMode && showFileRelation && (
        <div className="file-relation-panel">
          {productsWithProjects.map(product => {
            const relatedProjects = projects.filter(p => p.productId === product.id)
            const evolution = analyzeProductFileEvolution(product, relatedProjects)
            const productFiles = product.folders.flatMap(f => f.files)

            return (
              <div key={product.id} className="file-relation-item">
                <div className="file-relation-header">
                  <span className={`color-dot ${product.color}`}></span>
                  <span className="product-name">{product.name}</span>
                  <span className="file-count">{productFiles.length}个产品文件</span>
                </div>
                <div className="file-relation-content">
                  {productFiles.map(file => {
                    const derivedFiles = evolution.get(file) || []
                    return (
                      <div key={file.id} className="file-row">
                        <span className="source-file">{file.name}{file.extension}</span>
                        {derivedFiles.length > 0 && (
                          <>
                            <span className="derived-arrow">→</span>
                            <span className="derived-count">{derivedFiles.length}个衍生文件</span>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 记录列表区 - 按日期分组展示 */}
      <section className="overview-section records-scroll-area">
        {/* 专注模式：只显示当前目标的记录 */}
        {isFocusMode && focusedProduct && (
          <>
            {/* 产品文档卡片 - 历史/置顶文件 + 新建文本按钮 */}
            <div className="focus-files-card">
              <div className="focus-files-header">
                <span className="focus-files-title">历史打开的文件</span>
                <button
                  className="add-text-file-btn"
                  onClick={() => {
                    // 触发新建文本文件事件
                    window.dispatchEvent(new CustomEvent('create-text-file', {
                      detail: { targetType: 'product', targetId: focusedProduct.id }
                    }))
                  }}
                  title="新建文本文件"
                >
                  <IconFileText size={14} /> 新建文本
                </button>
              </div>
              <div className="focus-files-list">
                {getTargetHistoryFiles(focusedProduct.id).slice(0, 5).map(historyFile => (
                  <div
                    key={historyFile.id}
                    className="history-file-row"
                    onClick={() => {
                      // txt 文件直接进入编辑区
                      if (historyFile.type === 'txt' || historyFile.extension === '.txt') {
                        window.dispatchEvent(new CustomEvent('edit-text-file', {
                          detail: {
                            fileId: historyFile.fileId,
                            fileName: historyFile.name,
                            content: '',
                            targetId: historyFile.targetId,
                            targetType: historyFile.targetType,
                            fullPath: historyFile.fullPath
                          }
                        }))
                      } else {
                        handleOpenFile(historyFile.fullPath)
                      }
                    }}
                    title={`${historyFile.name}${historyFile.extension}`}
                  >
                    <span className="file-icon">
                      <FileTypeIcon type={historyFile.type} />
                    </span>
                    <span className="file-name">{historyFile.name}</span>
                    <span className="file-ext">{historyFile.extension}</span>
                    {historyFile.pinned && <IconStar size={12} className="pinned-icon" />}
                    <div className="history-file-actions">
                      <button
                        className="action-btn-small"
                        onClick={(e) => { e.stopPropagation(); togglePinHistory(historyFile.id) }}
                        title={historyFile.pinned ? '取消置顶' : '置顶'}
                      >
                        {historyFile.pinned ? <IconStarOff size={12} /> : <IconStar size={12} />}
                      </button>
                      <button
                        className="action-btn-small"
                        onClick={(e) => { e.stopPropagation(); removeFromHistory(historyFile.id) }}
                        title="删除"
                      >
                        <IconClose size={12} />
                      </button>
                    </div>
                  </div>
                ))}
                {getTargetHistoryFiles(focusedProduct.id).length === 0 && (
                  <div className="focus-files-empty">暂无历史文件</div>
                )}
              </div>
            </div>

            {/* 产品记录 */}
            <div className="focus-records-section">
              {renderDateGroups(focusedProduct.records || [], focusedProduct.id, 'product')}
            </div>
          </>
        )}

        {isFocusMode && focusedProject && (
          <>
            {/* 项目文档卡片 - 历史/置顶文件 + 新建文本按钮 */}
            <div className="focus-files-card">
              <div className="focus-files-header">
                <span className="focus-files-title">历史打开的文件</span>
                <button
                  className="add-text-file-btn"
                  onClick={() => {
                    // 触发新建文本文件事件
                    window.dispatchEvent(new CustomEvent('create-text-file', {
                      detail: { targetType: 'project', targetId: focusedProject.id }
                    }))
                  }}
                  title="新建文本文件"
                >
                  <IconFileText size={14} /> 新建文本
                </button>
              </div>
              <div className="focus-files-list">
                {getTargetHistoryFiles(focusedProject.id).slice(0, 5).map(historyFile => (
                  <div
                    key={historyFile.id}
                    className="history-file-row"
                    onClick={() => {
                      // txt 文件直接进入编辑区
                      if (historyFile.type === 'txt' || historyFile.extension === '.txt') {
                        window.dispatchEvent(new CustomEvent('edit-text-file', {
                          detail: {
                            fileId: historyFile.fileId,
                            fileName: historyFile.name,
                            content: '',
                            targetId: historyFile.targetId,
                            targetType: historyFile.targetType,
                            fullPath: historyFile.fullPath
                          }
                        }))
                      } else {
                        handleOpenFile(historyFile.fullPath)
                      }
                    }}
                    title={`${historyFile.name}${historyFile.extension}`}
                  >
                    <span className="file-icon">
                      <FileTypeIcon type={historyFile.type} />
                    </span>
                    <span className="file-name">{historyFile.name}</span>
                    <span className="file-ext">{historyFile.extension}</span>
                    {historyFile.pinned && <IconStar size={12} className="pinned-icon" />}
                    <div className="history-file-actions">
                      <button
                        className="action-btn-small"
                        onClick={(e) => { e.stopPropagation(); togglePinHistory(historyFile.id) }}
                        title={historyFile.pinned ? '取消置顶' : '置顶'}
                      >
                        {historyFile.pinned ? <IconStarOff size={12} /> : <IconStar size={12} />}
                      </button>
                      <button
                        className="action-btn-small"
                        onClick={(e) => { e.stopPropagation(); removeFromHistory(historyFile.id) }}
                        title="删除"
                      >
                        <IconClose size={12} />
                      </button>
                    </div>
                  </div>
                ))}
                {getTargetHistoryFiles(focusedProject.id).length === 0 && (
                  <div className="focus-files-empty">暂无历史文件</div>
                )}
              </div>
            </div>

            {/* 项目记录 */}
            <div className="focus-records-section">
              {renderDateGroups(focusedProject.records || [], focusedProject.id, 'project')}
            </div>
          </>
        )}

        {/* 非专注模式：显示所有产品和项目 */}
        {!isFocusMode && (
          <>
            {/* 产品区块 */}
            {products.map(product => {
          const productRecords = product.records || []
          const relatedProjects = activeProjects.filter(p => p.productId === product.id)
          const groupId = `product-${product.id}`
          const isExpanded = expandedGroups.has(groupId)
          const dateGroups = groupRecordsByDate(productRecords)

          return (
            <div key={product.id} className="record-group">
              {/* 产品标题行 */}
              <div
                className="record-group-header clickable"
                onClick={() => toggleGroup(groupId)}
              >
                <span className="expand-toggle">
                  {isExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                </span>
                <span className="type-tag product-tag">产品</span>
                <span className={`color-dot ${product.color}`}></span>
                <span className="group-title">{product.name}</span>
                <span className="record-count">{productRecords.length}条记录</span>
                <button
                  className="item-action-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectProduct(product.id)
                  }}
                >
                  详情
                </button>
              </div>

              {/* 产品记录 - 按日期分组 */}
              {isExpanded && dateGroups.map(([date, records]) => {
                const dateKey = `${groupId}-${date}`
                const isDateExpanded = expandedDateGroups.has(dateKey) || dateGroups.length === 1

                return (
                  <div key={dateKey} className="date-group">
                    <div
                      className="date-group-header clickable"
                      onClick={() => toggleDateGroup(dateKey)}
                    >
                      <span className="expand-toggle-small">
                        {isDateExpanded ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
                      </span>
                      <span className="date-label">{formatDateDisplay(date)}</span>
                      <span className="date-count">{records.length}</span>
                    </div>
                    {isDateExpanded && (
                      <div className="date-records">
                        {records.map(record => {
                          const contentFiles = extractFileTagsFromContent(record.content)
                          const displayFiles = record.files && record.files.length > 0 ? record.files : contentFiles

                          return (
                            <div
                              key={record.id}
                              className="record-item clickable"
                              onClick={() => handleRecordClick(record, product.id, 'product')}
                            >
                              <div className="record-main-row">
                                <span className="record-time">{record.time}</span>
                                <span className="record-text">
                                  {extractRecordText(record.content).slice(0, 80)}
                                  {extractRecordText(record.content).length > 80 && '...'}
                                </span>
                              </div>
                              {displayFiles && displayFiles.length > 0 && (
                                <div className="record-files-inline">
                                  {displayFiles.slice(0, 3).map((file, idx) => (
                                    <div
                                      key={file.id || `content-file-${idx}`}
                                      className="file-row-mini"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        if (file.path) handleOpenFile(file.path)
                                      }}
                                    >
                                      <span className="file-icon"><FileTypeIcon type={file.type || 'doc'} /></span>
                                      <span className="file-name">{file.name}</span>
                                    </div>
                                  ))}
                                  {displayFiles.length > 3 && (
                                    <span className="files-more">+{displayFiles.length - 3}</span>
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

              {/* 关联项目 */}
              {isExpanded && relatedProjects.map(project => {
                const projectRecords = project.records || []
                const projectGroupId = `project-${project.id}`
                const isProjectExpanded = expandedGroups.has(projectGroupId)
                const projectDateGroups = groupRecordsByDate(projectRecords)

                return (
                  <div key={project.id} className="nested-project">
                    <div
                      className="record-group-header nested clickable"
                      onClick={() => toggleGroup(projectGroupId)}
                    >
                      <span className="expand-toggle">
                        {isProjectExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                      </span>
                      <span className="type-tag project-tag">项目</span>
                      <span className={`color-dot ${project.color}`}></span>
                      <span className="group-title">{project.name}</span>
                      <span className="group-meta">{project.province} · {project.year}</span>
                      <span className="record-count">{projectRecords.length}条</span>
                      <button
                        className="item-action-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectProject(project.id)
                        }}
                      >
                        详情
                      </button>
                    </div>

                    {/* 项目记录 - 按日期分组 */}
                    {isProjectExpanded && projectDateGroups.map(([date, records]) => {
                      const dateKey = `${projectGroupId}-${date}`
                      const isDateExpanded = expandedDateGroups.has(dateKey) || projectDateGroups.length === 1

                      return (
                        <div key={dateKey} className="date-group nested">
                          <div
                            className="date-group-header clickable"
                            onClick={() => toggleDateGroup(dateKey)}
                          >
                            <span className="expand-toggle-small">
                              {isDateExpanded ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
                            </span>
                            <span className="date-label">{formatDateDisplay(date)}</span>
                            <span className="date-count">{records.length}</span>
                          </div>
                          {isDateExpanded && (
                            <div className="date-records">
                              {records.map(record => {
                                const contentFiles = extractFileTagsFromContent(record.content)
                                const displayFiles = record.files && record.files.length > 0 ? record.files : contentFiles

                                return (
                                  <div
                                    key={record.id}
                                    className="record-item clickable"
                                    onClick={() => handleRecordClick(record, project.id, 'project')}
                                  >
                                    <div className="record-main-row">
                                      <span className="record-time">{record.time}</span>
                                      <span className="record-text">
                                        {extractRecordText(record.content).slice(0, 80)}
                                        {extractRecordText(record.content).length > 80 && '...'}
                                      </span>
                                    </div>
                                    {displayFiles && displayFiles.length > 0 && (
                                      <div className="record-files-inline">
                                        {displayFiles.slice(0, 3).map((file, idx) => (
                                          <div
                                            key={file.id || `content-file-${idx}`}
                                            className="file-row-mini"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              if (file.path) handleOpenFile(file.path)
                                            }}
                                          >
                                            <span className="file-icon"><FileTypeIcon type={file.type || 'doc'} /></span>
                                            <span className="file-name">{file.name}</span>
                                          </div>
                                        ))}
                                        {displayFiles.length > 3 && (
                                          <span className="files-more">+{displayFiles.length - 3}</span>
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
                )
              })}
            </div>
          )
        })}

        {/* 个人事项区块 - 始终显示在最后 */}
        {(() => {
          const personalProject = projects.find(p => p.id === 'personal')
          if (!personalProject) return null
          const personalRecords = personalProject.records || []
          const groupId = `project-personal`
          const isExpanded = expandedGroups.has(groupId) || personalRecords.length > 0
          const dateGroups = groupRecordsByDate(personalRecords)

          return (
            <div key="personal" className="record-group personal-group">
              <div
                className="record-group-header clickable"
                onClick={() => toggleGroup(groupId)}
              >
                <span className="expand-toggle">
                  {isExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                </span>
                <span className="type-tag personal-tag">个人</span>
                <span className={`color-dot ${personalProject.color}`}></span>
                <span className="group-title">{personalProject.name}</span>
                <span className="record-count">{personalRecords.length}条记录</span>
              </div>

              {isExpanded && dateGroups.map(([date, records]) => {
                const dateKey = `${groupId}-${date}`
                const isDateExpanded = expandedDateGroups.has(dateKey) || dateGroups.length === 1

                return (
                  <div key={dateKey} className="date-group">
                    <div
                      className="date-group-header clickable"
                      onClick={() => toggleDateGroup(dateKey)}
                    >
                      <span className="expand-toggle-small">
                        {isDateExpanded ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
                      </span>
                      <span className="date-label">{formatDateDisplay(date)}</span>
                      <span className="date-count">{records.length}</span>
                    </div>
                    {isDateExpanded && (
                      <div className="date-records">
                        {records.map(record => {
                          const contentFiles = extractFileTagsFromContent(record.content)
                          const displayFiles = record.files && record.files.length > 0 ? record.files : contentFiles

                          return (
                            <div
                              key={record.id}
                              className="record-item clickable"
                              onClick={() => handleRecordClick(record, 'personal', 'project')}
                            >
                              <div className="record-main-row">
                                <span className="record-time">{record.time}</span>
                                <span className="record-text">
                                  {extractRecordText(record.content).slice(0, 80)}
                                  {extractRecordText(record.content).length > 80 && '...'}
                                </span>
                              </div>
                              {displayFiles && displayFiles.length > 0 && (
                                <div className="record-files-inline">
                                  {displayFiles.slice(0, 3).map((file, idx) => (
                                    <div
                                      key={file.id || `content-file-${idx}`}
                                      className="file-row-mini"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        if (file.path) handleOpenFile(file.path)
                                      }}
                                    >
                                      <span className="file-icon"><FileTypeIcon type={file.type || 'doc'} /></span>
                                      <span className="file-name">{file.name}</span>
                                    </div>
                                  ))}
                                  {displayFiles.length > 3 && (
                                    <span className="files-more">+{displayFiles.length - 3}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                        {records.length === 0 && (
                          <div className="empty-hint">暂无记录</div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
              {personalRecords.length === 0 && (
                <div className="empty-hint-small">点击下方编辑区添加个人记录</div>
              )}
            </div>
          )
        })()}
          </>
        )}

      </section>

      {/* 富文本编辑区 - 固定在底部 */}
      <div
        className={`editor-section-fixed ${isDraggingFile ? 'dragging-file' : ''}`}
        style={{ height: editorHeight }}
        ref={editorContainerRef}
      >
        <div className="editor-drag-handle" onMouseDown={handleEditorDragStart}>
          <span className="drag-line"></span>
        </div>

        <div className="editor-drop-area" ref={fileDropRef}>
          {editingRecord ? (
            /* 编辑模式 */
            <RichTextEditor
              showProjectSelector={false}
              content={editContent}
              onContentChange={setEditContent}
              attachedFiles={editFiles}
              onFileRemove={(fileId) => setEditFiles(prev => prev.filter(f => f.id !== fileId))}
              onSubmit={handleSaveEdit}
              onSubmitWithContent={handleSaveEditWithContent}
              onCancel={handleCancelEdit}
              submitHint="Ctrl+Enter 保存"
              placeholder="编辑记录内容..."
              targetName={getTargetName(editTargetId, editTargetType)}
              targetType={editTargetType}
            />
          ) : (
            /* 新建模式 */
            <RichTextEditor
              showProjectSelector={!isFocusMode}
              projects={targetOptions}
              selectedProject={newRecordTarget}
              onProjectChange={(id) => {
                const target = targetOptions.find(t => t.id === id)
                setNewRecordTarget(id)
                setNewRecordTargetType(target?.type || 'product')
              }}
              content={newRecordContent}
              onContentChange={setNewRecordContent}
              attachedFiles={newRecordFiles}
              onFileRemove={(fileId) => setNewRecordFiles(prev => prev.filter(f => f.id !== fileId))}
              onSubmit={handleAddRecord}
              onSubmitWithContent={handleAddRecordWithContent}
              onMp3ParseResult={(result) => {
                // 自动添加记录
                result.records.forEach(r => {
                  // 根据目标名称找到对应的项目
                  const targetProject = projects.find(p => p.name === r.target)
                  if (targetProject) {
                    onAddRecord?.(targetProject.id, 'project', r.content, [])
                  } else {
                    // 如果找不到匹配的项目，添加到当前目标
                    onAddRecord?.(newRecordTarget, newRecordTargetType, `${r.target}: ${r.content}`, [])
                  }
                })
                // 自动添加待办
                result.todos.forEach(t => {
                  onAddTodo?.(t.title, t.priority)
                })
              }}
              submitHint="Ctrl+Enter 发送"
              placeholder={isFocusMode ? "记录工作内容..." : "拖入文件或输入内容..."}
              targetName={isFocusMode ? (focusedProduct?.name || focusedProject?.name) : undefined}
              targetType={isFocusMode ? focusedTargetType : undefined}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default GlobalOverview