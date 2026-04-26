// 文件管理相关类型定义

export interface Folder {
  id: string
  name: string
  path: string              // 相对路径
  fullPath: string          // 绝对路径（模拟）
  iconType?: 'report' | 'document' | 'history' | 'default'
  files: FileItem[]
}

export interface FileItem {
  id: string
  name: string
  type: string              // 'pdf', 'doc', 'xls', 'ppt', 'img', 'other', 'note', 'md', 'txt'
  extension: string
  size: number              // 字节数
  sizeDisplay: string       // 显示格式如 "2.5MB"
  date: string              // 最后修改日期
  fullPath: string          // 绝对路径（模拟）
  editable?: boolean        // 是否支持在线编辑
  editorType?: 'text' | 'markdown' | 'rich'  // 编辑器类型
  derivation?: FileDerivation  // 文件衍生关系
}

// 文件衍生关系类型
export interface FileDerivation {
  sourceFileId?: string      // 来源文件ID（产品文件）
  sourceFileName?: string    // 来源文件名
  sourceFilePath?: string    // 来源文件路径
  similarityScore?: number   // 相似度分数 (0-1)
  derivationType?: 'copy' | 'adapt' | 'reference'  // 衍生类型
}

// ========== 历史文件类型定义 ==========

export interface HistoryFile {
  id: string
  fileId: string             // 原文件ID
  name: string
  type: string               // 'pdf', 'doc', 'xls', 'ppt', 'txt', 'md', 'note'
  extension: string
  fullPath: string           // 文件完整路径
  targetId: string           // 所属产品/项目ID
  targetType: 'product' | 'project'
  targetName: string         // 所属产品/项目名称
  openedAt: string           // 打开时间
  lastOpenedAt: string       // 最近打开时间
  openCount: number          // 打开次数
  pinned: boolean            // 是否置顶
}

// ========== 产品类型定义 ==========

export interface ProductOverview {
  type: 'document' | 'mindmap' | 'table'
  content: string           // 总览内容（JSON或文本）
  updatedAt: string
}

export interface Product {
  id: string
  name: string
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red'
  startYear: string         // 产品起始年份
  endYear?: string          // 结束年份（可选，持续中则无）
  description?: string      // 产品描述
  workCode?: string         // 工时代码
  overview?: ProductOverview // 产品总览
  // 产品级别的文件夹（规划、设计文档等）
  folders: Folder[]
  // 产品级别的记录
  records: WorkRecord[]
  createdAt: string
  updatedAt: string
}

export interface ProjectWithFiles {
  id: string
  name: string
  province: string
  year: string              // 年份
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red'
  visible: boolean
  fullPath: string          // 项目文件夹完整路径（模拟）
  folders: Folder[]         // 项目包含的文件夹
  records?: WorkRecord[]    // 项目级别的记录
  workCode?: string         // 工时代码
  createdAt: string
  updatedAt: string
  productId?: string        // 可选：归属的产品ID
  projectType: 'product' | 'standalone'  // 产品项目 or 独立项目
}

export interface AppConfig {
  basePath: string          // 用户配置的基础目录
  defaultFolders: string[]  // 默认子文件夹列表
}

// 默认配置
export const defaultConfig: AppConfig = {
  basePath: 'D:/WorkDocuments',
  defaultFolders: ['汇报材料', '申报材料', '历史文件']
}

// 文件类型映射
export const fileTypeMap: Record<string, { extension: string; label: string }> = {
  doc: { extension: '.docx', label: 'Word 文档' },
  xls: { extension: '.xlsx', label: 'Excel 表格' },
  ppt: { extension: '.pptx', label: 'PPT 演示' },
  pdf: { extension: '.pdf', label: 'PDF 文档' },
  note: { extension: '.note', label: '笔记文档' },
  md: { extension: '.md', label: 'Markdown' },
  txt: { extension: '.txt', label: '文本文件' }
}

// ========== 待办-记录关联类型 ==========

export interface TodoRecordLink {
  todoId: string
  recordId: string
  linkType: 'source' | 'completion' | 'reference'  // 来源/完成/引用
  createdAt: string
}

// ========== 待办类型定义 ==========

export interface Todo {
  id: string
  text: string
  project?: string
  projectId?: string         // 关联的项目ID
  assignee?: string
  dueDate: string
  dueTime?: string
  category: 'meeting' | 'material' | 'document' | 'approval' | 'coordination' | 'other'
  status: 'todo' | 'inProgress' | 'done' | 'archived'
  priority: 'high' | 'medium' | 'low'
  completed: boolean
  isOverdue: boolean
  isToday: boolean
  // 关联记录
  sourceRecordId?: string    // 来源记录ID
  completionRecordId?: string // 完成时生成的记录ID
}

// ========== 工作记录类型定义 ==========

export interface AttachedFile {
  id: string
  name: string
  type: string
  path?: string
}

export interface WorkRecord {
  id: string
  projectId: string
  content: string           // HTML内容
  time: string
  date: string
  files: AttachedFile[]
  // 待办关联
  linkedTodoIds?: string[]   // 关联的待办ID列表
  needsFollowUp?: boolean    // 是否需要跟进
}

// ========== 配置文件持久化类型定义 ==========

export interface WorkHubConfig {
  version: string                    // 配置版本，便于迁移
  lastUpdated: string                // 最后更新时间

  // 基础配置
  appConfig: {
    basePath: string                 // 用户配置的工作目录
    defaultFolders: string[]         // 默认子文件夹
  }

  // 产品列表（持久化显示状态）
  products: {
    id: string
    name: string
    color: string
    startYear: string
    endYear?: string
    description?: string
    visible: boolean                 // 是否显示在左侧面板
    createdAt: string
    updatedAt: string
  }[]

  // 项目列表（持久化显示状态）
  projects: {
    id: string
    name: string
    province: string
    year: string
    color: string
    visible: boolean                 // 是否显示
    fullPath: string                 // 项目文件夹路径
    productId?: string               // 关联产品
    projectType: string              // 'product' | 'standalone'
    createdAt: string
    updatedAt: string
  }[]

  // 临时任务
  quickTasks: QuickTask[]

  // UI 状态（可选）
  uiState?: {
    selectedProductId?: string
    focusedProjectId?: string
    viewType?: 'date' | 'project'
  }

  // 整理规则配置（可选）
  organizeRules?: OrganizeRuleConfig
}

// 默认配置
export const defaultWorkHubConfig: WorkHubConfig = {
  version: '1.0',
  lastUpdated: new Date().toISOString(),
  appConfig: {
    basePath: 'D:/WorkDocuments',
    defaultFolders: ['汇报材料', '申报材料', '历史文件']
  },
  products: [],
  projects: [],
  quickTasks: []
}

// ========== 临时项目/轻量任务类型定义 ==========

export interface QuickTaskRecord {
  id: string
  content: string            // HTML内容
  time: string
  date: string
  files: AttachedFile[]
}

export interface QuickTask {
  id: string
  title: string
  description?: string
  status: 'active' | 'paused' | 'completed' | 'archived'
  priority: 'high' | 'medium' | 'low'
  createdAt: string
  updatedAt: string
  dueDate?: string
  records: QuickTaskRecord[]
  linkedProductId?: string    // 可选关联产品
  linkedProjectId?: string    // 可选关联项目
  tags: string[]
}

// ========== 文件整理相关类型定义 ==========

// 待整理文件信息（从后端扫描返回）
export interface PendingFileInfo {
  name: string
  path: string
  extension: string
  size: number
  parentDirectory: string
  modifiedTime: string
}

// 目录内容（从后端 list_directory 返回）
export interface DirectoryContents {
  files: FileInfoData[]
  directories: DirectoryInfoData[]
}

export interface FileInfoData {
  name: string
  path: string
  extension: string
  size: number
  modifiedTime: string
}

export interface DirectoryInfoData {
  name: string
  path: string
}

// 文件移动操作
export interface FileMoveOperation {
  source: string
  destination: string
  type: 'move' | 'copy'
}

// 批量操作结果
export interface BatchOperationResult {
  operationId: string
  successCount: number
  failedCount: number
  errors: string[]
}

// 操作日志
export interface OperationLog {
  id: string
  timestamp: string
  operations: FileMoveOperation[]
  status: 'completed' | 'partial' | 'undone'
}

// 整理规则配置
export interface OrganizeRuleConfig {
  version: string
  lastUpdated: string

  // 产品关键词规则
  productKeywords: ProductKeywordRule[]

  // 网省映射规则
  provinceMappings: ProvinceMappingRule[]

  // 文件类型规则
  fileTypeRules: FileTypeRule[]

  // 年份提取规则（正则模式）
  yearPatterns: string[]

  // 默认目标（未匹配时的处理）
  defaultTarget: DefaultTargetConfig
}

export interface ProductKeywordRule {
  productId: string
  productName: string
  keywords: string[]
  priority: number  // 匹配优先级，数字越大优先级越高
}

export interface ProvinceMappingRule {
  province: string
  keywords: string[]
  aliases: string[]  // 别名如 "杭" -> 浙江
}

export interface FileTypeRule {
  ruleName: string
  keywords: string[]
  targetFolder: string  // 目标文件夹名
  extensions: string[]  // 适用文件类型
}

export interface DefaultTargetConfig {
  type: 'product' | 'project' | 'pending' | 'manual'
  productId?: string
  projectId?: string
  folder?: string
}

// 文件匹配结果
export interface FileMatchResult {
  file: PendingFileInfo
  matched: boolean
  matchDetails: {
    product?: { id: string; name: string; score: number }
    province?: { name: string; score: number }
    year?: { value: string }
    fileType?: { ruleName: string; targetFolder: string }
  }
  aiAnalysis?: {
    reasoning: string
    suggestedType: 'product' | 'project' | 'pending'
    suggestedTarget: string
    confidence: number
    relatedFiles: string[]
  }
  suggestedTarget: {
    type: 'product' | 'project' | 'pending'
    id?: string
    path: string
    folder: string
  }
  confidence: number  // 匹配置信度 0-1
  analysisSource?: 'rule' | 'ai'  // 主要来源：规则还是AI
  conflict?: string  // 冲突信息（如目标文件已存在）
}

// 默认整理规则配置
export const defaultOrganizeRuleConfig: OrganizeRuleConfig = {
  version: '1.0',
  lastUpdated: new Date().toISOString(),
  productKeywords: [],
  provinceMappings: [
    { province: '浙江', keywords: ['浙江', '浙', 'ZJ', 'Zhejiang'], aliases: ['杭', '杭州'] },
    { province: '江苏', keywords: ['江苏', '苏', 'JS', 'Jiangsu'], aliases: ['宁', '南京'] },
    { province: '山东', keywords: ['山东', '鲁', 'SD', 'Shandong'], aliases: ['济', '济南'] },
    { province: '北京', keywords: ['北京', '京', 'BJ', 'Beijing'], aliases: [] },
    { province: '上海', keywords: ['上海', '沪', 'SH', 'Shanghai'], aliases: [] },
    { province: '总部', keywords: ['总部', '国网', '集团', 'HQ', 'General'], aliases: [] }
  ],
  fileTypeRules: [
    { ruleName: '汇报材料', keywords: ['汇报', '总结', '报告', '介绍', '方案'], targetFolder: '汇报材料', extensions: ['.pptx', '.ppt', '.pdf'] },
    { ruleName: '申报材料', keywords: ['申报', '申请', '立项', '审批'], targetFolder: '申报材料', extensions: ['.docx', '.doc', '.pdf'] },
    { ruleName: '技术文档', keywords: ['技术', '规范', '设计', '需求', '说明'], targetFolder: '申报材料', extensions: ['.docx', '.doc', '.pdf', '.md'] },
    { ruleName: '数据文件', keywords: ['数据', '统计', '表格'], targetFolder: '历史文件', extensions: ['.xlsx', '.xls', '.csv', '.json'] },
    { ruleName: '交付归档', keywords: [], targetFolder: '历史文件', extensions: ['.zip', '.rar', '.7z', '.apk', '.exe'] }
  ],
  yearPatterns: ['20\\d{2}'],
  defaultTarget: {
    type: 'pending'
  }
}