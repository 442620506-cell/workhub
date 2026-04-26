import React, { useState } from 'react'
import './ModelConfig.css'

interface ModelConfig {
  provider: 'openai' | 'anthropic' | 'custom'
  apiKey: string
  baseUrl: string
  model: string
}

function ModelConfig() {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState<ModelConfig>({
    provider: 'openai',
    apiKey: '',
    baseUrl: '',
    model: 'gpt-4'
  })

  const handleSave = () => {
    // TODO: 保存配置到本地存储
    localStorage.setItem('modelConfig', JSON.stringify(config))
    setIsOpen(false)
    console.log('模型配置已保存:', config)
  }

  if (!isOpen) return null

  return (
    <div className="model-config-overlay">
      <div className="model-config-modal">
        <div className="modal-header">
          <h2>模型配置</h2>
          <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
        </div>

        <div className="modal-content">
          <div className="config-section">
            <label className="config-label">模型服务商</label>
            <select
              className="config-select"
              value={config.provider}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                provider: e.target.value as ModelConfig['provider'],
                model: e.target.value === 'openai' ? 'gpt-4' : e.target.value === 'anthropic' ? 'claude-3-opus' : ''
              }))}
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="custom">自定义</option>
            </select>
          </div>

          <div className="config-section">
            <label className="config-label">API Key</label>
            <input
              type="password"
              className="config-input"
              placeholder="请输入 API Key"
              value={config.apiKey}
              onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
            />
          </div>

          {config.provider === 'custom' && (
            <div className="config-section">
              <label className="config-label">Base URL</label>
              <input
                type="text"
                className="config-input"
                placeholder="例如: https://api.example.com/v1"
                value={config.baseUrl}
                onChange={(e) => setConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
              />
            </div>
          )}

          <div className="config-section">
            <label className="config-label">模型名称</label>
            {config.provider === 'custom' ? (
              <input
                type="text"
                className="config-input"
                placeholder="请输入模型名称"
                value={config.model}
                onChange={(e) => setConfig(prev => ({ ...prev, model: e.target.value }))}
              />
            ) : (
              <select
                className="config-select"
                value={config.model}
                onChange={(e) => setConfig(prev => ({ ...prev, model: e.target.value }))}
              >
                {config.provider === 'openai' && (
                  <>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  </>
                )}
                {config.provider === 'anthropic' && (
                  <>
                    <option value="claude-3-opus">Claude 3 Opus</option>
                    <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                    <option value="claude-3-haiku">Claude 3 Haiku</option>
                  </>
                )}
              </select>
            )}
          </div>

          <div className="config-note">
            <p>提示：配置完成后，智能功能将使用此模型进行任务解析、内容识别等操作。</p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-default" onClick={() => setIsOpen(false)}>取消</button>
          <button className="btn btn-primary" onClick={handleSave}>保存配置</button>
        </div>
      </div>
    </div>
  )
}

export default ModelConfig