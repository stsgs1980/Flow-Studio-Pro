'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Play,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Copy,
  Check,
  Terminal,
  Zap,
} from 'lucide-react';
import { useFlowStore } from '@/store/flow-store';
import type { NodeResult } from '@/types/flow';

interface ExecutionPanelProps {
  onExecute: () => void;
}

export function ExecutionPanel({ onExecute }: ExecutionPanelProps) {
  const {
    executionInput,
    setExecutionInput,
    executionOutput,
    executionStatus,
    isExecuting,
    nodeResults,
    executionError,
  } = useFlowStore();
  
  const [activeTab, setActiveTab] = useState('input');
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const nodeResultsArray = Object.entries(nodeResults);
  const successfulNodes = nodeResultsArray.filter(([, r]) => r.status === 'success').length;
  const failedNodes = nodeResultsArray.filter(([, r]) => r.status === 'error').length;
  
  return (
    <div className="h-full flex flex-col border-t bg-background">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <TabsList className="h-8">
            <TabsTrigger value="input" className="text-xs px-3">
              Ввод
            </TabsTrigger>
            <TabsTrigger value="output" className="text-xs px-3">
              Вывод
            </TabsTrigger>
            <TabsTrigger value="trace" className="text-xs px-3">
              Трассировка
              {nodeResultsArray.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
                  {nodeResultsArray.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <Button
            size="sm"
            className="h-7 gap-1"
            onClick={onExecute}
            disabled={isExecuting}
          >
            {isExecuting ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Выполнение...
              </>
            ) : (
              <>
                <Play className="h-3 w-3" />
                Выполнить
              </>
            )}
          </Button>
        </div>
        
        <TabsContent value="input" className="flex-1 m-0">
          <div className="h-full p-3">
            <Textarea
              value={executionInput}
              onChange={(e) => setExecutionInput(e.target.value)}
              placeholder="Введите входные данные для вашего потока..."
              className="h-full min-h-[120px] text-sm font-mono resize-none"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="output" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-3">
              {executionError ? (
                <div className="rounded-lg bg-destructive/10 p-3 border border-destructive/20">
                  <div className="flex items-center gap-2 text-destructive font-medium mb-2">
                    <XCircle className="h-4 w-4" />
                    Ошибка выполнения
                  </div>
                  <pre className="text-sm text-destructive/80 whitespace-pre-wrap">
                    {executionError}
                  </pre>
                </div>
              ) : executionOutput ? (
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 z-10"
                    onClick={() => handleCopy(executionOutput)}
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                  <pre className="text-sm font-mono bg-muted rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
                    {executionOutput}
                  </pre>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center text-muted-foreground">
                  <Terminal className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">Выполните поток, чтобы увидеть результат</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="trace" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-2">
              {nodeResultsArray.length > 0 ? (
                <>
                  {/* Summary */}
                  <div className="flex items-center gap-3 text-xs mb-3 pb-3 border-b">
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {successfulNodes} успешно
                    </div>
                    {failedNodes > 0 && (
                      <div className="flex items-center gap-1 text-red-600">
                        <XCircle className="h-3.5 w-3.5" />
                        {failedNodes} с ошибкой
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-muted-foreground ml-auto">
                      <Clock className="h-3.5 w-3.5" />
                      {nodeResultsArray.reduce((sum, [, r]) => sum + r.metadata.duration, 0)} мс
                    </div>
                  </div>
                  
                  {/* Node results */}
                  {nodeResultsArray.map(([nodeId, result]) => (
                    <NodeResultItem key={nodeId} result={result} />
                  ))}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center text-muted-foreground">
                  <Zap className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">Трассировка выполнения появится здесь</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NodeResultItem({ result }: { result: NodeResult }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const statusIcon = {
    success: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    error: <XCircle className="h-4 w-4 text-red-500" />,
    skipped: <Clock className="h-4 w-4 text-muted-foreground" />,
  };
  
  const statusLabel = {
    success: 'Успешно',
    error: 'Ошибка',
    skipped: 'Пропущено',
  };
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted text-left">
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          {statusIcon[result.status]}
          <div>
            <span className="text-sm font-medium">{result.nodeType}</span>
            <span className="text-xs text-muted-foreground ml-2">({result.nodeId.slice(0, 8)})</span>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px]">
          {result.metadata.duration} мс
        </Badge>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pl-10 pr-2 pb-2 space-y-2">
          {result.metadata.error && (
            <div className="rounded bg-destructive/10 p-2 text-xs text-destructive">
              {result.metadata.error}
            </div>
          )}
          
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Ввод:</span>
            <pre className="text-xs bg-muted rounded p-2 overflow-x-auto">
              {JSON.stringify(result.input, null, 2)}
            </pre>
          </div>
          
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Вывод:</span>
            <pre className="text-xs bg-muted rounded p-2 overflow-x-auto">
              {typeof result.output === 'string' 
                ? result.output 
                : JSON.stringify(result.output, null, 2)}
            </pre>
          </div>
          
          {result.metadata.tokensUsed && (
            <div className="text-xs text-muted-foreground">
              Использовано токенов: {result.metadata.tokensUsed}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
