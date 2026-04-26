import React, { useState, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import {
  IconFolder, IconFiles, IconFileText, IconFileSpreadsheet, IconFilePresentation,
  IconFilePdf, IconFile, IconFileImage, IconClose, IconCheck, IconPlus,
  IconTool, IconCalendar, IconRecord, IconChecklist, IconInfo,
  IconEdit, IconTrash, IconCopy, IconImport, IconUpload, IconArrowUp,
  IconSave, IconLink, IconAttach
} from './Icons'
import { ProjectWithFiles, Folder, FileItem } from '../types'
import './ProjectDetail.css'
import './PanelFull.css'

// 文件类型SVG图标组件映射
const FileTypeIcon = ({ type, size = 14 }: { type: string; size?: number }) => {
  switch (type) {
    case 'pdf': return <IconFilePdf size={size} />
    case 'doc': return <IconFileText size={size} />
    case 'xls': return <IconFileSpreadsheet size={size} />
    case 'ppt': return <IconFilePresentation size={size} />
    case 'img': return <IconFileImage size={size} />
    case 'note': return <IconFileText size={size} />
    case 'md': return <IconFileText size={size} />
    case 'txt': return <IconFileText size={size} />
    default: return <IconFile size={size} />
  }
}

// 文件夹图标映射
const FolderIcon = ({ iconType, size = 16 }: { iconType?: string; size?: number }) => {
  switch (iconType) {
    case 'report': return <IconFilePresentation size={size} />
    case 'document': return <IconFileText size={size} />
    case 'history': return <IconFolder size={size} />
    default: return <IconFolder size={size} />
  }
}

interface WorkRecord {
  id: string
  projectId: string
  content: string
  time: string
  date: string
  files: { id: string; name: string; type: string; path?: string }[]
}

interface ProjectDetailProps {
  project: ProjectWithFiles
  onClose: () => void
  defaultTab?: 'projectRecords' | 'files' | 'records' | 'todos' | 'info'
  projectRecords?: WorkRecord[]
}

interface RecordItem {
  date: string
  content: string
  time: string
}

interface TodoItem {
  text: string
  completed: boolean
  dueDate: string
}

interface ProjectInfo extends ProjectWithFiles {
  status: 'active' | 'paused' | 'completed'
  description: string
  records: RecordItem[]
  todos: TodoItem[]
}

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  type: 'file' | 'folder' | 'empty'
  targetId?: string
}

interface CreateFileDialogState {
  visible: boolean
  fileType: 'doc' | 'ppt' | 'pdf' | 'xls' | 'note' | 'md' | 'txt'
  fileName: string
}

const fileTypes: Record<string, { label: string; icon: React.ReactNode; extension: string }> = {
  doc: { label: 'Word 文档', icon: <IconFileText size={14} />, extension: '.docx' },
  ppt: { label: 'PPT 演示文稿', icon: <IconFilePresentation size={14} />, extension: '.pptx' },
  pdf: { label: 'PDF 文档', icon: <IconFilePdf size={14} />, extension: '.pdf' },
  xls: { label: 'Excel 表格', icon: <IconFileSpreadsheet size={14} />, extension: '.xlsx' },
  note: { label: '笔记文档', icon: <IconFileText size={14} />, extension: '.note' },
  md: { label: 'Markdown', icon: <IconFileText size={14} />, extension: '.md' },
  txt: { label: '文本文件', icon: <IconFileText size={14} />, extension: '.txt' }
}

// 可在线编辑的文件类型
const editableFileTypes = ['note', 'md', 'txt']

// 将项目数据转换为包含额外信息的ProjectInfo
const toProjectInfo = (project: ProjectWithFiles): ProjectInfo => ({
  ...project,
  status: 'active',
  description: `${project.name}项目，位于${project.province}，创建于${project.createdAt}`,
  records: [
    { date: project.updatedAt.slice(5).replace('-', '/'), content: '项目更新维护', time: '10:00' },
  ],
  todos: [
    { text: '完成项目文件整理', completed: false, dueDate: project.updatedAt },
  ]
})

function ProjectDetail({ project, onClose, defaultTab = 'projectRecords', projectRecords = [] }: ProjectDetailProps) {
  const [projectInfo, setProjectInfo] = useState<ProjectInfo>(() => toProjectInfo(project))
  const [activeTab, setActiveTab] = useState<'projectRecords' | 'files' | 'records' | 'todos' | 'info'>(defaultTab)
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [showAddFolder, setShowAddFolder] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, type: 'empty' })
  const [isDragging, setIsDragging] = useState(false)
  const [dragFiles, setDragFiles] = useState<FileItem[]>([])
  const [createFileDialog, setCreateFileDialog] = useState<CreateFileDialogState>({ visible: false, fileType: 'doc', fileName: '' })
  const [showOpenNotification, setShowOpenNotification] = useState<string | null>(null)
  const [showOrganizeMenu, setShowOrganizeMenu] = useState(false)
  const fileMainRef = useRef<HTMLDivElement>(null)

  // 文档编辑状态
  const [editingDoc, setEditingDoc] = useState<FileItem | null>(null)
  const [editorContent, setEditorContent] = useState('')
  const editorRef = useRef<HTMLDivElement>(null)
  const [isSaving, setIsSaving] = useState(false)

  const statusLabels = {
    active: '进行中',
    paused: '暂停',
    completed: '已完成'
  }

  const statusColors = {
    active: 'blue',
    paused: 'orange',
    completed: 'green'
  }

  // 打开文档进行编辑
  const handleOpenDocumentForEdit = async (file: FileItem) => {
    if (!editableFileTypes.includes(file.type)) {
      // 非 editable 类型，用系统默认程序打开
      try {
        await invoke('open_file', { path: file.fullPath })
        setShowOpenNotification(`正在打开 ${file.name}...`)
        setTimeout(() => setShowOpenNotification(null), 3000)
      } catch (error) {
        setShowOpenNotification(`打开失败: ${error}`)
        setTimeout(() => setShowOpenNotification(null), 3000)
      }
      return
    }

    // editable 类型，读取内容并打开编辑器
    try {
      const content = await invoke<string>('read_file_content', { path: file.fullPath })
      setEditingDoc(file)
      setEditorContent(content)
    } catch (error) {
      setShowOpenNotification(`读取文件失败: ${error}`)
      setTimeout(() => setShowOpenNotification(null), 3000)
    }
  }

  // 保存文档内容
  const handleSaveDocument = async () => {
    if (!editingDoc) return
    setIsSaving(true)
    try {
      const content = editorRef.current?.innerHTML || editorContent
      await invoke('write_file_content', { path: editingDoc.fullPath, content })
      setShowOpenNotification(`${editingDoc.name} 已保存`)
      setTimeout(() => setShowOpenNotification(null), 2000)
    } catch (error) {
      setShowOpenNotification(`保存失败: ${error}`)
      setTimeout(() => setShowOpenNotification(null), 3000)
    }
    setIsSaving(false)
  }

  // 关闭编辑器
  const handleCloseEditor = () => {
    setEditingDoc(null)
    setEditorContent('')
  }

  // 富文本格式化命令
  const execFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
  }

  const handleBold = () => execFormat('bold')
  const handleItalic = () => execFormat('italic')
  const handleUnderline = () => execFormat('underline')
  const handleStrikethrough = () => execFormat('strikeThrough')
  const handleHeading = (level: number) => {
    execFormat('formatBlock', level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3')
  }
  const handleBulletList = () => execFormat('insertUnorderedList')
  const handleNumberedList = () => execFormat('insertOrderedList')

  // 右键菜单处理
  const handleContextMenu = (e: React.MouseEvent, type: 'file' | 'folder' | 'empty', targetId?: string) => {
    e.preventDefault()
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      type,
      targetId
    })
  }

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, type: 'empty' })
  }

  // 创建新文件
  const handleCreateFile = (fileType: 'doc' | 'ppt' | 'pdf' | 'xls' | 'note' | 'md' | 'txt') => {
    setCreateFileDialog({
      visible: true,
      fileType,
      fileName: `新建${fileTypes[fileType].label}`
    })
    closeContextMenu()
  }

  // 确认创建文件并打开
  const handleConfirmCreate = async () => {
    if (!selectedFolder || !createFileDialog.fileName.trim()) return

    const typeInfo = fileTypes[createFileDialog.fileType]
    const selectedFolderData = projectInfo.folders.find(f => f.id === selectedFolder)
    const fullPath = selectedFolderData ? `${selectedFolderData.fullPath}/${createFileDialog.fileName}${typeInfo.extension}` : ''
    const newFile: FileItem = {
      id: `file${Date.now()}`,
      name: `${createFileDialog.fileName}${typeInfo.extension}`,
      type: createFileDialog.fileType,
      extension: typeInfo.extension,
      size: 0,
      sizeDisplay: '0KB',
      date: new Date().toISOString().slice(0, 10),
      fullPath,
      editable: editableFileTypes.includes(createFileDialog.fileType),
      editorType: createFileDialog.fileType === 'md' ? 'markdown' : createFileDialog.fileType === 'note' ? 'rich' : 'text'
    }

    // 如果是可编辑文件，先创建空文件
    if (editableFileTypes.includes(createFileDialog.fileType)) {
      try {
        await invoke('create_document', { path: fullPath, content: '' })
      } catch (error) {
        setShowOpenNotification(`创建文件失败: ${error}`)
        setTimeout(() => setShowOpenNotification(null), 3000)
      }
    }

    setProjectInfo(prev => ({
      ...prev,
      folders: prev.folders.map(f =>
        f.id === selectedFolder ? { ...f, files: [...f.files, newFile] } : f
      )
    }))

    setCreateFileDialog({ visible: false, fileType: 'doc', fileName: '' })

    // 可编辑文件直接打开编辑器
    if (editableFileTypes.includes(createFileDialog.fileType)) {
      handleOpenDocumentForEdit(newFile)
    } else {
      setShowOpenNotification(`正在打开 ${newFile.name}...`)
      setTimeout(() => setShowOpenNotification(null), 3000)
    }
  }

  // 创建新文件夹
  const handleAddFolder = () => {
    if (newFolderName.trim()) {
      const newFolder: Folder = {
        id: `f${Date.now()}`,
        name: newFolderName,
        path: newFolderName,
        fullPath: `${projectInfo.fullPath}/${newFolderName}`,
        iconType: 'default',
        files: []
      }
      setProjectInfo(prev => ({
        ...prev,
        folders: [...prev.folders, newFolder]
      }))
      setNewFolderName('')
      setShowAddFolder(false)
    }
  }

  // 删除文件
  const handleDeleteFile = (fileId: string) => {
    if (!selectedFolder) return
    setProjectInfo(prev => ({
      ...prev,
      folders: prev.folders.map(f =>
        f.id === selectedFolder ? { ...f, files: f.files.filter(file => file.id !== fileId) } : f
      )
    }))
    closeContextMenu()
  }

  // 拖拽处理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!isDragging) setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (fileMainRef.current && !fileMainRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    // 模拟从本地拖入的文件
    if (selectedFolder) {
      const selectedFolderData = projectInfo.folders.find(f => f.id === selectedFolder)
      const mockFiles: FileItem[] = [
        { id: `file${Date.now()}`, name: '拖入文件1.pdf', type: 'pdf', extension: '.pdf', size: 1500000, sizeDisplay: '1.5MB', date: new Date().toISOString().slice(0, 10), fullPath: selectedFolderData ? `${selectedFolderData.fullPath}/拖入文件1.pdf` : '' },
        { id: `file${Date.now()+1}`, name: '拖入文件2.docx', type: 'doc', extension: '.docx', size: 200000, sizeDisplay: '200KB', date: new Date().toISOString().slice(0, 10), fullPath: selectedFolderData ? `${selectedFolderData.fullPath}/拖入文件2.docx` : '' },
      ]
      setDragFiles(mockFiles)
      setProjectInfo(prev => ({
        ...prev,
        folders: prev.folders.map(f =>
          f.id === selectedFolder ? { ...f, files: [...f.files, ...mockFiles] } : f
        )
      }))
    }
  }

  // 自动整理功能
  const handleAutoOrganize = (mode: 'date' | 'type' | 'name') => {
    const allFiles: FileItem[] = projectInfo.folders.flatMap(f => f.files)

    let newFolders: Folder[] = []

    if (mode === 'date') {
      // 按日期分组
      const dateMap = new Map<string, FileItem[]>()
      allFiles.forEach(file => {
        const month = file.date.slice(0, 7) // 2026-04
        if (!dateMap.has(month)) dateMap.set(month, [])
        dateMap.get(month)!.push(file)
      })
      newFolders = Array.from(dateMap.entries()).map(([date, files], idx) => ({
        id: `org_${idx}`,
        name: `${date.replace('-', '年')}月文件`,
        path: `${date.replace('-', '年')}月文件`,
        fullPath: `${projectInfo.fullPath}/${date.replace('-', '年')}月文件`,
        iconType: 'default' as const,
        files
      }))
    } else if (mode === 'type') {
      // 按类型分组
      const typeMap = new Map<string, FileItem[]>()
      const typeNames: Record<string, string> = {
        pdf: 'PDF文档',
        doc: 'Word文档',
        xls: 'Excel表格',
        ppt: 'PPT演示',
        img: '图片文件',
        other: '其他文件'
      }
      allFiles.forEach(file => {
        const type = file.type || 'other'
        if (!typeMap.has(type)) typeMap.set(type, [])
        typeMap.get(type)!.push(file)
      })
      newFolders = Array.from(typeMap.entries()).map(([type, files], idx) => ({
        id: `org_${idx}`,
        name: typeNames[type] || type,
        path: typeNames[type] || type,
        fullPath: `${projectInfo.fullPath}/${typeNames[type] || type}`,
        iconType: type === 'pdf' ? 'document' : type === 'doc' ? 'document' : type === 'xls' || type === 'ppt' ? 'report' : 'default' as const,
        files
      }))
    } else if (mode === 'name') {
      // 按名称首字母分组
      const nameMap = new Map<string, FileItem[]>()
      allFiles.forEach(file => {
        const firstChar = file.name.charAt(0).toUpperCase()
        if (!nameMap.has(firstChar)) nameMap.set(firstChar, [])
        nameMap.get(firstChar)!.push(file)
      })
      newFolders = Array.from(nameMap.entries()).map(([char, files], idx) => ({
        id: `org_${idx}`,
        name: `${char}开头`,
        path: `${char}开头`,
        fullPath: `${projectInfo.fullPath}/${char}开头`,
        iconType: 'default' as const,
        files
      }))
    }

    setProjectInfo(prev => ({
      ...prev,
      folders: newFolders.length > 0 ? newFolders : prev.folders
    }))
    setShowOrganizeMenu(false)
    setShowOpenNotification(`已按${mode === 'date' ? '日期' : mode === 'type' ? '类型' : '名称'}整理完成`)
    setTimeout(() => setShowOpenNotification(null), 2000)
  }

  // 点击空白处关闭菜单
  const handleMainClick = () => {
    closeContextMenu()
    setSelectedFile(null)
  }

  return (
    <div className="panel-full" onClick={closeContextMenu}>
      {/* 顶部信息栏 */}
      <header className="panel-full-header">
        <div className="pd-title-area">
          <span className={`pd-dot ${projectInfo.color}`}></span>
          <h1 className="pd-name">{projectInfo.name}</h1>
          <span className="pd-province">{projectInfo.province}</span>
          <span className={`pd-status ${statusColors[projectInfo.status]}`}>{statusLabels[projectInfo.status]}</span>
        </div>
        <button className="panel-full-close" onClick={onClose}><IconClose size={16} /></button>
      </header>

        {/* 项目简介 */}
        <div className="pd-brief">
          <p className="pd-desc">{projectInfo.description}</p>
          <div className="pd-meta">
            <span className="pd-date">开始: {projectInfo.createdAt}</span>
            {projectInfo.updatedAt && <span className="pd-date">更新: {projectInfo.updatedAt}</span>}
          </div>
        </div>

        {/* Tab导航 */}
        <div className="pd-tabs">
          <button className={`pd-tab ${activeTab === 'projectRecords' ? 'active' : ''}`} onClick={() => setActiveTab('projectRecords')}>
            <IconRecord size={16} /> 项目记录
          </button>
          <button className={`pd-tab ${activeTab === 'files' ? 'active' : ''}`} onClick={() => setActiveTab('files')}>
            <IconFolder size={16} /> 文件空间
          </button>
          <button className={`pd-tab ${activeTab === 'records' ? 'active' : ''}`} onClick={() => setActiveTab('records')}>
            <IconRecord size={16} /> 工作记录
          </button>
          <button className={`pd-tab ${activeTab === 'todos' ? 'active' : ''}`} onClick={() => setActiveTab('todos')}>
            <IconChecklist size={16} /> 待办任务
          </button>
          <button className={`pd-tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>
            <IconInfo size={16} /> 项目信息
          </button>
        </div>

        {/* 内容区域 */}
        <div className="pd-content">
          {/* 项目记录详情 */}
          {activeTab === 'projectRecords' && (
            <div className="pd-project-records">
              <div className="project-records-header">
                <span className="records-count">共 {projectRecords.length} 条记录</span>
              </div>
              <div className="project-records-expanded">
                {projectRecords.length > 0 ? (
                  projectRecords.map(record => (
                    <div key={record.id} className="project-record-expanded-item">
                      <div className="record-expanded-header">
                        <span className="record-expanded-date">{record.date}</span>
                        <span className="record-expanded-time">{record.time}</span>
                      </div>
                      <div className="record-expanded-content">
                        <p>{record.content}</p>
                        {record.files.length > 0 && (
                          <div className="record-expanded-files">
                            {record.files.map(file => (
                              <div key={file.id} className="record-expanded-file">
                                <span className="file-type-icon-svg"><FileTypeIcon type={file.type} size={12} /></span>
                                <span className="file-expanded-name">{file.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-records">暂无项目记录</div>
                )}
              </div>
            </div>
          )}
          {/* 文件空间 */}
          {activeTab === 'files' && (
            <div className="pd-files">
              <div className="file-sidebar">
                <div className="folder-list-header">
                  <span className="folder-list-title">文件夹</span>
                  <div className="organize-btn-wrapper">
                    <button
                      className="organize-btn"
                      onClick={() => setShowOrganizeMenu(!showOrganizeMenu)}
                      title="自动整理"
                    >
                      <IconTool size={14} /> 整理
                    </button>
                    {showOrganizeMenu && (
                      <div className="organize-menu" onClick={e => e.stopPropagation()}>
                        <div className="menu-item" onClick={() => handleAutoOrganize('date')}>
                          <span className="menu-icon-svg"><IconCalendar size={14} /></span> 按日期整理
                        </div>
                        <div className="menu-item" onClick={() => handleAutoOrganize('type')}>
                          <span className="menu-icon-svg"><IconFile size={14} /></span> 按类型整理
                        </div>
                        <div className="menu-item" onClick={() => handleAutoOrganize('name')}>
                          <span className="menu-icon-svg"><IconFileText size={14} /></span> 按名称整理
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="folder-list">
                  {projectInfo.folders.map(folder => (
                    <div
                      key={folder.id}
                      className={`folder-item ${selectedFolder === folder.id ? 'active' : ''}`}
                      onClick={() => setSelectedFolder(folder.id)}
                      onContextMenu={(e) => handleContextMenu(e, 'folder', folder.id)}
                    >
                      <span className="folder-icon-svg"><FolderIcon iconType={folder.iconType} /></span>
                      <span className="folder-name">{folder.name}</span>
                      <span className="folder-count">{folder.files.length}</span>
                    </div>
                  ))}
                  {showAddFolder ? (
                    <div className="add-folder-form">
                      <input
                        className="folder-input"
                        value={newFolderName}
                        onChange={e => setNewFolderName(e.target.value)}
                        placeholder="文件夹名称"
                        autoFocus
                        onKeyDown={e => { if (e.key === 'Enter') handleAddFolder(); if (e.key === 'Escape') setShowAddFolder(false); }}
                      />
                      <button className="btn-confirm-svg" onClick={handleAddFolder}><IconCheck size={12} /></button>
                      <button className="btn-cancel-svg" onClick={() => setShowAddFolder(false)}><IconClose size={12} /></button>
                    </div>
                  ) : (
                    <button className="add-folder-btn" onClick={() => setShowAddFolder(true)}>
                      <IconPlus size={12} /> 新建文件夹
                    </button>
                  )}
                </div>
              </div>

              {/* 文件列表或编辑器 */}
              <div
                className={`file-main ${isDragging ? 'dragging' : ''}`}
                ref={fileMainRef}
                onClick={handleMainClick}
                onContextMenu={(e) => handleContextMenu(e, 'empty')}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {editingDoc ? (
                  /* 文档编辑器 */
                  <div className="document-editor-container">
                    <div className="doc-editor-header">
                      <span className="doc-editor-title">
                        <span className="file-type-icon-svg"><FileTypeIcon type={editingDoc.type} size={14} /></span>
                        {editingDoc.name}
                      </span>
                      <div className="doc-editor-actions">
                        <button className="doc-btn save-btn" onClick={handleSaveDocument} disabled={isSaving}>
                          <IconSave size={14} /> {isSaving ? '保存中...' : '保存'}
                        </button>
                        <button className="doc-btn close-btn" onClick={handleCloseEditor}>
                          <IconClose size={14} /> 关闭
                        </button>
                      </div>
                    </div>
                    <div className="doc-editor-toolbar">
                      <button className="editor-btn" onClick={handleBold} title="加粗">B</button>
                      <button className="editor-btn italic" onClick={handleItalic} title="斜体">I</button>
                      <button className="editor-btn underline" onClick={handleUnderline} title="下划线">U</button>
                      <button className="editor-btn strike" onClick={handleStrikethrough} title="删除线">S</button>
                      <span className="toolbar-divider"></span>
                      <button className="editor-btn heading-btn" onClick={() => handleHeading(1)} title="一级标题">H1</button>
                      <button className="editor-btn heading-btn" onClick={() => handleHeading(2)} title="二级标题">H2</button>
                      <button className="editor-btn heading-btn" onClick={() => handleHeading(3)} title="三级标题">H3</button>
                      <span className="toolbar-divider"></span>
                      <button className="editor-btn" onClick={handleBulletList} title="无序列表">•</button>
                      <button className="editor-btn" onClick={handleNumberedList} title="有序列表">1.</button>
                    </div>
                    <div
                      ref={editorRef}
                      className="doc-editor-content"
                      contentEditable
                      suppressContentEditableWarning
                      data-placeholder="开始编辑文档内容..."
                      dangerouslySetInnerHTML={{ __html: editorContent }}
                    />
                  </div>
                ) : selectedFolder ? (
                  /* 文件列表 */
                  <div className="file-list">
                    <div className="file-list-header">
                      <span className="col-name">文件名</span>
                      <span className="col-size">大小</span>
                      <span className="col-date">日期</span>
                      <span className="col-path">路径</span>
                    </div>
                    <div className="file-list-body">
                      {projectInfo.folders.find(f => f.id === selectedFolder)?.files.map(file => (
                        <div
                          key={file.id}
                          className={`file-row ${selectedFile === file.id ? 'selected' : ''} ${editableFileTypes.includes(file.type) ? 'editable' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedFile(file.id)
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation()
                            handleOpenDocumentForEdit(file)
                          }}
                          onContextMenu={(e) => handleContextMenu(e, 'file', file.id)}
                        >
                          <span className="col-name">
                            <span className="file-type-icon-svg"><FileTypeIcon type={file.type} /></span>
                            {file.name}
                            {editableFileTypes.includes(file.type) && <span className="editable-badge">可编辑</span>}
                          </span>
                          <span className="col-size">{file.sizeDisplay}</span>
                          <span className="col-date">{file.date}</span>
                          <span className="col-path">{file.fullPath}</span>
                        </div>
                      ))}
                    </div>
                    {isDragging && (
                      <div className="drop-overlay">
                        <span className="drop-icon-svg"><IconImport size={24} /></span>
                        <span className="drop-text">拖放文件到这里</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="no-folder-selected">
                    <span className="hint-icon-svg"><IconFolder size={24} /></span>
                    <span className="hint-text">选择左侧文件夹查看文件</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 工作记录 */}
          {activeTab === 'records' && (
            <div className="pd-records">
              {projectInfo.records.map((record, idx) => (
                <div key={idx} className="pd-record-item">
                  <span className="pd-record-time">{record.time}</span>
                  <span className="pd-record-date">{record.date}</span>
                  <span className="pd-record-content">{record.content}</span>
                </div>
              ))}
              <div className="pd-add-record">
                <input className="pd-input" placeholder="添加新的工作记录..." />
                <button className="btn-add">添加</button>
              </div>
            </div>
          )}

          {/* 待办任务 */}
          {activeTab === 'todos' && (
            <div className="pd-todos">
              {projectInfo.todos.map((todo, idx) => (
                <div key={idx} className={`pd-todo-item ${todo.completed ? 'completed' : ''}`}>
                  <span className={`pd-check ${todo.completed ? 'done' : ''}`}></span>
                  <span className="pd-todo-text">{todo.text}</span>
                  <span className="pd-todo-date">{todo.dueDate}</span>
                </div>
              ))}
              <div className="pd-add-todo">
                <input className="pd-input" placeholder="添加待办任务..." />
                <button className="btn-add">添加</button>
              </div>
            </div>
          )}

          {/* 项目信息 */}
          {activeTab === 'info' && (
            <div className="pd-info">
              <div className="info-section">
                <h3 className="info-title">基本信息</h3>
                <div className="info-card">
                  <div className="info-card-row">
                    <span className="info-card-label">项目名称</span>
                    <span className="info-card-value">{projectInfo.name}</span>
                  </div>
                  <div className="info-card-row">
                    <span className="info-card-label">所属省份</span>
                    <span className="info-card-value">{projectInfo.province}</span>
                  </div>
                  <div className="info-card-row">
                    <span className="info-card-label">年份</span>
                    <span className="info-card-value">{projectInfo.year}</span>
                  </div>
                  <div className="info-card-row">
                    <span className="info-card-label">项目状态</span>
                    <span className="info-card-value">
                      <span className={`pd-status ${statusColors[projectInfo.status]}`}>{statusLabels[projectInfo.status]}</span>
                    </span>
                  </div>
                  <div className="info-card-row">
                    <span className="info-card-label">项目颜色</span>
                    <span className="info-card-value">
                      <span className={`pd-dot ${projectInfo.color}`}></span>
                      <span className="color-name">{projectInfo.color}</span>
                    </span>
                  </div>
                  <div className="info-card-row">
                    <span className="info-card-label">创建日期</span>
                    <span className="info-card-value">{projectInfo.createdAt}</span>
                  </div>
                  <div className="info-card-row">
                    <span className="info-card-label">更新日期</span>
                    <span className="info-card-value">{projectInfo.updatedAt || '-'}</span>
                  </div>
                  <div className="info-card-row full-width">
                    <span className="info-card-label">文件路径</span>
                    <span className="info-card-value path-value">{projectInfo.fullPath}</span>
                  </div>
                </div>
              </div>
              <div className="info-section">
                <h3 className="info-title">项目描述</h3>
                <div className="info-desc-expanded">
                  <p>{projectInfo.description}</p>
                </div>
              </div>
              <div className="info-section">
                <h3 className="info-title">文件夹概览</h3>
                <div className="folders-overview">
                  {projectInfo.folders.map(folder => (
                    <div key={folder.id} className="folder-overview-item">
                      <span className="folder-icon-svg"><FolderIcon iconType={folder.iconType} /></span>
                      <span className="folder-overview-name">{folder.name}</span>
                      <span className="folder-overview-count">{folder.files.length} 个文件</span>
                    </div>
                  ))}
                  {projectInfo.folders.length === 0 && (
                    <div className="no-folders">暂无文件夹</div>
                  )}
                </div>
              </div>
              <div className="info-section">
                <h3 className="info-title">工作记录概览</h3>
                <div className="records-overview">
                  {projectInfo.records.length > 0 ? (
                    projectInfo.records.map((record, idx) => (
                      <div key={idx} className="record-overview-item">
                        <span className="record-overview-date">{record.date}</span>
                        <span className="record-overview-time">{record.time}</span>
                        <span className="record-overview-content">{record.content}</span>
                      </div>
                    ))
                  ) : (
                    <div className="no-records">暂无工作记录</div>
                  )}
                </div>
              </div>
              <div className="info-section">
                <h3 className="info-title">待办任务概览</h3>
                <div className="todos-overview">
                  {projectInfo.todos.length > 0 ? (
                    projectInfo.todos.map((todo, idx) => (
                      <div key={idx} className={`todo-overview-item ${todo.completed ? 'completed' : ''}`}>
                        <span className={`todo-check ${todo.completed ? 'done' : ''}`}></span>
                        <span className="todo-overview-text">{todo.text}</span>
                        <span className="todo-overview-date">{todo.dueDate}</span>
                      </div>
                    ))
                  ) : (
                    <div className="no-todos">暂无待办任务</div>
                  )}
                </div>
              </div>
              <div className="info-actions">
                <button className="btn-edit">编辑信息</button>
              </div>
            </div>
          )}
        </div>

      {/* 右键菜单 */}
      {contextMenu.visible && (
        <div
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'empty' && selectedFolder && (
            <>
              <div className="menu-header">新建文件</div>
              <div className="menu-item" onClick={() => handleCreateFile('doc')}>
                <span className="menu-icon-svg"><IconFileText size={14} /></span> Word 文档
              </div>
              <div className="menu-item" onClick={() => handleCreateFile('ppt')}>
                <span className="menu-icon-svg"><IconFilePresentation size={14} /></span> PPT 演示文稿
              </div>
              <div className="menu-item" onClick={() => handleCreateFile('xls')}>
                <span className="menu-icon-svg"><IconFileSpreadsheet size={14} /></span> Excel 表格
              </div>
              <div className="menu-item" onClick={() => handleCreateFile('pdf')}>
                <span className="menu-icon-svg"><IconFilePdf size={14} /></span> PDF 文档
              </div>
              <div className="menu-divider"></div>
              <div className="menu-header">在线文档</div>
              <div className="menu-item" onClick={() => handleCreateFile('note')}>
                <span className="menu-icon-svg"><IconFileText size={14} /></span> 笔记文档 (.note)
              </div>
              <div className="menu-item" onClick={() => handleCreateFile('md')}>
                <span className="menu-icon-svg"><IconFileText size={14} /></span> Markdown (.md)
              </div>
              <div className="menu-item" onClick={() => handleCreateFile('txt')}>
                <span className="menu-icon-svg"><IconFileText size={14} /></span> 文本文件 (.txt)
              </div>
              <div className="menu-divider"></div>
              <div className="menu-item">
                <span className="menu-icon-svg"><IconImport size={14} /></span> 从本地导入...
              </div>
              <div className="menu-divider"></div>
              <div className="menu-item">
                <span className="menu-icon-svg"><IconCopy size={14} /></span> 粘贴
              </div>
            </>
          )}
          {contextMenu.type === 'file' && (
            <>
              <div className="menu-item" onClick={() => {
                const file = projectInfo.folders.find(f => f.id === selectedFolder)?.files.find(f => f.id === contextMenu.targetId)
                if (file) handleOpenDocumentForEdit(file)
                closeContextMenu()
              }}>
                <span className="menu-icon-svg"><IconFile size={14} /></span> 打开文件
              </div>
              <div className="menu-item">
                <span className="menu-icon-svg"><IconFolder size={14} /></span> 打开所在目录
              </div>
              <div className="menu-divider"></div>
              <div className="menu-item">
                <span className="menu-icon-svg"><IconEdit size={14} /></span> 重命名
              </div>
              <div className="menu-item" onClick={() => handleDeleteFile(contextMenu.targetId!)}>
                <span className="menu-icon-svg"><IconTrash size={14} /></span> 删除
              </div>
              <div className="menu-divider"></div>
              <div className="menu-item">
                <span className="menu-icon-svg"><IconCopy size={14} /></span> 复制路径
              </div>
            </>
          )}
          {contextMenu.type === 'folder' && (
            <>
              <div className="menu-item">
                <span className="menu-icon-svg"><IconEdit size={14} /></span> 重命名
              </div>
              <div className="menu-item">
                <span className="menu-icon-svg"><IconTrash size={14} /></span> 删除文件夹
              </div>
            </>
          )}
          {!selectedFolder && contextMenu.type === 'empty' && (
            <div className="menu-item disabled">请先选择文件夹</div>
          )}
        </div>
      )}

      {/* 创建文件对话框 */}
      {createFileDialog.visible && (
        <div className="create-file-dialog" onClick={(e) => e.stopPropagation()}>
          <div className="dialog-header">
            <span className="dialog-icon">{fileTypes[createFileDialog.fileType].icon}</span>
            <span className="dialog-title">新建 {fileTypes[createFileDialog.fileType].label}</span>
          </div>
          <div className="dialog-body">
            <input
              className="dialog-input"
              value={createFileDialog.fileName}
              onChange={(e) => setCreateFileDialog(prev => ({ ...prev, fileName: e.target.value }))}
              placeholder="文件名称"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmCreate()
                if (e.key === 'Escape') setCreateFileDialog({ visible: false, fileType: 'doc', fileName: '' })
              }}
            />
            <span className="dialog-extension">{fileTypes[createFileDialog.fileType].extension}</span>
          </div>
          <div className="dialog-actions">
            <button className="btn-cancel" onClick={() => setCreateFileDialog({ visible: false, fileType: 'doc', fileName: '' })}>取消</button>
            <button className="btn-confirm" onClick={handleConfirmCreate}>创建并打开</button>
          </div>
        </div>
      )}

      {/* 打开文件通知 */}
      {showOpenNotification && (
        <div className="open-notification">
          <span className="notification-icon-svg"><IconFolder size={16} /></span>
          <span className="notification-text">{showOpenNotification}</span>
        </div>
      )}
    </div>
  )
}

export default ProjectDetail