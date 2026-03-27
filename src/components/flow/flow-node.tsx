'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { 
  Type, 
  FileOutput, 
  Brain, 
  Bot, 
  Layers, 
  Wrench, 
  GitBranch, 
  Route, 
  Repeat, 
  Timer,
  Database,
  Variable,
  FileText,
  Globe,
  Search,
  Braces,
  TextCursor,
  GitMerge,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import type { NodeType } from '@/types/flow';

interface FlowNodeData {
  label: string;
  nodeType: NodeType;
  description?: string;
  config?: Record<string, unknown>;
  color?: string;
  status?: 'idle' | 'running' | 'success' | 'error';
  result?: unknown;
  error?: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Type,
  FileOutput,
  Brain,
  Bot,
  Layers,
  Wrench,
  GitBranch,
  Route,
  Repeat,
  Timer,
  Database,
  Variable,
  FileText,
  Globe,
  Search,
  Braces,
  TextCursor,
  GitMerge,
};

const statusIcons = {
  idle: null,
  running: Loader2,
  success: CheckCircle2,
  error: XCircle,
};

const statusColors = {
  idle: 'text-muted-foreground',
  running: 'text-blue-500 animate-spin',
  success: 'text-green-500',
  error: 'text-red-500',
};

const nodeTypeLabels: Record<string, string> = {
  input: 'Ввод',
  output: 'Вывод',
  llm: 'LLM',
  agent: 'Агент',
  subAgent: 'Суб-агент',
  tool: 'Инструмент',
  condition: 'Условие',
  router: 'Маршрутизатор',
  loop: 'Цикл',
  delay: 'Задержка',
  memory: 'Память',
  variable: 'Переменная',
  template: 'Шаблон',
  jsonParser: 'JSON Парсер',
  textTransform: 'Преобраз. текста',
  merge: 'Слияние',
  httpRequest: 'HTTP Запрос',
  search: 'Поиск',
};

function FlowNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as FlowNodeData;
  const { label, nodeType, color, status = 'idle', error } = nodeData;
  
  const IconComponent = iconMap[nodeType] || Type;
  const StatusIcon = statusIcons[status];
  
  const hasInput = !['input'].includes(nodeType);
  const hasOutput = !['output'].includes(nodeType);
  
  // Determine if this is a condition node (has multiple outputs)
  const hasMultipleOutputs = ['condition', 'router'].includes(nodeType);
  
  return (
    <div
      className={cn(
        'relative min-w-[180px] rounded-lg border-2 bg-background shadow-sm transition-all',
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-border',
        status === 'running' && 'border-blue-500 animate-pulse',
        status === 'success' && 'border-green-500',
        status === 'error' && 'border-red-500'
      )}
      style={{ 
        borderColor: status === 'idle' ? color : undefined,
        borderTopWidth: '3px',
      }}
    >
      {/* Input Handle */}
      {hasInput && (
        <Handle
          type="target"
          position={Position.Left}
          className={cn(
            '!w-3 !h-3 !border-2 !border-background',
            '!bg-muted-foreground'
          )}
        />
      )}
      
      {/* Node Content */}
      <div className="p-3">
        <div className="flex items-center gap-2">
          <div 
            className="flex h-8 w-8 items-center justify-center rounded-md"
            style={{ backgroundColor: `${color}20` }}
          >
            <IconComponent 
              className="h-4 w-4" 
              style={{ color }} 
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium truncate">{label}</span>
              {StatusIcon && (
                <StatusIcon className={cn('h-3.5 w-3.5', statusColors[status])} />
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {nodeTypeLabels[nodeType] || nodeType}
            </span>
          </div>
        </div>
        
        {/* Error display */}
        {error && (
          <div className="mt-2 flex items-start gap-1.5 rounded bg-red-50 p-2 text-xs text-red-600">
            <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{error}</span>
          </div>
        )}
        
        {/* Config preview */}
        {nodeData.config && status === 'idle' && (
          <div className="mt-2 text-xs text-muted-foreground">
            {nodeType === 'llm' && (
              <span>{(nodeData.config as { model: string }).model || 'Модель не выбрана'}</span>
            )}
            {nodeType === 'agent' && (
              <span className="truncate block">{(nodeData.config as { agentRole: string }).agentRole || 'Роль не указана'}</span>
            )}
            {nodeType === 'condition' && (
              <code className="text-[10px] bg-muted px-1 rounded truncate block">
                {(nodeData.config as { condition: string }).condition || 'true'}
              </code>
            )}
          </div>
        )}
      </div>
      
      {/* Output Handles */}
      {hasOutput && !hasMultipleOutputs && (
        <Handle
          type="source"
          position={Position.Right}
          className={cn(
            '!w-3 !h-3 !border-2 !border-background',
            '!bg-muted-foreground'
          )}
        />
      )}
      
      {/* Multiple output handles for condition/router nodes */}
      {hasMultipleOutputs && (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            style={{ top: '30%' }}
            className={cn(
              '!w-3 !h-3 !border-2 !border-background',
              '!bg-green-500'
            )}
          />
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            style={{ top: '70%' }}
            className={cn(
              '!w-3 !h-3 !border-2 !border-background',
              '!bg-red-500'
            )}
          />
          <div className="absolute right-0 top-[30%] translate-x-5 text-[10px] text-green-600 font-medium">
            Истина
          </div>
          <div className="absolute right-0 top-[70%] translate-x-5 text-[10px] text-red-600 font-medium">
            Ложь
          </div>
        </>
      )}
    </div>
  );
}

export const FlowNode = memo(FlowNodeComponent);
