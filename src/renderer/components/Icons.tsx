import React from 'react'

// SVG图标组件库 - 简约科技风
// 所有图标使用统一的线条风格 (stroke-width: 1.5, fill: none)

interface IconProps {
  size?: number
  className?: string
  style?: React.CSSProperties
}

// 基础图标包装器
const IconWrapper: React.FC<IconProps & { children: React.ReactNode }> = ({
  size = 20,
  className = '',
  style,
  children
}) => (
  <span className={className} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, ...style }}>
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  </span>
)

// === 导航/功能图标 ===
export const IconHome: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9,22 9,12 15,12 15,22" />
  </IconWrapper>
)

export const IconTodo: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <line x1="8" y1="10" x2="16" y2="10" />
    <line x1="8" y1="14" x2="13" y2="14" />
  </IconWrapper>
)

export const IconNew: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </IconWrapper>
)

export const IconFolder: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path d="M3 7v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2z" />
  </IconWrapper>
)

export const IconFiles: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14,2 14,8 20,8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="14" y2="17" />
  </IconWrapper>
)

export const IconReview: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <line x1="7" y1="8" x2="17" y2="8" />
    <line x1="7" y1="12" x2="17" y2="12" />
    <line x1="7" y1="16" x2="13" y2="16" />
    <path d="M16 14v4l2-2" />
  </IconWrapper>
)

export const IconSettings: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </IconWrapper>
)

// === 操作图标 ===
export const IconClose: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </IconWrapper>
)

export const IconCheck: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <polyline points="20,6 9,17 4,12" />
  </IconWrapper>
)

export const IconPlus: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </IconWrapper>
)

export const IconFocus: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <circle cx="12" cy="12" r="3" />
    <line x1="12" y1="2" x2="12" y2="6" />
    <line x1="12" y1="18" x2="12" y2="22" />
    <line x1="2" y1="12" x2="6" y2="12" />
    <line x1="18" y1="12" x2="22" y2="12" />
  </IconWrapper>
)

export const IconMinus: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <line x1="5" y1="12" x2="19" y2="12" />
  </IconWrapper>
)

export const IconEdit: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </IconWrapper>
)

export const IconTrash: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <polyline points="3,6 5,6 21,6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </IconWrapper>
)

export const IconCopy: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </IconWrapper>
)

export const IconDownload: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7,10 12,15 17,10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </IconWrapper>
)

export const IconUpload: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17,8 12,3 7,8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </IconWrapper>
)

export const IconImport: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7,10 12,15 17,10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </IconWrapper>
)

export const IconExport: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17,8 12,3 7,8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </IconWrapper>
)

export const IconSave: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17,21 17,13 7,13 7,21" />
    <polyline points="7,3 7,8 15,8" />
  </IconWrapper>
)

export const IconAttach: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </IconWrapper>
)

export const IconLink: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </IconWrapper>
)

export const IconRefresh: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <polyline points="23,4 23,10 17,10" />
    <polyline points="1,20 1,14 7,14" />
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
  </IconWrapper>
)

export const IconSearch: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </IconWrapper>
)

export const IconFilter: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" />
  </IconWrapper>
)

// === 状态图标 ===
export const IconCheckCircle: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="16,9 10.5,14.5 8,12" />
  </IconWrapper>
)

export const IconClock: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12,6 12,12 16,14" />
  </IconWrapper>
)

export const IconPending: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12,6 12,12" />
    <circle cx="12" cy="16" r="1" fill="currentColor" />
  </IconWrapper>
)

export const IconInProgress: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </IconWrapper>
)

// === 折叠/展开图标 ===
export const IconChevronRight: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <polyline points="9,18 15,12 9,6" />
  </IconWrapper>
)

export const IconChevronDown: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <polyline points="6,9 12,15 18,9" />
  </IconWrapper>
)

export const IconChevronLeft: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <polyline points="15,18 9,12 15,6" />
  </IconWrapper>
)

export const IconChevronUp: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <polyline points="18,15 12,9 6,15" />
  </IconWrapper>
)

// === 优先级图标（使用圆形表示） ===
export const IconPriorityHigh: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <circle cx="12" cy="12" r="8" fill="currentColor" stroke="none" />
  </IconWrapper>
)

export const IconPriorityMedium: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <circle cx="12" cy="12" r="6" fill="currentColor" stroke="none" />
  </IconWrapper>
)

export const IconPriorityLow: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
  </IconWrapper>
)

// === 文件类型图标 ===
export const IconFile: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14,2 14,8 20,8" />
  </IconWrapper>
)

// WPS风格文件图标 - Word文档（蓝色背景+白色W）
export const IconFileText: React.FC<IconProps> = ({ size = 20, className = '', style }) => (
  <span className={className} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, ...style }}>
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <rect x="3" y="2" width="18" height="20" rx="2" fill="#2B579A" />
      <text x="12" y="15" fontSize="10" fill="white" textAnchor="middle" fontFamily="sans-serif" fontWeight="bold">W</text>
    </svg>
  </span>
)

// WPS风格文件图标 - Excel表格（绿色背景+白色X）
export const IconFileSpreadsheet: React.FC<IconProps> = ({ size = 20, className = '', style }) => (
  <span className={className} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, ...style }}>
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <rect x="3" y="2" width="18" height="20" rx="2" fill="#217346" />
      <text x="12" y="15" fontSize="10" fill="white" textAnchor="middle" fontFamily="sans-serif" fontWeight="bold">X</text>
    </svg>
  </span>
)

// WPS风格文件图标 - PPT演示（橙红色背景+白色P）
export const IconFilePresentation: React.FC<IconProps> = ({ size = 20, className = '', style }) => (
  <span className={className} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, ...style }}>
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <rect x="3" y="2" width="18" height="20" rx="2" fill="#D24726" />
      <text x="12" y="15" fontSize="10" fill="white" textAnchor="middle" fontFamily="sans-serif" fontWeight="bold">P</text>
    </svg>
  </span>
)

// WPS风格文件图标 - PDF文档（红色背景+白色PDF）
export const IconFilePdf: React.FC<IconProps> = ({ size = 20, className = '', style }) => (
  <span className={className} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, ...style }}>
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <rect x="3" y="2" width="18" height="20" rx="2" fill="#C63030" />
      <text x="12" y="15" fontSize="7" fill="white" textAnchor="middle" fontFamily="sans-serif" fontWeight="bold">PDF</text>
    </svg>
  </span>
)

export const IconFileImage: React.FC<IconProps> = ({ size = 20, className = '', style }) => (
  <span className={className} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, ...style }}>
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <rect x="3" y="2" width="18" height="20" rx="2" fill="#8E44AD" />
      <text x="12" y="15" fontSize="7" fill="white" textAnchor="middle" fontFamily="sans-serif" fontWeight="bold">IMG</text>
    </svg>
  </span>
)

// === 用户/人员图标 ===
export const IconUser: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </IconWrapper>
)

export const IconUsers: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </IconWrapper>
)

// === 信息图标 ===
export const IconInfo: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </IconWrapper>
)

export const IconAlert: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </IconWrapper>
)

export const IconHelp: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </IconWrapper>
)

// === 产品/项目图标 ===
export const IconProduct: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27,6.96 12,12.01 20.73,6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </IconWrapper>
)

export const IconProject: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </IconWrapper>
)

// === 产品图标 ===
export const IconPackage: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </IconWrapper>
)

// === 日历/时间图标 ===
export const IconCalendar: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </IconWrapper>
)

// === AI 图标 ===
export const IconAI: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v4M12 19v4M1 12h4M19 12h4" />
    <path d="M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
  </IconWrapper>
)

// AI闪烁/魔法图标
export const IconSparkles: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" fill="currentColor" stroke="none" />
    <path d="M5 19l1 3 1-3 3-1-3-1-1-3-1 3-3 1 3 1z" fill="currentColor" stroke="none" />
    <path d="M17 17l1 2 1-2 2-1-2-1-1-2-1 2-2 1 2 1z" fill="currentColor" stroke="none" />
  </IconWrapper>
)

// === 缩放图标 ===
export const IconZoomIn: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="11" y1="8" x2="11" y2="14" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </IconWrapper>
)

export const IconZoomOut: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </IconWrapper>
)

export const IconClockOutline: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12,6 12,12 16,14" />
  </IconWrapper>
)

// === 工具/配置图标 ===
export const IconTool: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2 2 0 0 1-2.83 0l-1.4-1.4a2 2 0 0 1 0-2.83l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </IconWrapper>
)

export const IconWrench: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2 2 0 0 1-2.83 0l-1.4-1.4a2 2 0 0 1 0-2.83l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </IconWrapper>
)

// === 图表/数据图标 ===
export const IconChartBar: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </IconWrapper>
)

export const IconChartLine: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
  </IconWrapper>
)

export const IconChartPie: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
    <path d="M22 12A10 10 0 0 0 12 2v10z" />
  </IconWrapper>
)

// === 标签/书签图标 ===
export const IconTag: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </IconWrapper>
)

export const IconBookmark: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </IconWrapper>
)

// === 箭头导航图标 ===
export const IconArrowLeft: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12,19 5,12 12,5" />
  </IconWrapper>
)

export const IconArrowRight: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12,5 19,12 12,19" />
  </IconWrapper>
)

export const IconArrowUp: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5,12 12,5 19,12" />
  </IconWrapper>
)

export const IconArrowDown: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <polyline points="19,12 12,19 5,12" />
  </IconWrapper>
)

// === 记录/文档图标 ===
export const IconRecord: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14,2 14,8 20,8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="14" y2="17" />
  </IconWrapper>
)

// === 清单/任务图标 ===
export const IconChecklist: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="9" y1="9" x2="9" y2="9.01" />
    <line x1="9" y1="15" x2="9" y2="15.01" />
    <line x1="13" y1="9" x2="17" y2="9" />
    <line x1="13" y1="15" x2="17" y2="15" />
  </IconWrapper>
)

// === 可见性图标 ===
export const IconEye: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </IconWrapper>
)

export const IconEyeOff: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </IconWrapper>
)

// 关联图标 - 用于待办-记录关联
export const IconLinkTodo: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path d="M10 13a5 5 0 0 0 7.54.54l1.5-1.5a5 5 0 0 0-7.07-7.07l-1.5 1.5" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-1.5 1.5a5 5 0 0 0 7.07 7.07l1.5-1.5" />
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
  </IconWrapper>
)

export const IconLinked: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12l3 3 5-6" strokeWidth="2" />
  </IconWrapper>
)

// 整理图标（文件归类整理）
export const IconOrganize: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <path d="M14 14h7v7h-7z" />
    <path d="M8 8l2 2m-2 0l2-2" strokeWidth="2" strokeLinecap="round" />
    <path d="M17 17l2 2m-2 0l2-2" strokeWidth="2" strokeLinecap="round" />
  </IconWrapper>
)

// 撤销图标
export const IconUndo: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path d="M3 7v6h6" />
    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
  </IconWrapper>
)

// 历史/时间轴图标
export const IconHistory: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12,6 12,12 16,14" />
  </IconWrapper>
)

// 音频/MP3图标
export const IconAudio: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </IconWrapper>
)

// 麦克风图标
export const IconMic: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </IconWrapper>
)

// 置顶图标（pin）
export const IconPin: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path d="M12 17v5" />
    <path d="M9 10.5a3 3 0 0 1 6 0c0 2-3 3.5-3 3.5s-3-1.5-3-3.5z" />
    <path d="M12 3v4" />
    <line x1="5" y1="8" x2="19" y2="8" />
  </IconWrapper>
)

// 取消置顶图标
export const IconPinOff: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path d="M12 17v5" />
    <path d="M9 10.5a3 3 0 0 1 6 0c0 2-3 3.5-3 3.5s-3-1.5-3-3.5z" />
    <path d="M12 3v4" />
    <line x1="5" y1="8" x2="19" y2="8" />
    <line x1="3" y1="3" x2="21" y2="21" />
  </IconWrapper>
)

// 星标图标（收藏）
export const IconStar: React.FC<IconProps> = ({ size = 20, className = '', style }) => (
  <span className={className} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, ...style }}>
    <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="1.5" fill="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  </span>
)

// 取消星标图标（空心）
export const IconStarOff: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="none" />
  </IconWrapper>
)

// 文件类型图标映射
export const fileTypeIcons: Record<string, React.FC<IconProps>> = {
  pdf: IconFilePdf,
  doc: IconFileText,
  xls: IconFileSpreadsheet,
  ppt: IconFilePresentation,
  img: IconFileImage,
  other: IconFile,
}

// 获取文件类型图标组件
export const getFileTypeIcon = (type: string): React.FC<IconProps> => {
  return fileTypeIcons[type] || fileTypeIcons.other
}