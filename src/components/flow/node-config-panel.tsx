'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Trash2, 
  Copy, 
  Settings2, 
  Sparkles,
  X,
} from 'lucide-react';
import { useFlowStore } from '@/store/flow-store';
import { PROMPT_TEMPLATES, AVAILABLE_MODELS } from '@/types/flow';
import type { NodeType } from '@/types/flow';

export function NodeConfigPanel() {
  const { selectedNode, updateNode, deleteNode, duplicateNode, setSelectedNode } = useFlowStore();
  
  if (!selectedNode) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
        <Settings2 className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-sm">Выберите узел для настройки его свойств</p>
      </div>
    );
  }
  
  const nodeType = selectedNode.data.nodeType as NodeType;
  const config = (selectedNode.data.config || {}) as Record<string, unknown>;
  
  const handleConfigChange = (key: string, value: unknown) => {
    updateNode(selectedNode.id, {
      config: { ...config, [key]: value },
    });
  };
  
  const handleLabelChange = (label: string) => {
    updateNode(selectedNode.id, { label });
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize">
            {nodeType.replace(/([A-Z])/g, ' $1').trim()}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => duplicateNode(selectedNode.id)}
            title="Дублировать"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => {
              deleteNode(selectedNode.id);
              setSelectedNode(null);
            }}
            title="Удалить"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setSelectedNode(null)}
            title="Закрыть"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Basic Settings */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Название</Label>
              <Input
                value={selectedNode.data.label as string || ''}
                onChange={(e) => handleLabelChange(e.target.value)}
                className="h-8"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs">Описание</Label>
              <Textarea
                value={selectedNode.data.description as string || ''}
                onChange={(e) => updateNode(selectedNode.id, { description: e.target.value })}
                className="min-h-[60px] text-sm"
                placeholder="Добавьте описание..."
              />
            </div>
          </div>
          
          <Separator />
          
          {/* Node-specific configuration */}
          {nodeType === 'input' && (
            <InputNodeConfig config={config} onChange={handleConfigChange} />
          )}
          
          {nodeType === 'output' && (
            <OutputNodeConfig config={config} onChange={handleConfigChange} />
          )}
          
          {nodeType === 'llm' && (
            <LLMNodeConfig config={config} onChange={handleConfigChange} />
          )}
          
          {nodeType === 'agent' && (
            <AgentNodeConfig config={config} onChange={handleConfigChange} />
          )}
          
          {nodeType === 'condition' && (
            <ConditionNodeConfig config={config} onChange={handleConfigChange} />
          )}
          
          {nodeType === 'httpRequest' && (
            <HTTPRequestNodeConfig config={config} onChange={handleConfigChange} />
          )}
          
          {nodeType === 'loop' && (
            <LoopNodeConfig config={config} onChange={handleConfigChange} />
          )}
          
          {nodeType === 'delay' && (
            <DelayNodeConfig config={config} onChange={handleConfigChange} />
          )}
          
          {nodeType === 'memory' && (
            <MemoryNodeConfig config={config} onChange={handleConfigChange} />
          )}
          
          {nodeType === 'variable' && (
            <VariableNodeConfig config={config} onChange={handleConfigChange} />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// Input Node Config
function InputNodeConfig({ 
  config, 
  onChange 
}: { 
  config: Record<string, unknown>; 
  onChange: (key: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Тип ввода</Label>
        <Select
          value={config.inputType as string || 'text'}
          onValueChange={(v) => onChange('inputType', v)}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Текст</SelectItem>
            <SelectItem value="json">JSON</SelectItem>
            <SelectItem value="file">Файл</SelectItem>
            <SelectItem value="api">API Триггер</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-1.5">
        <Label className="text-xs">Заполнитель</Label>
        <Input
          value={config.placeholder as string || ''}
          onChange={(e) => onChange('placeholder', e.target.value)}
          className="h-8"
          placeholder="Введите текст-заполнитель..."
        />
      </div>
      
      <div className="space-y-1.5">
        <Label className="text-xs">Значение по умолчанию</Label>
        <Textarea
          value={config.defaultValue as string || ''}
          onChange={(e) => onChange('defaultValue', e.target.value)}
          className="min-h-[80px] text-sm"
          placeholder="Введите значение по умолчанию..."
        />
      </div>
    </div>
  );
}

// Output Node Config
function OutputNodeConfig({ 
  config, 
  onChange 
}: { 
  config: Record<string, unknown>; 
  onChange: (key: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Тип вывода</Label>
        <Select
          value={config.outputType as string || 'text'}
          onValueChange={(v) => onChange('outputType', v)}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Текст</SelectItem>
            <SelectItem value="json">JSON</SelectItem>
            <SelectItem value="file">Файл</SelectItem>
            <SelectItem value="webhook">Webhook</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-1.5">
        <Label className="text-xs">Шаблон формата</Label>
        <Textarea
          value={config.format as string || ''}
          onChange={(e) => onChange('format', e.target.value)}
          className="min-h-[80px] text-sm font-mono"
          placeholder="Используйте {{переменная}} для интерполяции"
        />
      </div>
    </div>
  );
}

// LLM Node Config
function LLMNodeConfig({ 
  config, 
  onChange 
}: { 
  config: Record<string, unknown>; 
  onChange: (key: string, value: unknown) => void;
}) {
  const [activeTab, setActiveTab] = useState('basic');
  const selectedTemplate = PROMPT_TEMPLATES.find(t => t.acronym === config.promptTemplate) || PROMPT_TEMPLATES[0];
  const templateSections = (config.templateSections as Record<string, string>) || {};
  
  return (
    <div className="space-y-3">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full h-8">
          <TabsTrigger value="basic" className="text-xs flex-1">
            <Settings2 className="h-3 w-3 mr-1" />
            Основное
          </TabsTrigger>
          <TabsTrigger value="prompt" className="text-xs flex-1">
            <Sparkles className="h-3 w-3 mr-1" />
            Промпт
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-3 mt-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Модель</Label>
            <Select
              value={config.model as string || 'gpt-4o-mini'}
              onValueChange={(v) => onChange('model', v)}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_MODELS.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center gap-2">
                      <span>{model.name}</span>
                      <span className="text-xs text-muted-foreground">{model.provider}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-xs">Температура: {config.temperature as number ?? 0.7}</Label>
            <Slider
              value={[config.temperature as number ?? 0.7]}
              onValueChange={([v]) => onChange('temperature', v)}
              min={0}
              max={2}
              step={0.1}
            />
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-xs">Макс. токенов</Label>
            <Input
              type="number"
              value={config.maxTokens as number || 2048}
              onChange={(e) => onChange('maxTokens', parseInt(e.target.value) || 2048)}
              className="h-8"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="prompt" className="space-y-3 mt-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Шаблон промпта</Label>
            <Select
              value={config.promptTemplate as string || 'custom'}
              onValueChange={(v) => onChange('promptTemplate', v)}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROMPT_TEMPLATES.map((template) => (
                  <SelectItem key={template.id} value={template.acronym}>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {template.acronym}
                      </Badge>
                      <span>{template.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="text-xs text-muted-foreground">
            {selectedTemplate.useCase}
          </div>
          
          <Separator />
          
          {selectedTemplate.sections.map((section) => (
            <div key={section.key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">{section.title}</Label>
                <span className="text-[10px] text-muted-foreground">{section.description}</span>
              </div>
              <Textarea
                value={templateSections[section.key] || ''}
                onChange={(e) => onChange('templateSections', {
                  ...templateSections,
                  [section.key]: e.target.value,
                })}
                className="min-h-[60px] text-sm"
                placeholder={section.placeholder}
              />
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Agent Node Config
function AgentNodeConfig({ 
  config, 
  onChange 
}: { 
  config: Record<string, unknown>; 
  onChange: (key: string, value: unknown) => void;
}) {
  const [activeTab, setActiveTab] = useState('role');
  const selectedTemplate = PROMPT_TEMPLATES.find(t => t.acronym === config.promptTemplate) || PROMPT_TEMPLATES[0];
  const templateSections = (config.templateSections as Record<string, string>) || {};
  
  return (
    <div className="space-y-3">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full h-8">
          <TabsTrigger value="role" className="text-xs flex-1">Роль</TabsTrigger>
          <TabsTrigger value="tools" className="text-xs flex-1">Инструменты</TabsTrigger>
          <TabsTrigger value="prompt" className="text-xs flex-1">Промпт</TabsTrigger>
        </TabsList>
        
        <TabsContent value="role" className="space-y-3 mt-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Роль агента</Label>
            <Input
              value={config.agentRole as string || ''}
              onChange={(e) => onChange('agentRole', e.target.value)}
              className="h-8"
              placeholder="Напр.: Агент техподдержки"
            />
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-xs">Цель агента</Label>
            <Textarea
              value={config.agentGoal as string || ''}
              onChange={(e) => onChange('agentGoal', e.target.value)}
              className="min-h-[60px] text-sm"
              placeholder="Что должен достичь этот агент?"
            />
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-xs">Макс. итераций</Label>
            <Input
              type="number"
              value={config.maxIterations as number || 5}
              onChange={(e) => onChange('maxIterations', parseInt(e.target.value) || 5)}
              className="h-8"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="tools" className="space-y-3 mt-3">
          <div className="text-xs text-muted-foreground p-3 rounded bg-muted">
            Настройте инструменты, которые этот агент сможет использовать. Инструменты будут доступны во время выполнения.
          </div>
        </TabsContent>
        
        <TabsContent value="prompt" className="space-y-3 mt-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Шаблон промпта</Label>
            <Select
              value={config.promptTemplate as string || 'rtf'}
              onValueChange={(v) => onChange('promptTemplate', v)}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROMPT_TEMPLATES.map((template) => (
                  <SelectItem key={template.id} value={template.acronym}>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {template.acronym}
                      </Badge>
                      <span>{template.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Separator />
          
          {selectedTemplate.sections.map((section) => (
            <div key={section.key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">{section.title}</Label>
                <span className="text-[10px] text-muted-foreground">{section.description}</span>
              </div>
              <Textarea
                value={templateSections[section.key] || ''}
                onChange={(e) => onChange('templateSections', {
                  ...templateSections,
                  [section.key]: e.target.value,
                })}
                className="min-h-[60px] text-sm"
                placeholder={section.placeholder}
              />
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Condition Node Config
function ConditionNodeConfig({ 
  config, 
  onChange 
}: { 
  config: Record<string, unknown>; 
  onChange: (key: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Тип условия</Label>
        <Select
          value={config.conditionType as string || 'javascript'}
          onValueChange={(v) => onChange('conditionType', v)}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="javascript">JavaScript выражение</SelectItem>
            <SelectItem value="llm">На основе LLM</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-1.5">
        <Label className="text-xs">Выражение условия</Label>
        <Textarea
          value={config.condition as string || 'true'}
          onChange={(e) => onChange('condition', e.target.value)}
          className="min-h-[80px] text-sm font-mono"
          placeholder="напр., input.score > 0.8"
        />
        <p className="text-[10px] text-muted-foreground">
          Используйте синтаксис JavaScript. Доступ к входным данным через переменную `input`.
        </p>
      </div>
    </div>
  );
}

// HTTP Request Node Config
function HTTPRequestNodeConfig({ 
  config, 
  onChange 
}: { 
  config: Record<string, unknown>; 
  onChange: (key: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Метод</Label>
        <Select
          value={config.method as string || 'GET'}
          onValueChange={(v) => onChange('method', v)}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
            <SelectItem value="PATCH">PATCH</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-1.5">
        <Label className="text-xs">URL</Label>
        <Input
          value={config.url as string || ''}
          onChange={(e) => onChange('url', e.target.value)}
          className="h-8"
          placeholder="https://api.example.com/endpoint"
        />
      </div>
      
      <div className="space-y-1.5">
        <Label className="text-xs">Заголовки (JSON)</Label>
        <Textarea
          value={JSON.stringify(config.headers || {}, null, 2)}
          onChange={(e) => {
            try {
              onChange('headers', JSON.parse(e.target.value));
            } catch {}
          }}
          className="min-h-[60px] text-sm font-mono"
          placeholder='{"Authorization": "Bearer token"}'
        />
      </div>
      
      <div className="space-y-1.5">
        <Label className="text-xs">Тело (JSON)</Label>
        <Textarea
          value={config.body as string || ''}
          onChange={(e) => onChange('body', e.target.value)}
          className="min-h-[80px] text-sm font-mono"
          placeholder='{"key": "value"}'
        />
      </div>
    </div>
  );
}

// Loop Node Config
function LoopNodeConfig({ 
  config, 
  onChange 
}: { 
  config: Record<string, unknown>; 
  onChange: (key: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Макс. итераций</Label>
        <Input
          type="number"
          value={config.maxIterations as number || 10}
          onChange={(e) => onChange('maxIterations', parseInt(e.target.value) || 10)}
          className="h-8"
        />
      </div>
      
      <div className="space-y-1.5">
        <Label className="text-xs">Итерировать по (путь к переменной)</Label>
        <Input
          value={config.iterateOver as string || ''}
          onChange={(e) => onChange('iterateOver', e.target.value)}
          className="h-8"
          placeholder="напр., input.items"
        />
      </div>
      
      <div className="space-y-1.5">
        <Label className="text-xs">Условие выхода</Label>
        <Textarea
          value={config.condition as string || ''}
          onChange={(e) => onChange('condition', e.target.value)}
          className="min-h-[60px] text-sm font-mono"
          placeholder="напр., iteration.result !== null"
        />
      </div>
    </div>
  );
}

// Delay Node Config
function DelayNodeConfig({ 
  config, 
  onChange 
}: { 
  config: Record<string, unknown>; 
  onChange: (key: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Задержка (миллисекунды)</Label>
        <Input
          type="number"
          value={config.delayMs as number || 1000}
          onChange={(e) => onChange('delayMs', parseInt(e.target.value) || 1000)}
          className="h-8"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {config.delayMs || 1000} мс = {((config.delayMs as number || 1000) / 1000).toFixed(1)} сек
      </p>
    </div>
  );
}

// Memory Node Config
function MemoryNodeConfig({ 
  config, 
  onChange 
}: { 
  config: Record<string, unknown>; 
  onChange: (key: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Тип памяти</Label>
        <Select
          value={config.memoryType as string || 'context'}
          onValueChange={(v) => onChange('memoryType', v)}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="context">Контекстное окно</SelectItem>
            <SelectItem value="session">Сессионная память</SelectItem>
            <SelectItem value="vector">Векторное хранилище</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-1.5">
        <Label className="text-xs">Макс. размер (сообщений)</Label>
        <Input
          type="number"
          value={(config.memoryConfig as { maxSize?: number })?.maxSize || 10}
          onChange={(e) => onChange('memoryConfig', {
            ...(config.memoryConfig as object || {}),
            maxSize: parseInt(e.target.value) || 10,
          })}
          className="h-8"
        />
      </div>
    </div>
  );
}

// Variable Node Config
function VariableNodeConfig({ 
  config, 
  onChange 
}: { 
  config: Record<string, unknown>; 
  onChange: (key: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Имя переменной</Label>
        <Input
          value={config.name as string || ''}
          onChange={(e) => onChange('name', e.target.value)}
          className="h-8"
          placeholder="мояПеременная"
        />
      </div>
      
      <div className="space-y-1.5">
        <Label className="text-xs">Значение</Label>
        <Textarea
          value={config.value as string || ''}
          onChange={(e) => onChange('value', e.target.value)}
          className="min-h-[80px] text-sm"
          placeholder="Значение переменной..."
        />
      </div>
    </div>
  );
}
