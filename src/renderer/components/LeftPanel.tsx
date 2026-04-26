import { useState, useEffect, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import {
  IconFolder, IconChevronRight, IconChevronDown, IconChevronLeft,
  IconFile, IconFileText, IconFileSpreadsheet, IconFilePresentation, IconFilePdf,
  IconPlus, IconEye, IconEyeOff, IconSearch, IconRecord, IconSettings, IconOrganize, IconCheck, IconClose
} from './Icons'
import TodoPanel from './TodoPanel'
import OrganizePanel from './OrganizePanel'
import { defaultConfig, Product, ProjectWithFiles, FileItem, QuickTask, OrganizeRuleConfig, defaultOrganizeRuleConfig } from '../types'
import './LeftPanel.css'

interface LeftPanelProps {
  products: Product[]
  projects: ProjectWithFiles[]
  quickTasks: QuickTask[]
  selectedProductId: string | null
  focusedProjectId: string | null
  onSelectProduct: (id: string | null) => void
  onSelectProject: (id: string | null) => void
  onAddProduct?: (name: string, color: string, startYear: string, description?: string, workCode?: string) => void
  onAddProject: (name: string, province: string, year: string, productId?: string, workCode?: string) => void
  onAddFolder: (projectId: string, folderName: string) => void
  onAddProductFolder?: (productId: string, folderName: string) => void
  onAddFile: (projectId: string, folderId: string, fileName: string, fileType: string) => void
  onToggleProjectVisible: (projectId: string) => void
  onRenameFolder?: (projectId: string, folderId: string, newName: string) => void
  onRenameProduct?: (productId: string, newName: string) => void
  onRenameProject?: (projectId: string, newName: string) => void
  onAddQuickTask: (task: QuickTask) => void
  onUpdateQuickTask: (id: string, updates: Partial<QuickTask>) => void
  onSaveOrganizeRules?: (rules: OrganizeRuleConfig) => void
  organizeRules?: OrganizeRuleConfig
  onUpdateProductWorkCode?: (productId: string, workCode: string) => void
  onUpdateProjectWorkCode?: (projectId: string, workCode: string) => void
  onAddRecord?: (targetId: string, targetType: 'product' | 'project', content: string, files: never[]) => void
}

function LeftPanel({
  products, projects, quickTasks,
  selectedProductId, focusedProjectId,
  onSelectProduct, onSelectProject,
  onAddProduct, onAddProject, onAddFolder, onAddProductFolder, onAddFile, onToggleProjectVisible, onRenameFolder, onRenameProduct, onRenameProject,
  onAddQuickTask, onUpdateQuickTask,
  onSaveOrganizeRules, organizeRules = defaultOrganizeRuleConfig,
  onUpdateProductWorkCode, onUpdateProjectWorkCode,
  onAddRecord,
}: LeftPanelProps) {
  const [basePath] = useState(defaultConfig.basePath)

  // 展开/折叠状态
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set())
  const [expandedProductProjects, setExpandedProductProjects] = useState<Set<string>>(new Set())
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)

  // 搜索和筛选
  const [searchKeyword, setSearchKeyword] = useState('')
  const [showOnlyVisible, setShowOnlyVisible] = useState(true)
  const [drillDown, setDrillDown] = useState<{ level: 'product' | 'project', productId?: string, productIndex?: number } | null>(null)

  // 弹窗状态
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
  const [showAddQuickTaskModal, setShowAddQuickTaskModal] = useState(false)
  const [newQuickTaskTitle, setNewQuickTaskTitle] = useState('')
  const [showVisibilityModal, setShowVisibilityModal] = useState(false)
  const [showRenameProductModal, setShowRenameProductModal] = useState(false)
  const [renameProductId, setRenameProductId] = useState<string | null>(null)
  const [renameProductName, setRenameProductName] = useState('')
  const [showAddProductFolderModal, setShowAddProductFolderModal] = useState(false)
  const [addProductFolderProductId, setAddProductFolderProductId] = useState<string | null>(null)
  const [newProductFolderName, setNewProductFolderName] = useState('')
  const [showAddProjectWithProductModal, setShowAddProjectWithProductModal] = useState(false)
  const [addProjectProductId, setAddProjectProductId] = useState<string | null>(null)
  const [newProjectWithProductName, setNewProjectWithProductName] = useState('')
  const [newProjectWithProductProvince, setNewProjectWithProductProvince] = useState('浙江')
  const [newProjectWithProductYear, setNewProjectWithProductYear] = useState('2026')
  const [showRenameProjectModal, setShowRenameProjectModal] = useState(false)
  const [renameProjectId, setRenameProjectId] = useState<string | null>(null)
  const [renameProjectName, setRenameProjectName] = useState('')
  const [showOrganizeModal, setShowOrganizeModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addType, setAddType] = useState<'product' | 'project'>('product')
  const [newItemName, setNewItemName] = useState('')
  const [newItemStartYear, setNewItemStartYear] = useState('2026')
  const [newItemDescription, setNewItemDescription] = useState('')
  const [newItemWorkCode, setNewItemWorkCode] = useState('')
  // 项目专用字段
  const [newItemProvince, setNewItemProvince] = useState('浙江')
  const [newItemYear, setNewItemYear] = useState('2026')
  const [newItemProductId, setNewItemProductId] = useState<string | null>(null)

  // 工时代码编辑状态
  const [editingWorkCodeId, setEditingWorkCodeId] = useState<string | null>(null)
  const [editingWorkCodeValue, setEditingWorkCodeValue] = useState('')
  const [editingWorkCodeType, setEditingWorkCodeType] = useState<'product' | 'project'>('product')

  // 右键菜单
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: 'product' | 'project' | 'folder'; productId?: string; projectId?: string; folderId?: string } | null>(null)

  // 拖拽状态
  const [draggingFile, setDraggingFile] = useState<FileItem | null>(null)
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 })
  const [dragCurrentPos, setDragCurrentPos] = useState({ x: 0, y: 0 })
  const isDraggingRef = useRef(false)
  const dragThreshold = 5

  // 当进入专注模式时，左侧同步下钻
  useEffect(() => {
    // 产品专注模式：下钻到产品层级
    if (selectedProductId) {
      setDrillDown({ level: 'product', productId: selectedProductId })
      setExpandedProducts(prev => new Set(prev).add(selectedProductId))
    }
    // 项目专注模式：下钻到产品层级，高亮项目
    else if (focusedProjectId) {
      const project = projects.find(p => p.id === focusedProjectId)
      if (project) {
        if (project.productId) {
          setDrillDown({ level: 'product', productId: project.productId })
          setExpandedProducts(prev => new Set(prev).add(project.productId!))
          setExpandedProductProjects(prev => new Set(prev).add(project.id))
        } else {
          // 临时项目（无产品关联），不下钻但高亮
          setDrillDown(null)
        }
      }
    }
    // 非专注模式：退出下钻
    else {
      setDrillDown(null)
    }
  }, [selectedProductId, focusedProjectId, projects])

  // 筛选产品
  const filteredProducts = () => {
    let filtered = products
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase()
      filtered = filtered.filter(p => p.name.toLowerCase().includes(keyword))
    }
    return filtered
  }

  // 筛选项目（按产品）
  const filteredProjectsByProduct = (productId: string) => {
    let filtered = projects.filter(p => p.productId === productId)
    if (!showOnlyVisible) {
      // 显示全部
    } else {
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
    return filtered
  }


  // 展开/折叠函数
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
  const drillDownToProduct = (productId: string) => {
    setDrillDown({ level: 'product', productId })
    setExpandedProducts(prev => new Set(prev).add(productId))
  }

  const drillDownToProject = (productId: string, index: number) => {
    setDrillDown({ level: 'project', productId, productIndex: index })
  }

  const exitDrillDown = () => {
    setDrillDown(null)
    // 退出下钻时，也退出右侧专注模式
    onSelectProduct(null)
    onSelectProject(null)
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
  const renderFileRow = (file: FileItem, projectId: string, project: ProjectWithFiles) => (
    <div
      key={file.id}
      className="file-row clickable"
      onMouseDown={(e) => handleDragMouseDown(e, file)}
      onClick={() => {
        if (!draggingFile) {
          // 添加到历史打开的文件
          window.dispatchEvent(new CustomEvent('add-file-to-history', {
            detail: {
              file,
              targetId: projectId,
              targetType: 'project',
              targetName: project.name
            }
          }))
          // txt 文件直接进入编辑区
          if (file.type === 'txt' || file.extension === '.txt') {
            window.dispatchEvent(new CustomEvent('edit-text-file', {
              detail: {
                fileId: file.id,
                fileName: file.name,
                content: '', // 内容需要从文件读取，这里暂时为空
                targetId: projectId,
                targetType: 'project',
                fullPath: file.fullPath
              }
            }))
          } else {
            handleOpenFile(file.fullPath)
          }
        }
      }}
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
        className={`project-row-in-tree clickable ${focusedProjectId === project.id ? 'active' : ''}`}
        onClick={() => toggleExpand()}
        onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, type: 'project', projectId: project.id, productId: project.productId }) }}
      >
        <span className="node-expand">
          {isExpanded ? <IconChevronDown size={10} /> : <IconChevronRight size={10} />}
        </span>
        <span className={`node-dot ${project.color}`}></span>
        <span className="node-name">{project.name}</span>
        <span className="node-year-tag">{project.year}</span>
        <span className="node-province-tag">{project.province}</span>
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
                    {folder.files.map(file => renderFileRow(file, project.id, project))}
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
      case 'renameProduct':
        if (contextMenu.productId) {
          const product = products.find(p => p.id === contextMenu.productId)
          if (product) {
            setRenameProductId(contextMenu.productId)
            setRenameProductName(product.name)
            setShowRenameProductModal(true)
          }
        }
        break
      case 'addProductFolder':
        if (contextMenu.productId) {
          setAddProductFolderProductId(contextMenu.productId)
          setNewProductFolderName('')
          setShowAddProductFolderModal(true)
        }
        break
      case 'addProjectToProduct':
        if (contextMenu.productId) {
          setAddProjectProductId(contextMenu.productId)
          setNewProjectWithProductName('')
          setNewProjectWithProductProvince('浙江')
          setNewProjectWithProductYear('2026')
          setShowAddProjectWithProductModal(true)
        }
        break
      case 'renameProject':
        if (contextMenu.projectId) {
          const project = projects.find(p => p.id === contextMenu.projectId)
          if (project) {
            setRenameProjectId(contextMenu.projectId)
            setRenameProjectName(project.name)
            setShowRenameProjectModal(true)
          }
        }
        break
      case 'addFolder':
        if (contextMenu.productId) {
          setAddFolderProjectId(contextMenu.productId)
          setNewFolderName('')
          setShowAddFolderModal(true)
        }
        break
      case 'renameFolder':
        if (contextMenu.productId && contextMenu.folderId) {
          const project = projects.find(p => p.id === contextMenu.productId)
          const folder = project?.folders.find(f => f.id === contextMenu.folderId)
          if (folder) {
            setRenameFolderProjectId(contextMenu.productId)
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
        if (contextMenu.productId && contextMenu.folderId) {
          const fileType = action.replace('addFile', '').toLowerCase()
          setAddFileProjectId(contextMenu.productId)
          setAddFileFolderId(contextMenu.folderId)
          setNewFileName('')
          setNewFileType(fileType)
          setShowAddFileModal(true)
        }
        break
      case 'addDocument':
        if (contextMenu.productId && contextMenu.folderId) {
          setAddDocumentProjectId(contextMenu.productId)
          setAddDocumentFolderId(contextMenu.folderId)
          setNewDocumentName('')
          setNewDocumentType('note')
          setShowAddDocumentModal(true)
        }
        break
    }
    closeContextMenu()
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

  // 重命名产品
  const handleRenameProduct = () => {
    if (renameProductId && renameProductName.trim()) {
      onRenameProduct?.(renameProductId, renameProductName.trim())
      setShowRenameProductModal(false)
      setRenameProductId(null)
      setRenameProductName('')
    }
  }

  // 在产品下新建文件夹
  const handleAddProductFolder = () => {
    if (addProductFolderProductId && newProductFolderName.trim()) {
      onAddProductFolder?.(addProductFolderProductId, newProductFolderName.trim())
      setShowAddProductFolderModal(false)
      setAddProductFolderProductId(null)
      setNewProductFolderName('')
    }
  }

  // 在产品下新建项目
  const handleAddProjectWithProduct = () => {
    if (addProjectProductId && newProjectWithProductName.trim()) {
      onAddProject(newProjectWithProductName.trim(), newProjectWithProductProvince, newProjectWithProductYear, addProjectProductId)
      setShowAddProjectWithProductModal(false)
      setAddProjectProductId(null)
      setNewProjectWithProductName('')
    }
  }

  // 重命名项目
  const handleRenameProject = () => {
    if (renameProjectId && renameProjectName.trim()) {
      onRenameProject?.(renameProjectId, renameProjectName.trim())
      setShowRenameProjectModal(false)
      setRenameProjectId(null)
      setRenameProjectName('')
    }
  }

  // 添加临时任务
  const handleAddQuickTask = () => {
    if (newQuickTaskTitle.trim()) {
      const now = new Date().toISOString()
      onAddQuickTask({
        id: `qt${Date.now()}`,
        title: newQuickTaskTitle.trim(),
        status: 'active',
        priority: 'medium',
        createdAt: now,
        updatedAt: now,
        records: [],
        tags: []
      })
      setNewQuickTaskTitle('')
      setShowAddQuickTaskModal(false)
    }
  }

  return (
    <aside className="left-panel" onClick={closeContextMenu}>
      {/* 区块一：产品/项目列表 */}
      <section className="panel-block product-block">
        <header className="block-header">
          <h3>产品/项目</h3>
          <div className="block-toolbar">
            <button className="toolbar-btn-small" onClick={() => setShowOrganizeModal(true)} title="文件整理">
              <IconOrganize size={12} />
            </button>
            <button className="toolbar-btn-small" onClick={() => setShowVisibilityModal(true)} title="显示设置">
              <IconSettings size={12} />
            </button>
            <button className="toolbar-btn-small" onClick={() => { setAddType('product'); setNewItemName(''); setShowAddModal(true) }} title="新建">
              <IconPlus size={12} />
            </button>
          </div>
        </header>
        {/* 搜索栏 */}
        <div className="files-search-inline">
          <IconSearch size={12} />
          <input
            type="text"
            value={searchKeyword}
            onChange={e => setSearchKeyword(e.target.value)}
            placeholder="搜索产品/项目..."
          />
          <button
            className={`toolbar-btn-small toggle-btn ${showOnlyVisible ? 'active' : ''}`}
            onClick={() => setShowOnlyVisible(!showOnlyVisible)}
            title={showOnlyVisible ? '显示全部' : '仅显示可见'}
          >
            <IconEye size={12} />
          </button>
        </div>
        {/* 下钻导航栏 */}
        {drillDown && (
          <div className="drill-down-bar">
            <button className="drill-back-btn" onClick={exitDrillDown}>
              <IconChevronLeft size={10} />
            </button>
            <span className="drill-path">
              {drillDown.level === 'product' && products.find(p => p.id === drillDown.productId)?.name}
            </span>
          </div>
        )}
        <div className="block-content">
          {/* 下钻模式：只显示当前产品的项目列表 */}
          {drillDown && drillDown.level === 'product' && drillDown.productId ? (
            (() => {
              const product = products.find(p => p.id === drillDown.productId)
              if (!product) return null
              const relatedProjects = filteredProjectsByProduct(product.id)
              return (
                <div className="drill-down-content">
                  {relatedProjects.map(project => {
                    const isProjExpanded = expandedProductProjects.has(project.id)
                    return renderProjectNode(project, isProjExpanded, () => toggleProductProjectExpand(project.id))
                  })}
                  {relatedProjects.length === 0 && (
                    <div className="empty-hint">该产品暂无项目</div>
                  )}
                </div>
              )
            })()
          ) : (
            /* 正常模式：显示所有产品树 */
            filteredProducts().map(product => {
              const isProductExpanded = expandedProducts.has(product.id)
              const relatedProjects = filteredProjectsByProduct(product.id)
              return (
                <div key={product.id} className="product-tree-node">
                  <div
                    className={`product-tree-row clickable ${selectedProductId === product.id ? 'active' : ''}`}
                    onClick={() => toggleProductExpand(product.id)}
                    onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, type: 'product', productId: product.id }) }}
                  >
                    <span className="node-expand">
                      {isProductExpanded ? <IconChevronDown size={10} /> : <IconChevronRight size={10} />}
                    </span>
                    <span className={`node-dot ${product.color}`}></span>
                    <span className="node-name">{product.name}</span>
                    <span className="node-year-range">{product.startYear}{product.endYear ? `-${product.endYear}` : '-进行中'}</span>
                    <span className="node-meta">{relatedProjects.length}</span>
                    <button
                      className="drill-btn"
                      onClick={(e) => { e.stopPropagation(); drillDownToProduct(product.id) }}
                      title="下钻"
                    >
                      <IconChevronRight size={10} />
                    </button>
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
            })
          )}
        </div>
      </section>

      {/* 区块二：待办 */}
      <section className="panel-block todo-block">
        <header className="block-header">
          <h3>待办</h3>
        </header>
        <div className="block-content">
          <TodoPanel products={products} projects={projects} onAddRecord={onAddRecord} />
        </div>
      </section>

      {/* 右键菜单 */}
      {contextMenu && (
        <div className="context-menu" style={{ left: contextMenu.x, top: contextMenu.y }} onClick={e => e.stopPropagation()}>
          {contextMenu.type === 'product' && (
            <>
              <div className="context-menu-item" onClick={() => handleContextMenuAction('renameProduct')}>
                重命名
              </div>
              <div className="context-menu-separator" />
              <div className="context-menu-item" onClick={() => handleContextMenuAction('addProductFolder')}>
                <IconFolder size={12} /> 新建文件夹
              </div>
              <div className="context-menu-item" onClick={() => handleContextMenuAction('addProjectToProduct')}>
                <IconPlus size={12} /> 新建项目
              </div>
            </>
          )}
          {contextMenu.type === 'project' && (
            <>
              <div className="context-menu-item" onClick={() => handleContextMenuAction('renameProject')}>
                重命名
              </div>
              <div className="context-menu-separator" />
              <div className="context-menu-item" onClick={() => handleContextMenuAction('addFolder')}>
                <IconPlus size={12} /> 新建文件夹
              </div>
            </>
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

      {/* 显示设置弹窗 */}
      {showVisibilityModal && (
        <div className="modal-overlay" onClick={() => setShowVisibilityModal(false)}>
          <div className="modal modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>显示设置</h3>
              <button className="modal-close" onClick={() => setShowVisibilityModal(false)}><IconClose size={14} /></button>
            </div>
            <div className="modal-body">
              <div className="visibility-section">
                <h4>产品显示</h4>
                <div className="visibility-list">
                  {products.map(product => (
                    <div key={product.id} className="visibility-item">
                      <span className={`node-dot ${product.color}`}></span>
                      <span className="visibility-name">{product.name}</span>
                      <span className="visibility-year-range">{product.startYear}{product.endYear ? `-${product.endYear}` : '-进行中'}</span>
                      {editingWorkCodeId === product.id && editingWorkCodeType === 'product' ? (
                        <>
                          <input
                            className="workcode-input-inline"
                            value={editingWorkCodeValue}
                            onChange={e => setEditingWorkCodeValue(e.target.value)}
                            placeholder="工时代码"
                            autoFocus
                          />
                          <button className="btn-icon-confirm" onClick={() => {
                            if (onUpdateProductWorkCode) {
                              onUpdateProductWorkCode(product.id, editingWorkCodeValue.trim())
                            }
                            setEditingWorkCodeId(null)
                          }}><IconCheck size={12} /></button>
                          <button className="btn-icon-cancel" onClick={() => setEditingWorkCodeId(null)}><IconClose size={12} /></button>
                        </>
                      ) : (
                        <>
                          <span className="visibility-workcode">{product.workCode || '未设置'}</span>
                          <button className="btn-icon-edit" onClick={() => {
                            setEditingWorkCodeId(product.id)
                            setEditingWorkCodeType('product')
                            setEditingWorkCodeValue(product.workCode || '')
                          }}>编辑</button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="visibility-section">
                <h4>项目显示</h4>
                <div className="visibility-list">
                  {projects.filter(p => p.id !== 'personal').map(project => (
                    <div key={project.id} className="visibility-item">
                      <span className={`node-dot ${project.color}`}></span>
                      <span className="visibility-name">{project.name}</span>
                      <span className="visibility-year">{project.year}</span>
                      <span className="visibility-province">{project.province}</span>
                      {editingWorkCodeId === project.id && editingWorkCodeType === 'project' ? (
                        <>
                          <input
                            className="workcode-input-inline"
                            value={editingWorkCodeValue}
                            onChange={e => setEditingWorkCodeValue(e.target.value)}
                            placeholder="工时代码"
                            autoFocus
                          />
                          <button className="btn-icon-confirm" onClick={() => {
                            if (onUpdateProjectWorkCode) {
                              onUpdateProjectWorkCode(project.id, editingWorkCodeValue.trim())
                            }
                            setEditingWorkCodeId(null)
                          }}><IconCheck size={12} /></button>
                          <button className="btn-icon-cancel" onClick={() => setEditingWorkCodeId(null)}><IconClose size={12} /></button>
                        </>
                      ) : (
                        <>
                          <span className="visibility-workcode">{project.workCode || '未设置'}</span>
                          <button className="btn-icon-edit" onClick={() => {
                            setEditingWorkCodeId(project.id)
                            setEditingWorkCodeType('project')
                            setEditingWorkCodeValue(project.workCode || '')
                          }}>编辑</button>
                        </>
                      )}
                      <button className="visibility-toggle" onClick={() => onToggleProjectVisible(project.id)}>
                        {project.visible ? <IconEye size={14} /> : <IconEyeOff size={14} />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setShowVisibilityModal(false)}>完成</button>
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

      {/* 新建临时任务弹窗 */}
      {showAddQuickTaskModal && (
        <div className="modal-overlay" onClick={() => setShowAddQuickTaskModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>新建临时项目</h3>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <label>项目名称</label>
                <input type="text" value={newQuickTaskTitle} onChange={e => setNewQuickTaskTitle(e.target.value)} placeholder="输入临时项目名称" autoFocus />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddQuickTaskModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleAddQuickTask}>创建</button>
            </div>
          </div>
        </div>
      )}

      {/* 重命名产品弹窗 */}
      {showRenameProductModal && (
        <div className="modal-overlay" onClick={() => setShowRenameProductModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>重命名产品</h3>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <label>产品名称</label>
                <input type="text" value={renameProductName} onChange={e => setRenameProductName(e.target.value)} placeholder="输入产品名称" autoFocus />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRenameProductModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleRenameProduct}>确定</button>
            </div>
          </div>
        </div>
      )}

      {/* 在产品下新建文件夹弹窗 */}
      {showAddProductFolderModal && (
        <div className="modal-overlay" onClick={() => setShowAddProductFolderModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>新建文件夹</h3>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <label>文件夹名称</label>
                <input type="text" value={newProductFolderName} onChange={e => setNewProductFolderName(e.target.value)} placeholder="输入文件夹名称" autoFocus />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddProductFolderModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleAddProductFolder}>创建</button>
            </div>
          </div>
        </div>
      )}

      {/* 在产品下新建项目弹窗 */}
      {showAddProjectWithProductModal && (
        <div className="modal-overlay" onClick={() => setShowAddProjectWithProductModal(false)}>
          <div className="modal modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>新建项目</h3>
              <button className="modal-close" onClick={() => setShowAddProjectWithProductModal(false)}><IconFile size={14} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <label>项目名称</label>
                <input type="text" value={newProjectWithProductName} onChange={e => setNewProjectWithProductName(e.target.value)} placeholder="输入项目名称" autoFocus />
              </div>
              <div className="form-row">
                <label>年份</label>
                <div className="select-btn-group">
                  {['2026', '2025', '2024'].map(year => (
                    <button key={year} className={`select-btn ${newProjectWithProductYear === year ? 'active' : ''}`} onClick={() => setNewProjectWithProductYear(year)}>
                      {year}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-row">
                <label>省份</label>
                <div className="select-btn-group">
                  {['浙江', '江苏', '安徽', '上海'].map(province => (
                    <button key={province} className={`select-btn ${newProjectWithProductProvince === province ? 'active' : ''}`} onClick={() => setNewProjectWithProductProvince(province)}>
                      {province}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-hint">{basePath}/项目/{newProjectWithProductYear}/{newProjectWithProductProvince}/{newProjectWithProductName || '项目名'}</div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddProjectWithProductModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleAddProjectWithProduct}>创建</button>
            </div>
          </div>
        </div>
      )}

      {/* 重命名项目弹窗 */}
      {showRenameProjectModal && (
        <div className="modal-overlay" onClick={() => setShowRenameProjectModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>重命名项目</h3>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <label>项目名称</label>
                <input type="text" value={renameProjectName} onChange={e => setRenameProjectName(e.target.value)} placeholder="输入项目名称" autoFocus />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRenameProjectModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleRenameProject}>确定</button>
            </div>
          </div>
        </div>
      )}

      {/* 新建弹窗 - 产品/项目 */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>新建</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}><IconFile size={14} /></button>
            </div>
            <div className="modal-body">
              {/* 类型选择 */}
              <div className="form-row">
                <label>类型</label>
                <div className="select-btn-group">
                  <button className={`select-btn ${addType === 'product' ? 'active' : ''}`} onClick={() => setAddType('product')}>
                    产品
                  </button>
                  <button className={`select-btn ${addType === 'project' ? 'active' : ''}`} onClick={() => setAddType('project')}>
                    项目
                  </button>
                </div>
              </div>

              {/* 名称 */}
              <div className="form-row">
                <label>{addType === 'product' ? '产品名称' : '项目名称'}</label>
                <input type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder={`输入${addType === 'product' ? '产品' : '项目'}名称`} autoFocus />
              </div>

              {/* 产品表单 */}
              {addType === 'product' && (
                <>
                  <div className="form-row">
                    <label>年份</label>
                    <div className="select-btn-group">
                      {['2026', '2025', '2024', '2023'].map(year => (
                        <button key={year} className={`select-btn ${newItemStartYear === year ? 'active' : ''}`} onClick={() => setNewItemStartYear(year)}>
                          {year}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-row">
                    <label>工时代码</label>
                    <input type="text" value={newItemWorkCode} onChange={e => setNewItemWorkCode(e.target.value)} placeholder="工时代码（可选）" />
                  </div>
                  <div className="form-row">
                    <label>描述</label>
                    <input type="text" value={newItemDescription} onChange={e => setNewItemDescription(e.target.value)} placeholder="产品描述（可选）" />
                  </div>
                  <div className="form-hint">{basePath}/产品/{newItemName || '产品名'}</div>
                </>
              )}

              {/* 项目表单 */}
              {addType === 'project' && (
                <>
                  <div className="form-row">
                    <label>所属产品</label>
                    <div className="select-btn-group">
                      <button className={`select-btn ${newItemProductId === null ? 'active' : ''}`} onClick={() => setNewItemProductId(null)}>
                        无
                      </button>
                      {products.map(product => (
                        <button key={product.id} className={`select-btn ${newItemProductId === product.id ? 'active' : ''}`} onClick={() => setNewItemProductId(product.id)}>
                          <span className={`node-dot ${product.color}`}></span> {product.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-row">
                    <label>年份</label>
                    <div className="select-btn-group">
                      {['2026', '2025', '2024'].map(year => (
                        <button key={year} className={`select-btn ${newItemYear === year ? 'active' : ''}`} onClick={() => setNewItemYear(year)}>
                          {year}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-row">
                    <label>省份</label>
                    <div className="select-btn-group">
                      {['浙江', '江苏', '安徽', '上海'].map(province => (
                        <button key={province} className={`select-btn ${newItemProvince === province ? 'active' : ''}`} onClick={() => setNewItemProvince(province)}>
                          {province}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-row">
                    <label>工时代码</label>
                    <input type="text" value={newItemWorkCode} onChange={e => setNewItemWorkCode(e.target.value)} placeholder="工时代码（可选）" />
                  </div>
                  <div className="form-hint">{basePath}/项目/{newItemYear}/{newItemProvince}/{newItemName || '项目名'}</div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={() => {
                if (newItemName.trim()) {
                  const workCodeValue = newItemWorkCode.trim() || undefined
                  if (addType === 'product' && onAddProduct) {
                    onAddProduct(newItemName.trim(), 'blue', newItemStartYear, newItemDescription.trim(), workCodeValue)
                  } else if (addType === 'project') {
                    onAddProject(newItemName.trim(), newItemProvince, newItemYear, newItemProductId || undefined, workCodeValue)
                  }
                  setShowAddModal(false)
                  setNewItemName('')
                  setNewItemDescription('')
                  setNewItemWorkCode('')
                  setNewItemProductId(null)
                }
              }}>创建</button>
            </div>
          </div>
        </div>
      )}

      {/* 拖拽指示器 */}
      {renderDragIndicator()}

      {/* 文件整理面板 */}
      <OrganizePanel
        isOpen={showOrganizeModal}
        onClose={() => setShowOrganizeModal(false)}
        basePath={basePath}
        products={products}
        projects={projects}
        organizeRules={organizeRules}
        onSaveRules={onSaveOrganizeRules}
      />
    </aside>
  )
}

export default LeftPanel