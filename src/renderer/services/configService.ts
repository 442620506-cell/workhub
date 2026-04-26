import { invoke } from '@tauri-apps/api/core'
import { WorkHubConfig, defaultWorkHubConfig, defaultOrganizeRuleConfig, Folder, FileItem, Product, ProjectWithFiles, OrganizeRuleConfig, PendingFileInfo, DirectoryContents, BatchOperationResult, OperationLog, FileMoveOperation } from '../types'

/**
 * 加载配置文件
 */
export async function loadConfig(): Promise<WorkHubConfig> {
  try {
    const config = await invoke<WorkHubConfig>('load_config')
    return mergeWithDefaults(config)
  } catch (error) {
    console.warn('加载配置失败，使用默认配置:', error)
    return defaultWorkHubConfig
  }
}

/**
 * 保存配置文件
 */
export async function saveConfig(config: WorkHubConfig): Promise<void> {
  try {
    config.lastUpdated = new Date().toISOString()
    await invoke('save_config', { config })
  } catch (error) {
    console.error('保存配置失败:', error)
    throw error
  }
}

/**
 * 防抖保存（避免频繁写入磁盘）
 */
let saveTimeout: number | null = null
export function debouncedSaveConfig(config: WorkHubConfig, delay = 500) {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = window.setTimeout(() => {
    saveConfig(config).catch(err => console.error('自动保存配置失败:', err))
  }, delay)
}

/**
 * 合并默认值（处理缺失字段）
 */
function mergeWithDefaults(config: WorkHubConfig): WorkHubConfig {
  return {
    version: config.version || defaultWorkHubConfig.version,
    lastUpdated: config.lastUpdated || defaultWorkHubConfig.lastUpdated,
    appConfig: {
      basePath: config.appConfig?.basePath || defaultWorkHubConfig.appConfig.basePath,
      defaultFolders: config.appConfig?.defaultFolders || defaultWorkHubConfig.appConfig.defaultFolders,
    },
    products: config.products || [],
    projects: config.projects || [],
    quickTasks: config.quickTasks || [],
    uiState: config.uiState,
    organizeRules: config.organizeRules || defaultOrganizeRuleConfig,
  }
}

/**
 * 获取配置文件路径（用于调试）
 */
export async function getConfigPath(): Promise<string> {
  try {
    return await invoke<string>('get_config_path')
  } catch (error) {
    console.error('获取配置路径失败:', error)
    return ''
  }
}

// ========== 目录扫描 ==========

interface ScannedFolder {
  name: string
  path: string
  file_count: number
}

interface ScannedProduct {
  name: string
  path: string
  folders: ScannedFolder[]
}

interface ScannedProject {
  name: string
  year: string
  province: string
  path: string
  folders: ScannedFolder[]
}

/**
 * 扫描产品目录
 */
export async function scanProducts(basePath: string): Promise<ScannedProduct[]> {
  try {
    return await invoke<ScannedProduct[]>('scan_products', { basePath })
  } catch (error) {
    console.error('扫描产品目录失败:', error)
    return []
  }
}

/**
 * 扫描项目目录
 */
export async function scanProjects(basePath: string): Promise<ScannedProject[]> {
  try {
    return await invoke<ScannedProject[]>('scan_projects', { basePath })
  } catch (error) {
    console.error('扫描项目目录失败:', error)
    return []
  }
}

/**
 * 将扫描结果转换为 Product 类型
 */
export function convertScannedProduct(scanned: ScannedProduct, index: number): Product {
  const colors: Product['color'][] = ['blue', 'green', 'orange', 'purple', 'red']
  const color = colors[index % colors.length]

  return {
    id: `prod_${index}`,
    name: scanned.name,
    color,
    startYear: '2024', // 默认值，可后续从配置或文件夹信息推断
    folders: scanned.folders.map((f, fi) => ({
      id: `folder_${index}_${fi}`,
      name: f.name,
      path: f.name,
      fullPath: f.path,
      files: [], // 文件列表需要单独扫描
    })),
    records: [],
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
  }
}

/**
 * 将扫描结果转换为 ProjectWithFiles 类型
 */
export function convertScannedProject(scanned: ScannedProject, index: number): ProjectWithFiles {
  const colors: ProjectWithFiles['color'][] = ['blue', 'green', 'orange', 'purple', 'red']
  const color = colors[index % colors.length]

  return {
    id: `proj_${index}`,
    name: scanned.name,
    province: scanned.province,
    year: scanned.year,
    color,
    visible: true,
    fullPath: scanned.path,
    folders: scanned.folders.map((f, fi) => ({
      id: `folder_${index}_${fi}`,
      name: f.name,
      path: f.name,
      fullPath: f.path,
      files: [], // 文件列表需要单独扫描
    })),
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
    productId: undefined,
    projectType: 'standalone',
  }
}

// ========== 文件整理相关服务 ==========

/**
 * 扫描待整理目录
 */
export async function scanPendingDirectory(path: string, maxDepth: number = 3): Promise<PendingFileInfo[]> {
  try {
    return await invoke<PendingFileInfo[]>('scan_pending_directory', { path, maxDepth })
  } catch (error) {
    console.error('扫描待整理目录失败:', error)
    return []
  }
}

/**
 * 列出目录内容
 */
export async function listDirectory(path: string): Promise<DirectoryContents> {
  try {
    return await invoke<DirectoryContents>('list_directory', { path })
  } catch (error) {
    console.error('列出目录内容失败:', error)
    return { files: [], directories: [] }
  }
}

/**
 * 检查文件是否存在
 */
export async function fileExists(path: string): Promise<boolean> {
  try {
    return await invoke<boolean>('file_exists', { path })
  } catch (error) {
    console.error('检查文件存在失败:', error)
    return false
  }
}

/**
 * 移动单个文件
 */
export async function moveFile(source: string, destination: string, overwrite: boolean = false): Promise<void> {
  try {
    await invoke('move_file', { source, destination, overwrite })
  } catch (error) {
    console.error('移动文件失败:', error)
    throw error
  }
}

/**
 * 复制单个文件
 */
export async function copyFile(source: string, destination: string, overwrite: boolean = false): Promise<void> {
  try {
    await invoke('copy_file', { source, destination, overwrite })
  } catch (error) {
    console.error('复制文件失败:', error)
    throw error
  }
}

/**
 * 创建目录
 */
export async function createDirectory(path: string): Promise<void> {
  try {
    await invoke('create_directory', { path })
  } catch (error) {
    console.error('创建目录失败:', error)
    throw error
  }
}

/**
 * 批量移动文件
 */
export async function batchMoveFiles(operations: FileMoveOperation[]): Promise<BatchOperationResult> {
  try {
    return await invoke<BatchOperationResult>('batch_move_files', { operations })
  } catch (error) {
    console.error('批量移动文件失败:', error)
    throw error
  }
}

/**
 * 获取操作历史
 */
export async function getOperationHistory(): Promise<OperationLog[]> {
  try {
    return await invoke<OperationLog[]>('get_operation_history')
  } catch (error) {
    console.error('获取操作历史失败:', error)
    return []
  }
}

/**
 * 撤销批量操作
 */
export async function undoBatchOperation(operationId: string): Promise<void> {
  try {
    await invoke('undo_batch_operation', { operationId })
  } catch (error) {
    console.error('撤销操作失败:', error)
    throw error
  }
}