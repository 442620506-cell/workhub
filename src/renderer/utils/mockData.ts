import { Folder, FileItem, defaultConfig } from '../types'

// 生成模拟文件夹结构
export const generateMockFolders = (basePath: string, projectName: string): Folder[] => {
  const defaultFolders = ['汇报材料', '申报材料', '历史文件']
  const mockFiles: Record<string, FileItem[]> = {
    '汇报材料': [
      { id: 'f1', name: '项目汇报PPT', type: 'ppt', extension: '.pptx', size: 2500000, sizeDisplay: '2.5MB', date: '2026-04-20', fullPath: `${basePath}/${projectName}/汇报材料/项目汇报PPT.pptx` },
      { id: 'f2', name: '汇报大纲', type: 'doc', extension: '.docx', size: 50000, sizeDisplay: '50KB', date: '2026-04-18', fullPath: `${basePath}/${projectName}/汇报材料/汇报大纲.docx` },
    ],
    '申报材料': [
      { id: 'f3', name: '申报材料', type: 'pdf', extension: '.pdf', size: 1200000, sizeDisplay: '1.2MB', date: '2026-04-15', fullPath: `${basePath}/${projectName}/申报材料/申报材料.pdf` },
      { id: 'f4', name: '附件清单', type: 'xls', extension: '.xlsx', size: 80000, sizeDisplay: '80KB', date: '2026-04-15', fullPath: `${basePath}/${projectName}/申报材料/附件清单.xlsx` },
    ],
    '历史文件': [],
  }

  const iconTypes: Record<string, 'report' | 'document' | 'history' | 'default'> = {
    '汇报材料': 'report',
    '申报材料': 'document',
    '历史文件': 'history',
  }

  return defaultFolders.map((folderName, index) => ({
    id: `folder_${index}`,
    name: folderName,
    path: folderName,
    fullPath: `${basePath}/${projectName}/${folderName}`,
    iconType: iconTypes[folderName] || 'default',
    files: mockFiles[folderName] || [],
  }))
}