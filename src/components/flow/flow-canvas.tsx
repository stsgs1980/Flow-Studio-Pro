'use client';

import { useCallback, useRef, DragEvent } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
  Panel,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Play,
  Square,
  Save,
  Undo2,
  Redo2,
  Sparkles,
  Bot,
} from 'lucide-react';
import { useFlowStore } from '@/store/flow-store';
import { FlowNode } from './flow-node';
import type { NodeType } from '@/types/flow';

const nodeTypes = {
  flowNode: FlowNode,
};

interface FlowCanvasProps {
  onExecute: () => void;
  onSave: () => void;
}

function FlowCanvasInner({ onExecute, onSave }: FlowCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    viewport,
    setViewport,
    setSelectedNode,
    selectedNode,
    addNode,
    addEdge: addFlowEdge,
    isExecuting,
    executionStatus,
    nodeResults,
    undo,
    redo,
    history,
    toggleAssistant,
    showAssistant,
  } = useFlowStore();
  
  const [nodesState, setNodesState, onNodesChange] = useNodesState(nodes);
  const [edgesState, setEdgesState, onEdgesChange] = useEdgesState(edges);
  
  // Sync nodes with store
  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChange(changes);
      setNodes(nodesState);
    },
    [nodesState, onNodesChange, setNodes]
  );
  
  // Sync edges with store
  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesChange(changes);
      setEdges(edgesState);
    },
    [edgesState, onEdgesChange, setEdges]
  );
  
  // Handle new connections
  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = addEdge(params, edgesState)[edgesState.length];
      setEdgesState(addEdge(params, edgesState));
      if (newEdge) {
        addFlowEdge(newEdge);
      }
    },
    [edgesState, setEdgesState, addFlowEdge]
  );
  
  // Handle node selection
  const onNodeClick = useCallback(
    (_: any, node: any) => {
      setSelectedNode(node);
    },
    [setSelectedNode]
  );
  
  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);
  
  // Handle drag over
  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  
  // Handle drop
  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      
      const type = event.dataTransfer.getData('application/reactflow') as NodeType;
      
      if (!type) return;
      
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      addNode(type, position);
    },
    [screenToFlowPosition, addNode]
  );
  
  // Handle viewport change
  const onMoveEnd = useCallback(
    (_: any, viewport: any) => {
      setViewport(viewport);
    },
    [setViewport]
  );
  
  return (
    <div ref={reactFlowWrapper} className="h-full w-full">
      <ReactFlow
        nodes={nodesState}
        edges={edgesState}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onMoveEnd={onMoveEnd}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        defaultViewport={viewport}
        minZoom={0.2}
        maxZoom={2}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
        className="bg-muted/30"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        
        <Controls
          className="!bg-background !border !shadow-sm"
          showZoom={false}
          showFitView={false}
          showInteractive={false}
        />
        
        <MiniMap
          nodeColor={(node) => node.data?.color || '#6B7280'}
          maskColor="rgba(0, 0, 0, 0.1)"
          className="!bg-background !border"
        />
        
        {/* Toolbar */}
        <Panel position="top-center" className="flex items-center gap-1 bg-background border rounded-lg p-1 shadow-sm">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={undo}
                  disabled={history.past.length === 0}
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Отменить (Ctrl+Z)</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={redo}
                  disabled={history.future.length === 0}
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Повторить (Ctrl+Shift+Z)</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Separator orientation="vertical" className="h-6 mx-1" />
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isExecuting ? "destructive" : "default"}
                  size="sm"
                  className="h-8 gap-1"
                  onClick={onExecute}
                >
                  {isExecuting ? (
                    <>
                      <Square className="h-4 w-4" />
                      Стоп
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Запуск
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Выполнить поток (Ctrl+Enter)</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Separator orientation="vertical" className="h-6 mx-1" />
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onSave}
                >
                  <Save className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Сохранить поток (Ctrl+S)</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Separator orientation="vertical" className="h-6 mx-1" />
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showAssistant ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 gap-1"
                  onClick={toggleAssistant}
                >
                  <Sparkles className="h-4 w-4" />
                  Помощник
                </Button>
              </TooltipTrigger>
              <TooltipContent>Открыть помощник по потокам</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Panel>
        
        {/* Status indicator */}
        {isExecuting && (
          <Panel position="top-right" className="flex items-center gap-2">
            <Badge variant={executionStatus === 'running' ? 'default' : executionStatus === 'success' ? 'success' : 'destructive'}>
              {executionStatus === 'running' && 'Выполнение...'}
              {executionStatus === 'success' && 'Завершено'}
              {executionStatus === 'error' && 'Ошибка'}
            </Badge>
          </Panel>
        )}
        
        {/* Empty state */}
        {nodesState.length === 0 && (
          <Panel position="middle-center">
            <div className="flex flex-col items-center gap-4 p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Bot className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Начните создавать поток</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  Перетащите узлы из боковой панели или используйте помощник для создания AI-рабочего процесса
                </p>
              </div>
              <Button onClick={toggleAssistant} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Открыть помощник
              </Button>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}

export function FlowCanvas(props: FlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
