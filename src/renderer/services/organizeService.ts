import {
  PendingFileInfo, OrganizeRuleConfig, FileMatchResult,
  Product, ProjectWithFiles
} from '../types'

/**
 * 规则匹配服务
 * 根据整理规则将文件匹配到目标位置
 */

/**
 * 对单个文件执行规则匹配
 */
export function matchFileToTarget(
  file: PendingFileInfo,
  rules: OrganizeRuleConfig,
  products: Product[],
  projects: ProjectWithFiles[],
  basePath: string
): FileMatchResult {
  // 1. 产品关键词匹配
  const productMatch = matchProductKeywords(file.name, rules.productKeywords)

  // 2. 网省关键词匹配
  const provinceMatch = matchProvinceKeywords(file.name, rules.provinceMappings)

  // 3. 年份提取
  const yearMatch = extractYear(file.name, rules.yearPatterns)

  // 4. 文件类型匹配
  const typeMatch = matchFileType(file.name, file.extension, rules.fileTypeRules)

  // 5. 综合匹配，计算目标
  const target = determineTarget(
    productMatch,
    provinceMatch,
    yearMatch,
    typeMatch,
    products,
    projects,
    basePath,
    rules.defaultTarget
  )

  // 6. 计算置信度
  const confidence = calculateConfidence(productMatch, provinceMatch, yearMatch, typeMatch)

  return {
    file,
    matched: confidence > 0.3,
    matchDetails: {
      product: productMatch,
      province: provinceMatch,
      year: yearMatch,
      fileType: typeMatch
    },
    suggestedTarget: target,
    confidence
  }
}

/**
 * 产品关键词匹配
 */
function matchProductKeywords(
  fileName: string,
  rules: OrganizeRuleConfig['productKeywords']
): { id: string; name: string; score: number } | undefined {
  let bestMatch: { id: string; name: string; score: number } | undefined

  // 按优先级排序
  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority)

  for (const rule of sortedRules) {
    for (const keyword of rule.keywords) {
      if (fileName.toLowerCase().includes(keyword.toLowerCase())) {
        const score = keyword.length / fileName.length
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { id: rule.productId, name: rule.productName, score }
        }
      }
    }
  }

  return bestMatch
}

/**
 * 网省关键词匹配
 */
function matchProvinceKeywords(
  fileName: string,
  rules: OrganizeRuleConfig['provinceMappings']
): { name: string; score: number } | undefined {
  let bestMatch: { name: string; score: number } | undefined

  for (const rule of rules) {
    // 检查关键词
    for (const keyword of rule.keywords) {
      if (fileName.toLowerCase().includes(keyword.toLowerCase())) {
        const score = keyword.length / fileName.length
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { name: rule.province, score }
        }
      }
    }
    // 检查别名
    for (const alias of rule.aliases) {
      if (fileName.toLowerCase().includes(alias.toLowerCase())) {
        const score = alias.length / fileName.length
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { name: rule.province, score }
        }
      }
    }
  }

  return bestMatch
}

/**
 * 年份提取（从文件名中）
 */
function extractYear(
  fileName: string,
  patterns: string[]
): { value: string } | undefined {
  for (const pattern of patterns) {
    const regex = new RegExp(pattern)
    const match = fileName.match(regex)
    if (match) {
      return { value: match[0] }
    }
  }
  return undefined
}

/**
 * 文件类型匹配
 */
function matchFileType(
  fileName: string,
  extension: string,
  rules: OrganizeRuleConfig['fileTypeRules']
): { ruleName: string; targetFolder: string } | undefined {
  const ext = extension.toLowerCase()

  for (const rule of rules) {
    // 检查扩展名是否匹配
    if (rule.extensions.length > 0 && !rule.extensions.some(e => e.toLowerCase() === ext)) {
      continue
    }

    // 检查关键词是否匹配
    if (rule.keywords.length > 0) {
      for (const keyword of rule.keywords) {
        if (fileName.toLowerCase().includes(keyword.toLowerCase())) {
          return { ruleName: rule.ruleName, targetFolder: rule.targetFolder }
        }
      }
    } else if (rule.extensions.length > 0) {
      // 只根据扩展名匹配
      return { ruleName: rule.ruleName, targetFolder: rule.targetFolder }
    }
  }

  return undefined
}

/**
 * 综合确定目标位置
 */
function determineTarget(
  productMatch: { id: string; name: string; score: number } | undefined,
  provinceMatch: { name: string; score: number } | undefined,
  yearMatch: { value: string } | undefined,
  typeMatch: { ruleName: string; targetFolder: string } | undefined,
  products: Product[],
  projects: ProjectWithFiles[],
  basePath: string,
  defaultTarget: OrganizeRuleConfig['defaultTarget']
): FileMatchResult['suggestedTarget'] {
  // 优先级：产品+网省+年份 → 项目；产品 → 产品文件夹；网省+年份 → 项目；默认

  // 尝试找到匹配的项目
  if (provinceMatch && yearMatch) {
    const matchingProject = projects.find(p =>
      p.province === provinceMatch.name && p.year === yearMatch.value
    )

    if (matchingProject) {
      const folder = typeMatch?.targetFolder || '汇报材料'
      return {
        type: 'project',
        id: matchingProject.id,
        path: `${matchingProject.fullPath}/${folder}`,
        folder
      }
    }
  }

  // 尝试匹配产品
  if (productMatch) {
    const matchingProduct = products.find(p => p.id === productMatch.id || p.name === productMatch.name)

    if (matchingProduct && provinceMatch && yearMatch) {
      // 产品+网省+年份 → 尝试找到该产品下的项目
      const matchingProject = projects.find(p =>
        p.productId === matchingProduct.id &&
        p.province === provinceMatch.name &&
        p.year === yearMatch.value
      )

      if (matchingProject) {
        const folder = typeMatch?.targetFolder || '汇报材料'
        return {
          type: 'project',
          id: matchingProject.id,
          path: `${matchingProject.fullPath}/${folder}`,
          folder
        }
      }
    }

    if (matchingProduct) {
      // 只匹配产品 → 产品文件夹
      const folder = typeMatch?.targetFolder || '产品规划'
      const productPath = `${basePath}/产品/${matchingProduct.name}/${folder}`
      return {
        type: 'product',
        id: matchingProduct.id,
        path: productPath,
        folder
      }
    }
  }

  // 默认目标
  if (defaultTarget.type === 'pending') {
    return {
      type: 'pending',
      path: `${basePath}/待整理`,
      folder: ''
    }
  }

  if (defaultTarget.type === 'product' && defaultTarget.productId) {
    const product = products.find(p => p.id === defaultTarget.productId)
    if (product) {
      const folder = defaultTarget.folder || '产品规划'
      return {
        type: 'product',
        id: product.id,
        path: `${basePath}/产品/${product.name}/${folder}`,
        folder
      }
    }
  }

  if (defaultTarget.type === 'project' && defaultTarget.projectId) {
    const project = projects.find(p => p.id === defaultTarget.projectId)
    if (project) {
      const folder = defaultTarget.folder || '汇报材料'
      return {
        type: 'project',
        id: project.id,
        path: `${project.fullPath}/${folder}`,
        folder
      }
    }
  }

  // 无法匹配，放入待整理
  return {
    type: 'pending',
    path: `${basePath}/待整理`,
    folder: ''
  }
}

/**
 * 计算匹配置信度
 */
function calculateConfidence(
  productMatch: { id: string; name: string; score: number } | undefined,
  provinceMatch: { name: string; score: number } | undefined,
  yearMatch: { value: string } | undefined,
  typeMatch: { ruleName: string; targetFolder: string } | undefined
): number {
  let score = 0

  // 产品匹配权重 0.3
  if (productMatch) {
    score += 0.3 * Math.min(1, productMatch.score * 5)
  }

  // 网省匹配权重 0.2
  if (provinceMatch) {
    score += 0.2 * Math.min(1, provinceMatch.score * 5)
  }

  // 年份匹配权重 0.2
  if (yearMatch) {
    score += 0.2
  }

  // 文件类型匹配权重 0.3
  if (typeMatch) {
    score += 0.3
  }

  return Math.min(1, score)
}