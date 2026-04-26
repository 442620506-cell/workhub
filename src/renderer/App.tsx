import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import LeftPanel from './components/LeftPanel'
import GlobalOverview from './components/GlobalOverview'
import WorkReview from './components/WorkReview'
import SettingsDrawer from './components/SettingsDrawer'
import MindmapView from './components/MindmapView'
import { IconReview, IconSettings, IconClose, IconChevronLeft, IconChevronRight, IconFileText, IconCheck } from './components/Icons'
import { Product, ProjectWithFiles, QuickTask, defaultConfig, WorkHubConfig, WorkRecord, AttachedFile, OrganizeRuleConfig, defaultOrganizeRuleConfig, Folder, FileItem } from './types'
import { generateMockFolders } from './utils/mockData'
import { loadConfig, debouncedSaveConfig, scanProducts, scanProjects, convertScannedProduct, convertScannedProject } from './services/configService'

type ViewType = 'date' | 'project'

const currentYear = '2026'

// 生成随机工时代码
const generateWorkCode = (seq: number) => `LSKJ26P${String(seq).padStart(4, '0')}`

// 示例产品数据 - AI智能应用构建平台
const initialProducts: Product[] = [
  {
    id: 'prod1',
    name: 'AI智能应用构建平台',
    color: 'blue',
    startYear: '2024',
    endYear: undefined,
    workCode: generateWorkCode(1),
    description: '面向电力营销领域的AI应用快速构建平台，支持业扩、计量、客服等专业的智能化场景落地',
    folders: [
      {
        id: 'pf1',
        name: '产品规划',
        path: '产品规划',
        fullPath: `${defaultConfig.basePath}/产品/AI智能应用构建平台/产品规划`,
        iconType: 'document',
        files: [
          { id: 'pf1f1', name: '产品规划书V2.0', type: 'doc', extension: '.docx', size: 356000, sizeDisplay: '356KB', date: '2024-06-15', fullPath: `${defaultConfig.basePath}/产品/AI智能应用构建平台/产品规划/产品规划书V2.0.docx` },
          { id: 'pf1f2', name: 'AI能力蓝图', type: 'ppt', extension: '.pptx', size: 2800000, sizeDisplay: '2.8MB', date: '2024-08-20', fullPath: `${defaultConfig.basePath}/产品/AI智能应用构建平台/产品规划/AI能力蓝图.pptx` },
          { id: 'pf1f3', name: '场景落地规划', type: 'ppt', extension: '.pptx', size: 1500000, sizeDisplay: '1.5MB', date: '2025-01-10', fullPath: `${defaultConfig.basePath}/产品/AI智能应用构建平台/产品规划/场景落地规划.pptx` },
        ]
      },
      {
        id: 'pf2',
        name: '立项材料',
        path: '立项材料',
        fullPath: `${defaultConfig.basePath}/产品/AI智能应用构建平台/立项材料`,
        iconType: 'document',
        files: [
          { id: 'pf2f1', name: '立项申请书', type: 'doc', extension: '.docx', size: 280000, sizeDisplay: '280KB', date: '2024-03-10', fullPath: `${defaultConfig.basePath}/产品/AI智能应用构建平台/立项材料/立项申请书.docx` },
          { id: 'pf2f2', name: '可行性研究报告', type: 'pdf', extension: '.pdf', size: 850000, sizeDisplay: '850KB', date: '2024-03-25', fullPath: `${defaultConfig.basePath}/产品/AI智能应用构建平台/立项材料/可行性研究报告.pdf` },
          { id: 'pf2f3', name: '投资估算表', type: 'xls', extension: '.xlsx', size: 96000, sizeDisplay: '96KB', date: '2024-04-05', fullPath: `${defaultConfig.basePath}/产品/AI智能应用构建平台/立项材料/投资估算表.xlsx` },
        ]
      },
      {
        id: 'pf3',
        name: '技术设计',
        path: '技术设计',
        fullPath: `${defaultConfig.basePath}/产品/AI智能应用构建平台/技术设计`,
        iconType: 'document',
        files: [
          { id: 'pf3f1', name: '系统架构设计V3.0', type: 'doc', extension: '.docx', size: 520000, sizeDisplay: '520KB', date: '2025-02-28', fullPath: `${defaultConfig.basePath}/产品/AI智能应用构建平台/技术设计/系统架构设计V3.0.docx` },
          { id: 'pf3f2', name: 'AI模型接口规范', type: 'pdf', extension: '.pdf', size: 380000, sizeDisplay: '380KB', date: '2025-05-15', fullPath: `${defaultConfig.basePath}/产品/AI智能应用构建平台/技术设计/AI模型接口规范.pdf` },
          { id: 'pf3f3', name: '数据接入标准', type: 'doc', extension: '.docx', size: 245000, sizeDisplay: '245KB', date: '2025-06-20', fullPath: `${defaultConfig.basePath}/产品/AI智能应用构建平台/技术设计/数据接入标准.docx` },
        ]
      },
      {
        id: 'pf4',
        name: '培训材料',
        path: '培训材料',
        fullPath: `${defaultConfig.basePath}/产品/AI智能应用构建平台/培训材料`,
        iconType: 'document',
        files: [
          { id: 'pf4f1', name: '平台操作手册', type: 'pdf', extension: '.pdf', size: 1200000, sizeDisplay: '1.2MB', date: '2025-09-10', fullPath: `${defaultConfig.basePath}/产品/AI智能应用构建平台/培训材料/平台操作手册.pdf` },
          { id: 'pf4f2', name: 'AI场景构建指南', type: 'ppt', extension: '.pptx', size: 3500000, sizeDisplay: '3.5MB', date: '2025-10-15', fullPath: `${defaultConfig.basePath}/产品/AI智能应用构建平台/培训材料/AI场景构建指南.pptx` },
        ]
      },
    ],
    records: [
      { id: 'pr1', projectId: 'prod1', content: '完成平台核心架构升级，新增多模态AI能力支持，提升模型调用效率30%', time: '09:00', date: '2026-04-20', files: [] },
      { id: 'pr2', projectId: 'prod1', content: '与浙江营销部对接业扩AI审批场景需求，确认首批试点业务范围', time: '14:30', date: '2026-04-21', files: [] },
      { id: 'pr3', projectId: 'prod1', content: '完成AI模型管理模块开发，支持模型版本控制和A/B测试功能', time: '10:00', date: '2026-04-22', files: [] },
      { id: 'pr4', projectId: 'prod1', content: '编制平台年度迭代规划，确定Q3重点：低代码场景编排能力', time: '15:00', date: '2026-04-23', files: [] },
      { id: 'pr5', projectId: 'prod1', content: '组织内部技术分享会，讲解大模型在营销场景的最佳实践', time: '13:30', date: '2026-04-24', files: [] },
    ],
    createdAt: '2024-03-01',
    updatedAt: '2026-04-24'
  },
]

// 生成项目文件夹（包含具体专业内容）
const generateProjectFolders = (basePath: string, projectName: string): Folder[] => {
  const specificFiles: Record<string, FileItem[]> = {
    '汇报材料': [
      { id: 'rm1', name: `${projectName}阶段性汇报`, type: 'ppt', extension: '.pptx', size: 2800000, sizeDisplay: '2.8MB', date: '2026-04-18', fullPath: `${basePath}/${projectName}/汇报材料/${projectName}阶段性汇报.pptx` },
      { id: 'rm2', name: '项目进展报告', type: 'doc', extension: '.docx', size: 156000, sizeDisplay: '156KB', date: '2026-04-20', fullPath: `${basePath}/${projectName}/汇报材料/项目进展报告.docx` },
    ],
    '申报材料': [
      { id: 'dm1', name: '项目申报书', type: 'doc', extension: '.docx', size: 320000, sizeDisplay: '320KB', date: '2025-06-10', fullPath: `${basePath}/${projectName}/申报材料/项目申报书.docx` },
      { id: 'dm2', name: '技术方案', type: 'pdf', extension: '.pdf', size: 580000, sizeDisplay: '580KB', date: '2025-06-25', fullPath: `${basePath}/${projectName}/申报材料/技术方案.pdf` },
      { id: 'dm3', name: '投资概算表', type: 'xls', extension: '.xlsx', size: 85000, sizeDisplay: '85KB', date: '2025-07-05', fullPath: `${basePath}/${projectName}/申报材料/投资概算表.xlsx` },
    ],
    '技术文档': [
      { id: 'td1', name: '需求规格说明书', type: 'doc', extension: '.docx', size: 420000, sizeDisplay: '420KB', date: '2025-08-15', fullPath: `${basePath}/${projectName}/技术文档/需求规格说明书.docx` },
      { id: 'td2', name: '接口设计文档', type: 'doc', extension: '.docx', size: 280000, sizeDisplay: '280KB', date: '2025-09-20', fullPath: `${basePath}/${projectName}/技术文档/接口设计文档.docx` },
      { id: 'td3', name: '数据模型设计', type: 'pdf', extension: '.pdf', size: 350000, sizeDisplay: '350KB', date: '2025-10-10', fullPath: `${basePath}/${projectName}/技术文档/数据模型设计.pdf` },
    ],
    '历史文件': [
      { id: 'hf1', name: '验收报告V1', type: 'pdf', extension: '.pdf', size: 680000, sizeDisplay: '680KB', date: '2024-12-20', fullPath: `${basePath}/${projectName}/历史文件/验收报告V1.pdf` },
    ],
  }

  return ['汇报材料', '申报材料', '技术文档', '历史文件'].map((folderName, index) => ({
    id: `folder_${projectName}_${index}`,
    name: folderName,
    path: folderName,
    fullPath: `${basePath}/${projectName}/${folderName}`,
    iconType: folderName === '汇报材料' ? 'report' : folderName === '历史文件' ? 'history' : 'document',
    files: specificFiles[folderName] || [],
  }))
}

// 示例项目数据 - 基于AI平台的产品项目
const productProjects: ProjectWithFiles[] = [
  // 业扩专业项目
  {
    id: 'p_ye1',
    name: '浙江业扩报装AI辅助审批',
    province: '浙江',
    year: '2024',
    color: 'blue',
    visible: true,
    workCode: generateWorkCode(101),
    fullPath: `${defaultConfig.basePath}/项目/2024/浙江/浙江业扩报装AI辅助审批`,
    folders: generateProjectFolders(`${defaultConfig.basePath}/项目/2024/浙江`, '浙江业扩报装AI辅助审批'),
    records: [
      { id: 'r_ye1_1', projectId: 'p_ye1', content: '完成业扩报装智能审批模型训练，准确率达到92%', time: '09:30', date: '2026-04-20', files: [] },
      { id: 'r_ye1_2', projectId: 'p_ye1', content: '与浙江营销部确认试点范围：杭州市区首批10个营业厅', time: '14:00', date: '2026-04-21', files: [] },
      { id: 'r_ye1_3', projectId: 'p_ye1', content: '优化审批规则引擎，新增低压居民报装快速通道', time: '10:30', date: '2026-04-22', files: [] },
    ],
    createdAt: '2024-06-01',
    updatedAt: '2026-04-22',
    productId: 'prod1',
    projectType: 'product'
  },
  {
    id: 'p_ye2',
    name: '安徽业扩流程AI优化',
    province: '安徽',
    year: '2025',
    color: 'blue',
    visible: true,
    workCode: generateWorkCode(102),
    fullPath: `${defaultConfig.basePath}/项目/2025/安徽/安徽业扩流程AI优化`,
    folders: generateProjectFolders(`${defaultConfig.basePath}/项目/2025/安徽`, '安徽业扩流程AI优化', '业扩'),
    records: [
      { id: 'r_ye2_1', projectId: 'p_ye2', content: '完成安徽业扩流程现状调研，识别3个AI优化切入点', time: '10:00', date: '2026-04-20', files: [] },
      { id: 'r_ye2_2', projectId: 'p_ye2', content: '设计智能预审方案，预计缩短审批时限40%', time: '15:30', date: '2026-04-23', files: [] },
    ],
    createdAt: '2025-03-15',
    updatedAt: '2026-04-23',
    productId: 'prod1',
    projectType: 'product'
  },
  // 计量专业项目
  {
    id: 'p_jl1',
    name: '江苏智能计量异常诊断',
    province: '江苏',
    year: '2025',
    color: 'green',
    visible: true,
    workCode: generateWorkCode(201),
    fullPath: `${defaultConfig.basePath}/项目/2025/江苏/江苏智能计量异常诊断`,
    folders: generateProjectFolders(`${defaultConfig.basePath}/项目/2025/江苏`, '江苏智能计量异常诊断', '计量'),
    records: [
      { id: 'r_jl1_1', projectId: 'p_jl1', content: '完成计量异常AI诊断模型V2.0升级，新增失压失流识别能力', time: '09:00', date: '2026-04-21', files: [] },
      { id: 'r_jl1_2', projectId: 'p_jl1', content: '与江苏计量中心对接数据接入方案，确认MDM数据源', time: '14:30', date: '2026-04-22', files: [] },
      { id: 'r_jl1_3', projectId: 'p_jl1', content: '编制异常诊断效果验证报告，检出率提升至95%', time: '11:00', date: '2026-04-24', files: [] },
    ],
    createdAt: '2025-05-01',
    updatedAt: '2026-04-24',
    productId: 'prod1',
    projectType: 'product'
  },
  {
    id: 'p_jl2',
    name: '浙江计量设备AI巡检',
    province: '浙江',
    year: '2026',
    color: 'green',
    visible: true,
    workCode: generateWorkCode(202),
    fullPath: `${defaultConfig.basePath}/项目/2026/浙江/浙江计量设备AI巡检`,
    folders: generateProjectFolders(`${defaultConfig.basePath}/项目/2026/浙江`, '浙江计量设备AI巡检', '计量'),
    records: [
      { id: 'r_jl2_1', projectId: 'p_jl2', content: '启动项目需求调研，确定智能终端巡检场景', time: '09:30', date: '2026-04-20', files: [] },
      { id: 'r_jl2_2', projectId: 'p_jl2', content: '完成设备状态预测模型初步设计', time: '15:00', date: '2026-04-25', files: [] },
    ],
    createdAt: '2026-01-10',
    updatedAt: '2026-04-25',
    productId: 'prod1',
    projectType: 'product'
  },
  // 客服专业项目
  {
    id: 'p_kf1',
    name: '浙江客服智能应答系统',
    province: '浙江',
    year: '2025',
    color: 'purple',
    visible: true,
    workCode: generateWorkCode(301),
    fullPath: `${defaultConfig.basePath}/项目/2025/浙江/浙江客服智能应答系统`,
    folders: generateProjectFolders(`${defaultConfig.basePath}/项目/2025/浙江`, '浙江客服智能应答系统', '客服'),
    records: [
      { id: 'r_kf1_1', projectId: 'p_kf1', content: '客服智能应答系统上线运行，95598热线智能分流效果显著', time: '10:00', date: '2026-04-20', files: [] },
      { id: 'r_kf1_2', projectId: 'p_kf1', content: '优化投诉智能分类模型，新增8类投诉场景识别', time: '14:00', date: '2026-04-22', files: [] },
      { id: 'r_kf1_3', projectId: 'p_kf1', content: '完成客服知识库更新，新增AI应用问答条目120条', time: '16:00', date: '2026-04-24', files: [] },
    ],
    createdAt: '2025-07-01',
    updatedAt: '2026-04-24',
    productId: 'prod1',
    projectType: 'product'
  },
  {
    id: 'p_kf2',
    name: '江苏智能客服质检',
    province: '江苏',
    year: '2026',
    color: 'purple',
    visible: true,
    workCode: generateWorkCode(302),
    fullPath: `${defaultConfig.basePath}/项目/2026/江苏/江苏智能客服质检`,
    folders: generateProjectFolders(`${defaultConfig.basePath}/项目/2026/江苏`, '江苏智能客服质检', '客服'),
    records: [
      { id: 'r_kf2_1', projectId: 'p_kf2', content: '完成客服录音智能质检模型训练，情感分析准确率88%', time: '09:30', date: '2026-04-21', files: [] },
      { id: 'r_kf2_2', projectId: 'p_kf2', content: '设计质检规则引擎，支持100+质检维度配置', time: '15:30', date: '2026-04-23', files: [] },
    ],
    createdAt: '2026-02-15',
    updatedAt: '2026-04-23',
    productId: 'prod1',
    projectType: 'product'
  },
  // 其他AI专项项目
  {
    id: 'p_ai1',
    name: '浙江用电行为AI分析',
    province: '浙江',
    year: '2025',
    color: 'orange',
    visible: true,
    workCode: generateWorkCode(401),
    fullPath: `${defaultConfig.basePath}/项目/2025/浙江/浙江用电行为AI分析`,
    folders: generateProjectFolders(`${defaultConfig.basePath}/项目/2025/浙江`, '浙江用电行为AI分析', '分析'),
    records: [
      { id: 'r_ai1_1', projectId: 'p_ai1', content: '用电行为分析平台完成迭代，新增窃电嫌疑识别功能', time: '10:30', date: '2026-04-20', files: [] },
      { id: 'r_ai1_2', projectId: 'p_ai1', content: '与浙江电费中心对接异常用户预警机制', time: '14:00', date: '2026-04-22', files: [] },
    ],
    createdAt: '2025-09-01',
    updatedAt: '2026-04-22',
    productId: 'prod1',
    projectType: 'product'
  },
  {
    id: 'p_ai2',
    name: '江苏负荷预测AI提升',
    province: '江苏',
    year: '2026',
    color: 'orange',
    visible: true,
    workCode: generateWorkCode(402),
    fullPath: `${defaultConfig.basePath}/项目/2026/江苏/江苏负荷预测AI提升`,
    folders: generateProjectFolders(`${defaultConfig.basePath}/项目/2026/江苏`, '江苏负荷预测AI提升', '预测'),
    records: [
      { id: 'r_ai2_1', projectId: 'p_ai2', content: '负荷预测模型V3.0发布，短期预测精度提升至97.5%', time: '09:00', date: '2026-04-21', files: [] },
      { id: 'r_ai2_2', projectId: 'p_ai2', content: '完成节假日特殊负荷预测规则优化', time: '15:00', date: '2026-04-24', files: [] },
      { id: 'r_ai2_3', projectId: 'p_ai2', content: '编制负荷预测系统升级验收材料', time: '11:30', date: '2026-04-25', files: [] },
    ],
    createdAt: '2026-01-05',
    updatedAt: '2026-04-25',
    productId: 'prod1',
    projectType: 'product'
  },
]

// 独立项目 - 与AI平台无关的传统营销数字化项目
const standaloneProjects: ProjectWithFiles[] = [
  {
    id: 'p_std1',
    name: '浙江营销数据中心建设',
    province: '浙江',
    year: '2024',
    color: 'red',
    visible: true,
    workCode: generateWorkCode(501),
    fullPath: `${defaultConfig.basePath}/项目/2024/浙江/浙江营销数据中心建设`,
    folders: generateProjectFolders(`${defaultConfig.basePath}/项目/2024/浙江`, '浙江营销数据中心建设', '数据中心'),
    records: [
      { id: 'r_std1_1', projectId: 'p_std1', content: '数据中心扩容完成，新增营销数据存储容量50TB', time: '09:00', date: '2026-04-20', files: [] },
      { id: 'r_std1_2', projectId: 'p_std1', content: '完成营销数据治理专项行动，清洗历史数据1200万条', time: '14:30', date: '2026-04-22', files: [] },
      { id: 'r_std1_3', projectId: 'p_std1', content: '数据中心安全评估报告编制完成', time: '16:00', date: '2026-04-24', files: [] },
    ],
    createdAt: '2024-10-01',
    updatedAt: '2026-04-24',
    productId: undefined,
    projectType: 'standalone'
  },
  {
    id: 'p_std2',
    name: '安徽电费结算系统升级',
    province: '安徽',
    year: '2025',
    color: 'red',
    visible: true,
    workCode: generateWorkCode(502),
    fullPath: `${defaultConfig.basePath}/项目/2025/安徽/安徽电费结算系统升级`,
    folders: generateProjectFolders(`${defaultConfig.basePath}/项目/2025/安徽`, '安徽电费结算系统升级', '电费'),
    records: [
      { id: 'r_std2_1', projectId: 'p_std2', content: '电费结算系统V5.0上线测试，批量结算效率提升60%', time: '10:00', date: '2026-04-21', files: [] },
      { id: 'r_std2_2', projectId: 'p_std2', content: '完成分布式光伏结算模块开发', time: '15:00', date: '2026-04-23', files: [] },
    ],
    createdAt: '2025-06-01',
    updatedAt: '2026-04-23',
    productId: undefined,
    projectType: 'standalone'
  },
  {
    id: 'p_std3',
    name: '江苏营销移动作业平台',
    province: '江苏',
    year: '2026',
    color: 'red',
    visible: true,
    workCode: generateWorkCode(503),
    fullPath: `${defaultConfig.basePath}/项目/2026/江苏/江苏营销移动作业平台`,
    folders: generateProjectFolders(`${defaultConfig.basePath}/项目/2026/江苏`, '江苏营销移动作业平台', '移动'),
    records: [
      { id: 'r_std3_1', projectId: 'p_std3', content: '移动作业平台APP完成安全加固，通过国网安全测评', time: '09:30', date: '2026-04-20', files: [] },
      { id: 'r_std3_2', projectId: 'p_std3', content: '现场作业模块迭代，新增表计拍照识别功能', time: '14:00', date: '2026-04-22', files: [] },
      { id: 'r_std3_3', projectId: 'p_std3', content: '编制移动平台推广培训方案', time: '16:30', date: '2026-04-25', files: [] },
    ],
    createdAt: '2026-01-20',
    updatedAt: '2026-04-25',
    productId: undefined,
    projectType: 'standalone'
  },
]

// 个人事项项目
const personalProject: ProjectWithFiles = {
  id: 'personal',
  name: '个人事项',
  province: '个人',
  year: currentYear,
  color: 'orange',
  visible: true,
  fullPath: '',
  folders: [],
  createdAt: '2026-01-01',
  updatedAt: '2026-04-22',
  productId: undefined,
  projectType: 'standalone'
}

// 合并所有项目
const initialProjects: ProjectWithFiles[] = [...productProjects, ...standaloneProjects, personalProject]

// 示例临时任务数据
const initialQuickTasks: QuickTask[] = [
  {
    id: 'qt1',
    title: 'AI平台年度规划编制',
    status: 'active',
    priority: 'high',
    createdAt: '2026-04-20',
    updatedAt: '2026-04-20',
    dueDate: '2026-04-30',
    records: [],
    tags: ['规划', '年度']
  },
  {
    id: 'qt2',
    title: '营销AI场景白皮书编写',
    status: 'active',
    priority: 'medium',
    createdAt: '2026-04-15',
    updatedAt: '2026-04-15',
    dueDate: '2026-05-15',
    records: [],
    tags: ['白皮书', 'AI']
  }
]

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [projects, setProjects] = useState<ProjectWithFiles[]>(initialProjects)
  const [quickTasks, setQuickTasks] = useState<QuickTask[]>(initialQuickTasks)
  const [viewType, setViewType] = useState<ViewType>('project')
  const [focusedProjectId, setFocusedProjectId] = useState<string | null>(null)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [showReview, setShowReview] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showMindmap, setShowMindmap] = useState(false)
  const [selectedProductForMindmap, setSelectedProductForMindmap] = useState<Product | null>(null)
  const [organizeRules, setOrganizeRules] = useState<OrganizeRuleConfig>(defaultOrganizeRuleConfig)

  // 新建文本文件相关状态
  const [showTextFileModal, setShowTextFileModal] = useState(false)
  const [newTextFileName, setNewTextFileName] = useState('')
  const [textFileTarget, setTextFileTarget] = useState<{ id: string, type: 'product' | 'project' } | null>(null)
  const [selectedFolderForTextFile, setSelectedFolderForTextFile] = useState<string>('')
  const [editingFile, setEditingFile] = useState<{
    fileId: string;
    fileName: string;
    content: string;
    targetId: string;
    targetType: 'product' | 'project';
    fullPath?: string;
    isNew: boolean; // 标记是否为新建文件
  } | null>(null)

  // 扫描本地目录并更新数据
  const refreshFromLocalDirectory = async () => {
    try {
      const config = await loadConfig()
      const basePath = config.appConfig?.basePath || defaultConfig.basePath

      // 尝试扫描本地目录获取真实数据
      const scannedProducts = await scanProducts(basePath)
      const scannedProjects = await scanProjects(basePath)

      // 如果有扫描结果，使用真实数据
      if (scannedProducts.length > 0 || scannedProjects.length > 0) {
        const realProducts = scannedProducts.map((sp, i) => convertScannedProduct(sp, i))
        const realProjects = scannedProjects.map((sp, i) => convertScannedProject(sp, i))

        // 合并扫描数据与配置中的可见状态
        if (config.projects.length > 0) {
          const mergedProjects = realProjects.map(p => {
            const configProject = config.projects.find(cp => cp.id === p.id)
            if (configProject) {
              return { ...p, visible: configProject.visible }
            }
            return p
          })
          setProjects(mergedProjects)
        } else {
          setProjects(realProjects)
        }

        // 使用扫描的产品数据
        setProducts(realProducts)
      }
      return true
    } catch (err) {
      console.error('扫描本地目录失败:', err)
      return false
    }
  }

  // 启动时加载配置并扫描本地目录
  useEffect(() => {
    async function initApp() {
      try {
        const config = await loadConfig()

        // 先扫描本地目录
        await refreshFromLocalDirectory()

        // 根据配置初始化临时任务
        if (config.quickTasks.length > 0) {
          setQuickTasks(config.quickTasks)
        }

        // 恢复 UI 状态
        if (config.uiState) {
          if (config.uiState.selectedProductId) setSelectedProductId(config.uiState.selectedProductId)
          if (config.uiState.focusedProjectId) setFocusedProjectId(config.uiState.focusedProjectId)
          if (config.uiState.viewType) setViewType(config.uiState.viewType as ViewType)
        }

        setIsLoading(false)
      } catch (err) {
        console.error('加载配置失败:', err)
        setIsLoading(false)
      }
    }

    initApp()
  }, [])

  // 监听新建文本文件事件
  useEffect(() => {
    const handleCreateTextFile = (e: CustomEvent) => {
      const { targetType, targetId } = e.detail
      setTextFileTarget({ id: targetId, type: targetType })
      setNewTextFileName('')
      // 设置默认文件夹为第一个文件夹
      if (targetType === 'product') {
        const product = products.find(p => p.id === targetId)
        if (product && product.folders.length > 0) {
          setSelectedFolderForTextFile(product.folders[0].id)
        }
      } else {
        const project = projects.find(p => p.id === targetId)
        if (project && project.folders.length > 0) {
          setSelectedFolderForTextFile(project.folders[0].id)
        }
      }
      setShowTextFileModal(true)
    }

    window.addEventListener('create-text-file', handleCreateTextFile as EventListener)
    return () => {
      window.removeEventListener('create-text-file', handleCreateTextFile as EventListener)
    }
  }, [products, projects])

  // 监听编辑文本文件事件（点击 txt 文件时触发）
  useEffect(() => {
    const handleEditTextFile = async (e: CustomEvent) => {
      const { fileId, fileName, content, targetId, targetType, fullPath } = e.detail
      // 读取已有文件的内容
      let fileContent = content
      if (fullPath) {
        try {
          fileContent = await invoke<string>('read_file_content', { path: fullPath })
        } catch (error) {
          console.error('读取文件内容失败:', error)
          fileContent = ''
        }
      }
      setEditingFile({
        fileId,
        fileName,
        content: fileContent,
        targetId,
        targetType,
        fullPath,
        isNew: false // 编辑已有文件
      })
    }

    window.addEventListener('edit-text-file', handleEditTextFile as unknown as EventListener)
    return () => {
      window.removeEventListener('edit-text-file', handleEditTextFile as unknown as EventListener)
    }
  }, [])

  // 状态变化时自动保存配置
  useEffect(() => {
    if (!isLoading) {
      const config: WorkHubConfig = {
        version: '1.0',
        lastUpdated: new Date().toISOString(),
        appConfig: {
          basePath: defaultConfig.basePath,
          defaultFolders: defaultConfig.defaultFolders,
        },
        products: products.map(p => ({
          id: p.id,
          name: p.name,
          color: p.color,
          startYear: p.startYear,
          endYear: p.endYear,
          description: p.description,
          visible: true,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        })),
        projects: projects.map(p => ({
          id: p.id,
          name: p.name,
          province: p.province,
          year: p.year,
          color: p.color,
          visible: p.visible,
          fullPath: p.fullPath,
          productId: p.productId,
          projectType: p.projectType,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        })),
        quickTasks,
        uiState: {
          selectedProductId: selectedProductId || undefined,
          focusedProjectId: focusedProjectId || undefined,
          viewType,
        },
      }
      debouncedSaveConfig(config)
    }
  }, [products, projects, quickTasks, selectedProductId, focusedProjectId, viewType, isLoading])

  const handleAddProduct = (name: string, color: string, startYear: string, description?: string, workCode?: string) => {
    const validColors: Product['color'][] = ['blue', 'green', 'orange', 'purple', 'red']
    const productColor = validColors.includes(color as Product['color']) ? color as Product['color'] : 'blue'
    const now = new Date().toISOString().split('T')[0]
    setProducts(prev => [...prev, {
      id: `prod${Date.now()}`,
      name,
      color: productColor,
      startYear,
      endYear: undefined,
      description: description || '',
      workCode,
      folders: [],
      records: [],
      createdAt: now,
      updatedAt: now
    }])
  }

  const handleAddProject = (name: string, province: string, year: string, productId?: string, workCode?: string) => {
    const colors: ProjectWithFiles['color'][] = ['blue', 'green', 'purple', 'red']
    const fullPath = `${defaultConfig.basePath}/项目/${year}/${province}/${name}`
    const now = new Date().toISOString().split('T')[0]
    setProjects(prev => [...prev, {
      id: `p${Date.now()}`,
      name,
      province,
      year,
      color: colors[Math.floor(Math.random() * colors.length)],
      visible: true,
      fullPath,
      folders: generateMockFolders(`${defaultConfig.basePath}/项目/${year}/${province}`, name),
      workCode,
      createdAt: now,
      updatedAt: now,
      productId: productId || undefined,
      projectType: productId ? 'product' : 'standalone'
    }])
  }

  const handleAddProductFolder = (productId: string, folderName: string) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const newFolder = {
          id: `folder_${Date.now()}`,
          name: folderName,
          path: folderName,
          fullPath: `${defaultConfig.basePath}/产品/${p.name}/${folderName}`,
          iconType: 'default' as const,
          files: []
        }
        return { ...p, folders: [...p.folders, newFolder], updatedAt: new Date().toISOString().split('T')[0] }
      }
      return p
    }))
  }

  const handleToggleProjectVisible = (projectId: string) => {
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, visible: !p.visible } : p
    ))
  }

  const handleRenameProduct = (productId: string, newName: string) => {
    setProducts(prev => prev.map(p =>
      p.id === productId ? { ...p, name: newName, updatedAt: new Date().toISOString().split('T')[0] } : p
    ))
  }

  const handleRenameProject = (projectId: string, newName: string) => {
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, name: newName, updatedAt: new Date().toISOString().split('T')[0] } : p
    ))
  }

  const handleUpdateProductWorkCode = (productId: string, workCode: string) => {
    setProducts(prev => prev.map(p =>
      p.id === productId ? { ...p, workCode, updatedAt: new Date().toISOString().split('T')[0] } : p
    ))
  }

  const handleUpdateProjectWorkCode = (projectId: string, workCode: string) => {
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, workCode, updatedAt: new Date().toISOString().split('T')[0] } : p
    ))
  }

  const handleAddFolder = (projectId: string, folderName: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const newFolder = {
          id: `folder_${Date.now()}`,
          name: folderName,
          path: folderName,
          fullPath: `${p.fullPath}/${folderName}`,
          iconType: 'default' as const,
          files: []
        }
        return { ...p, folders: [...p.folders, newFolder], updatedAt: new Date().toISOString().split('T')[0] }
      }
      return p
    }))
  }

  const handleAddFile = (projectId: string, folderId: string, fileName: string, fileType: string) => {
    const extensions: Record<string, string> = { doc: '.docx', xls: '.xlsx', ppt: '.pptx', pdf: '.pdf', note: '.note', md: '.md', txt: '.txt' }
    const newFileId = `file_${Date.now()}`
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const updatedFolders = p.folders.map(f => {
          if (f.id === folderId) {
            const newFile = {
              id: newFileId,
              name: fileName,
              type: fileType,
              extension: extensions[fileType] || '',
              size: 0,
              sizeDisplay: '0 KB',
              date: new Date().toISOString().split('T')[0],
              fullPath: `${f.fullPath}/${fileName}${extensions[fileType] || ''}`,
              editable: true,
              editorType: 'text' as const,
            }
            return { ...f, files: [...f.files, newFile] }
          }
          return f
        })
        return { ...p, folders: updatedFolders, updatedAt: new Date().toISOString().split('T')[0] }
      }
      return p
    }))
    return newFileId
  }

  // 添加文件到产品
  const handleAddProductFile = (productId: string, folderId: string, fileName: string, fileType: string) => {
    const extensions: Record<string, string> = { doc: '.docx', xls: '.xlsx', ppt: '.pptx', pdf: '.pdf', note: '.note', md: '.md', txt: '.txt' }
    const newFileId = `file_${Date.now()}`
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const updatedFolders = p.folders.map(f => {
          if (f.id === folderId) {
            const newFile = {
              id: newFileId,
              name: fileName,
              type: fileType,
              extension: extensions[fileType] || '',
              size: 0,
              sizeDisplay: '0 KB',
              date: new Date().toISOString().split('T')[0],
              fullPath: `${f.fullPath}/${fileName}${extensions[fileType] || ''}`,
              editable: true,
              editorType: 'text' as const,
            }
            return { ...f, files: [...f.files, newFile] }
          }
          return f
        })
        return { ...p, folders: updatedFolders, updatedAt: new Date().toISOString().split('T')[0] }
      }
      return p
    }))
    return newFileId
  }

  // 获取产品文件
  const getProductFile = (productId: string, fileId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) return null
    for (const folder of product.folders) {
      const file = folder.files.find(f => f.id === fileId)
      if (file) return { file, folder }
    }
    return null
  }

  // 获取项目文件
  const getProjectFile = (projectId: string, fileId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (!project) return null
    for (const folder of project.folders) {
      const file = folder.files.find(f => f.id === fileId)
      if (file) return { file, folder }
    }
    return null
  }

  const handleRenameFolder = (projectId: string, folderId: string, newName: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const updatedFolders = p.folders.map(f => {
          if (f.id === folderId) {
            return { ...f, name: newName, path: newName, fullPath: `${p.fullPath}/${newName}` }
          }
          return f
        })
        return { ...p, folders: updatedFolders, updatedAt: new Date().toISOString().split('T')[0] }
      }
      return p
    }))
  }

  const handleAddQuickTask = (task: QuickTask) => {
    setQuickTasks(prev => [...prev, task])
  }

  const handleUpdateQuickTask = (id: string, updates: Partial<QuickTask>) => {
    setQuickTasks(prev => prev.map(t =>
      t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
    ))
  }

  // 选择产品时清除项目选择
  const handleSelectProduct = (id: string | null) => {
    setSelectedProductId(id)
    if (id) setFocusedProjectId(null)
  }

  // 选择项目时清除产品选择
  const handleSelectProject = (id: string | null) => {
    setFocusedProjectId(id)
    if (id) setSelectedProductId(null)
  }

  // 添加记录到产品/项目
  const handleAddRecord = (targetId: string, targetType: 'product' | 'project', content: string, files: AttachedFile[]) => {
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    const timeStr = now.toTimeString().slice(0, 5)
    const newRecord: WorkRecord = {
      id: `record_${Date.now()}`,
      projectId: targetId,
      content,
      time: timeStr,
      date: dateStr,
      files
    }

    if (targetType === 'product') {
      setProducts(prev => prev.map(p =>
        p.id === targetId ? { ...p, records: [...(p.records || []), newRecord] } : p
      ))
    } else {
      setProjects(prev => prev.map(p =>
        p.id === targetId ? { ...p, records: [...(p.records || []), newRecord] } : p
      ))
    }
  }

  // 更新记录
  const handleUpdateRecord = (targetId: string, targetType: 'product' | 'project', recordId: string, content: string, files: AttachedFile[]) => {
    if (targetType === 'product') {
      setProducts(prev => prev.map(p =>
        p.id === targetId ? {
          ...p,
          records: (p.records || []).map(r =>
            r.id === recordId ? { ...r, content, files } : r
          )
        } : p
      ))
    } else {
      setProjects(prev => prev.map(p =>
        p.id === targetId ? {
          ...p,
          records: (p.records || []).map(r =>
            r.id === recordId ? { ...r, content, files } : r
          )
        } : p
      ))
    }
  }

  // 添加待办（从MP3解析）
  const handleAddTodo = (title: string, priority: string) => {
    const now = new Date()
    const newTodo: QuickTask = {
      id: `todo_${Date.now()}`,
      title,
      status: 'active',
      priority: priority === '高' ? 'high' : priority === '中' ? 'medium' : 'low',
      createdAt: now.toISOString().split('T')[0],
      updatedAt: now.toISOString().split('T')[0],
      records: [],
      tags: []
    }
    setQuickTasks(prev => [...prev, newTodo])
  }

  return (
    <div className="app-container">
      <div className="main-row">
        {/* 左侧面板 */}
        <LeftPanel
          products={products}
          projects={projects}
          quickTasks={quickTasks}
          selectedProductId={selectedProductId}
          focusedProjectId={focusedProjectId}
          onSelectProduct={handleSelectProduct}
          onSelectProject={handleSelectProject}
          onAddProduct={handleAddProduct}
          onAddProject={handleAddProject}
          onAddFolder={handleAddFolder}
          onAddProductFolder={handleAddProductFolder}
          onAddFile={handleAddFile}
          onToggleProjectVisible={handleToggleProjectVisible}
          onRenameFolder={handleRenameFolder}
          onRenameProduct={handleRenameProduct}
          onRenameProject={handleRenameProject}
          onAddQuickTask={handleAddQuickTask}
          onUpdateQuickTask={handleUpdateQuickTask}
          organizeRules={organizeRules}
          onSaveOrganizeRules={setOrganizeRules}
          onUpdateProductWorkCode={handleUpdateProductWorkCode}
          onUpdateProjectWorkCode={handleUpdateProjectWorkCode}
          onAddRecord={handleAddRecord}
        />

        {/* 右侧内容区 */}
        <div className="right-content">
          {/* 顶部工具栏 - 统一固定区域 */}
          <div className="right-toolbar">
            {/* 左侧区域：返回首页 + 位置指示 */}
            <div className="toolbar-left">
              {(selectedProductId || focusedProjectId) && (
                <>
                  <button className="back-home-btn" onClick={() => { setSelectedProductId(null); setFocusedProjectId(null); }}>
                    <IconChevronLeft size={14} />
                    <span>首页</span>
                  </button>
                  <span className="breadcrumb-separator"><IconChevronRight size={12} /></span>
                  {/* 类型标签和颜色点 */}
                  <span className={`type-tag ${selectedProductId ? 'product-tag' : 'project-tag'}`}>
                    {selectedProductId ? '产品' : '项目'}
                  </span>
                  <span className={`color-dot ${selectedProductId ? products.find(p => p.id === selectedProductId)?.color : projects.find(p => p.id === focusedProjectId)?.color}`}></span>
                  <span className="toolbar-location">
                    {selectedProductId ? products.find(p => p.id === selectedProductId)?.name : projects.find(p => p.id === focusedProjectId)?.name}
                  </span>
                  {selectedProductId && products.find(p => p.id === selectedProductId) && (
                    <span className="toolbar-meta">
                      {products.find(p => p.id === selectedProductId)!.startYear}
                      {products.find(p => p.id === selectedProductId)!.endYear ? `-${products.find(p => p.id === selectedProductId)!.endYear}` : '至今'}
                    </span>
                  )}
                  {focusedProjectId && !selectedProductId && projects.find(p => p.id === focusedProjectId) && (
                    <span className="toolbar-meta">
                      {projects.find(p => p.id === focusedProjectId)!.province} · {projects.find(p => p.id === focusedProjectId)!.year}
                    </span>
                  )}
                </>
              )}
            </div>
            {/* 右侧区域：功能按钮 */}
            <div className="toolbar-right">
              <div className="toolbar-section">
                <button className="toolbar-btn" onClick={() => setShowMindmap(!showMindmap)}>
                  <IconFileText size={16} />
                  <span>产品脉络</span>
                </button>
                {showMindmap && (
                  <div className="toolbar-dropdown">
                    {products.filter(p => projects.some(proj => proj.productId === p.id)).map(product => (
                      <button
                        key={product.id}
                        className={`dropdown-item ${product.color}`}
                        onClick={() => {
                          setSelectedProductForMindmap(product)
                          setShowMindmap(false)
                        }}
                      >
                        <span className={`dot ${product.color}`}></span>
                        {product.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* 文件关联功能已暂时隐藏 */}
              <button className="toolbar-btn" onClick={() => setShowReview(true)}>
                <IconReview size={16} />
                <span>复盘</span>
              </button>
              <button className="toolbar-btn" onClick={() => setShowSettings(true)}>
                <IconSettings size={16} />
                <span>设置</span>
              </button>
            </div>
          </div>

          {/* 内容区域 */}
          <div className="content-body">
            {/* 使用 GlobalOverview 统一处理首页和专注模式 */}
            <GlobalOverview
              products={products}
              projects={projects}
              quickTasks={quickTasks}
              onSelectProduct={handleSelectProduct}
              onSelectProject={handleSelectProject}
              showFileRelation={false}
              onAddRecord={handleAddRecord}
              onUpdateRecord={handleUpdateRecord}
              onAddTodo={handleAddTodo}
              focusedTargetId={selectedProductId || focusedProjectId}
              focusedTargetType={selectedProductId ? 'product' : focusedProjectId ? 'project' : undefined}
              onExitFocus={() => { setSelectedProductId(null); setFocusedProjectId(null); }}
            />
          </div>
        </div>

        {/* 复盘弹窗 */}
        {showReview && (
          <div className="modal-overlay" onClick={() => setShowReview(false)}>
            <div className="modal modal-large" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>工作复盘</h3>
                <button className="modal-close" onClick={() => setShowReview(false)}>
                  <IconClose size={14} />
                </button>
              </div>
              <div className="modal-body-full">
                <WorkReview
                products={products}
                projects={projects}
                activeTab="weekly"
                onClose={() => setShowReview(false)}
              />
              </div>
            </div>
          </div>
        )}

        {/* 设置弹窗 */}
        {showSettings && (
          <div className="modal-overlay" onClick={() => setShowSettings(false)}>
            <div className="modal modal-large" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>设置</h3>
                <button className="modal-close" onClick={() => setShowSettings(false)}>
                  <IconClose size={14} />
                </button>
              </div>
              <div className="modal-body-full">
                <SettingsDrawer
                  activeTab="structure"
                  onClose={() => setShowSettings(false)}
                  products={products}
                  projects={projects}
                  onSelectProduct={handleSelectProduct}
                  onSelectProject={handleSelectProject}
                  onRefreshScan={refreshFromLocalDirectory}
                />
              </div>
            </div>
          </div>
        )}

        {/* 产品脉络图弹窗 */}
        {selectedProductForMindmap && (
          <div className="modal-overlay" onClick={() => setSelectedProductForMindmap(null)}>
            <div className="modal modal-large mindmap-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{selectedProductForMindmap.name} - 产品脉络</h3>
                <button className="modal-close" onClick={() => setSelectedProductForMindmap(null)}>
                  <IconClose size={14} />
                </button>
              </div>
              <div className="modal-body-full">
                <MindmapView
                  product={selectedProductForMindmap}
                  projects={projects}
                  onSelectProject={handleSelectProject}
                  onSelectProduct={handleSelectProduct}
                />
              </div>
            </div>
          </div>
        )}

        {/* 新建文本文件弹窗 */}
        {showTextFileModal && textFileTarget && (
          <div className="modal-overlay" onClick={() => setShowTextFileModal(false)}>
            <div className="modal text-file-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>新建文本文件</h3>
                <button className="modal-close" onClick={() => setShowTextFileModal(false)}>
                  <IconClose size={14} />
                </button>
              </div>
              <div className="modal-body">
                <div className="text-file-name-step">
                  <div className="form-row">
                    <label>文件名称：</label>
                    <input
                      type="text"
                      className="text-file-input"
                      value={newTextFileName}
                      onChange={e => setNewTextFileName(e.target.value)}
                      placeholder="输入文件名称"
                      autoFocus
                    />
                    <span className="file-ext-hint">.txt</span>
                  </div>
                  <div className="form-row">
                    <label>目标文件夹：</label>
                    <select
                      className="folder-select"
                      value={selectedFolderForTextFile}
                      onChange={e => setSelectedFolderForTextFile(e.target.value)}
                    >
                      {textFileTarget.type === 'product'
                        ? products.find(p => p.id === textFileTarget.id)?.folders.map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))
                        : projects.find(p => p.id === textFileTarget.id)?.folders.map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))
                      }
                    </select>
                  </div>
                  <div className="form-row">
                    <label>目标位置：</label>
                    <div className="target-info">
                      <span className={`type-tag ${textFileTarget.type}-tag`}>
                        {textFileTarget.type === 'product' ? '产品' : '项目'}
                      </span>
                      <span className="target-name">
                        {textFileTarget.type === 'product'
                          ? products.find(p => p.id === textFileTarget.id)?.name
                          : projects.find(p => p.id === textFileTarget.id)?.name}
                      </span>
                    </div>
                  </div>
                  <div className="form-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        if (newTextFileName.trim() && selectedFolderForTextFile) {
                          // 创建文件并获取文件ID
                          const fileId = textFileTarget.type === 'product'
                            ? handleAddProductFile(textFileTarget.id, selectedFolderForTextFile, newTextFileName, 'txt')
                            : handleAddFile(textFileTarget.id, selectedFolderForTextFile, newTextFileName, 'txt')
                          // 关闭弹窗
                          setShowTextFileModal(false)
                          setNewTextFileName('')
                          // 获取文件夹路径构建文件完整路径
                          const target = textFileTarget.type === 'product'
                            ? products.find(p => p.id === textFileTarget.id)
                            : projects.find(p => p.id === textFileTarget.id)
                          const folder = target?.folders.find(f => f.id === selectedFolderForTextFile)
                          const fullPath = folder ? `${folder.fullPath}/${newTextFileName}.txt` : ''
                          // 进入文件编辑模式
                          setEditingFile({
                            fileId,
                            fileName: newTextFileName,
                            content: '',
                            targetId: textFileTarget.id,
                            targetType: textFileTarget.type,
                            fullPath,
                            isNew: true // 新建文件
                          })
                        }
                      }}
                      disabled={!newTextFileName.trim() || !selectedFolderForTextFile}
                    >
                      <IconCheck size={14} /> 创建并编辑
                    </button>
                    <button className="btn btn-secondary" onClick={() => setShowTextFileModal(false)}>
                      取消
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 文本文件全屏编辑区 */}
        {editingFile && (
          <div className="text-file-editor-overlay">
            <div className="text-file-editor">
              <header className="text-file-editor-header">
                <div className="editor-header-left">
                  <button className="back-btn" onClick={() => setEditingFile(null)}>
                    <IconChevronLeft size={14} />
                    <span>返回</span>
                  </button>
                  <span className="breadcrumb-separator"><IconChevronRight size={12} /></span>
                  <span className={`type-tag ${editingFile.targetType}-tag`}>
                    {editingFile.targetType === 'product' ? '产品' : '项目'}
                  </span>
                  <span className="file-name-display">{editingFile.fileName}{editingFile.fileName.endsWith('.txt') ? '' : '.txt'}</span>
                </div>
                <div className="editor-header-right">
                  <span className="target-name">
                    {editingFile.targetType === 'product'
                      ? products.find(p => p.id === editingFile.targetId)?.name
                      : projects.find(p => p.id === editingFile.targetId)?.name}
                  </span>
                  <button className="save-btn" onClick={async () => {
                    // 保存文件内容到磁盘
                    if (editingFile.fullPath && editingFile.content) {
                      try {
                        await invoke('write_file_content', { path: editingFile.fullPath, content: editingFile.content })
                        console.log('保存文件成功:', editingFile.fullPath)
                      } catch (error) {
                        console.error('保存文件失败:', error)
                      }
                    }

                    // 如果是新建文件，需要添加到历史记录
                    if (editingFile.isNew) {
                      const target = editingFile.targetType === 'product'
                        ? products.find(p => p.id === editingFile.targetId)
                        : projects.find(p => p.id === editingFile.targetId)
                      if (target) {
                        const newFile = {
                          id: editingFile.fileId,
                          name: editingFile.fileName,
                          type: 'txt',
                          extension: '.txt',
                          fullPath: editingFile.fullPath || '',
                          size: editingFile.content.length,
                          sizeDisplay: `${Math.round(editingFile.content.length / 1024)} KB`,
                          date: new Date().toISOString().split('T')[0],
                        }
                        window.dispatchEvent(new CustomEvent('add-file-to-history', {
                          detail: {
                            file: newFile,
                            targetId: editingFile.targetId,
                            targetType: editingFile.targetType,
                            targetName: target.name
                          }
                        }))
                      }
                    }
                    setEditingFile(null)
                  }}>
                    <IconCheck size={14} /> 保存
                  </button>
                </div>
              </header>
              <div className="text-file-editor-body">
                <textarea
                  className="text-file-textarea"
                  value={editingFile.content}
                  onChange={e => setEditingFile(prev => prev ? { ...prev, content: e.target.value } : null)}
                  placeholder="开始编辑文本内容..."
                  autoFocus
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App