import { useState, useRef, useEffect, useCallback } from 'react'
import { Product, ProjectWithFiles } from '../types'
import { IconChevronRight, IconChevronDown, IconPlus, IconMinus, IconZoomIn, IconZoomOut } from './Icons'
import './MindmapView.css'

interface MindmapViewProps {
  product: Product
  projects: ProjectWithFiles[]
  onSelectProject: (id: string) => void
  onSelectProduct: (id: string) => void
}

interface TreeNode {
  id: string
  type: 'product' | 'year' | 'province' | 'project'
  name: string
  color?: string
  x: number
  y: number
  children: TreeNode[]
  expanded: boolean
  projectId?: string
  productId?: string
}

function MindmapView({ product, projects, onSelectProject, onSelectProduct }: MindmapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // 关联项目
  const relatedProjects = projects.filter(p => p.productId === product.id)

  // 初始化展开状态：默认全部展开
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    const initialExpanded = new Set<string>([product.id])
    // 添加所有年份、省份节点
    relatedProjects.forEach(project => {
      initialExpanded.add(`${product.id}-${project.year}`)
      initialExpanded.add(`${product.id}-${project.year}-${project.province}`)
    })
    return initialExpanded
  })

  // 构建树结构
  const buildTree = useCallback(() => {
    // 按年份分组
    const yearMap = new Map<string, Map<string, ProjectWithFiles[]>>()
    relatedProjects.forEach(project => {
      if (!yearMap.has(project.year)) yearMap.set(project.year, new Map())
      const provinceMap = yearMap.get(project.year)!
      if (!provinceMap.has(project.province)) provinceMap.set(project.province, [])
      provinceMap.get(project.province).push(project)
    })

    // 构建节点树
    const rootNode: TreeNode = {
      id: product.id,
      type: 'product',
      name: product.name,
      color: product.color,
      x: 0,
      y: 0,
      children: [],
      expanded: expandedNodes.has(product.id),
      productId: product.id
    }

    // 添加年份节点
    const sortedYears = Array.from(yearMap.keys()).sort()
    sortedYears.forEach((year) => {
      const yearNode: TreeNode = {
        id: `${product.id}-${year}`,
        type: 'year',
        name: year,
        x: 0,
        y: 0,
        children: [],
        expanded: expandedNodes.has(`${product.id}-${year}`)
      }

      // 添加网省节点
      const provinceMap = yearMap.get(year)!
      const sortedProvinces = Array.from(provinceMap.keys())
      sortedProvinces.forEach((province) => {
        const provinceNode: TreeNode = {
          id: `${product.id}-${year}-${province}`,
          type: 'province',
          name: province,
          x: 0,
          y: 0,
          children: [],
          expanded: expandedNodes.has(`${product.id}-${year}-${province}`)
        }

        // 添加项目节点
        const provinceProjects = provinceMap.get(province)!
        provinceProjects.forEach((project) => {
          const projectNode: TreeNode = {
            id: project.id,
            type: 'project',
            name: project.name,
            color: project.color,
            x: 0,
            y: 0,
            children: [],
            expanded: false,
            projectId: project.id
          }
          provinceNode.children.push(projectNode)
        })

        if (provinceNode.children.length > 0) {
          yearNode.children.push(provinceNode)
        }
      })

      if (yearNode.children.length > 0) {
        rootNode.children.push(yearNode)
      }
    })

    return rootNode
  }, [product, relatedProjects, expandedNodes])

  const tree = buildTree()

  // 计算节点所需的总高度
  const calculateSubtreeHeight = useCallback((node: TreeNode): number => {
    if (!node.expanded || node.children.length === 0) {
      return 40 // 单个节点高度
    }

    // 子节点的总高度
    const childrenHeight = node.children.reduce((sum, child) => sum + calculateSubtreeHeight(child), 0)
    // 加上子节点之间的间距
    const totalSpacing = (node.children.length - 1) * 10
    return Math.max(40, childrenHeight + totalSpacing)
  }, [])

  // 计算节点位置（递归布局）
  const layoutTree = useCallback((node: TreeNode, startX: number, startY: number): void => {
    node.x = startX
    node.y = startY

    if (node.expanded && node.children.length > 0) {
      // 计算子节点总高度
      const totalHeight = calculateSubtreeHeight(node)
      // 子节点起始位置：父节点位置减去总高度的一半，使父节点居中
      let childY = startY - totalHeight / 2 + 20

      node.children.forEach(child => {
        const childHeight = calculateSubtreeHeight(child)
        // 子节点居中于其子树
        const childCenterY = childY + childHeight / 2
        layoutTree(child, startX + 200, childCenterY)
        childY += childHeight + 10
      })
    }
  }, [calculateSubtreeHeight])

  layoutTree(tree, 100, 400)

  // 缩放控制
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 2))
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5))

  // 平移控制
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || e.target.classList.contains('mindmap-canvas')) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
    }
  }

  const handleMouseUp = () => setIsDragging(false)

  // 展开/收起节点
  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) newSet.delete(nodeId)
      else newSet.add(nodeId)
      return newSet
    })
  }

  // 收集所有节点和连线
  const collectNodesAndLines = (node: TreeNode): { nodes: TreeNode[]; lines: { from: TreeNode; to: TreeNode }[] } => {
    const nodes: TreeNode[] = [node]
    const lines: { from: TreeNode; to: TreeNode }[] = []

    if (node.expanded) {
      node.children.forEach(child => {
        lines.push({ from: node, to: child })
        const childData = collectNodesAndLines(child)
        nodes.push(...childData.nodes)
        lines.push(...childData.lines)
      })
    }

    return { nodes, lines }
  }

  const { nodes, lines } = collectNodesAndLines(tree)

  // 节点颜色映射
  const getNodeColor = (node: TreeNode) => {
    if (node.color) return node.color
    if (node.type === 'product') return 'blue'
    if (node.type === 'year') return 'gray'
    if (node.type === 'province') return 'purple'
    return 'blue'
  }

  const colorMap: Record<string, string> = {
    blue: '#3b82f6',
    green: '#10b981',
    orange: '#f59e0b',
    purple: '#8b5cf6',
    red: '#ef4444',
    gray: '#6b7280'
  }

  return (
    <div className="mindmap-container" ref={containerRef}>
      {/* 工具栏 */}
      <div className="mindmap-toolbar">
        <button className="mindmap-toolbar-btn" onClick={handleZoomOut}>
          <IconZoomOut size={16} />
        </button>
        <span className="zoom-level">{Math.round(scale * 100)}%</span>
        <button className="mindmap-toolbar-btn" onClick={handleZoomIn}>
          <IconZoomIn size={16} />
        </button>
        <button className="mindmap-toolbar-btn" onClick={() => setScale(1)}>
          重置
        </button>
      </div>

      {/* 思维导图画布 */}
      <div
        className="mindmap-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="mindmap-content"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: '0 0'
          }}
        >
          {/* SVG 连线 */}
          <svg className="mindmap-lines" width="1600" height="2000">
            {lines.map(({ from, to }) => (
              <path
                key={`${from.id}-${to.id}`}
                d={`M ${from.x + 120} ${from.y + 20} C ${from.x + 160} ${from.y + 20}, ${to.x - 40} ${to.y + 20}, ${to.x} ${to.y + 20}`}
                className="mindmap-line"
                stroke={colorMap[getNodeColor(from)]}
                strokeWidth="2"
                fill="none"
              />
            ))}
          </svg>

          {/* 节点 */}
          {nodes.map(node => (
            <div
              key={node.id}
              className={`mindmap-node ${node.type} ${getNodeColor(node)} clickable`}
              style={{
                left: node.x,
                top: node.y
              }}
              onClick={(e) => {
                e.stopPropagation()
                if (node.type === 'project' && node.projectId) {
                  onSelectProject(node.projectId)
                } else if (node.type === 'product' && node.productId) {
                  onSelectProduct(node.productId)
                } else if (node.children.length > 0) {
                  toggleNode(node.id)
                }
              }}
            >
              {/* 展开收起按钮 */}
              {node.children.length > 0 && (
                <span className="node-expand-btn">
                  {node.expanded ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
                </span>
              )}

              {/* 节点内容 */}
              <div className="node-content">
                <span className="node-label">{node.name}</span>
                {node.type === 'product' && (
                  <span className="node-meta">{product.startYear}-{product.endYear || '进行中'}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 提示 */}
      <div className="mindmap-hint">
        拖拽画布移动 | 点击节点展开/收起 | 点击项目查看详情
      </div>
    </div>
  )
}

export default MindmapView