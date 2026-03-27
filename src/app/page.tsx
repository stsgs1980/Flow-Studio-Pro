'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  PanelLeftClose,
  PanelLeft,
  FileCode,
  FolderOpen,
  Plus,
  ChevronDown,
  Save,
  Download,
  HelpCircle,
  Bot,
  Layers,
  Settings2,
} from 'lucide-react';
import { useFlowStore } from '@/store/flow-store';
import { FlowCanvas } from '@/components/flow/flow-canvas';
import { NodePalette } from '@/components/flow/node-palette';
import { NodeConfigPanel } from '@/components/flow/node-config-panel';
import { FlowAssistant } from '@/components/flow/flow-assistant';
import { ExecutionPanel } from '@/components/flow/execution-panel';
import { toast } from 'sonner';

// Sample flows for demo
const SAMPLE_FLOWS = [
  {
    id: 'demo-1',
    name: 'Простой Q&A Бот',
    description: 'Базовый бот для ответов на вопросы с использованием LLM',
    nodes: [
      {
        id: 'input-1',
        type: 'flowNode',
        position: { x: 100, y: 200 },
        data: {
          label: 'Вопрос пользователя',
          nodeType: 'input',
          config: { inputType: 'text', placeholder: 'Задайте вопрос...' },
          color: '#10B981',
        },
      },
      {
        id: 'llm-1',
        type: 'flowNode',
        position: { x: 350, y: 200 },
        data: {
          label: 'AI Ответ',
          nodeType: 'llm',
          config: { model: 'gpt-4o-mini', temperature: 0.7, maxTokens: 2048 },
          color: '#8B5CF6',
        },
      },
      {
        id: 'output-1',
        type: 'flowNode',
        position: { x: 600, y: 200 },
        data: {
          label: 'Ответ',
          nodeType: 'output',
          config: { outputType: 'text' },
          color: '#F59E0B',
        },
      },
    ],
    edges: [
      { id: 'e1', source: 'input-1', target: 'llm-1' },
      { id: 'e2', source: 'llm-1', target: 'output-1' },
    ],
  },
  {
    id: 'demo-2',
    name: 'Агент с поиском',
    description: 'AI агент, который может искать информацию в интернете',
    nodes: [
      {
        id: 'input-1',
        type: 'flowNode',
        position: { x: 100, y: 200 },
        data: {
          label: 'Запрос пользователя',
          nodeType: 'input',
          config: { inputType: 'text' },
          color: '#10B981',
        },
      },
      {
        id: 'agent-1',
        type: 'flowNode',
        position: { x: 350, y: 200 },
        data: {
          label: 'Исследовательский агент',
          nodeType: 'agent',
          config: { agentRole: 'Исследовательский помощник', model: 'gpt-4o' },
          color: '#EF4444',
        },
      },
      {
        id: 'search-1',
        type: 'flowNode',
        position: { x: 350, y: 400 },
        data: {
          label: 'Веб-поиск',
          nodeType: 'search',
          config: { maxResults: 5 },
          color: '#84CC16',
        },
      },
      {
        id: 'output-1',
        type: 'flowNode',
        position: { x: 600, y: 200 },
        data: {
          label: 'Ответ',
          nodeType: 'output',
          config: { outputType: 'text' },
          color: '#F59E0B',
        },
      },
    ],
    edges: [
      { id: 'e1', source: 'input-1', target: 'agent-1' },
      { id: 'e2', source: 'agent-1', target: 'search-1' },
      { id: 'e3', source: 'agent-1', target: 'output-1' },
    ],
  },
];

export default function FlowStudioPro() {
  const {
    flowId,
    flowName,
    flowDescription,
    isDirty,
    nodes,
    edges,
    setFlowName,
    setFlowDescription,
    setDirty,
    loadFlow,
    newFlow,
    clearFlow,
    isExecuting,
    setExecuting,
    setExecutionStatus,
    setNodeResult,
    clearNodeResults,
    setExecutionOutput,
    setExecutionError,
    executionInput,
    sidebarCollapsed,
    toggleSidebar,
    showAssistant,
    toggleAssistant,
    selectedNode,
    showConfigPanel,
  } = useFlowStore();
  
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [savedFlows, setSavedFlows] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [draggedNodeType, setDraggedNodeType] = useState<string | null>(null);
  
  // Load saved flows from API
  const loadSavedFlows = useCallback(async () => {
    try {
      const response = await fetch('/api/flows');
      if (response.ok) {
        const flows = await response.json();
        setSavedFlows(flows);
      }
    } catch (error) {
      console.error('Failed to load flows:', error);
    }
  }, []);
  
  useEffect(() => {
    loadSavedFlows();
  }, [loadSavedFlows]);
  
  // Handle save
  const handleSave = useCallback(async () => {
    if (!flowName.trim()) {
      setSaveDialogOpen(true);
      return;
    }
    
    setIsSaving(true);
    try {
      const flowData = {
        id: flowId,
        name: flowName,
        description: flowDescription,
        nodes: JSON.stringify(nodes),
        edges: JSON.stringify(edges),
      };
      
      const response = await fetch('/api/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flowData),
      });
      
      if (response.ok) {
        const savedFlow = await response.json();
        if (!flowId) {
          loadFlow({
            id: savedFlow.id,
            name: savedFlow.name,
            description: savedFlow.description || '',
            nodes,
            edges,
          });
        }
        setDirty(false);
        toast.success('Поток успешно сохранен');
        loadSavedFlows();
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast.error('Не удалось сохранить поток');
    } finally {
      setIsSaving(false);
    }
  }, [flowId, flowName, flowDescription, nodes, edges, loadFlow, setDirty]);
  
  // Handle execute
  const handleExecute = useCallback(async () => {
    if (isExecuting) {
      setExecuting(false);
      return;
    }
    
    // Find input and output nodes
    const inputNodes = nodes.filter((n: any) => n.data?.nodeType === 'input');
    const outputNodes = nodes.filter((n: any) => n.data?.nodeType === 'output');
    
    if (inputNodes.length === 0) {
      toast.error('Добавьте узел ввода в ваш поток');
      return;
    }
    
    if (outputNodes.length === 0) {
      toast.error('Добавьте узел вывода в ваш поток');
      return;
    }
    
    setExecuting(true);
    setExecutionStatus('running');
    clearNodeResults();
    setExecutionError(null);
    setExecutionOutput('');
    
    try {
      // Build execution request
      const executionData = {
        flowId,
        nodes,
        edges,
        input: executionInput,
      };
      
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(executionData),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setExecutionOutput(result.output);
        setExecutionStatus('success');
        
        // Set node results for trace
        if (result.nodeResults) {
          Object.entries(result.nodeResults).forEach(([nodeId, nodeResult]: [string, any]) => {
            setNodeResult(nodeId, nodeResult);
          });
        }
        
        toast.success('Поток успешно выполнен');
      } else {
        throw new Error(result.error || 'Execution failed');
      }
    } catch (error: any) {
      setExecutionError(error.message);
      setExecutionStatus('error');
      toast.error('Ошибка выполнения потока');
    } finally {
      setExecuting(false);
    }
  }, [isExecuting, nodes, edges, flowId, executionInput, setExecuting, setExecutionStatus, clearNodeResults, setExecutionOutput, setExecutionError, setNodeResult]);
  
  // Handle new flow
  const handleNewFlow = useCallback(() => {
    if (isDirty) {
      // Could show confirmation dialog here
    }
    newFlow();
    toast.success('Создан новый поток');
  }, [isDirty, newFlow]);
  
  // Handle load flow
  const handleLoadFlow = useCallback((flow: any) => {
    loadFlow({
      id: flow.id,
      name: flow.name,
      description: flow.description || '',
      nodes: typeof flow.nodes === 'string' ? JSON.parse(flow.nodes) : flow.nodes,
      edges: typeof flow.edges === 'string' ? JSON.parse(flow.edges) : flow.edges,
    });
    setLoadDialogOpen(false);
    toast.success(`Загружен поток: ${flow.name}`);
  }, [loadFlow]);
  
  // Handle load sample
  const handleLoadSample = useCallback((sample: typeof SAMPLE_FLOWS[0]) => {
    loadFlow({
      id: sample.id,
      name: sample.name,
      description: sample.description,
      nodes: sample.nodes,
      edges: sample.edges,
    });
    toast.success(`Загружен пример: ${sample.name}`);
  }, [loadFlow]);
  
  // Handle export
  const handleExport = useCallback(() => {
    const flowData = {
      name: flowName,
      description: flowDescription,
      nodes,
      edges,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(flowData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${flowName.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Поток экспортирован');
  }, [flowName, flowDescription, nodes, edges]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleExecute();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleAssistant();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleExecute, toggleAssistant]);
  
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-12 border-b flex items-center justify-between px-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleSidebar}
          >
            {sidebarCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
          
          <div className="flex items-center gap-1.5">
            <Bot className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">Flow Studio Pro</span>
          </div>
          
          <Separator orientation="vertical" className="h-6 mx-2" />
          
          <div className="flex items-center gap-1">
            <Input
              value={flowName}
              onChange={(e) => {
                setFlowName(e.target.value);
                setDirty(true);
              }}
              className="h-7 w-[180px] text-sm border-transparent hover:border-input focus:border-input bg-transparent"
            />
            {isDirty && (
              <Badge variant="secondary" className="text-[10px] px-1.5">
                Не сохранено
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1">
                <FileCode className="h-4 w-4" />
                Файл
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleNewFlow}>
                <Plus className="h-4 w-4 mr-2" />
                Новый поток
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSaveDialogOpen(true)}>
                <Save className="h-4 w-4 mr-2" />
                Сохранить как...
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLoadDialogOpen(true)}>
                <FolderOpen className="h-4 w-4 mr-2" />
                Открыть...
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Экспорт JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1">
                <Layers className="h-4 w-4" />
                Примеры
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {SAMPLE_FLOWS.map((sample) => (
                <DropdownMenuItem
                  key={sample.id}
                  onClick={() => handleLoadSample(sample)}
                >
                  <div className="flex flex-col">
                    <span>{sample.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {sample.description}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={toggleAssistant}
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Помощник по потокам (Ctrl+K)</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </header>
      
      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Sidebar - Node Palette */}
          {!sidebarCollapsed && (
            <>
              <ResizablePanel defaultSize={18} minSize={15} maxSize={25}>
                <div className="h-full border-r bg-muted/30">
                  <div className="h-10 border-b flex items-center px-3">
                    <span className="text-sm font-medium">Узлы</span>
                  </div>
                  <NodePalette onDragStart={setDraggedNodeType} />
                </div>
              </ResizablePanel>
              <ResizableHandle />
            </>
          )}
          
          {/* Canvas */}
          <ResizablePanel defaultSize={showConfigPanel && selectedNode ? 55 : 82}>
            <div className="h-full flex flex-col">
              <div className="flex-1">
                <FlowCanvas onExecute={handleExecute} onSave={handleSave} />
              </div>
              
              {/* Execution Panel */}
              <div className="h-[200px] border-t">
                <ExecutionPanel onExecute={handleExecute} />
              </div>
            </div>
          </ResizablePanel>
          
          {/* Config Panel */}
          {showConfigPanel && selectedNode && (
            <>
              <ResizableHandle />
              <ResizablePanel defaultSize={27} minSize={20} maxSize={35}>
                <div className="h-full border-l bg-background">
                  <div className="h-10 border-b flex items-center justify-between px-3">
                    <div className="flex items-center gap-2">
                      <Settings2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Настройки</span>
                    </div>
                  </div>
                  <NodeConfigPanel />
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
      
      {/* Flow Assistant */}
      <FlowAssistant />
      
      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Сохранить поток</DialogTitle>
            <DialogDescription>
              Укажите название и описание для вашего потока
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название</Label>
              <Input
                id="name"
                value={flowName}
                onChange={(e) => setFlowName(e.target.value)}
                placeholder="Мой AI-поток"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={flowDescription}
                onChange={(e) => setFlowDescription(e.target.value)}
                placeholder="Что делает этот поток?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={() => {
              setSaveDialogOpen(false);
              handleSave();
            }}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Load Dialog */}
      <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Открыть поток</DialogTitle>
            <DialogDescription>
              Выберите сохраненный поток для открытия
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[300px]">
            <div className="space-y-1 p-1">
              {savedFlows.length > 0 ? (
                savedFlows.map((flow) => (
                  <button
                    key={flow.id}
                    onClick={() => handleLoadFlow(flow)}
                    className="w-full text-left p-3 rounded-lg border hover:bg-muted transition-colors"
                  >
                    <div className="font-medium">{flow.name}</div>
                    {flow.description && (
                      <div className="text-sm text-muted-foreground">
                        {flow.description}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(flow.updatedAt).toLocaleDateString('ru-RU')}
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Нет сохраненных потоков
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLoadDialogOpen(false)}>
              Отмена
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
