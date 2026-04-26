import { useState, useEffect, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import {
  IconFolder, IconClose, IconChevronRight, IconChevronDown,
  IconFile, IconFileText, IconFileSpreadsheet, IconFilePresentation, IconFilePdf,
  IconPlus, IconEye, IconEyeOff, IconSearch, IconChevronLeft, IconRecord
} from './Icons'
import TodoPanel from './TodoPanel'
import { defaultConfig, Product, ProjectWithFiles, FileItem } from '../types'
import './FunctionPanel.css'

type PanelItem = 'home' | 'products' | 'projects' | 'review' | 'settings'
type ReviewTab = 'weekly' | 'hours' | 'codes' | 'personal'
type SettingsTab = 'storage' | 'theme' | 'ai' | 'backup'

interface FunctionPanelProps {
  activeItem: PanelItem
  isOpen: boolean
  onClose: () => void
  products: Product[]
  projects: ProjectWithFiles[]
  onAddProject: (name: string, province: string, year: string) => void
  onAddFolder: (projectId: string, folderName: string) => void
  onAddFile: (projectId: string, folderId: string, fileName: string, fileType: string) => void
  onToggleProjectVisible: (projectId: string) => void
  onRenameFolder?: (projectId: string, folderId: string, newName: string) => void
  reviewTab?: ReviewTab
  onReviewTabChange?: (tab: ReviewTab) => void
  settingsTab?: SettingsTab
  onSettingsTabChange?: (tab: SettingsTab) => void
  focusedProjectId?: string | null
  onSelectProduct?: (productId: string) => void
  onAddRecord?: (targetId: string, targetType: 'product' | 'project', content: string, files: never[]) => void
}

function FunctionPanel({
  activeItem, isOpen, onClose, products, projects,
  onAddProject, onAddFolder, onAddFile, onToggleProjectVisible,
  onRenameFolder,
  reviewTab = 'weekly', onReviewTabChange,
  settingsTab = 'storage', onSettingsTabChange,
  focusedProjectId, onSelectProduct,
  onAddRecord
}: FunctionPanelProps) {
  const [basePath] = useState(defaultConfig.basePath)

  // 展开/折叠状态
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set())
  const [expandedProvinces, setExpandedProvinces] = useState<Set<string>>(new Set())
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set())
  const [expandedProductProjects, setExpandedProductProjects] = useState<Set<string>>(new Set())
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)

  // 搜索和筛选
  const [searchKeyword, setSearchKeyword] = useState('')
  const [showOnlyVisible, setShowOnlyVisible] = useState(true)
  const [drillDown, setDrillDown] = useState<{ level: 'year' | 'province', value: string } | null>(null)

  // 弹窗状态
  const [showAddProjectModal, setShowAddProjectModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectProvince, setNewProjectProvince] = useState('浙江')
  const [newProjectYear, setNewProjectYear] = useState('2026')
  const [showAddFolderModal, setShowAddFolderModal] = useState(false)
  const [addFolderProjectId, setAddFolderProjectId] = useState<string | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [showAddFileModal, setShowAddFileModal] = useState(false)
  const [addFileProjectId, setAddFileProjectId] = useState<string | null>(null)
  const [addFileFolderId, setAddFileFolderId] = useState<string | null>(null)
  const [newFileName, setNewFileName] = useState('')
  const [newFileType, setNewFileType] = useState('doc')
  const [showRenameFolderModal, setShowRenameFolderModal] = useState(false)
  const [renameFolderProjectId, setRenameFolderProjectId] = useState<string | null>(null)
  const [renameFolderId, setRenameFolderId] = useState<string | null>(null)
  const [renameFolderName, setRenameFolderName] = useState('')
  const [showAddDocumentModal, setShowAddDocumentModal] = useState(false)
  const [addDocumentProjectId, setAddDocumentProjectId] = useState<string | null>(null)
  const [addDocumentFolderId, setAddDocumentFolderId] = useState<string | null>(null)
  const [newDocumentName, setNewDocumentName] = useState('')
  const [newDocumentType, setNewDocumentType] = useState<'note' | 'md' | 'txt'>('note')

  // 右键菜单
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: 'year' | 'province' | 'project' | 'folder' | 'empty'; projectId?: string; folderId?: string; year?: string; province?: string } | null>(null)

  // 拖拽状态
  const [draggingFile, setDraggingFile] = useState<FileItem | null>(null)
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 })
  const [dragCurrentPos, setDragCurrentPos] = useState({ x: 0, y: 0 })
  const isDraggingRef = useRef(false)
  const dragThreshold = 5

  // 当进入专注模式时，自动展开对应层级
  useEffect(() => {
    if (focusedProjectId) {
      const project = projects.find(p => p.id === focusedProjectId)
      if (project) {
        setExpandedYears(prev => new Set(prev).add(project.year))
        setExpandedProvinces(prev => new Set(prev).add(`${project.year}-${project.province}`))
        setExpandedProjects(prev => new Set(prev).add(project.id))
      }
    }
  }, [focusedProjectId, projects])

  // 按年份-省份分组项目
  const groupedProjects = () => {
    const groups: Record<string, Record<string, ProjectWithFiles[]>> = {}
    let filtered = projects.filter(p => p.id !== 'personal')

    if (focusedProjectId) {
      filtered = filtered.filter(p => p.id === focusedProjectId)
    } else {
      if (drillDown) {
        if (drillDown.level === 'year') {
          filtered = filtered.filter(p => p.year === drillDown.value)
        } else if (drillDown.level === 'province') {
          const [year, province] = drillDown.value.split('-')
          filtered = filtered.filter(p => p.year === year && p.province === province)
        }
      } else {
        if (showOnlyVisible) {
          filtered = filtered.filter(p => p.visible)
        }
        if (searchKeyword.trim()) {
          const keyword = searchKeyword.toLowerCase()
          filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(keyword) ||
            p.province.toLowerCase().includes(keyword) ||
            p.year.toLowerCase().includes(keyword)
          )
        }
      }
    }

    filtered.forEach(project => {
      if (!groups[project.year]) groups[project.year] = {}
      if (!groups[project.year][project.province]) groups[project.year][project.province] = []
      groups[project.year][project.province].push(project)
    })
    return groups
  }

  // 展开/折叠函数
  const toggleYearExpand = (year: string) => {
    setExpandedYears(prev => {
      const newSet = new Set(prev)
      if (newSet.has(year)) newSet.delete(year)
      else newSet.add(year)
      return newSet
    })
  }

  const toggleProvinceExpand = (key: string) => {
    setExpandedProvinces(prev => {
      const newSet = new Set(prev)
      if (newSet.has(key)) newSet.delete(key)
      else newSet.add(key)
      return newSet
    })
  }

  const toggleProjectExpand = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev)
      if (newSet.has(projectId)) newSet.delete(projectId)
      else newSet.add(projectId)
      return newSet
    })
  }

  const toggleProductExpand = (productId: string) => {
    setExpandedProducts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(productId)) newSet.delete(productId)
      else newSet.add(productId)
      return newSet
    })
  }

  const toggleProductProjectExpand = (projectId: string) => {
    setExpandedProductProjects(prev => {
      const newSet = new Set(prev)
      if (newSet.has(projectId)) newSet.delete(projectId)
      else newSet.add(projectId)
      return newSet
    })
  }

  // 下钻函数
  const drillDownToYear = (year: string) => {
    setDrillDown({ level: 'year', value: year })
    setExpandedYears(prev => new Set(prev).add(year))
  }

  const drillDownToProvince = (year: string, province: string) => {
    setDrillDown({ level: 'province', value: `${year}-${province}` })
    setExpandedYears(prev => new Set(prev).add(year))
    setExpandedProvinces(prev => new Set(prev).add(`${year}-${province}`))
  }

  const exitDrillDown = () => setDrillDown(null)

  const getDrillDownPath = () => {
    if (!drillDown) return null
    if (drillDown.level === 'year') return `${basePath}/${drillDown.value}`
    if (drillDown.level === 'province') {
      const [year, province] = drillDown.value.split('-')
      return `${basePath}/${year}/${province}`
    }
    return null
  }

  // 文件夹选择
  const getFolderKey = (projectId: string, folderId: string) => `${projectId}-${folderId}`
  const isFolderSelected = (projectId: string, folderId: string) => selectedFolder === getFolderKey(projectId, folderId)

  // 文件类型图标
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

  // 拖拽处理
  const handleDragMouseDown = (e: React.MouseEvent, file: FileItem) => {
    e.preventDefault()
    setDraggingFile(file)
    setDragStartPos({ x: e.clientX, y: e.clientY })
    setDragCurrentPos({ x: e.clientX, y: e.clientY })
    isDraggingRef.current = false
  }

  useEffect(() => {
    if (!draggingFile) return

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartPos.x
      const dy = e.clientY - dragStartPos.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance > dragThreshold) {
        isDraggingRef.current = true
        setDragCurrentPos({ x: e.clientX, y: e.clientY })
        document.body.style.userSelect = 'none'
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      document.body.style.userSelect = ''
      if (isDraggingRef.current) {
        const editorEls = document.querySelectorAll('.rich-textarea')
        for (const editorEl of editorEls) {
          const rect = editorEl.getBoundingClientRect()
          if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
            window.dispatchEvent(new CustomEvent('insert-file-ref', { detail: { file: draggingFile, targetEditor: editorEl } }))
            break
          }
        }
      }
      setDraggingFile(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
    }
  }, [draggingFile, dragStartPos])

  const renderDragIndicator = () => {
    if (!draggingFile || !isDraggingRef.current) return null
    return (
      <div className="drag-indicator" style={{ left: dragCurrentPos.x, top: dragCurrentPos.y }}>
        <span className="drag-file-tag">📎 {draggingFile.name}{draggingFile.extension}</span>
      </div>
    )
  }

  // 渲染文件行
  const renderFileRow = (file: FileItem) => (
    <div
      key={file.id}
      className="file-row clickable"
      onMouseDown={(e) => handleDragMouseDown(e, file)}
      onClick={() => { if (!draggingFile) handleOpenFile(file.fullPath) }}
      title={`${file.name}${file.extension}（拖拽图标到编辑区引用）`}
    >
      <span className="file-drag-handle file-icon" style={{ cursor: 'grab' }}>
        <FileTypeIcon type={file.type} />
      </span>
      <span className="file-name">{file.name}</span>
      <span className="file-ext">{file.extension}</span>
    </div>
  )

  // 渲染项目节点（含文件夹）
  const renderProjectNode = (project: ProjectWithFiles, isExpanded: boolean, toggleExpand: () => void) => (
    <div key={project.id} className="project-node-in-tree">
      <div
        className="project-row-in-tree"
        onClick={toggleExpand}
        onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, type: 'project', projectId: project.id }) }}
      >
        <span className="node-expand">
          {isExpanded ? <IconChevronDown size={10} /> : <IconChevronRight size={10} />}
        </span>
        <span className={`node-dot ${project.color}`}></span>
        <span className="node-name">{project.name}</span>
        <button
          className="visibility-btn"
          onClick={(e) => { e.stopPropagation(); onToggleProjectVisible(project.id); }}
          title={project.visible ? '隐藏' : '显示'}
        >
          {project.visible ? <IconEye size={12} /> : <IconEyeOff size={12} />}
        </button>
      </div>
      {isExpanded && (
        <div className="folder-list-compact">
          {project.folders.map(folder => {
            const folderSelected = isFolderSelected(project.id, folder.id)
            return (
              <div key={folder.id} className="folder-node">
                <div
                  className={`folder-row ${folderSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedFolder(folderSelected ? null : getFolderKey(project.id, folder.id))}
                  onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, type: 'folder', projectId: project.id, folderId: folder.id }) }}
                >
                  <span className="node-expand">
                    {folderSelected ? <IconChevronDown size={10} /> : <IconChevronRight size={10} />}
                  </span>
                  <IconFolder size={14} />
                  <span className="node-name">{folder.name}</span>
                  <span className="node-meta">{folder.files.length}</span>
                </div>
                {folderSelected && (
                  <div className="file-list-compact">
                    {folder.files.map(file => renderFileRow(file))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  // 右键菜单处理
  const closeContextMenu = () => setContextMenu(null)

  const handleContextMenuAction = (action: string) => {
    if (!contextMenu) return
    switch (action) {
      case 'addProject':
        if (contextMenu.year) setNewProjectYear(contextMenu.year)
        if (contextMenu.province) setNewProjectProvince(contextMenu.province.split('-')[1] || '浙江')
        setShowAddProjectModal(true)
        break
      case 'addFolder':
        if (contextMenu.projectId) {
          setAddFolderProjectId(contextMenu.projectId)
          setNewFolderName('')
          setShowAddFolderModal(true)
        }
        break
      case 'renameFolder':
        if (contextMenu.projectId && contextMenu.folderId) {
          const project = projects.find(p => p.id === contextMenu.projectId)
          const folder = project?.folders.find(f => f.id === contextMenu.folderId)
          if (folder) {
            setRenameFolderProjectId(contextMenu.projectId)
            setRenameFolderId(contextMenu.folderId)
            setRenameFolderName(folder.name)
            setShowRenameFolderModal(true)
          }
        }
        break
      case 'addFilePdf':
      case 'addFileDoc':
      case 'addFileXls':
      case 'addFilePpt':
        if (contextMenu.projectId && contextMenu.folderId) {
          const fileType = action.replace('addFile', '').toLowerCase()
          setAddFileProjectId(contextMenu.projectId)
          setAddFileFolderId(contextMenu.folderId)
          setNewFileName('')
          setNewFileType(fileType)
          setShowAddFileModal(true)
        }
        break
      case 'addDocument':
        if (contextMenu.projectId && contextMenu.folderId) {
          setAddDocumentProjectId(contextMenu.projectId)
          setAddDocumentFolderId(contextMenu.folderId)
          setNewDocumentName('')
          setNewDocumentType('note')
          setShowAddDocumentModal(true)
        }
        break
    }
    closeContextMenu()
  }

  // 添加项目
  const handleAddProject = () => {
    if (newProjectName.trim()) {
      onAddProject(newProjectName, newProjectProvince, newProjectYear)
      setNewProjectName('')
      setShowAddProjectModal(false)
    }
  }

  // 添加文件夹
  const handleAddFolder = () => {
    if (addFolderProjectId && newFolderName.trim()) {
      onAddFolder(addFolderProjectId, newFolderName)
      setNewFolderName('')
      setShowAddFolderModal(false)
      setAddFolderProjectId(null)
    }
  }

  // 添加文件
  const handleAddFile = () => {
    if (addFileProjectId && addFileFolderId && newFileName.trim()) {
      onAddFile(addFileProjectId, addFileFolderId, newFileName, newFileType)
      setNewFileName('')
      setShowAddFileModal(false)
      setAddFileProjectId(null)
      setAddFileFolderId(null)
    }
  }

  // 重命名文件夹
  const handleRenameFolder = () => {
    if (renameFolderProjectId && renameFolderId && renameFolderName.trim()) {
      onRenameFolder?.(renameFolderProjectId, renameFolderId, renameFolderName.trim())
      setShowRenameFolderModal(false)
      setRenameFolderProjectId(null)
      setRenameFolderId(null)
      setRenameFolderName('')
    }
  }

  const getPanelTitle = () => {
    switch (activeItem) {
      case 'home': return '首页'
      case 'products': return '产品'
      case 'projects': return '项目'
      case 'review': return '工作复盘'
      case 'settings': return '设置'
      default: return ''
    }
  }

  if (!isOpen) return null

  return (
    <div className="function-panel" onClick={closeContextMenu}>
      <div className="panel-header">
        <h3 className="panel-title">{getPanelTitle()}</h3>
        <button className="panel-close-svg" onClick={onClose}><IconClose size={16} /></button>
      </div>

      <div className="panel-body">
        {/* ========== 首页：产品树 + 项目树 + 待办 ========== */}
        {activeItem === 'home' && (
          <div className="home-panel-tree">
            {/* 产品树 */}
            <div className="tree-section">
              <div className="tree-section-header">
                <span className="tree-section-label">产品</span>
              </div>
              <div className="tree-list">
                {products.map(product => {
                  const isProductExpanded = expandedProducts.has(product.id)
                  const relatedProjects = projects.filter(p => p.productId === product.id)
                  return (
                    <div key={product.id} className="product-tree-node">
                      <div
                        className="product-tree-row clickable"
                        onClick={() => {
                          toggleProductExpand(product.id)
                          onSelectProduct?.(product.id)
                        }}
                      >
                        <span className="node-expand">
                          {isProductExpanded ? <IconChevronDown size={10} /> : <IconChevronRight size={10} />}
                        </span>
                        <span className={`node-dot ${product.color}`}></span>
                        <span className="node-name">{product.name}</span>
                        <span className="node-meta">{relatedProjects.length}</span>
                      </div>
                      {isProductExpanded && (
                        <div className="product-projects-tree">
                          {relatedProjects.map(project => {
                            const isProjExpanded = expandedProductProjects.has(project.id)
                            return renderProjectNode(project, isProjExpanded, () => toggleProductProjectExpand(project.id))
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 项目树 */}
            <div className="tree-section">
              <div className="tree-section-header">
                <span className="tree-section-label">项目</span>
                <button className="toolbar-btn-small" onClick={() => setShowAddProjectModal(true)}>
                  <IconPlus size={10} />
                </button>
              </div>
              <div className="tree-list">
                {Object.entries(groupedProjects()).map(([year, provinces]) => (
                  <div key={year} className="year-node">
                    <div className="year-row" onClick={() => toggleYearExpand(year)}>
                      <span className="node-expand">
                        {expandedYears.has(year) ? <IconChevronDown size={10} /> : <IconChevronRight size={10} />}
                      </span>
                      <span className="year-name">{year}</span>
                      <span className="year-count">{Object.values(provinces).reduce((sum, projs) => sum + projs.length, 0)}</span>
                    </div>
                    {expandedYears.has(year) && (
                      <div className="province-list-compact">
                        {Object.entries(provinces).map(([province, projs]) => (
                          <div key={`${year}-${province}`} className="province-node">
                            <div className="province-row" onClick={() => toggleProvinceExpand(`${year}-${province}`)}>
                              <span className="node-expand">
                                {expandedProvinces.has(`${year}-${province}`) ? <IconChevronDown size={10} /> : <IconChevronRight size={10} />}
                              </span>
                              <span className="province-name">{province}</span>
                              <span className="province-count">{projs.length}</span>
                            </div>
                            {expandedProvinces.has(`${year}-${province}`) && (
                              <div className="project-list-in-province">
                                {projs.map(project => {
                                  const isProjExpanded = expandedProjects.has(project.id)
                                  return renderProjectNode(project, isProjExpanded, () => toggleProjectExpand(project.id))
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 待办 */}
            <div className="tree-section todo-section">
              <div className="tree-section-header">
                <span className="tree-section-label">待办</span>
              </div>
              <div className="todo-panel-compact">
                <TodoPanel products={products} projects={projects} onAddRecord={onAddRecord} />
              </div>
            </div>
          </div>
        )}

        {/* ========== 产品：产品树 + 待办 ========== */}
        {activeItem === 'products' && (
          <div className="products-panel-tree">
            {/* 产品树 */}
            <div className="tree-section">
              <div className="tree-section-header">
                <span className="tree-section-label">产品</span>
              </div>
              <div className="tree-list">
                {products.map(product => {
                  const isProductExpanded = expandedProducts.has(product.id)
                  const relatedProjects = projects.filter(p => p.productId === product.id)
                  return (
                    <div key={product.id} className="product-tree-node">
                      <div
                        className="product-tree-row clickable"
                        onClick={() => {
                          toggleProductExpand(product.id)
                          onSelectProduct?.(product.id)
                        }}
                      >
                        <span className="node-expand">
                          {isProductExpanded ? <IconChevronDown size={10} /> : <IconChevronRight size={10} />}
                        </span>
                        <span className={`node-dot ${product.color}`}></span>
                        <span className="node-name">{product.name}</span>
                        <span className="node-meta">{relatedProjects.length}</span>
                      </div>
                      {isProductExpanded && (
                        <div className="product-projects-tree">
                          {relatedProjects.map(project => {
                            const isProjExpanded = expandedProductProjects.has(project.id)
                            return renderProjectNode(project, isProjExpanded, () => toggleProductProjectExpand(project.id))
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 待办 */}
            <div className="tree-section todo-section">
              <div className="tree-section-header">
                <span className="tree-section-label">待办</span>
              </div>
              <div className="todo-panel-compact">
                <TodoPanel products={products} projects={projects} onAddRecord={onAddRecord} />
              </div>
            </div>
          </div>
        )}

        {/* ========== 项目：项目树 + 待办 ========== */}
        {activeItem === 'projects' && (
          <div className="projects-panel-tree">
            {/* 项目树 */}
            <div className="tree-section">
              <div className="tree-section-header">
                <span className="tree-section-label">项目</span>
                <div className="tree-section-toolbar">
                  <button className="toolbar-btn-small" onClick={() => setShowAddProjectModal(true)}>
                    <IconPlus size={10} />
                  </button>
                  <button
                    className={`toolbar-btn-small toggle-btn ${showOnlyVisible ? 'active' : ''}`}
                    onClick={() => setShowOnlyVisible(!showOnlyVisible)}
                    title={showOnlyVisible ? '显示所有' : '仅显示可见'}
                  >
                    <IconEye size={10} />
                  </button>
                </div>
              </div>
              <div className="files-search-inline">
                <IconSearch size={12} />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={e => setSearchKeyword(e.target.value)}
                  placeholder="搜索项目..."
                />
              </div>
              {drillDown && (
                <div className="drill-down-bar">
                  <button className="drill-back-btn" onClick={exitDrillDown}>
                    <IconChevronLeft size={10} />
                  </button>
                  <span className="drill-path">{getDrillDownPath()}</span>
                </div>
              )}
              <div className="tree-list">
                {focusedProjectId ? (
                  (() => {
                    const project = projects.find(p => p.id === focusedProjectId)
                    if (!project) return null
                    const isProjExpanded = expandedProjects.has(project.id)
                    return renderProjectNode(project, isProjExpanded, () => toggleProjectExpand(project.id))
                  })()
                ) : drillDown?.level === 'year' ? (
                  Object.entries(groupedProjects()).map(([year, provinces]) => (
                    <div key={year} className="province-list-compact" style={{ paddingLeft: 0 }}>
                      {Object.entries(provinces).map(([province, projs]) => (
                        <div key={`${year}-${province}`} className="province-node">
                          <div className="province-row-drill" onClick={() => toggleProvinceExpand(`${year}-${province}`)}>
                            <span className="node-expand">
                              {expandedProvinces.has(`${year}-${province}`) ? <IconChevronDown size={10} /> : <IconChevronRight size={10} />}
                            </span>
                            <span className="province-name">{province}</span>
                            <span className="province-count">{projs.length}</span>
                            <button className="drill-btn" onClick={(e) => { e.stopPropagation(); drillDownToProvince(year, province) }}>
                              <IconChevronRight size={10} />
                            </button>
                          </div>
                          {expandedProvinces.has(`${year}-${province}`) && (
                            <div className="project-list-in-province">
                              {projs.map(project => {
                                const isProjExpanded = expandedProjects.has(project.id)
                                return renderProjectNode(project, isProjExpanded, () => toggleProjectExpand(project.id))
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))
                ) : drillDown?.level === 'province' ? (
                  Object.entries(groupedProjects()).map(([year, provinces]) => (
                    Object.entries(provinces).map(([province, projs]) => (
                      <div key={`${year}-${province}`} className="project-list-in-province" style={{ paddingLeft: 0 }}>
                        {projs.map(project => {
                          const isProjExpanded = expandedProjects.has(project.id)
                          return renderProjectNode(project, isProjExpanded, () => toggleProjectExpand(project.id))
                        })}
                      </div>
                    ))
                  ))
                ) : (
                  Object.entries(groupedProjects()).map(([year, provinces]) => (
                    <div key={year} className="year-node">
                      <div className="year-row" onClick={() => toggleYearExpand(year)}>
                        <span className="node-expand">
                          {expandedYears.has(year) ? <IconChevronDown size={10} /> : <IconChevronRight size={10} />}
                        </span>
                        <span className="year-name">{year}</span>
                        <span className="year-count">{Object.values(provinces).reduce((sum, projs) => sum + projs.length, 0)}</span>
                        <button className="drill-btn" onClick={(e) => { e.stopPropagation(); drillDownToYear(year) }}>
                          <IconChevronRight size={10} />
                        </button>
                      </div>
                      {expandedYears.has(year) && (
                        <div className="province-list-compact">
                          {Object.entries(provinces).map(([province, projs]) => (
                            <div key={`${year}-${province}`} className="province-node">
                              <div className="province-row" onClick={() => toggleProvinceExpand(`${year}-${province}`)}>
                                <span className="node-expand">
                                  {expandedProvinces.has(`${year}-${province}`) ? <IconChevronDown size={10} /> : <IconChevronRight size={10} />}
                                </span>
                                <span className="province-name">{province}</span>
                                <span className="province-count">{projs.length}</span>
                              </div>
                              {expandedProvinces.has(`${year}-${province}`) && (
                                <div className="project-list-in-province">
                                  {projs.map(project => {
                                    const isProjExpanded = expandedProjects.has(project.id)
                                    return renderProjectNode(project, isProjExpanded, () => toggleProjectExpand(project.id))
                                  })}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 待办 */}
            <div className="tree-section todo-section">
              <div className="tree-section-header">
                <span className="tree-section-label">待办</span>
              </div>
              <div className="todo-panel-compact">
                <TodoPanel products={products} projects={projects} onAddRecord={onAddRecord} />
              </div>
            </div>
          </div>
        )}

        {/* ========== 复盘 ========== */}
        {activeItem === 'review' && (
          <div className="submenu-nav">
            <div className={`nav-section ${reviewTab === 'weekly' ? 'active' : ''}`} onClick={() => onReviewTabChange?.('weekly')}>
              <span className="nav-label">周报生成</span>
            </div>
            <div className={`nav-section ${reviewTab === 'hours' ? 'active' : ''}`} onClick={() => onReviewTabChange?.('hours')}>
              <span className="nav-label">周工时看板</span>
            </div>
            <div className={`nav-section ${reviewTab === 'codes' ? 'active' : ''}`} onClick={() => onReviewTabChange?.('codes')}>
              <span className="nav-label">工时代码</span>
            </div>
            <div className={`nav-section ${reviewTab === 'personal' ? 'active' : ''}`} onClick={() => onReviewTabChange?.('personal')}>
              <span className="nav-label">个人工时</span>
            </div>
          </div>
        )}

        {/* ========== 设置 ========== */}
        {activeItem === 'settings' && (
          <div className="submenu-nav">
            <div className={`nav-section ${settingsTab === 'storage' ? 'active' : ''}`} onClick={() => onSettingsTabChange?.('storage')}>
              <span className="nav-label">文件存储</span>
            </div>
            <div className={`nav-section ${settingsTab === 'theme' ? 'active' : ''}`} onClick={() => onSettingsTabChange?.('theme')}>
              <span className="nav-label">外观主题</span>
            </div>
            <div className={`nav-section ${settingsTab === 'ai' ? 'active' : ''}`} onClick={() => onSettingsTabChange?.('ai')}>
              <span className="nav-label">AI 模型</span>
            </div>
            <div className={`nav-section ${settingsTab === 'backup' ? 'active' : ''}`} onClick={() => onSettingsTabChange?.('backup')}>
              <span className="nav-label">数据备份</span>
            </div>
          </div>
        )}
      </div>

      {/* 右键菜单 */}
      {contextMenu && (
        <div className="context-menu" style={{ left: contextMenu.x, top: contextMenu.y }} onClick={e => e.stopPropagation()}>
          {contextMenu.type === 'year' && (
            <div className="context-menu-item" onClick={() => handleContextMenuAction('addProject')}>
              <IconPlus size={12} /> 新建项目
            </div>
          )}
          {contextMenu.type === 'province' && (
            <div className="context-menu-item" onClick={() => handleContextMenuAction('addProject')}>
              <IconPlus size={12} /> 新建项目
            </div>
          )}
          {contextMenu.type === 'project' && (
            <div className="context-menu-item" onClick={() => handleContextMenuAction('addFolder')}>
              <IconPlus size={12} /> 新建文件夹
            </div>
          )}
          {contextMenu.type === 'folder' && (
            <>
              <div className="context-menu-item" onClick={() => handleContextMenuAction('renameFolder')}>重命名</div>
              <div className="context-menu-separator" />
              <div className="context-menu-item" onClick={() => handleContextMenuAction('addFilePdf')}>
                <IconFilePdf size={12} /> 新建 PDF
              </div>
              <div className="context-menu-item" onClick={() => handleContextMenuAction('addFileDoc')}>
                <IconFileText size={12} /> 新建 Word
              </div>
              <div className="context-menu-item" onClick={() => handleContextMenuAction('addFileXls')}>
                <IconFileSpreadsheet size={12} /> 新建 Excel
              </div>
              <div className="context-menu-item" onClick={() => handleContextMenuAction('addFilePpt')}>
                <IconFilePresentation size={12} /> 新建 PPT
              </div>
              <div className="context-menu-separator" />
              <div className="context-menu-item" onClick={() => handleContextMenuAction('addDocument')}>
                <IconRecord size={12} /> 新建在线文档
              </div>
            </>
          )}
        </div>
      )}

      {/* 新建项目弹窗 */}
      {showAddProjectModal && (
        <div className="modal-overlay" onClick={() => setShowAddProjectModal(false)}>
          <div className="modal modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>新建项目</h3>
              <button className="modal-close" onClick={() => setShowAddProjectModal(false)}><IconClose size={14} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <label>项目名称</label>
                <input type="text" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder="输入项目名称" autoFocus />
              </div>
              <div className="form-row">
                <label>年份</label>
                <div className="select-btn-group">
                  {['2026', '2025', '2024'].map(year => (
                    <button key={year} className={`select-btn ${newProjectYear === year ? 'active' : ''}`} onClick={() => setNewProjectYear(year)}>
                      {year}
                    </button>
                  ))}
                  <input type="text" className="custom-input-small" placeholder="自定义" value={['2026', '2025', '2024'].includes(newProjectYear) ? '' : newProjectYear} onChange={e => setNewProjectYear(e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <label>省份</label>
                <div className="select-btn-group">
                  {['浙江', '江苏', '安徽', '上海'].map(province => (
                    <button key={province} className={`select-btn ${newProjectProvince === province ? 'active' : ''}`} onClick={() => setNewProjectProvince(province)}>
                      {province}
                    </button>
                  ))}
                  <input type="text" className="custom-input-small" placeholder="自定义" value={['浙江', '江苏', '安徽', '上海'].includes(newProjectProvince) ? '' : newProjectProvince} onChange={e => setNewProjectProvince(e.target.value)} />
                </div>
              </div>
              <div className="form-hint">{basePath}/{newProjectYear}/{newProjectProvince}/{newProjectName || '项目名'}</div>
              <div className="form-note">创建后将自动生成"汇报材料"、"申报材料"、"历史文件"文件夹</div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddProjectModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleAddProject}>创建</button>
            </div>
          </div>
        </div>
      )}

      {/* 新建文件夹弹窗 */}
      {showAddFolderModal && (
        <div className="modal-overlay" onClick={() => setShowAddFolderModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>新建文件夹</h3>
              <button className="modal-close" onClick={() => setShowAddFolderModal(false)}><IconClose size={14} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <label>文件夹名称</label>
                <input type="text" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="输入文件夹名称" autoFocus />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddFolderModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleAddFolder}>创建</button>
            </div>
          </div>
        </div>
      )}

      {/* 新建文件弹窗 */}
      {showAddFileModal && (
        <div className="modal-overlay" onClick={() => setShowAddFileModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>新建文件</h3>
              <button className="modal-close" onClick={() => setShowAddFileModal(false)}><IconClose size={14} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <label>文件名称</label>
                <input type="text" value={newFileName} onChange={e => setNewFileName(e.target.value)} placeholder="输入文件名称" autoFocus />
              </div>
              <div className="form-row">
                <label>文件类型</label>
                <select value={newFileType} onChange={e => setNewFileType(e.target.value)}>
                  <option value="doc">Word 文档 (.docx)</option>
                  <option value="xls">Excel 表格 (.xlsx)</option>
                  <option value="ppt">PPT 演示 (.pptx)</option>
                  <option value="pdf">PDF 文档 (.pdf)</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddFileModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleAddFile}>创建</button>
            </div>
          </div>
        </div>
      )}

      {/* 重命名文件夹弹窗 */}
      {showRenameFolderModal && (
        <div className="modal-overlay" onClick={() => setShowRenameFolderModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>重命名文件夹</h3>
              <button className="modal-close" onClick={() => setShowRenameFolderModal(false)}><IconClose size={14} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <label>文件夹名称</label>
                <input type="text" value={renameFolderName} onChange={e => setRenameFolderName(e.target.value)} placeholder="输入文件夹名称" autoFocus />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRenameFolderModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleRenameFolder}>确定</button>
            </div>
          </div>
        </div>
      )}

      {/* 新建在线文档弹窗 */}
      {showAddDocumentModal && (
        <div className="modal-overlay" onClick={() => setShowAddDocumentModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>新建在线文档</h3>
              <button className="modal-close" onClick={() => setShowAddDocumentModal(false)}><IconClose size={14} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <label>文档名称</label>
                <input type="text" value={newDocumentName} onChange={e => setNewDocumentName(e.target.value)} placeholder="输入文档名称" autoFocus />
              </div>
              <div className="form-row">
                <label>文档类型</label>
                <div className="select-btn-group">
                  <button className={`select-btn ${newDocumentType === 'note' ? 'active' : ''}`} onClick={() => setNewDocumentType('note')}>笔记文档 (.note)</button>
                  <button className={`select-btn ${newDocumentType === 'md' ? 'active' : ''}`} onClick={() => setNewDocumentType('md')}>Markdown (.md)</button>
                  <button className={`select-btn ${newDocumentType === 'txt' ? 'active' : ''}`} onClick={() => setNewDocumentType('txt')}>文本文件 (.txt)</button>
                </div>
              </div>
              <div className="form-note">在线文档可在右侧直接编辑，支持富文本格式</div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddDocumentModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={() => {
                if (addDocumentProjectId && addDocumentFolderId && newDocumentName.trim()) {
                  onAddFile(addDocumentProjectId, addDocumentFolderId, newDocumentName.trim(), newDocumentType)
                  setShowAddDocumentModal(false)
                  setNewDocumentName('')
                }
              }}>创建</button>
            </div>
          </div>
        </div>
      )}

      {/* 拖拽指示器 */}
      {renderDragIndicator()}
    </div>
  )
}

export default FunctionPanel