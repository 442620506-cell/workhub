import { useState } from 'react'
import { IconFolder, IconChevronRight, IconChevronDown, IconProduct, IconProject } from './Icons'
import { Product, ProjectWithFiles } from '../types'
import './DirectoryTree.css'

type TreeNodeType = 'root' | 'product-root' | 'project-root' | 'product' | 'year' | 'province' | 'project' | 'folder'

interface TreeNode {
  type: TreeNodeType
  name: string
  path: string
  children?: TreeNode[]
  count?: number
  productId?: string
  projectId?: string
  color?: string
}

interface DirectoryTreeProps {
  basePath: string
  products: Product[]
  projects: ProjectWithFiles[]
  onSelectProduct: (id: string) => void
  onSelectProject: (id: string) => void
}

function DirectoryTree({ basePath, products, projects, onSelectProduct, onSelectProject }: DirectoryTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root', 'product-root', 'project-root']))

  // 构建目录树结构
  const buildTree = (): TreeNode[] => {
    const tree: TreeNode[] = []

    // 产品目录树
    const productRoot: TreeNode = {
      type: 'product-root',
      name: '产品',
      path: `${basePath}/产品`,
      children: products.map(product => ({
        type: 'product',
        name: product.name,
        path: `${basePath}/产品/${product.name}`,
        productId: product.id,
        color: product.color,
        count: projects.filter(p => p.productId === product.id).length,
        children: product.folders.map(folder => ({
          type: 'folder',
          name: folder.name,
          path: folder.fullPath,
          count: folder.files.length,
        }))
      }))
    }
    tree.push(productRoot)

    // 项目目录树（按年份/网省组织）
    const projectRoot: TreeNode = {
      type: 'project-root',
      name: '项目',
      path: `${basePath}/项目`,
      children: []
    }

    // 按年份分组
    const yearMap = new Map<string, Map<string, ProjectWithFiles[]>>()
    projects.filter(p => p.id !== 'personal').forEach(project => {
      if (!yearMap.has(project.year)) {
        yearMap.set(project.year, new Map())
      }
      const provinceMap = yearMap.get(project.year)!
      if (!provinceMap.has(project.province)) {
        provinceMap.set(project.province, [])
      }
      provinceMap.get(project.province)!.push(project)
    })

    // 构建年份-网省-项目层级
    yearMap.forEach((provinceMap, year) => {
      const yearNode: TreeNode = {
        type: 'year',
        name: year,
        path: `${basePath}/项目/${year}`,
        count: Array.from(provinceMap.values()).flat().length,
        children: []
      }

      provinceMap.forEach((projs, province) => {
        const provinceNode: TreeNode = {
          type: 'province',
          name: province,
          path: `${basePath}/项目/${year}/${province}`,
          count: projs.length,
          children: projs.map(project => ({
            type: 'project',
            name: project.name,
            path: project.fullPath,
            projectId: project.id,
            productId: project.productId,
            color: project.color,
            count: project.folders.reduce((sum, f) => sum + f.files.length, 0),
          }))
        }
        yearNode.children!.push(provinceNode)
      })

      projectRoot.children!.push(yearNode)
    })
    tree.push(projectRoot)

    return tree
  }

  const toggleExpand = (path: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      return newSet
    })
  }

  const handleNodeClick = (node: TreeNode) => {
    if (node.type === 'product' && node.productId) {
      onSelectProduct(node.productId)
    } else if (node.type === 'project' && node.projectId) {
      onSelectProject(node.projectId)
    } else {
      toggleExpand(node.path)
    }
  }

  const renderNode = (node: TreeNode, depth: number): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.path)
    const hasChildren = node.children && node.children.length > 0
    const indent = depth * 16

    return (
      <div key={node.path} className="tree-node">
        <div
          className={`tree-node-row ${node.type} clickable`}
          style={{ paddingLeft: indent }}
          onClick={() => handleNodeClick(node)}
        >
          {hasChildren && (
            <span className="tree-expand">
              {isExpanded ? <IconChevronDown size={10} /> : <IconChevronRight size={10} />}
            </span>
          )}
          {!hasChildren && <span className="tree-expand-placeholder"></span>}

          {node.type === 'product-root' && <IconProduct size={14} />}
          {node.type === 'project-root' && <IconProject size={14} />}
          {node.type === 'product' && node.color && <span className={`tree-dot ${node.color}`}></span>}
          {node.type === 'project' && node.color && <span className={`tree-dot ${node.color}`}></span>}
          {(node.type === 'year' || node.type === 'province' || node.type === 'folder') && <IconFolder size={14} />}
          {node.type === 'folder' && <IconFolder size={14} />}
          {(node.type === 'root' || node.type === 'product-root' || node.type === 'project-root') && (
            <span className="tree-icon-text"></span>
          )}

          <span className="tree-node-name">{node.name}</span>

          {node.count !== undefined && node.count > 0 && (
            <span className="tree-node-count">{node.count}</span>
          )}

          {node.productId && node.type === 'project' && (
            <span className="tree-product-link">
              {products.find(p => p.id === node.productId)?.name}
            </span>
          )}
        </div>

        {isExpanded && hasChildren && (
          <div className="tree-node-children">
            {node.children!.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  const tree = buildTree()

  return (
    <div className="directory-tree">
      <div className="directory-tree-header">
        <span className="directory-base-path">{basePath}</span>
      </div>
      <div className="directory-tree-content">
        {tree.map(node => renderNode(node, 0))}
      </div>
    </div>
  )
}

export default DirectoryTree