import { useState, useEffect } from 'react'
import {
  Product, ProjectWithFiles, PendingFileInfo, OrganizeRuleConfig,
  defaultOrganizeRuleConfig, FileMatchResult, FileMoveOperation, OperationLog, defaultConfig
} from '../types'
import {
  IconClose, IconFolder, IconSettings, IconCheck, IconHistory,
  IconRefresh, IconArrowRight, IconOrganize, IconUndo,
  IconFile, IconFileText, IconFileSpreadsheet, IconFilePresentation, IconFilePdf
} from './Icons'
import './OrganizePanel.css'

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

// 模拟数据生成器 - 基于 AI智能应用构建平台及其项目
const generateMockPendingFiles = (): PendingFileInfo[] => {
  const mockFiles: PendingFileInfo[] = [
    // 业扩专业文件
    { name: '浙江业扩报装审批汇报材料', path: 'D:/待整理/浙江业扩报装审批汇报材料.pptx', extension: '.pptx', size: 2400000, parentDirectory: 'D:/待整理', modifiedTime: '2026-04-20' },
    { name: '安徽业扩流程优化需求规格说明书', path: 'D:/待整理/安徽业扩流程优化需求规格说明书.docx', extension: '.docx', size: 850000, parentDirectory: 'D:/待整理', modifiedTime: '2026-04-18' },
    { name: '业扩报装智能审批技术方案', path: 'D:/待整理/业扩报装智能审批技术方案.pdf', extension: '.pdf', size: 1200000, parentDirectory: 'D:/待整理', modifiedTime: '2026-04-15' },
    // 计量专业文件
    { name: '江苏计量异常诊断2025年度规划', path: 'D:/待整理/江苏计量异常诊断2025年度规划.xlsx', extension: '.xlsx', size: 450000, parentDirectory: 'D:/待整理', modifiedTime: '2026-04-10' },
    { name: '浙江计量设备巡检验收报告', path: 'D:/待整理/浙江计量设备巡检验收报告.docx', extension: '.docx', size: 680000, parentDirectory: 'D:/待整理', modifiedTime: '2026-04-05' },
    { name: '计量异常诊断模型演示PPT', path: 'D:/待整理/计量异常诊断模型演示PPT.pptx', extension: '.pptx', size: 5200000, parentDirectory: 'D:/待整理/产品资料', modifiedTime: '2026-03-28' },
    // 客服专业文件
    { name: '浙江客服智能应答合同', path: 'D:/待整理/浙江客服智能应答合同.pdf', extension: '.pdf', size: 320000, parentDirectory: 'D:/待整理', modifiedTime: '2026-04-08' },
    { name: '江苏智能客服质检初步方案', path: 'D:/待整理/江苏智能客服质检初步方案.docx', extension: '.docx', size: 920000, parentDirectory: 'D:/待整理', modifiedTime: '2026-03-20' },
    // AI专项文件
    { name: '浙江用电行为分析项目预算表', path: 'D:/待整理/浙江用电行为分析项目预算表.xlsx', extension: '.xlsx', size: 280000, parentDirectory: 'D:/待整理', modifiedTime: '2026-03-15' },
    { name: 'AI智能应用构建平台产品规划', path: 'D:/待整理/AI智能应用构建平台产品规划.docx', extension: '.docx', size: 560000, parentDirectory: 'D:/待整理/产品文档', modifiedTime: '2026-04-12' },
    { name: '负荷预测AI提升验收材料', path: 'D:/待整理/负荷预测AI提升验收材料.pdf', extension: '.pdf', size: 780000, parentDirectory: 'D:/待整理', modifiedTime: '2026-04-22' },
    // 无法归类的文件
    { name: '未知文件_杂项', path: 'D:/待整理/未知文件_杂项.pdf', extension: '.pdf', size: 150000, parentDirectory: 'D:/待整理', modifiedTime: '2026-03-10' },
  ]
  return mockFiles
}

// AI分析模拟 - 基于实际产品项目数据
const mockAIAnalysis = (file: PendingFileInfo, products: Product[], projects: ProjectWithFiles[]): {
  reasoning: string;
  suggestedType: 'product' | 'project' | 'pending';
  suggestedTarget: string;
  confidence: number;
  relatedFiles: string[];
} => {
  // 模拟AI推理过程
  const reasoningSteps: string[] = []

  // 1. 文件名语义分析
  reasoningSteps.push(`📁 文件名语义分析："${file.name}"`)

  // 2. 关键词提取
  const keywords = []
  if (file.name.includes('汇报') || file.name.includes('演示') || file.name.includes('PPT')) keywords.push('汇报材料')
  if (file.name.includes('方案') || file.name.includes('设计') || file.name.includes('技术')) keywords.push('技术方案')
  if (file.name.includes('需求') || file.name.includes('规格') || file.name.includes('说明书')) keywords.push('需求文档')
  if (file.name.includes('合同') || file.name.includes('协议')) keywords.push('合同文档')
  if (file.name.includes('预算') || file.name.includes('规划') || file.name.includes('年度')) keywords.push('财务规划')
  if (file.name.includes('验收') || file.name.includes('报告')) keywords.push('验收材料')
  reasoningSteps.push(`🔍 关键词提取：${keywords.join('、') || '无明显关键词'}`)

  // 3. 网省识别 - 从实际项目提取
  const provinces = [...new Set(projects.map(p => p.province))]
  const provinceMatch = provinces.find(p => file.name.includes(p))
  if (provinceMatch) {
    reasoningSteps.push(`📍 网省识别：识别到"${provinceMatch}"`)
  } else {
    reasoningSteps.push(`📍 网省识别：未识别到明确网省信息`)
  }

  // 4. 年份提取
  const yearMatch = file.name.match(/20\d{2}/)
  if (yearMatch) {
    reasoningSteps.push(`📅 年份提取：${yearMatch[0]}`)
  }

  // 5. 产品关联 - 匹配实际产品名称关键词
  const productMatch = products.find(p =>
    file.name.includes(p.name) ||
    file.name.includes('AI') && p.name.includes('AI') ||
    file.name.includes('智能应用') && p.name.includes('智能应用') ||
    file.name.includes('构建平台') && p.name.includes('构建平台')
  )
  if (productMatch) {
    reasoningSteps.push(`🔗 产品关联：关联到产品"${productMatch.name}"`)
  }

  // 6. 项目匹配 - 从实际项目匹配
  let projectMatch: ProjectWithFiles | undefined
  if (provinceMatch) {
    // 先尝试匹配省份+年份
    if (yearMatch) {
      projectMatch = projects.find(p =>
        p.province === provinceMatch && p.year === yearMatch[0]
      )
    }
    // 再尝试匹配省份+项目关键词
    if (!projectMatch) {
      projectMatch = projects.find(p =>
        p.province === provinceMatch && (
          file.name.includes('业扩') && p.name.includes('业扩') ||
          file.name.includes('计量') && p.name.includes('计量') ||
          file.name.includes('客服') && p.name.includes('客服') ||
          file.name.includes('用电') && p.name.includes('用电') ||
          file.name.includes('负荷') && p.name.includes('负荷')
        )
      )
    }
    if (projectMatch) {
      reasoningSteps.push(`📋 项目匹配：匹配到项目"${projectMatch.name}"`)
    } else {
      reasoningSteps.push(`📋 项目匹配：未找到匹配项目，建议创建新项目或归档至产品`)
    }
  }

  // 7. 文件类型推断
  const typeMap: Record<string, string> = {
    '.pptx': '汇报材料',
    '.docx': '技术文档',
    '.xlsx': '财务文档',
    '.pdf': '合同文档'
  }
  reasoningSteps.push(`📄 文件类型：${typeMap[file.extension] || '其他'}`)

  // 8. 最终推理
  reasoningSteps.push(`🤖 AI推理结论：`)

  // 计算置信度和目标
  let confidence = 0.5
  let suggestedType: 'product' | 'project' | 'pending' = 'pending'
  let suggestedTarget = ''
  const targetFolder = typeMap[file.extension] || '汇报材料'

  if (projectMatch) {
    suggestedType = 'project'
    suggestedTarget = `${projectMatch.fullPath}/${targetFolder}`
    confidence = 0.9
    reasoningSteps.push(`   → 高置信度匹配到现有项目，建议归档至 ${suggestedTarget}`)
  } else if (productMatch) {
    suggestedType = 'product'
    suggestedTarget = `${defaultConfig.basePath}/产品/${productMatch.name}/${keywords.includes('产品规划') ? '产品规划' : targetFolder}`
    confidence = 0.7
    reasoningSteps.push(`   → 中高置信度，产品匹配，建议归档至产品文件夹 ${suggestedTarget}`)
  } else if (provinceMatch) {
    // 有省份但没有匹配项目，建议创建新项目或归档到待整理
    suggestedType = 'pending'
    suggestedTarget = `${defaultConfig.basePath}/待整理/${provinceMatch}未归类`
    confidence = 0.5
    reasoningSteps.push(`   → 中置信度，省份匹配但无对应项目，建议人工处理或创建新项目`)
  } else {
    suggestedType = 'pending'
    suggestedTarget = `${defaultConfig.basePath}/待整理/未归类`
    confidence = 0.3
    reasoningSteps.push(`   → 低置信度，无法明确归类，建议人工处理`)
  }

  // 相关文件推荐
  const relatedFiles = [
    '同期项目需求文档.docx',
    '历史汇报材料.pptx',
    '技术架构设计.pdf'
  ].slice(0, Math.floor(Math.random() * 3) + 1)

  return {
    reasoning: reasoningSteps.join('\n'),
    suggestedType,
    suggestedTarget,
    confidence,
    relatedFiles
  }
}

// 模拟规则匹配 + AI分析 - 基于实际产品项目
const mockMatchFilesWithAI = (files: PendingFileInfo[], products: Product[], projects: ProjectWithFiles[], basePath: string): FileMatchResult[] => {
  return files.map(file => {
    // 规则匹配部分
    let ruleMatchDetails: FileMatchResult['matchDetails'] = {}
    let ruleConfidence = 0

    // 检查产品关键词 - 从实际产品生成
    const productKeywords = products.map(p => ({
      name: p.name,
      productId: p.id,
      keywords: extractProductKeywords(p.name)
    }))
    for (const pk of productKeywords) {
      if (file.name.includes(pk.name) || pk.keywords.some(k => file.name.includes(k))) {
        ruleMatchDetails.product = { id: pk.productId, name: pk.name, score: 0.8 }
        ruleConfidence += 0.3
        break
      }
    }

    // 检查省份 - 从实际项目提取
    const provinces = [...new Set(projects.map(p => p.province))]
    for (const prov of provinces) {
      if (file.name.includes(prov)) {
        ruleMatchDetails.province = { name: prov, score: 0.6 }
        ruleConfidence += 0.2
        break
      }
    }

    // 检查年份
    const yearMatch = file.name.match(/20\d{2}/)
    if (yearMatch) {
      ruleMatchDetails.year = { value: yearMatch[0] }
      ruleConfidence += 0.2
    }

    // 检查文件类型
    const typeMap: Record<string, { name: string; folder: string }> = {
      '.pptx': { name: '汇报材料', folder: '汇报材料' },
      '.docx': { name: '技术文档', folder: '技术文档' },
      '.xlsx': { name: '财务文档', folder: '财务文档' },
      '.pdf': { name: '合同文档', folder: '合同文档' }
    }
    const typeInfo = typeMap[file.extension]
    if (typeInfo) {
      ruleMatchDetails.fileType = { ruleName: typeInfo.name, targetFolder: typeInfo.folder }
      ruleConfidence += 0.3
    }

    // AI分析部分
    const aiResult = mockAIAnalysis(file, products, projects)

    // 综合规则匹配和AI分析
    const finalConfidence = Math.max(ruleConfidence, aiResult.confidence)

    // 确定目标路径（优先使用AI建议）
    let suggestedTarget: FileMatchResult['suggestedTarget'] = {
      type: aiResult.suggestedType,
      path: aiResult.suggestedTarget,
      folder: typeInfo?.folder || '汇报材料'
    }

    // 如果是项目类型且有匹配的项目
    if (aiResult.suggestedType === 'project' && ruleMatchDetails.province && ruleMatchDetails.year) {
      const matchingProject = projects.find(p =>
        p.province === ruleMatchDetails.province!.name &&
        p.year === ruleMatchDetails.year!.value
      )
      if (matchingProject) {
        suggestedTarget.id = matchingProject.id
        suggestedTarget.path = `${matchingProject.fullPath}/${typeInfo?.folder || '汇报材料'}`
      }
    }

    return {
      file,
      matched: finalConfidence >= 0.5,
      matchDetails: ruleMatchDetails,
      aiAnalysis: aiResult,
      suggestedTarget,
      confidence: finalConfidence,
      analysisSource: ruleConfidence > aiResult.confidence ? 'rule' : 'ai'
    }
  })
}

// 从产品名称提取关键词
function extractProductKeywords(productName: string): string[] {
  const keywords: string[] = []
  if (productName.includes('AI')) keywords.push('AI', '人工智能')
  if (productName.includes('智能')) keywords.push('智能')
  if (productName.includes('应用')) keywords.push('应用')
  if (productName.includes('构建')) keywords.push('构建', '构建平台')
  if (productName.includes('平台')) keywords.push('平台')
  return keywords
}

// 模拟操作历史 - 基于实际项目路径
const generateMockHistory = (): OperationLog[] => {
  return [
    {
      id: 'op_20260420_001',
      timestamp: '2026-04-20T14:30:00',
      operations: [
        { source: 'D:/待整理/浙江业扩汇报.pptx', destination: `${defaultConfig.basePath}/项目/2024/浙江/浙江业扩报装AI辅助审批/汇报材料`, type: 'move' },
        { source: 'D:/待整理/江苏计量需求.docx', destination: `${defaultConfig.basePath}/项目/2025/江苏/江苏智能计量异常诊断/技术文档`, type: 'move' },
      ],
      status: 'completed'
    },
    {
      id: 'op_20260418_002',
      timestamp: '2026-04-18T10:15:00',
      operations: [
        { source: 'D:/待整理/AI平台技术方案.pdf', destination: `${defaultConfig.basePath}/产品/AI智能应用构建平台/技术设计`, type: 'move' },
      ],
      status: 'completed'
    },
    {
      id: 'op_20260415_003',
      timestamp: '2026-04-15T16:45:00',
      operations: [
        { source: 'D:/待整理/浙江客服规划.xlsx', destination: `${defaultConfig.basePath}/项目/2025/浙江/浙江客服智能应答系统/申报材料`, type: 'move' },
      ],
      status: 'undone'
    },
  ]
}

interface OrganizePanelProps {
  isOpen: boolean
  onClose: () => void
  basePath: string
  products: Product[]
  projects: ProjectWithFiles[]
  organizeRules?: OrganizeRuleConfig
  onSaveRules?: (rules: OrganizeRuleConfig) => void
}

function OrganizePanel({
  isOpen,
  onClose,
  basePath,
  products,
  projects,
  organizeRules = defaultOrganizeRuleConfig,
  onSaveRules
}: OrganizePanelProps) {
  // Tab 状态
  const [activeTab, setActiveTab] = useState<'scan' | 'rules' | 'preview' | 'history'>('scan')

  // 扫描状态
  const [scanPath, setScanPath] = useState('D:/待整理')
  const [scanDepth, setScanDepth] = useState(3)
  const [pendingFiles, setPendingFiles] = useState<PendingFileInfo[]>([])
  const [isScanning, setIsScanning] = useState(false)

  // 规则状态
  const [rules, setRules] = useState<OrganizeRuleConfig>(organizeRules)

  // 预览状态
  const [matchResults, setMatchResults] = useState<FileMatchResult[]>([])
  const [isMatching, setIsMatching] = useState(false)
  const [simulationMode, setSimulationMode] = useState(true)

  // 操作历史
  const [operationLogs, setOperationLogs] = useState<OperationLog[]>([])

  // 执行状态
  const [executing, setExecuting] = useState(false)
  const [executeResult, setExecuteResult] = useState<{ success: number; failed: number; message: string } | null>(null)

  // 初始化模拟历史
  useEffect(() => {
    if (activeTab === 'history') {
      setOperationLogs(generateMockHistory())
    }
  }, [activeTab])

  // 模拟扫描目录
  const handleScan = async () => {
    if (!scanPath) return

    setIsScanning(true)
    // 模拟扫描延迟
    await new Promise(resolve => setTimeout(resolve, 1500))
    setPendingFiles(generateMockPendingFiles())
    setIsScanning(false)
  }

  // 选择目录（模拟）
  const handleSelectDirectory = async () => {
    // 模拟选择目录
    const mockPaths = ['D:/待整理', 'D:/下载', 'D:/临时文件', 'E:/资料备份']
    const randomPath = mockPaths[Math.floor(Math.random() * mockPaths.length)]
    setScanPath(randomPath)
  }

  // 构建文件树结构
  const buildFileTree = (results: FileMatchResult[], projects: ProjectWithFiles[], products: Product[]) => {
    const tree: Map<string, {
      type: 'project' | 'product' | 'folder'
      name: string
      path: string
      isNew: boolean
      files: { name: string; confidence: number; source: 'rule' | 'ai' }[]
      children: Map<string, any>
    }> = new Map()

    results.filter(r => r.matched).forEach(result => {
      const pathParts = result.suggestedTarget.path!.split('/')
      let currentPath = ''
      let currentLevel = tree

      // 遍历路径构建树
      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i]
        currentPath = currentPath ? `${currentPath}/${part}` : part

        if (!currentLevel.has(currentPath)) {
          // 判断是否是新建
          const isExistingProject = projects.some(p => currentPath.includes(p.fullPath))
          const isExistingProduct = products.some(p => currentPath.includes(`/产品/${p.name}`))
          const isNew = !isExistingProject && !isExistingProduct && i >= 2

          // 判断节点类型
          let nodeType: 'project' | 'product' | 'folder' = 'folder'
          if (i === 3 && pathParts[2] === '项目') {
            nodeType = 'project'
          } else if (i === 3 && pathParts[2] === '产品') {
            nodeType = 'product'
          }

          currentLevel.set(currentPath, {
            type: nodeType,
            name: part,
            path: currentPath,
            isNew,
            files: [],
            children: new Map()
          })
        }

        // 最后一级添加文件
        if (i === pathParts.length - 1) {
          const node = currentLevel.get(currentPath)!
          node.files.push({
            name: result.file.name + result.file.extension,
            confidence: result.confidence,
            source: result.analysisSource || 'rule'
          })
        } else {
          currentLevel = currentLevel.get(currentPath)!.children
        }
      }
    })

    return tree
  }

  // 渲染文件树
  const renderFileTree = (tree: Map<string, any>, depth = 0) => {
    const nodes = Array.from(tree.values()).sort((a, b) => a.path.localeCompare(b.path))

    return nodes.map(node => (
      <div key={node.path} className="tree-node">
        <div className={`tree-node-header ${node.isNew ? 'new' : 'existing'} depth-${depth}`}>
          <span className="node-icon">
            {node.type === 'project' ? '📋' : node.type === 'product' ? '📦' : '📁'}
          </span>
          <span className="node-name">{node.name}</span>
          {node.isNew && <span className="new-badge">新建</span>}
          {node.files.length > 0 && <span className="file-count">{node.files.length}个文件</span>}
        </div>
        {/* 渲染文件 */}
        {node.files.length > 0 && (
          <div className="tree-files">
            {node.files.map(file => (
              <div key={file.name} className="tree-file">
                <span className="file-icon">📄</span>
                <span className="file-name">{file.name}</span>
                <span className={`file-confidence ${file.source}`}>
                  {Math.round(file.confidence * 100)}%
                  {file.source === 'ai' && <span className="ai-mini-tag">AI</span>}
                </span>
              </div>
            ))}
          </div>
        )}
        {/* 渲染子节点 */}
        {node.children.size > 0 && renderFileTree(node.children, depth + 1)}
      </div>
    ))
  }

  // 模拟规则匹配 + AI分析
  const handleMatch = async () => {
    if (pendingFiles.length === 0) return

    setIsMatching(true)
    // 模拟匹配延迟（AI分析需要时间）
    await new Promise(resolve => setTimeout(resolve, 2000))
    const results = mockMatchFilesWithAI(pendingFiles, products, projects, basePath)
    setMatchResults(results)
    setIsMatching(false)
    setActiveTab('preview')
  }

  // 模拟执行整理
  const handleExecute = async () => {
    const matchedResults = matchResults.filter(r => r.matched)
    if (matchedResults.length === 0) {
      alert('没有可执行的整理操作')
      return
    }

    setExecuting(true)
    // 模拟执行延迟
    await new Promise(resolve => setTimeout(resolve, 2000))

    if (simulationMode) {
      // 模拟模式：生成报告
      const csvContent = matchedResults.map(r => `${r.file.path} → ${r.suggestedTarget.path}`).join('\n')
      console.log('整理计划:\n', csvContent)
      setExecuteResult({
        success: matchedResults.length,
        failed: 0,
        message: `模拟完成：将移动 ${matchedResults.length} 个文件。请查看控制台日志查看详细计划。`
      })
    } else {
      // 实际执行（模拟）
      const successCount = matchedResults.length - 1 // 模拟一个失败
      setExecuteResult({
        success: successCount,
        failed: 1,
        message: `整理完成：成功 ${successCount}，失败 1（模拟结果）`
      })
      // 添加到历史
      const newLog: OperationLog = {
        id: `op_${Date.now()}`,
        timestamp: new Date().toISOString(),
        operations: matchedResults.map(r => ({
          source: r.file.path,
          destination: r.suggestedTarget.path!,
          type: 'move'
        })),
        status: 'completed'
      }
      setOperationLogs(prev => [newLog, ...prev])
    }

    setExecuting(false)
  }

  // 模拟撤销操作
  const handleUndo = async (operationId: string) => {
    setExecuting(true)
    await new Promise(resolve => setTimeout(resolve, 500))

    setOperationLogs(prev => prev.map(log =>
      log.id === operationId ? { ...log, status: 'undone' } : log
    ))
    setExecuteResult({
      success: 0,
      failed: 0,
      message: '撤销成功（模拟）'
    })
    setExecuting(false)
  }

  // 保存规则
  const handleSaveRules = () => {
    const updatedRules = { ...rules, lastUpdated: new Date().toISOString() }
    setRules(updatedRules)
    onSaveRules?.(updatedRules)
    alert('规则已保存（模拟）')
  }

  // 清除执行结果
  const clearExecuteResult = () => {
    setExecuteResult(null)
    setMatchResults([])
    setPendingFiles([])
  }

  if (!isOpen) return null

  return (
    <div className="organize-panel-overlay">
      <div className="organize-panel">
        {/* 头部 */}
        <header className="organize-panel-header">
          <div className="header-left">
            <IconOrganize size={18} />
            <h3>文件整理（模拟模式）</h3>
          </div>
          <button className="close-btn" onClick={onClose}>
            <IconClose size={16} />
          </button>
        </header>

        {/* Tab 导航 */}
        <nav className="organize-tabs">
          <button
            className={`tab-btn ${activeTab === 'scan' ? 'active' : ''}`}
            onClick={() => setActiveTab('scan')}
          >
            待整理目录
          </button>
          <button
            className={`tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
            onClick={() => setActiveTab('rules')}
          >
            整理规则
          </button>
          <button
            className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            预览结果
          </button>
          <button
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            操作历史
          </button>
        </nav>

        {/* 内容区 */}
        <div className="organize-panel-content">
          {/* Tab 1: 待整理目录 */}
          {activeTab === 'scan' && (
            <div className="scan-section">
              <div className="scan-input-row">
                <input
                  type="text"
                  value={scanPath}
                  onChange={e => setScanPath(e.target.value)}
                  placeholder="输入或选择待整理目录路径..."
                  className="scan-path-input"
                />
                <button className="select-btn" onClick={handleSelectDirectory}>
                  选择
                </button>
              </div>

              <div className="scan-options-row">
                <label>扫描深度：</label>
                {[1, 2, 3, 5].map(d => (
                  <button
                    key={d}
                    className={`depth-btn ${scanDepth === d ? 'active' : ''}`}
                    onClick={() => setScanDepth(d)}
                  >
                    {d}级
                  </button>
                ))}
              </div>

              <div className="scan-actions-row">
                <button className="scan-btn" onClick={handleScan} disabled={isScanning}>
                  {isScanning ? '扫描中...' : '扫描目录'}
                </button>
                {pendingFiles.length > 0 && (
                  <button className="match-btn" onClick={handleMatch} disabled={isMatching}>
                    {isMatching ? 'AI分析中...' : '智能分析匹配'}
                  </button>
                )}
              </div>

              <div className="scan-results">
                <div className="results-header">
                  <span>扫描结果 ({pendingFiles.length} 个文件) {pendingFiles.length > 0 && <span style={{ color: '#f59e0b' }}>— 模拟数据</span>}</span>
                </div>
                <div className="results-list">
                  {pendingFiles.map(file => (
                    <div key={file.path} className="file-item">
                      <span className="file-icon">
                        <FileTypeIcon type={file.extension.replace('.', '')} />
                      </span>
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">{formatFileSize(file.size)}</span>
                      <span className="file-path">{file.parentDirectory}</span>
                    </div>
                  ))}
                  {pendingFiles.length === 0 && !isScanning && (
                    <div className="empty-hint">请选择目录并扫描（将生成模拟数据）</div>
                  )}
                  {isScanning && (
                    <div className="empty-hint" style={{ color: '#10b981' }}>正在扫描...（生成模拟数据）</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: 整理规则 */}
          {activeTab === 'rules' && (
            <div className="rules-section">
              <div className="rules-intro">
                <h4>智能整理引擎</h4>
                <p className="rules-desc">文件整理采用「规则匹配 + AI语义分析」混合模式。规则匹配用于精确关键词识别，AI分析用于语义理解和智能推断。</p>
              </div>
              <div className="rules-group">
                <h4>📋 产品关键词规则</h4>
                <p className="group-desc">基于关键词精确匹配，快速识别产品和网省</p>
                <div className="rules-list">
                  <div className="rule-item">
                    <span className="rule-name">AI智能应用构建平台</span>
                    <span className="rule-keywords">
                      <span className="keyword-tag">AI智能</span>
                      <span className="keyword-tag">应用构建</span>
                      <span className="keyword-tag">构建平台</span>
                      <span className="keyword-tag">人工智能</span>
                    </span>
                  </div>
                  {rules.productKeywords.length === 0 && (
                    <div className="empty-hint">显示默认规则（基于实际产品）</div>
                  )}
                </div>
              </div>

              <div className="rules-group">
                <h4>网省映射规则</h4>
                <div className="rules-list">
                  {[
                    { province: '浙江', keywords: ['浙江', '浙'], aliases: ['ZJ'] },
                    { province: '江苏', keywords: ['江苏', '苏'], aliases: ['JS'] },
                    { province: '安徽', keywords: ['安徽', '皖'], aliases: ['AH'] },
                  ].map((rule, idx) => (
                    <div key={idx} className="rule-item">
                      <span className="rule-name">{rule.province}</span>
                      <span className="rule-keywords">
                        {rule.keywords.map(k => <span key={k} className="keyword-tag">{k}</span>)}
                        {rule.aliases.map(a => <span key={a} className="keyword-tag alias">{a}</span>)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rules-group">
                <h4>文件类型规则</h4>
                <div className="rules-list">
                  {[
                    { name: '汇报材料', folder: '汇报材料', keywords: ['汇报', '演示', 'PPT'], exts: ['.pptx'] },
                    { name: '技术文档', folder: '技术文档', keywords: ['方案', '规格', '设计'], exts: ['.docx', '.pdf'] },
                    { name: '财务文档', folder: '财务文档', keywords: ['预算', '规划', '合同'], exts: ['.xlsx'] },
                    { name: '合同文档', folder: '合同文档', keywords: ['合同', '协议'], exts: ['.pdf'] },
                  ].map((rule, idx) => (
                    <div key={idx} className="rule-item">
                      <span className="rule-name">{rule.name}</span>
                      <span className="rule-target">→ {rule.folder}</span>
                      <span className="rule-keywords">
                        {rule.keywords.map(k => <span key={k} className="keyword-tag">{k}</span>)}
                        {rule.exts.map(e => <span key={e} className="ext-tag">{e}</span>)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rules-actions">
                <button className="save-rules-btn" onClick={handleSaveRules}>
                  <IconCheck size={14} /> 保存规则
                </button>
              </div>

              {/* AI分析说明 */}
              <div className="ai-section">
                <h4>🤖 AI语义分析</h4>
                <p className="group-desc">AI会分析文件名语义、识别隐含信息、推断最佳归类</p>
                <div className="ai-features">
                  <div className="ai-feature">
                    <span className="feature-icon">🔍</span>
                    <div className="feature-content">
                      <span className="feature-title">语义理解</span>
                      <span className="feature-desc">识别"汇报"、"方案"、"合同"等文档类型关键词</span>
                    </div>
                  </div>
                  <div className="ai-feature">
                    <span className="feature-icon">📍</span>
                    <div className="feature-content">
                      <span className="feature-title">地理识别</span>
                      <span className="feature-desc">从文件名提取省份、城市信息（如"杭"→杭州→浙江）</span>
                    </div>
                  </div>
                  <div className="ai-feature">
                    <span className="feature-icon">📅</span>
                    <div className="feature-content">
                      <span className="feature-title">时间提取</span>
                      <span className="feature-desc">自动提取年份信息用于项目匹配</span>
                    </div>
                  </div>
                  <div className="ai-feature">
                    <span className="feature-icon">🔗</span>
                    <div className="feature-content">
                      <span className="feature-title">关联推荐</span>
                      <span className="feature-desc">推荐相关文件，帮助用户发现关联文档</span>
                    </div>
                  </div>
                  <div className="ai-feature">
                    <span className="feature-icon">💡</span>
                    <div className="feature-content">
                      <span className="feature-title">智能推断</span>
                      <span className="feature-desc">当规则匹配不足时，AI会根据上下文推断最佳归档位置</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: 预览结果 */}
          {activeTab === 'preview' && (
            <div className="preview-section">
              <div className="preview-stats">
                <div className="stat-item">
                  <span className="stat-label">已匹配</span>
                  <span className="stat-value matched">
                    {matchResults.filter(r => r.matched).length}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">未匹配</span>
                  <span className="stat-value unmatched">
                    {matchResults.filter(r => !r.matched).length}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">总文件</span>
                  <span className="stat-value">
                    {matchResults.length}
                  </span>
                </div>
              </div>

              <div className="preview-options">
                <label className="simulation-toggle">
                  <input
                    type="checkbox"
                    checked={simulationMode}
                    onChange={e => setSimulationMode(e.target.checked)}
                  />
                  模拟模式（不实际移动文件）— 当前始终为模拟模式
                </label>
              </div>

              {/* 执行结果提示 */}
              {executeResult && (
                <div className={`execute-result ${executeResult.failed === 0 ? 'success' : 'partial'}`}>
                  <span>{executeResult.message}</span>
                  <button className="clear-result-btn" onClick={clearExecuteResult}>清除</button>
                </div>
              )}

              {/* 文件树预览 */}
              {matchResults.filter(r => r.matched).length > 0 ? (
                <div className="preview-tree-container">
                  <div className="preview-tree-header">
                    <span className="tree-title">整理预览 - 文件树</span>
                    <span className="tree-summary">
                      新建 {Array.from(buildFileTree(matchResults, projects, products).values()).filter(n => n.isNew).length} 个文件夹，
                      添加 {matchResults.filter(r => r.matched).length} 个文件
                    </span>
                  </div>
                  <div className="preview-tree">
                    {renderFileTree(buildFileTree(matchResults, projects, products))}
                  </div>
                </div>
              ) : (
                <div className="empty-hint">请先扫描目录并执行智能分析匹配</div>
              )}

              {/* 未匹配文件列表 */}
              {matchResults.filter(r => !r.matched).length > 0 && (
                <div className="unmatched-files-section">
                  <h4>未匹配文件（需要手动处理）</h4>
                  <div className="unmatched-files-list">
                    {matchResults.filter(r => !r.matched).map((result, idx) => (
                      <div key={idx} className="unmatched-file-item">
                        <span className="file-icon">📄</span>
                        <span className="file-name">{result.file.name}{result.file.extension}</span>
                        <span className="unmatched-reason">无法确定归档位置</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="preview-actions">
                <button
                  className="execute-btn"
                  onClick={handleExecute}
                  disabled={matchResults.filter(r => r.matched).length === 0 || executing}
                >
                  {executing ? '执行中...' : simulationMode ? '模拟运行' : '执行整理'}
                </button>
              </div>
            </div>
          )}

          {/* Tab 4: 操作历史 */}
          {activeTab === 'history' && (
            <div className="history-section">
              <div className="history-list">
                {operationLogs.map(log => (
                  <div key={log.id} className={`history-item ${log.status}`}>
                    <div className="history-header">
                      <span className="history-id">{log.id}</span>
                      <span className="history-time">{formatTime(log.timestamp)}</span>
                      <span className={`history-status ${log.status}`}>{log.status}</span>
                    </div>
                    <div className="history-count">
                      操作文件：{log.operations.length} 个
                    </div>
                    <div className="history-details">
                      {log.operations.slice(0, 2).map((op, i) => (
                        <div key={i} className="history-operation">
                          <span className="op-source">{op.source.split('/').pop()}</span>
                          <IconArrowRight size={10} />
                          <span className="op-dest">{op.destination.split('/').slice(-2).join('/')}</span>
                        </div>
                      ))}
                      {log.operations.length > 2 && (
                        <span className="more-count">... 等 {log.operations.length - 2} 个</span>
                      )}
                    </div>
                    {log.status !== 'undone' && (
                      <button className="undo-btn" onClick={() => handleUndo(log.id)} disabled={executing}>
                        <IconUndo size={12} /> 撤销（模拟）
                      </button>
                    )}
                  </div>
                ))}
                {operationLogs.length === 0 && (
                  <div className="empty-hint">暂无操作历史</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

// 格式化时间
function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
}

export default OrganizePanel