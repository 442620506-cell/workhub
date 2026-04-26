import { Product, ProjectWithFiles, FileItem, FileDerivation } from '../types'

/**
 * 文件关联服务 - 通过文件名相似度匹配建立衍生关系
 */

// 关键词权重表（用于匹配判断）
const KEYWORD_WEIGHTS: Record<string, number> = {
  '总体': 0.8,
  '介绍': 0.7,
  '汇报': 0.7,
  '规划': 0.6,
  '方案': 0.6,
  '设计': 0.5,
  '报告': 0.5,
  '总结': 0.5,
  '概述': 0.5,
  '说明': 0.4,
  '材料': 0.3,
  '文档': 0.3,
}

/**
 * 提取文件名中的关键词
 */
function extractKeywords(fileName: string): string[] {
  // 去除扩展名和常见前缀后缀
  const cleanName = fileName
    .replace(/\.[^.]+$/, '')  // 移除扩展名
    .replace(/^(浙江|江苏|安徽|上海|北京|广东|山东)/, '')  // 移除省份前缀
    .replace(/^(人工智能|智慧|智能|政务|数据)/, '')  // 移除产品类前缀
    .replace(/(总体|情况|介绍|汇报|材料|文档)$/, '')  // 移除常见后缀

  const keywords: string[] = []

  // 匹配权重表中的关键词
  for (const keyword of Object.keys(KEYWORD_WEIGHTS)) {
    if (fileName.includes(keyword)) {
      keywords.push(keyword)
    }
  }

  return keywords
}

/**
 * 计算两个文件名的相似度
 */
function calculateSimilarity(file1: FileItem, file2: FileItem): number {
  // 必须是相同类型才能匹配
  if (file1.type !== file2.type) return 0

  const name1 = file1.name.toLowerCase()
  const name2 = file2.name.toLowerCase()

  // 提取关键词
  const keywords1 = extractKeywords(file1.name)
  const keywords2 = extractKeywords(file2.name)

  // 计算关键词匹配分数
  let keywordScore = 0
  const commonKeywords = keywords1.filter(k => keywords2.includes(k))
  for (const keyword of commonKeywords) {
    keywordScore += KEYWORD_WEIGHTS[keyword] || 0.3
  }

  // 归一化关键词分数
  if (keywords1.length > 0 && keywords2.length > 0) {
    keywordScore = keywordScore / Math.max(keywords1.length, keywords2.length)
  }

  // 计算名称相似度（简单包含判断）
  let nameScore = 0
  if (name1.includes(name2.slice(0, 4)) || name2.includes(name1.slice(0, 4))) {
    nameScore = 0.3
  }

  // 总分数
  return Math.min(keywordScore + nameScore, 1)
}

/**
 * 为项目文件查找产品文件的衍生关系
 * @param productFiles 产品文件夹下的文件列表
 * @param projectFiles 项目文件夹下的文件列表
 * @returns 带有衍生关系的项目文件列表
 */
export function findFileDerivations(
  productFiles: FileItem[],
  projectFiles: FileItem[]
): FileItem[] {
  return projectFiles.map(projectFile => {
    // 对每个项目文件，找到最匹配的产品文件
    let bestMatch: { file: FileItem; score: number } | null = null

    for (const productFile of productFiles) {
      const score = calculateSimilarity(productFile, projectFile)
      if (score > 0.3 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { file: productFile, score }
      }
    }

    if (bestMatch) {
      return {
        ...projectFile,
        derivation: {
          sourceFileId: bestMatch.file.id,
          sourceFileName: bestMatch.file.name,
          sourceFilePath: bestMatch.file.fullPath,
          similarityScore: bestMatch.score,
          derivationType: bestMatch.score > 0.7 ? 'copy' : 'adapt'
        }
      }
    }

    return projectFile
  })
}

/**
 * 分析产品到项目的文件衍生关系
 * @param product 产品对象
 * @param projects 关联的项目列表
 * @returns 衍生关系映射（产品文件 → 项目文件列表）
 */
export function analyzeProductFileEvolution(
  product: Product,
  projects: ProjectWithFiles[]
): Map<FileItem, FileItem[]> {
  const evolutionMap = new Map<FileItem, FileItem[]>()

  // 收集产品所有文件
  const productFiles: FileItem[] = []
  for (const folder of product.folders) {
    productFiles.push(...folder.files)
  }

  // 对每个项目分析文件衍生
  for (const project of projects) {
    for (const folder of project.folders) {
      const derivedFiles = findFileDerivations(productFiles, folder.files)

      // 将带有衍生关系的文件添加到映射
      for (const derivedFile of derivedFiles) {
        if (derivedFile.derivation?.sourceFileId) {
          const sourceFile = productFiles.find(f => f.id === derivedFile.derivation!.sourceFileId)
          if (sourceFile) {
            const existing = evolutionMap.get(sourceFile) || []
            existing.push(derivedFile)
            evolutionMap.set(sourceFile, existing)
          }
        }
      }
    }
  }

  return evolutionMap
}

/**
 * 生成产品演进摘要文本（用于 AI 分析输入）
 */
export function generateEvolutionSummary(
  product: Product,
  projects: ProjectWithFiles[]
): string {
  const lines: string[] = []

  lines.push(`产品名称：${product.name}`)
  lines.push(`起始年份：${product.startYear}`)
  lines.push(`当前状态：${product.endYear ? `已于${product.endYear}结束` : '进行中'}`)
  lines.push('')
  lines.push('关联项目：')

  // 按年份分组
  const yearGroups = new Map<string, ProjectWithFiles[]>()
  for (const project of projects) {
    const year = project.year
    if (!yearGroups.has(year)) yearGroups.set(year, [])
    yearGroups.get(year)!.push(project)
  }

  for (const [year, yearProjects] of yearGroups) {
    lines.push(`  ${year}年：`)
    for (const project of yearProjects) {
      lines.push(`    - ${project.name}（${project.province}）`)
    }
  }

  lines.push('')
  lines.push('产品级文件：')
  for (const folder of product.folders) {
    if (folder.files.length > 0) {
      lines.push(`  ${folder.name}/`)
      for (const file of folder.files) {
        lines.push(`    - ${file.name}${file.extension}`)
      }
    }
  }

  return lines.join('\n')
}