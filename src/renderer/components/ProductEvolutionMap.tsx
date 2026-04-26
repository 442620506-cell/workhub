import { useState, useMemo } from 'react'
import { Product, ProjectWithFiles, FileItem } from '../types'
import { IconChevronRight, IconChevronDown, IconFile, IconAI } from './Icons'
import { analyzeProductFileEvolution } from '../services/fileRelationService'
import './ProductEvolutionMap.css'

interface ProductEvolutionMapProps {
  product: Product
  projects: ProjectWithFiles[]
  onSelectProject: (id: string) => void
}

function ProductEvolutionMap({ product, projects, onSelectProject }: ProductEvolutionMapProps) {
  const [expandedFiles, setExpandedFiles] = useState(false)
  const [selectedSourceFile, setSelectedSourceFile] = useState<FileItem | null>(null)

  // 关联到该产品的项目
  const relatedProjects = useMemo(() => {
    return projects.filter(p => p.productId === product.id)
  }, [projects, product.id])

  // 按年份分组
  const projectsByYear = useMemo(() => {
    const groups = new Map<string, ProjectWithFiles[]>()
    for (const project of relatedProjects) {
      if (!groups.has(project.year)) groups.set(project.year, [])
      groups.get(project.year)!.push(project)
    }
    // 按年份排序
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [relatedProjects])

  // 分析文件衍生关系
  const fileEvolution = useMemo(() => {
    return analyzeProductFileEvolution(product, relatedProjects)
  }, [product, relatedProjects])

  // 计算项目卡片的辐射位置
  const getProjectPosition = (index: number, total: number) => {
    if (total === 0) return { x: 0, y: 0 }
    if (total === 1) return { x: 200, y: 0 }
    if (total === 2) return { x: 200, y: -60 + index * 120 }

    // 多个项目时呈扇形分布
    const angleSpread = Math.min(total * 30, 180)
    const startAngle = -angleSpread / 2
    const angleStep = angleSpread / (total - 1 || 1)
    const angle = startAngle + index * angleStep
    const radius = 180

    return {
      x: Math.cos(angle * Math.PI / 180) * radius,
      y: Math.sin(angle * Math.PI / 180) * radius
    }
  }

  // 收集产品文件
  const productFiles = product.folders.flatMap(f => f.files)

  // AI分析按钮点击
  const handleAIAnalysis = () => {
    alert('AI分析功能正在开发中，敬请期待！')
  }

  return (
    <div className="evolution-map">
      {/* 产品-项目关系图 */}
      <div className="evolution-graph">
        {/* SVG 连线 */}
        <svg className="connection-lines" width="500" height="300">
          {/* 产品中心点到各项目节点 */}
          {relatedProjects.map((project, index) => {
            const pos = getProjectPosition(index, relatedProjects.length)
            return (
              <line
                key={project.id}
                x1="250"
                y1="150"
                x2={250 + pos.x}
                y2={150 + pos.y}
                className="connection-line"
              />
            )
          })}
        </svg>

        {/* 产品卡片（中心） */}
        <div className="product-card-center">
          <div className={`product-color-indicator ${product.color}`}></div>
          <div className="product-card-content">
            <span className="product-card-name">{product.name}</span>
            <span className="product-card-years">
              {product.startYear} - {product.endYear || '进行中'}
            </span>
            <span className="product-card-count">{relatedProjects.length} 个项目</span>
          </div>
        </div>

        {/* 项目卡片（辐射） */}
        {relatedProjects.map((project, index) => {
          const pos = getProjectPosition(index, relatedProjects.length)
          return (
            <div
              key={project.id}
              className={`project-card-node ${project.color} clickable`}
              style={{
                transform: `translate(${pos.x}px, ${pos.y}px)`
              }}
              onClick={() => onSelectProject(project.id)}
            >
              <span className="project-card-year">{project.year}</span>
              <span className="project-card-name">{project.name}</span>
              <span className="project-card-province">{project.province}</span>
            </div>
          )
        })}
      </div>

      {/* AI 分析按钮 */}
      <div className="evolution-actions">
        <button className="ai-analysis-btn" onClick={handleAIAnalysis}>
          <IconAI size={16} />
          AI 分析脉络
        </button>
      </div>

      {/* 文件脉络展开区 */}
      {productFiles.length > 0 && (
        <div className="file-evolution-section">
          <div
            className="file-evolution-header clickable"
            onClick={() => setExpandedFiles(!expandedFiles)}
          >
            <span className="header-icon">
              {expandedFiles ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
            </span>
            <span className="header-title">文件衍生脉络</span>
            <span className="header-count">{productFiles.length} 个产品文件</span>
          </div>

          {expandedFiles && (
            <div className="file-evolution-content">
              {productFiles.map(sourceFile => {
                const derivedFiles = fileEvolution.get(sourceFile) || []
                const isSelected = selectedSourceFile?.id === sourceFile.id

                return (
                  <div
                    key={sourceFile.id}
                    className={`file-source-row ${isSelected ? 'selected' : ''} clickable`}
                    onClick={() => setSelectedSourceFile(isSelected ? null : sourceFile)}
                  >
                    <div className="file-source-info">
                      <IconFile size={14} />
                      <span className="file-source-name">{sourceFile.name}</span>
                      <span className="file-source-type">{sourceFile.extension}</span>
                      {derivedFiles.length > 0 && (
                        <span className="file-derived-count">→ {derivedFiles.length} 个衍生文件</span>
                      )}
                    </div>

                    {isSelected && derivedFiles.length > 0 && (
                      <div className="file-derived-list">
                        {derivedFiles.map(derivedFile => {
                          const project = relatedProjects.find(p =>
                            p.folders.some(f => f.files.some(f => f.id === derivedFile.id))
                          )
                          return (
                            <div
                              key={derivedFile.id}
                              className="file-derived-item clickable"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (project) onSelectProject(project.id)
                              }}
                            >
                              <IconFile size={12} />
                              <span className="derived-file-name">{derivedFile.name}</span>
                              <span className="derived-file-project">
                                {project?.name || '未知项目'}
                              </span>
                              <span className="derived-score">
                                {Math.round((derivedFile.derivation?.similarityScore || 0) * 100)}%
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ProductEvolutionMap