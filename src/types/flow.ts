import type { Node, Edge } from '@xyflow/react';

// Node Types
export type NodeType = 
  | 'input' 
  | 'output' 
  | 'llm' 
  | 'agent' 
  | 'subAgent' 
  | 'tool' 
  | 'condition' 
  | 'router' 
  | 'loop' 
  | 'delay'
  | 'memory'
  | 'variable'
  | 'template'
  | 'jsonParser'
  | 'textTransform'
  | 'merge'
  | 'httpRequest'
  | 'search';

// Node Categories
export type NodeCategory = 
  | 'input' 
  | 'output' 
  | 'processing' 
  | 'agent' 
  | 'tool' 
  | 'logic' 
  | 'memory' 
  | 'utility' 
  | 'data';

// Tool Types
export type ToolType = 'function' | 'http' | 'search' | 'calculator';

// Memory Types
export type MemoryType = 'context' | 'vector' | 'session';

// Execution Status
export type ExecutionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

// Base Node Data
export interface BaseNodeData {
  label: string;
  description?: string;
  [key: string]: unknown;
}

// Node Configurations
export interface LLMNodeConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  promptTemplate?: string;
  templateSections?: Record<string, string>;
}

export interface AgentNodeConfig {
  agentRole?: string;
  agentGoal?: string;
  agentInstructions?: string;
  tools?: Tool[];
  maxIterations?: number;
  promptTemplate?: string;
  templateSections?: Record<string, string>;
}

export interface SubAgentNodeConfig {
  subFlowId?: string;
  inputMapping?: Record<string, string>;
  outputMapping?: Record<string, string>;
}

export interface ToolNodeConfig {
  toolType: ToolType;
  toolConfig?: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    functionName?: string;
    functionCode?: string;
  };
}

export interface ConditionNodeConfig {
  condition: string;
  conditionType: 'javascript' | 'llm';
}

export interface RouterNodeConfig {
  cases: {
    id: string;
    label: string;
    pattern: string;
  }[];
  defaultOutput?: string;
}

export interface MemoryNodeConfig {
  memoryType: MemoryType;
  memoryConfig?: {
    maxSize?: number;
    ttl?: number;
    persistSession?: boolean;
  };
}

export interface InputNodeConfig {
  inputType: 'text' | 'file' | 'json' | 'api';
  placeholder?: string;
  defaultValue?: string;
}

export interface OutputNodeConfig {
  outputType: 'text' | 'file' | 'json' | 'webhook';
  format?: string;
}

export interface LoopNodeConfig {
  maxIterations: number;
  iterateOver?: string;
  condition?: string;
}

export interface DelayNodeConfig {
  delayMs: number;
}

export interface HTTPRequestNodeConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

// Tool Definition
export interface Tool {
  id: string;
  name: string;
  description: string;
  type: ToolType;
  config?: ToolNodeConfig['toolConfig'];
}

// Flow Node
export interface FlowNode extends Node {
  data: BaseNodeData & {
    config?: LLMNodeConfig | AgentNodeConfig | ToolNodeConfig | ConditionNodeConfig | RouterNodeConfig | MemoryNodeConfig | InputNodeConfig | OutputNodeConfig | SubAgentNodeConfig | LoopNodeConfig | DelayNodeConfig | HTTPRequestNodeConfig;
    status?: 'idle' | 'running' | 'success' | 'error';
    result?: unknown;
    error?: string;
  };
}

// Flow Edge
export interface FlowEdge extends Edge {
  data?: {
    label?: string;
    condition?: string;
  };
}

// Complete Flow
export interface Flow {
  id: string;
  name: string;
  description?: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  variables: Record<string, string>;
  version: number;
  isPublic: boolean;
  isTemplate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Flow Execution
export interface FlowExecution {
  id: string;
  flowId: string;
  status: ExecutionStatus;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  nodeResults: Record<string, NodeResult>;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  tokensUsed?: number;
}

// Node Execution Result
export interface NodeResult {
  nodeId: string;
  nodeType: string;
  status: 'success' | 'error' | 'skipped';
  input: unknown;
  output: unknown;
  metadata: {
    duration: number;
    tokensUsed?: number;
    model?: string;
    error?: string;
  };
  timestamp: Date;
}

// Prompt Template
export interface PromptTemplate {
  id: string;
  name: string;
  acronym: string;
  sections: {
    key: string;
    title: string;
    description: string;
    placeholder: string;
  }[];
  useCase: string;
}

// Built-in Prompt Templates (Russian)
export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'rtf',
    name: 'Роль-Задача-Формат',
    acronym: 'RTF',
    sections: [
      { key: 'role', title: 'Роль', description: 'Определите роль или персону', placeholder: 'Вы эксперт в области...' },
      { key: 'task', title: 'Задача', description: 'Какую задачу выполнить', placeholder: 'Ваша задача...' },
      { key: 'format', title: 'Формат', description: 'Формат вывода', placeholder: 'Ответьте в следующем формате...' },
    ],
    useCase: 'Общие задачи',
  },
  {
    id: 'tag',
    name: 'Задача-Действие-Цель',
    acronym: 'TAG',
    sections: [
      { key: 'task', title: 'Задача', description: 'Что нужно сделать', placeholder: 'Задача состоит в...' },
      { key: 'action', title: 'Действие', description: 'Конкретные действия', placeholder: 'Выполните следующие действия...' },
      { key: 'goal', title: 'Цель', description: 'Желаемый результат', placeholder: 'Цель заключается в...' },
    ],
    useCase: 'Анализ и принятие решений',
  },
  {
    id: 'bab',
    name: 'До-После-Мост',
    acronym: 'BAB',
    sections: [
      { key: 'before', title: 'До', description: 'Текущее состояние/проблема', placeholder: 'В данный момент ситуация такова...' },
      { key: 'after', title: 'После', description: 'Желаемое состояние', placeholder: 'После преобразования...' },
      { key: 'bridge', title: 'Мост', description: 'Как этого достичь', placeholder: 'Чтобы преодолеть разрыв...' },
    ],
    useCase: 'Трансформации',
  },
  {
    id: 'care',
    name: 'Контекст-Действие-Результат-Пример',
    acronym: 'CARE',
    sections: [
      { key: 'context', title: 'Контекст', description: 'Фоновая информация', placeholder: 'Контекст таков...' },
      { key: 'action', title: 'Действие', description: 'Что делать', placeholder: 'Выполните следующее действие...' },
      { key: 'result', title: 'Результат', description: 'Ожидаемый результат', placeholder: 'Ожидаемый результат...' },
      { key: 'example', title: 'Пример', description: 'Пример вывода', placeholder: 'Пример вывода...' },
    ],
    useCase: 'Сложные задачи',
  },
  {
    id: 'rise',
    name: 'Роль-Вход-Шаги-Ожидание',
    acronym: 'RISE',
    sections: [
      { key: 'role', title: 'Роль', description: 'Определите роль', placeholder: 'Вы...' },
      { key: 'input', title: 'Вход', description: 'Входные данные/контекст', placeholder: 'Входные данные...' },
      { key: 'steps', title: 'Шаги', description: 'Пошаговые инструкции', placeholder: '1. Первый шаг...\n2. Второй шаг...' },
      { key: 'expectation', title: 'Ожидание', description: 'Ожидаемый вывод', placeholder: 'Ожидаемый результат должен...' },
    ],
    useCase: 'Инструкции',
  },
  {
    id: 'soap',
    name: 'Субъект-Объект-Действие-Продукт',
    acronym: 'SOAP',
    sections: [
      { key: 'subject', title: 'Субъект', description: 'Предметная область', placeholder: 'Субъект...' },
      { key: 'objective', title: 'Объект', description: 'Цель или назначение', placeholder: 'Цель...' },
      { key: 'action', title: 'Действие', description: 'Действия для выполнения', placeholder: 'Выполните следующие действия...' },
      { key: 'product', title: 'Продукт', description: 'Ожидаемый результат', placeholder: 'Результат должен быть...' },
    ],
    useCase: 'Документация',
  },
  {
    id: 'para',
    name: 'Проблема-Анализ-Рекомендация-Действие',
    acronym: 'PARA',
    sections: [
      { key: 'problem', title: 'Проблема', description: 'Определите проблему', placeholder: 'Проблема заключается в...' },
      { key: 'analysis', title: 'Анализ', description: 'Проанализируйте ситуацию', placeholder: 'Анализ показывает...' },
      { key: 'recommendation', title: 'Рекомендация', description: 'Предлагаемое решение', placeholder: 'Я рекомендую...' },
      { key: 'action', title: 'Действие', description: 'Следующие шаги', placeholder: 'План действий...' },
    ],
    useCase: 'Консалтинг',
  },
  {
    id: 'star',
    name: 'Ситуация-Задача-Действие-Результат',
    acronym: 'STAR',
    sections: [
      { key: 'situation', title: 'Ситуация', description: 'Контекст/ситуация', placeholder: 'Ситуация была...' },
      { key: 'task', title: 'Задача', description: 'Поставленная задача', placeholder: 'Моей задачей было...' },
      { key: 'action', title: 'Действие', description: 'Предпринятые действия', placeholder: 'Я предпринял следующие действия...' },
      { key: 'result', title: 'Результат', description: 'Результат', placeholder: 'Результатом было...' },
    ],
    useCase: 'Достижения',
  },
  {
    id: 'aida',
    name: 'Внимание-Интерес-Желание-Действие',
    acronym: 'AIDA',
    sections: [
      { key: 'attention', title: 'Внимание', description: 'Привлечь внимание', placeholder: 'Привлекающее внимание начало...' },
      { key: 'interest', title: 'Интерес', description: 'Создать интерес', placeholder: 'Создайте интерес через...' },
      { key: 'desire', title: 'Желание', description: 'Вызвать желание', placeholder: 'Вызовите желание через...' },
      { key: 'action', title: 'Действие', description: 'Призыв к действию', placeholder: 'Призыв к действию...' },
    ],
    useCase: 'Маркетинг',
  },
  {
    id: 'cba',
    name: 'Вызов-Барьер-Действие',
    acronym: 'CBA',
    sections: [
      { key: 'challenge', title: 'Вызов', description: 'Столкнувшийся вызов', placeholder: 'Вызов состоит в...' },
      { key: 'barrier', title: 'Барьер', description: 'Встреченные препятствия', placeholder: 'Барьеры таковы...' },
      { key: 'action', title: 'Действие', description: 'Действия по преодолению', placeholder: 'Чтобы преодолеть это...' },
    ],
    useCase: 'Решение проблем',
  },
  {
    id: 'custom',
    name: 'Пользовательский шаблон',
    acronym: 'CUSTOM',
    sections: [
      { key: 'system', title: 'Системный промпт', description: 'Базовые инструкции', placeholder: 'Вы полезный помощник...' },
      { key: 'context', title: 'Контекст', description: 'Дополнительный контекст', placeholder: 'Контекстная информация...' },
      { key: 'instructions', title: 'Инструкции', description: 'Конкретные инструкции', placeholder: 'Следуйте этим инструкциям...' },
    ],
    useCase: 'Любая задача',
  },
];

// Node Template Definition
export interface NodeTemplateDefinition {
  type: NodeType;
  name: string;
  description: string;
  category: NodeCategory;
  icon: string;
  color: string;
  defaultConfig?: Record<string, unknown>;
}

// Built-in Node Templates (Russian)
export const NODE_TEMPLATES: NodeTemplateDefinition[] = [
  // Input Nodes
  { type: 'input', name: 'Ввод текста', description: 'Поле ввода текста', category: 'input', icon: 'Type', color: '#10B981' },
  
  // Output Nodes
  { type: 'output', name: 'Вывод текста', description: 'Поле вывода текста', category: 'output', icon: 'FileOutput', color: '#F59E0B' },
  
  // Processing Nodes
  { type: 'llm', name: 'LLM', description: 'Вызов языковой модели', category: 'processing', icon: 'Brain', color: '#8B5CF6' },
  { type: 'jsonParser', name: 'JSON Парсер', description: 'Парсинг и преобразование JSON', category: 'data', icon: 'Braces', color: '#6366F1' },
  { type: 'textTransform', name: 'Преобразование текста', description: 'Преобразование текстовых данных', category: 'data', icon: 'TextCursor', color: '#EC4899' },
  { type: 'merge', name: 'Слияние', description: 'Объединение нескольких входов', category: 'data', icon: 'GitMerge', color: '#14B8A6' },
  
  // Agent Nodes
  { type: 'agent', name: 'Агент', description: 'AI агент с инструментами', category: 'agent', icon: 'Bot', color: '#EF4444' },
  { type: 'subAgent', name: 'Суб-Агент', description: 'Вложенное выполнение потока', category: 'agent', icon: 'Layers', color: '#F97316' },
  
  // Tool Nodes
  { type: 'httpRequest', name: 'HTTP Запрос', description: 'Выполнение HTTP запросов', category: 'tool', icon: 'Globe', color: '#06B6D4' },
  { type: 'search', name: 'Поиск', description: 'Веб-поиск', category: 'tool', icon: 'Search', color: '#84CC16' },
  { type: 'tool', name: 'Функция', description: 'Выполнение пользовательской функции', category: 'tool', icon: 'Wrench', color: '#A855F7' },
  
  // Logic Nodes
  { type: 'condition', name: 'Условие', description: 'Условное ветвление', category: 'logic', icon: 'GitBranch', color: '#F59E0B' },
  { type: 'router', name: 'Маршрутизатор', description: 'Многопутевая маршрутизация', category: 'logic', icon: 'Route', color: '#64748B' },
  { type: 'loop', name: 'Цикл', description: 'Итеративное выполнение', category: 'logic', icon: 'Repeat', color: '#8B5CF6' },
  { type: 'delay', name: 'Задержка', description: 'Добавить задержку времени', category: 'logic', icon: 'Timer', color: '#94A3B8' },
  
  // Memory Nodes
  { type: 'memory', name: 'Память контекста', description: 'Хранение и получение контекста', category: 'memory', icon: 'Database', color: '#0EA5E9' },
  
  // Utility Nodes
  { type: 'variable', name: 'Переменная', description: 'Определить переменные', category: 'utility', icon: 'Variable', color: '#6B7280' },
  { type: 'template', name: 'Шаблон', description: 'Текстовый шаблон', category: 'utility', icon: 'FileText', color: '#9CA3AF' },
];

// Available Models
export const AVAILABLE_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic' },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic' },
  { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic' },
];

// Flow Assistant Types
export interface AssistantQuestion {
  id: string;
  question: string;
  suggestions?: string[];
  suggestionDescriptions?: Record<string, string>;
  multiSelect?: boolean;
  required?: boolean;
}

export interface AssistantStage {
  id: string;
  name: string;
  questions: AssistantQuestion[];
}

export interface AssistantState {
  currentStageIndex: number;
  currentQuestionIndex: number;
  answers: Record<string, unknown>;
  history: {
    stageId: string;
    questionId: string;
    answer: unknown;
    timestamp: Date;
  }[];
}
