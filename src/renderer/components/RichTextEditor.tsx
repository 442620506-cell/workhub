import { useRef, useEffect, useState } from 'react'
import { IconAttach, IconFile, IconClose, IconMic, IconAudio } from './Icons'
import { ProjectWithFiles, AttachedFile } from '../types'
import './RichTextEditor.css'

// 获取文件类型图标SVG字符串（用于HTML插入）
const getFileTypeIconSvg = (type: string, size: number = 12): string => {
  const icons: Record<string, string> = {
    pdf: `<svg viewBox="0 0 24 24" width="${size}" height="${size}" style="vertical-align: middle;"><rect x="3" y="2" width="18" height="20" rx="2" fill="#C63030"/><text x="12" y="15" fontSize="7" fill="white" textAnchor="middle" fontFamily="sans-serif" fontWeight="bold">PDF</text></svg>`,
    doc: `<svg viewBox="0 0 24 24" width="${size}" height="${size}" style="vertical-align: middle;"><rect x="3" y="2" width="18" height="20" rx="2" fill="#2B579A"/><text x="12" y="15" fontSize="10" fill="white" textAnchor="middle" fontFamily="sans-serif" fontWeight="bold">W</text></svg>`,
    xls: `<svg viewBox="0 0 24 24" width="${size}" height="${size}" style="vertical-align: middle;"><rect x="3" y="2" width="18" height="20" rx="2" fill="#217346"/><text x="12" y="15" fontSize="10" fill="white" textAnchor="middle" fontFamily="sans-serif" fontWeight="bold">X</text></svg>`,
    ppt: `<svg viewBox="0 0 24 24" width="${size}" height="${size}" style="vertical-align: middle;"><rect x="3" y="2" width="18" height="20" rx="2" fill="#D24726"/><text x="12" y="15" fontSize="10" fill="white" textAnchor="middle" fontFamily="sans-serif" fontWeight="bold">P</text></svg>`,
    img: `<svg viewBox="0 0 24 24" width="${size}" height="${size}" style="vertical-align: middle;"><rect x="3" y="2" width="18" height="20" rx="2" fill="#8E44AD"/><text x="12" y="15" fontSize="7" fill="white" textAnchor="middle" fontFamily="sans-serif" fontWeight="bold">IMG</text></svg>`,
    note: `<svg viewBox="0 0 24 24" width="${size}" height="${size}" style="vertical-align: middle;"><rect x="3" y="2" width="18" height="20" rx="2" fill="#F39C12"/><text x="12" y="15" fontSize="7" fill="white" textAnchor="middle" fontFamily="sans-serif" fontWeight="bold">📝</text></svg>`,
    txt: `<svg viewBox="0 0 24 24" width="${size}" height="${size}" style="vertical-align: middle;"><rect x="3" y="2" width="18" height="20" rx="2" fill="#7F8C8D"/><text x="12" y="15" fontSize="7" fill="white" textAnchor="middle" fontFamily="sans-serif" fontWeight="bold">TXT</text></svg>`,
    md: `<svg viewBox="0 0 24 24" width="${size}" height="${size}" style="vertical-align: middle;"><rect x="3" y="2" width="18" height="20" rx="2" fill="#3498DB"/><text x="12" y="15" fontSize="7" fill="white" textAnchor="middle" fontFamily="sans-serif" fontWeight="bold">MD</text></svg>`,
  }
  return icons[type] || `<svg viewBox="0 0 24 24" width="${size}" height="${size}" style="vertical-align: middle;"><rect x="3" y="2" width="18" height="20" rx="2" fill="#95A5A6"/><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="white"/><polyline points="14,2 14,8 20,8" fill="white"/></svg>`
}

// 目标选择项类型
interface TargetItem {
  id: string
  name: string
  color?: string
  type: 'product' | 'project'
}

interface RichTextEditorProps {
  // 目标选择器配置
  showProjectSelector?: boolean
  projects?: TargetItem[]  // 改为支持产品/项目混合列表
  selectedProject?: string
  onProjectChange?: (projectId: string) => void

  // 编辑器内容
  content: string
  onContentChange: (content: string) => void

  // 附件配置
  attachedFiles?: AttachedFile[]
  onFileClick?: (file: AttachedFile) => void
  onFileRemove?: (fileId: string) => void
  onFileAdd?: () => void

  // 文件引用配置
  onFileRef?: () => void

  // 提交配置
  onSubmit?: () => void
  onSubmitWithContent?: (content: string, files: AttachedFile[]) => void  // 带内容的提交
  onCancel?: () => void  // 取消编辑
  submitHint?: string

  // MP3解析结果回调 - 直接添加记录和待办
  onMp3ParseResult?: (result: {
    records: Array<{ target: string; content: string }>;
    todos: Array<{ title: string; priority: string }>;
  }) => void

  // 编辑目标信息
  targetName?: string
  targetType?: 'product' | 'project'

  // 其他
  placeholder?: string
  autoFocus?: boolean
  className?: string
}

function RichTextEditor({
  showProjectSelector = false,
  projects = [],
  selectedProject,
  onProjectChange,
  content,
  onContentChange,
  attachedFiles = [],
  onFileClick,
  onFileRemove,
  onFileAdd,
  onFileRef,
  onSubmit,
  onSubmitWithContent,
  onCancel,
  submitHint = 'Ctrl+Enter 发送',
  onMp3ParseResult,
  targetName,
  targetType,
  placeholder = '记录工作内容...',
  autoFocus = false,
  className = ''
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const mp3InputRef = useRef<HTMLInputElement>(null)
  const [showMp3Modal, setShowMp3Modal] = useState(false)
  const [selectedMp3File, setSelectedMp3File] = useState<File | null>(null)
  const [mp3ParsePreview, setMp3ParsePreview] = useState<{
    textContent: string;
    records: Array<{ target: string; content: string }>;
    todos: Array<{ title: string; priority: string }>;
  } | null>(null)

  // 生成模拟解析数据（预览格式）
  const generateParsePreview = () => {
    return {
      textContent: '今天主要完成了项目申报材料的初稿编写，花了大约两个小时。下午参加了项目进度协调会议，确认了浙江项目下周需要完成需求文档，江苏项目需要准备汇报材料。明天需要重点跟进审批流程的进展。',
      records: [
        { target: '浙江政务平台一期', content: '完成申报材料初稿编写(2h)' },
        { target: '江苏政务平台二期', content: '项目进度协调会议 - 确认需求文档交付时间' },
      ],
      todos: [
        { title: '完成浙江项目需求文档', priority: '高' },
        { title: '准备江苏项目汇报材料', priority: '中' },
        { title: '跟进审批流程进展', priority: '高' },
      ],
    }
  }

  // 智能解析按钮点击 - 显示预览
  const handleSmartParse = () => {
    const preview = generateParsePreview()
    setMp3ParsePreview(preview)
  }

  // 确认插入解析结果 - 直接添加到记录和待办
  const handleConfirmParse = () => {
    if (!mp3ParsePreview) return

    // 如果有回调函数，直接将结果传递给父组件处理
    if (onMp3ParseResult) {
      onMp3ParseResult({
        records: mp3ParsePreview.records,
        todos: mp3ParsePreview.todos,
      })
    } else {
      // 没有回调时，作为文本插入到编辑器
      const htmlResult = `<div class="mp3-parse-result">
<h4>语音解析结果${selectedMp3File ? ` (${selectedMp3File.name})` : ''}</h4>
<div class="parse-section">
<p>${mp3ParsePreview.textContent}</p>
</div>
<div class="parse-section">
<h4>生成记录：</h4>
${mp3ParsePreview.records.map(r => `<p><strong>${r.target}</strong>: ${r.content}</p>`).join('')}
</div>
<div class="parse-section">
<h4>提取待办：</h4>
<ul>
${mp3ParsePreview.todos.map(t => `<li><span class="todo-tag">待办</span> ${t.title} (优先级: ${t.priority})</li>`).join('')}
</ul>
</div>
</div>`

      // 插入到编辑器
      if (editorRef.current) {
        editorRef.current.focus()
        document.execCommand('insertHTML', false, htmlResult)
        onContentChange(editorRef.current.innerHTML)
      }
    }

    // 关闭弹窗并清空
    setShowMp3Modal(false)
    setSelectedMp3File(null)
    setMp3ParsePreview(null)
  }

  // 取消预览
  const handleCancelPreview = () => {
    setMp3ParsePreview(null)
  }

  // 选择MP3文件
  const handleMp3FileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedMp3File(file)
    }
    e.target.value = ''
  }

  // 拖拽处理
  const handleMp3Drop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files?.[0]
    if (file && (file.name.endsWith('.mp3') || file.name.endsWith('.wav') || file.name.endsWith('.m4a'))) {
      setSelectedMp3File(file)
    }
  }

  const handleMp3DragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  // 监听文件引用事件
  useEffect(() => {
    const handleInsertFileRef = (e: CustomEvent) => {
      const file = e.detail?.file
      const targetEditor = e.detail?.targetEditor

      // 只处理目标编辑器是当前编辑器的事件
      if (file && editorRef.current && targetEditor === editorRef.current) {
        // 获取文件类型图标
        const iconSvg = getFileTypeIconSvg(file.type, 12)
        // 使用 contenteditable="false" 使文件标签成为不可编辑的原子单位
        const fileRefHtml = `<span contenteditable="false" class="file-tag file-tag-atomic" data-file-path="${file.fullPath}" data-file-name="${file.name}" data-file-type="${file.type}" draggable="true">${iconSvg} ${file.name}${file.extension || ''}<button class="file-remove-btn" contenteditable="false">×</button></span>&nbsp;`
        editorRef.current.focus()
        document.execCommand('insertHTML', false, fileRefHtml)
        // 触发内容更新
        onContentChange(editorRef.current.innerHTML)
      }
    }
    window.addEventListener('insert-file-ref', handleInsertFileRef as EventListener)
    return () => {
      window.removeEventListener('insert-file-ref', handleInsertFileRef as EventListener)
    }
  }, [onContentChange])

  // 处理编辑区点击事件（点击文件标签打开文件或删除）
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement

      // 点击删除按钮
      if (target.classList.contains('file-remove-btn')) {
        e.preventDefault()
        e.stopPropagation()
        const fileTag = target.closest('.file-tag-atomic')
        if (fileTag) {
          fileTag.remove()
          // 触发内容更新
          if (editorRef.current) {
            onContentChange(editorRef.current.innerHTML)
          }
        }
        return
      }

      // 点击文件标签本身（打开文件）
      const fileTag = target.closest('.file-tag-atomic')
      if (fileTag && !target.classList.contains('file-remove-btn')) {
        const filePath = fileTag.getAttribute('data-file-path')
        if (filePath) {
          // 阻止默认行为，防止编辑器失焦
          e.preventDefault()
          // 调用打开文件
          handleOpenFileRef(filePath)
        }
      }
    }

    const editorEl = editorRef.current
    if (editorEl) {
      editorEl.addEventListener('click', handleClick)
      return () => {
        editorEl.removeEventListener('click', handleClick)
      }
    }
  }, [])

  // 处理文件标签拖拽（二次拖拽）
  useEffect(() => {
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement
      if (target.classList.contains('file-tag-atomic')) {
        const filePath = target.getAttribute('data-file-path')
        const fileName = target.getAttribute('data-file-name')
        if (filePath && fileName) {
          e.dataTransfer?.setData('text/plain', JSON.stringify({ filePath, fileName }))
          e.dataTransfer?.setData('application/file-ref', 'true')
        }
      }
    }

    const editorEl = editorRef.current
    if (editorEl) {
      editorEl.addEventListener('dragstart', handleDragStart)
      return () => {
        editorEl.removeEventListener('dragstart', handleDragStart)
      }
    }
  }, [])

  // 打开文件引用
  const handleOpenFileRef = (filePath: string) => {
    // 触发自定义事件，让父组件处理
    window.dispatchEvent(new CustomEvent('open-file-ref', {
      detail: { path: filePath }
    }))
  }

  // 富文本格式化命令
  const execFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value)
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

  // 内容变化处理
  const handleBlur = () => {
    if (editorRef.current) {
      onContentChange(editorRef.current.innerHTML)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      // 先同步内容
      if (editorRef.current) {
        const currentContent = editorRef.current.innerHTML
        onContentChange(currentContent)
        // 如果有 onSubmitWithContent，传入最新内容
        if (onSubmitWithContent) {
          onSubmitWithContent(currentContent, attachedFiles)
        } else {
          onSubmit?.()
        }
      } else {
        onSubmit?.()
      }
    }
  }

  const regularProjects = projects.filter(p => p.id !== 'personal')

  // 编辑模式显示目标信息
  const showTargetInfo = targetName && targetType

  return (
    <div className={`rich-text-editor ${className}`}>
      {/* 目标信息显示 - 编辑模式 */}
      {showTargetInfo && (
        <div className="editor-target-info">
          <span className={`type-tag ${targetType}-tag`}>
            {targetType === 'product' ? '产品' : '项目'}
          </span>
          <span className="target-name">{targetName}</span>
        </div>
      )}

      {/* 目标选择器 - 新建模式 */}
      {showProjectSelector && !showTargetInfo && (
        <div className="editor-project-selector">
          {regularProjects.map(p => (
            <button
              key={p.id}
              className={`selector-btn ${selectedProject === p.id ? 'active' : ''}`}
              onClick={() => onProjectChange?.(p.id)}
            >
              <span className={`type-tag-mini ${p.type}-tag`}>
                {p.type === 'product' ? '产品' : '项目'}
              </span>
              {p.color && <span className={`dot ${p.color}`}></span>}
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* 工具栏 */}
      <div className="editor-toolbar">
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
        {onFileRef && (
          <button className="editor-btn" onClick={onFileRef} title="引用文档"><IconFile size={14} /></button>
        )}
        {onFileAdd && (
          <button className="editor-btn" onClick={onFileAdd} title="添加附件"><IconAttach size={14} /></button>
        )}
        <span className="toolbar-divider"></span>
        {/* MP3语音解析按钮 */}
        <input
          ref={mp3InputRef}
          type="file"
          accept=".mp3,.wav,.m4a"
          style={{ display: 'none' }}
          onChange={handleMp3FileSelect}
        />
        <button className="editor-btn mp3-btn" onClick={() => setShowMp3Modal(true)} title="录音解析">
          <IconMic size={14} />
          <span className="mp3-btn-label">录音解析</span>
        </button>
        <span className="toolbar-spacer"></span>
        {/* 取消按钮 - 编辑模式 */}
        {onCancel && (
          <button className="editor-btn cancel-btn" onClick={onCancel} title="取消">取消</button>
        )}
        <span className="toolbar-hint">{submitHint}</span>
      </div>

      {/* MP3解析弹窗 */}
      {showMp3Modal && (
        <div className="mp3-modal-overlay" onClick={() => {
          setShowMp3Modal(false)
          setSelectedMp3File(null)
          setMp3ParsePreview(null)
        }}>
          <div className="mp3-modal" onClick={e => e.stopPropagation()}>
            <div className="mp3-modal-header">
              <IconAudio size={16} />
              <span>录音解析</span>
              <button className="mp3-close-btn" onClick={() => {
                setShowMp3Modal(false)
                setSelectedMp3File(null)
                setMp3ParsePreview(null)
              }}>
                <IconClose size={14} />
              </button>
            </div>
            <div className="mp3-modal-body">
              {!mp3ParsePreview ? (
                /* 第一步：上传区域 */
                <>
                  <div
                    className="mp3-drop-area"
                    onDrop={handleMp3Drop}
                    onDragOver={handleMp3DragOver}
                    onClick={() => mp3InputRef.current?.click()}
                  >
                    <IconMic size={32} />
                    <p className="mp3-drop-text">请拖入mp3文件解析</p>
                    <p className="mp3-drop-hint">或点击选择文件（演示模式无需上传）</p>
                  </div>
                  {selectedMp3File && (
                    <div className="mp3-selected-file">
                      <span className="file-name">{selectedMp3File.name}</span>
                      <span className="file-size">{Math.round(selectedMp3File.size / 1024)}KB</span>
                    </div>
                  )}
                  <div className="mp3-modal-actions">
                    <button className="btn btn-primary" onClick={handleSmartParse}>
                      智能解析
                    </button>
                    {selectedMp3File && (
                      <button className="btn btn-secondary" onClick={() => setSelectedMp3File(null)}>
                        清除文件
                      </button>
                    )}
                  </div>
                </>
              ) : (
                /* 第二步：预览确认列表 */
                <div className="mp3-preview-list">
                  <div className="preview-section">
                    <h4 className="preview-title">识别文本</h4>
                    <div className="preview-text-content">
                      {mp3ParsePreview.textContent}
                    </div>
                  </div>
                  <div className="preview-section">
                    <h4 className="preview-title">AI分析 - 生成记录</h4>
                    <div className="preview-items">
                      {mp3ParsePreview.records.map((r, idx) => (
                        <div key={idx} className="preview-item">
                          <span className="preview-target">{r.target}</span>
                          <span className="preview-arrow">→</span>
                          <span className="preview-content">{r.content}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="preview-section">
                    <h4 className="preview-title">AI分析 - 提取待办</h4>
                    <div className="preview-items">
                      {mp3ParsePreview.todos.map((t, idx) => (
                        <div key={idx} className="preview-item todo-item">
                          <span className={`priority-tag priority-${t.priority}`}>{t.priority}</span>
                          <span className="preview-content">{t.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mp3-modal-actions">
                    <button className="btn btn-primary" onClick={handleConfirmParse}>
                      确认插入
                    </button>
                    <button className="btn btn-secondary" onClick={handleCancelPreview}>
                      返回修改
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 编辑区域 */}
      <div
        ref={editorRef}
        className="rich-textarea"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        dangerouslySetInnerHTML={{ __html: content }}
      />

      {/* 附件区域 */}
      {attachedFiles.length > 0 && (
        <div className="attached-files-bar">
          {attachedFiles.map(f => (
            <span key={f.id} className="file-tag">
              📎 {f.name}
              {onFileRemove && (
                <button className="remove-file" onClick={() => onFileRemove(f.id)}>
                  <IconClose size={12} />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      </div>
  )
}

export default RichTextEditor