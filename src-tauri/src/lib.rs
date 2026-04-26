use tauri::Manager;
use tauri_plugin_shell::ShellExt;
use std::fs;
use std::path::Path;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use chrono::Utc;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to WorkHub.", name)
}

#[tauri::command]
async fn open_file(app: tauri::AppHandle, path: String) -> Result<(), String> {
    // 使用系统默认程序打开文件
    app.shell().open(&path, None).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn read_file_content(path: String) -> Result<String, String> {
    // 读取文件内容返回文本
    fs::read_to_string(&path).map_err(|e| format!("读取文件失败: {}", e.to_string()))
}

#[tauri::command]
async fn write_file_content(path: String, content: String) -> Result<(), String> {
    // 写入内容到文件
    fs::write(&path, content).map_err(|e| format!("写入文件失败: {}", e.to_string()))
}

#[tauri::command]
async fn create_document(path: String, content: String) -> Result<(), String> {
    // 创建新文档文件
    let file_path = Path::new(&path);

    // 确保父目录存在
    if let Some(parent) = file_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| format!("创建目录失败: {}", e.to_string()))?;
        }
    }

    // 创建并写入文件
    fs::write(file_path, content).map_err(|e| format!("创建文件失败: {}", e.to_string()))
}

#[tauri::command]
async fn delete_file(path: String) -> Result<(), String> {
    // 删除文件
    if Path::new(&path).is_file() {
        fs::remove_file(&path).map_err(|e| format!("删除文件失败: {}", e.to_string()))
    } else {
        Err("路径不是文件".to_string())
    }
}

// ========== 文件整理相关命令 ==========

#[derive(Serialize, Deserialize)]
struct FileInfo {
    name: String,
    path: String,
    extension: String,
    size: u64,
    modified_time: String,
}

#[derive(Serialize, Deserialize)]
struct DirectoryInfo {
    name: String,
    path: String,
}

#[derive(Serialize, Deserialize)]
struct DirectoryContents {
    files: Vec<FileInfo>,
    directories: Vec<DirectoryInfo>,
}

#[derive(Serialize, Deserialize)]
struct PendingFileInfo {
    name: String,
    path: String,
    extension: String,
    size: u64,
    parent_directory: String,
    modified_time: String,
}

#[derive(Serialize, Deserialize, Clone)]
struct FileMoveOperation {
    source: String,
    destination: String,
    #[serde(rename = "type")]
    operation_type: String, // "move" | "copy"
}

#[derive(Serialize, Deserialize)]
struct BatchOperationResult {
    operation_id: String,
    success_count: u32,
    failed_count: u32,
    errors: Vec<String>,
}

// 移动文件
#[tauri::command]
async fn move_file(source: String, destination: String, overwrite: bool) -> Result<(), String> {
    let src_path = Path::new(&source);
    let dest_path = Path::new(&destination);

    // 检查源文件是否存在
    if !src_path.exists() {
        return Err("源文件不存在".to_string());
    }

    if !src_path.is_file() {
        return Err("源路径不是文件".to_string());
    }

    // 确保目标目录存在
    if let Some(parent) = dest_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| format!("创建目标目录失败: {}", e))?;
        }
    }

    // 处理目标文件已存在的情况
    if dest_path.exists() {
        if overwrite {
            fs::remove_file(dest_path).map_err(|e| format!("删除目标文件失败: {}", e))?;
        } else {
            return Err("目标文件已存在".to_string());
        }
    }

    // 移动文件
    fs::copy(src_path, dest_path).map_err(|e| format!("复制文件失败: {}", e))?;
    fs::remove_file(src_path).map_err(|e| format!("删除源文件失败: {}", e))?;

    Ok(())
}

// 复制文件
#[tauri::command]
async fn copy_file(source: String, destination: String, overwrite: bool) -> Result<(), String> {
    let src_path = Path::new(&source);
    let dest_path = Path::new(&destination);

    // 检查源文件是否存在
    if !src_path.exists() {
        return Err("源文件不存在".to_string());
    }

    if !src_path.is_file() {
        return Err("源路径不是文件".to_string());
    }

    // 确保目标目录存在
    if let Some(parent) = dest_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| format!("创建目标目录失败: {}", e))?;
        }
    }

    // 处理目标文件已存在的情况
    if dest_path.exists() {
        if overwrite {
            fs::remove_file(dest_path).map_err(|e| format!("删除目标文件失败: {}", e))?;
        } else {
            return Err("目标文件已存在".to_string());
        }
    }

    // 复制文件
    fs::copy(src_path, dest_path).map_err(|e| format!("复制文件失败: {}", e))?;

    Ok(())
}

// 重命名文件
#[tauri::command]
async fn rename_file(path: String, new_name: String) -> Result<String, String> {
    let old_path = Path::new(&path);

    if !old_path.exists() {
        return Err("文件不存在".to_string());
    }

    if !old_path.is_file() {
        return Err("路径不是文件".to_string());
    }

    // 获取父目录和新路径
    let parent = old_path.parent().unwrap_or(Path::new(""));
    let new_path = parent.join(&new_name);

    // 检查新路径是否已存在
    if new_path.exists() {
        return Err("目标文件名已存在".to_string());
    }

    // 重命名
    fs::rename(old_path, &new_path).map_err(|e| format!("重命名失败: {}", e))?;

    Ok(new_path.to_string_lossy().to_string())
}

// 创建目录（递归）
#[tauri::command]
async fn create_directory(path: String) -> Result<(), String> {
    let dir_path = Path::new(&path);

    if dir_path.exists() {
        return Err("目录已存在".to_string());
    }

    fs::create_dir_all(dir_path).map_err(|e| format!("创建目录失败: {}", e))?;

    Ok(())
}

// 删除目录
#[tauri::command]
async fn delete_directory(path: String, recursive: bool) -> Result<(), String> {
    let dir_path = Path::new(&path);

    if !dir_path.exists() {
        return Err("目录不存在".to_string());
    }

    if !dir_path.is_dir() {
        return Err("路径不是目录".to_string());
    }

    if recursive {
        fs::remove_dir_all(dir_path).map_err(|e| format!("删除目录失败: {}", e))?;
    } else {
        // 非递归删除，检查目录是否为空
        let is_empty = fs::read_dir(dir_path)
            .map(|entries| entries.count() == 0)
            .unwrap_or(false);

        if !is_empty {
            return Err("目录不为空，需要递归删除".to_string());
        }

        fs::remove_dir(dir_path).map_err(|e| format!("删除目录失败: {}", e))?;
    }

    Ok(())
}

// 列出目录内容
#[tauri::command]
async fn list_directory(path: String) -> Result<DirectoryContents, String> {
    let dir_path = Path::new(&path);

    if !dir_path.exists() {
        return Err("目录不存在".to_string());
    }

    if !dir_path.is_dir() {
        return Err("路径不是目录".to_string());
    }

    let mut files = vec![];
    let mut directories = vec![];

    if let Ok(entries) = fs::read_dir(dir_path) {
        for entry in entries.filter_map(|e| e.ok()) {
            let entry_path = entry.path();

            if entry_path.is_file() {
                let name = entry_path.file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_default();

                let extension = entry_path.extension()
                    .map(|e| e.to_string_lossy().to_string())
                    .unwrap_or_default();

                let size = entry.metadata()
                    .map(|m| m.len())
                    .unwrap_or(0);

                let modified_time = entry.metadata()
                    .and_then(|m| m.modified())
                    .map(|t| {
                        let datetime: chrono::DateTime<chrono::Utc> = t.into();
                        datetime.to_rfc3339()
                    })
                    .unwrap_or_default();

                files.push(FileInfo {
                    name,
                    path: entry_path.to_string_lossy().to_string(),
                    extension,
                    size,
                    modified_time,
                });
            } else if entry_path.is_dir() {
                let name = entry_path.file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_default();

                directories.push(DirectoryInfo {
                    name,
                    path: entry_path.to_string_lossy().to_string(),
                });
            }
        }
    }

    Ok(DirectoryContents { files, directories })
}

// 检查文件/目录是否存在
#[tauri::command]
async fn file_exists(path: String) -> Result<bool, String> {
    Ok(Path::new(&path).exists())
}

// 扫描待整理目录（递归）
#[tauri::command]
async fn scan_pending_directory(path: String, max_depth: u32) -> Result<Vec<PendingFileInfo>, String> {
    let dir_path = Path::new(&path);

    if !dir_path.exists() {
        return Err("目录不存在".to_string());
    }

    if !dir_path.is_dir() {
        return Err("路径不是目录".to_string());
    }

    let mut files = vec![];
    scan_directory_recursive(dir_path, 0, max_depth, &mut files);

    Ok(files)
}

// 递归扫描目录
fn scan_directory_recursive(dir: &Path, current_depth: u32, max_depth: u32, files: &mut Vec<PendingFileInfo>) {
    if current_depth > max_depth {
        return;
    }

    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.filter_map(|e| e.ok()) {
            let entry_path = entry.path();

            if entry_path.is_file() {
                let name = entry_path.file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_default();

                let extension = entry_path.extension()
                    .map(|e| e.to_string_lossy().to_string())
                    .unwrap_or_default();

                let size = entry.metadata()
                    .map(|m| m.len())
                    .unwrap_or(0);

                let parent_directory = entry_path.parent()
                    .map(|p| p.to_string_lossy().to_string())
                    .unwrap_or_default();

                let modified_time = entry.metadata()
                    .and_then(|m| m.modified())
                    .map(|t| {
                        let datetime: chrono::DateTime<chrono::Utc> = t.into();
                        datetime.to_rfc3339()
                    })
                    .unwrap_or_default();

                files.push(PendingFileInfo {
                    name,
                    path: entry_path.to_string_lossy().to_string(),
                    extension,
                    size,
                    parent_directory,
                    modified_time,
                });
            } else if entry_path.is_dir() {
                // 递归扫描子目录
                scan_directory_recursive(&entry_path, current_depth + 1, max_depth, files);
            }
        }
    }
}

// 批量移动文件
#[tauri::command]
async fn batch_move_files(app: tauri::AppHandle, operations: Vec<FileMoveOperation>) -> Result<BatchOperationResult, String> {
    let operation_id = format!("op_{}", Utc::now().timestamp());

    let mut success_count = 0u32;
    let mut failed_count = 0u32;
    let mut errors = vec![];

    // Clone operations for logging before iterating
    let operations_clone = operations.clone();

    for op in operations {
        let result = if op.operation_type == "copy" {
            copy_file(op.source.clone(), op.destination.clone(), false).await
        } else {
            move_file(op.source.clone(), op.destination.clone(), false).await
        };

        match result {
            Ok(_) => success_count += 1,
            Err(e) => {
                failed_count += 1;
                errors.push(format!("{} -> {}: {}", op.source, op.destination, e));
            }
        }
    }

    // 记录操作日志
    let log = OperationLog {
        id: operation_id.clone(),
        timestamp: Utc::now().to_rfc3339(),
        operations: operations_clone,
        status: if failed_count == 0 { "completed" } else { "partial" }.to_string(),
    };

    save_operation_log(app, log).await?;

    Ok(BatchOperationResult {
        operation_id,
        success_count,
        failed_count,
        errors,
    })
}

// 操作日志结构
#[derive(Serialize, Deserialize)]
struct OperationLog {
    id: String,
    timestamp: String,
    operations: Vec<FileMoveOperation>,
    status: String,
}

// 保存操作日志
async fn save_operation_log(app: tauri::AppHandle, log: OperationLog) -> Result<(), String> {
    let config_dir = app.path().app_data_dir()
        .map_err(|e| format!("获取应用目录失败: {}", e))?;

    let logs_path = config_dir.join("operation_logs.json");

    // 加载现有日志
    let mut logs: Vec<OperationLog> = if logs_path.exists() {
        let content = fs::read_to_string(&logs_path)
            .map_err(|e| format!("读取日志失败: {}", e))?;
        serde_json::from_str(&content)
            .map_err(|e| format!("解析日志失败: {}", e))?
    } else {
        vec![]
    };

    // 添加新日志
    logs.push(log);

    // 保存日志
    let content = serde_json::to_string_pretty(&logs)
        .map_err(|e| format!("序列化日志失败: {}", e))?;
    fs::write(&logs_path, content)
        .map_err(|e| format!("写入日志失败: {}", e))?;

    Ok(())
}

// 加载操作日志
async fn load_operation_logs(app: tauri::AppHandle) -> Result<Vec<OperationLog>, String> {
    let config_dir = app.path().app_data_dir()
        .map_err(|e| format!("获取应用目录失败: {}", e))?;

    let logs_path = config_dir.join("operation_logs.json");

    if !logs_path.exists() {
        return Ok(vec![]);
    }

    let content = fs::read_to_string(&logs_path)
        .map_err(|e| format!("读取日志失败: {}", e))?;
    let logs: Vec<OperationLog> = serde_json::from_str(&content)
        .map_err(|e| format!("解析日志失败: {}", e))?;

    Ok(logs)
}

// 获取操作历史
#[tauri::command]
async fn get_operation_history(app: tauri::AppHandle) -> Result<Vec<OperationLog>, String> {
    load_operation_logs(app).await
}

// 撤销批量操作
#[tauri::command]
async fn undo_batch_operation(app: tauri::AppHandle, operation_id: String) -> Result<(), String> {
    let logs = load_operation_logs(app.clone()).await?;

    // 找到对应的操作日志
    let log = logs.iter().find(|l| l.id == operation_id)
        .ok_or("找不到操作记录".to_string())?;

    if log.status == "undone" {
        return Err("操作已撤销".to_string());
    }

    // 执行反向操作（将文件移回原位置）
    for op in &log.operations {
        if op.operation_type == "move" {
            // 反向移动：destination -> source
            let result = move_file(op.destination.clone(), op.source.clone(), true).await;
            if let Err(e) = result {
                // 继续尝试其他操作，但记录错误
                eprintln!("撤销失败: {} -> {}: {}", op.destination, op.source, e);
            }
        }
        // copy 操作不撤销（源文件还在）
    }

    // 更新日志状态
    let config_dir = app.path().app_data_dir()
        .map_err(|e| format!("获取应用目录失败: {}", e))?;
    let logs_path = config_dir.join("operation_logs.json");

    let mut updated_logs = logs;
    for l in updated_logs.iter_mut() {
        if l.id == operation_id {
            l.status = "undone".to_string();
        }
    }

    let content = serde_json::to_string_pretty(&updated_logs)
        .map_err(|e| format!("序列化日志失败: {}", e))?;
    fs::write(&logs_path, content)
        .map_err(|e| format!("写入日志失败: {}", e))?;

    Ok(())
}

// ========== 目录扫描 ==========

#[derive(Serialize, Deserialize)]
struct ScannedProduct {
    name: String,
    path: String,
    folders: Vec<ScannedFolder>,
}

#[derive(Serialize, Deserialize)]
struct ScannedProject {
    name: String,
    year: String,
    province: String,
    path: String,
    folders: Vec<ScannedFolder>,
}

#[derive(Serialize, Deserialize)]
struct ScannedFolder {
    name: String,
    path: String,
    file_count: usize,
}

// 扫描产品目录
#[tauri::command]
async fn scan_products(base_path: String) -> Result<Vec<ScannedProduct>, String> {
    let products_dir = PathBuf::from(&base_path).join("产品");

    if !products_dir.exists() {
        return Ok(vec![]);
    }

    let mut products = vec![];

    // 遍历产品目录
    if let Ok(entries) = fs::read_dir(&products_dir) {
        for entry in entries.filter_map(|e| e.ok()) {
            let path = entry.path();
            if path.is_dir() {
                let name = path.file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_default();

                // 扫描产品下的文件夹
                let folders = scan_folders(&path);

                products.push(ScannedProduct {
                    name,
                    path: path.to_string_lossy().to_string(),
                    folders,
                });
            }
        }
    }

    Ok(products)
}

// 扫描项目目录
#[tauri::command]
async fn scan_projects(base_path: String) -> Result<Vec<ScannedProject>, String> {
    let projects_dir = PathBuf::from(&base_path).join("项目");

    if !projects_dir.exists() {
        return Ok(vec![]);
    }

    let mut projects = vec![];

    // 遍历年份目录
    if let Ok(year_entries) = fs::read_dir(&projects_dir) {
        for year_entry in year_entries.filter_map(|e| e.ok()) {
            let year_path = year_entry.path();
            if year_path.is_dir() {
                let year = year_path.file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_default();

                // 遍历网省目录
                if let Ok(province_entries) = fs::read_dir(&year_path) {
                    for province_entry in province_entries.filter_map(|e| e.ok()) {
                        let province_path = province_entry.path();
                        if province_path.is_dir() {
                            let province = province_path.file_name()
                                .map(|n| n.to_string_lossy().to_string())
                                .unwrap_or_default();

                            // 遍历项目目录
                            if let Ok(project_entries) = fs::read_dir(&province_path) {
                                for project_entry in project_entries.filter_map(|e| e.ok()) {
                                    let project_path = project_entry.path();
                                    if project_path.is_dir() {
                                        let name = project_path.file_name()
                                            .map(|n| n.to_string_lossy().to_string())
                                            .unwrap_or_default();

                                        let folders = scan_folders(&project_path);

                                        projects.push(ScannedProject {
                                            name,
                                            year: year.clone(),
                                            province: province.clone(),
                                            path: project_path.to_string_lossy().to_string(),
                                            folders,
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(projects)
}

// 扫描文件夹及其文件数量
fn scan_folders(dir: &PathBuf) -> Vec<ScannedFolder> {
    let mut folders = vec![];

    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.filter_map(|e| e.ok()) {
            let path = entry.path();
            if path.is_dir() {
                let name = path.file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_default();

                // 计算文件数量
                let file_count = count_files_in_dir(&path);

                folders.push(ScannedFolder {
                    name,
                    path: path.to_string_lossy().to_string(),
                    file_count,
                });
            }
        }
    }

    folders
}

// 计算目录中的文件数量
fn count_files_in_dir(dir: &PathBuf) -> usize {
    if let Ok(entries) = fs::read_dir(dir) {
        entries.filter_map(|e| e.ok()).filter(|e| e.path().is_file()).count()
    } else {
        0
    }
}

// ========== 配置文件持久化 ==========

#[derive(Serialize, Deserialize)]
struct AppConfig {
    base_path: String,
    default_folders: Vec<String>,
}

#[derive(Serialize, Deserialize)]
struct ProductConfig {
    id: String,
    name: String,
    color: String,
    start_year: String,
    end_year: Option<String>,
    description: Option<String>,
    visible: bool,
    created_at: String,
    updated_at: String,
}

#[derive(Serialize, Deserialize)]
struct ProjectConfig {
    id: String,
    name: String,
    province: String,
    year: String,
    color: String,
    visible: bool,
    full_path: String,
    product_id: Option<String>,
    project_type: String,
    created_at: String,
    updated_at: String,
}

#[derive(Serialize, Deserialize)]
struct UiState {
    selected_product_id: Option<String>,
    focused_project_id: Option<String>,
    view_type: Option<String>,
}

#[derive(Serialize, Deserialize)]
struct QuickTaskConfig {
    id: String,
    title: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    description: Option<String>,
    status: String,
    priority: String,
    created_at: String,
    updated_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    due_date: Option<String>,
    records: Vec<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    linked_product_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    linked_project_id: Option<String>,
    tags: Vec<String>,
}

#[derive(Serialize, Deserialize)]
struct WorkHubConfig {
    version: String,
    last_updated: String,
    app_config: AppConfig,
    products: Vec<ProductConfig>,
    projects: Vec<ProjectConfig>,
    quick_tasks: Vec<QuickTaskConfig>,
    #[serde(skip_serializing_if = "Option::is_none")]
    ui_state: Option<UiState>,
}

// 获取配置文件路径
#[tauri::command]
async fn get_config_path(app: tauri::AppHandle) -> Result<String, String> {
    let config_dir = app.path().app_data_dir()
        .map_err(|e| format!("获取应用目录失败: {}", e))?;
    Ok(config_dir.join("workhub-config.json").to_string_lossy().to_string())
}

// 加载配置
#[tauri::command]
async fn load_config(app: tauri::AppHandle) -> Result<WorkHubConfig, String> {
    let config_path = get_config_path(app).await?;
    let path = PathBuf::from(&config_path);

    if !path.exists() {
        // 返回默认配置
        return Ok(WorkHubConfig {
            version: "1.0".to_string(),
            last_updated: Utc::now().to_rfc3339(),
            app_config: AppConfig {
                base_path: "D:/WorkDocuments".to_string(),
                default_folders: vec!["汇报材料".to_string(), "申报材料".to_string(), "历史文件".to_string()],
            },
            products: vec![],
            projects: vec![],
            quick_tasks: vec![],
            ui_state: None,
        });
    }

    let content = fs::read_to_string(&path)
        .map_err(|e| format!("读取配置失败: {}", e))?;
    let config: WorkHubConfig = serde_json::from_str(&content)
        .map_err(|e| format!("解析配置失败: {}", e))?;
    Ok(config)
}

// 保存配置
#[tauri::command]
async fn save_config(app: tauri::AppHandle, config: WorkHubConfig) -> Result<(), String> {
    let config_path = get_config_path(app).await?;
    let path = PathBuf::from(&config_path);

    // 确保目录存在
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("创建目录失败: {}", e))?;
        }
    }

    let content = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("序列化配置失败: {}", e))?;
    fs::write(&path, content)
        .map_err(|e| format!("写入配置失败: {}", e))?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            open_file,
            read_file_content,
            write_file_content,
            create_document,
            delete_file,
            get_config_path,
            load_config,
            save_config,
            scan_products,
            scan_projects,
            // 文件整理相关命令
            move_file,
            copy_file,
            rename_file,
            create_directory,
            delete_directory,
            list_directory,
            file_exists,
            scan_pending_directory,
            batch_move_files,
            get_operation_history,
            undo_batch_operation
        ])
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            window.set_title("WorkHub").unwrap();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}