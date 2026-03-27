'use client';

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Node, Edge, Viewport } from '@xyflow/react';
import type { 
  FlowNode, 
  FlowEdge, 
  NodeType, 
  NodeResult,
  PROMPT_TEMPLATES,
} from '@/types/flow';

interface FlowState {
  // Flow metadata
  flowId: string | null;
  flowName: string;
  flowDescription: string;
  isDirty: boolean;
  
  // Canvas state
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;
  selectedNode: Node | null;
  selectedEdge: Edge | null;
  
  // Execution state
  isExecuting: boolean;
  executionId: string | null;
  executionStatus: 'idle' | 'running' | 'success' | 'error';
  nodeResults: Record<string, NodeResult>;
  executionError: string | null;
  executionInput: string;
  executionOutput: string;
  
  // UI state
  showAssistant: boolean;
  showConfigPanel: boolean;
  showExecutionPanel: boolean;
  sidebarCollapsed: boolean;
  
  // History for undo/redo
  history: {
    past: { nodes: Node[]; edges: Edge[] }[];
    future: { nodes: Node[]; edges: Edge[] }[];
  };
  
  // Actions
  setFlowId: (id: string | null) => void;
  setFlowName: (name: string) => void;
  setFlowDescription: (description: string) => void;
  setDirty: (dirty: boolean) => void;
  
  // Node actions
  setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
  setEdges: (edges: Edge[] | ((edges: Edge[]) => Edge[])) => void;
  addNode: (type: NodeType, position: { x: number; y: number }) => void;
  updateNode: (nodeId: string, data: Partial<Node['data']>) => void;
  deleteNode: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => void;
  
  // Edge actions
  addEdge: (edge: Edge) => void;
  deleteEdge: (edgeId: string) => void;
  
  // Selection
  setSelectedNode: (node: Node | null) => void;
  setSelectedEdge: (edge: Edge | null) => void;
  
  // Viewport
  setViewport: (viewport: Viewport) => void;
  
  // Execution
  setExecuting: (executing: boolean) => void;
  setExecutionStatus: (status: 'idle' | 'running' | 'success' | 'error') => void;
  setNodeResult: (nodeId: string, result: NodeResult) => void;
  clearNodeResults: () => void;
  setExecutionError: (error: string | null) => void;
  setExecutionInput: (input: string) => void;
  setExecutionOutput: (output: string) => void;
  
  // UI Actions
  toggleAssistant: () => void;
  toggleConfigPanel: () => void;
  toggleExecutionPanel: () => void;
  toggleSidebar: () => void;
  
  // History
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
  
  // Flow management
  loadFlow: (flow: { id: string; name: string; description?: string; nodes: Node[]; edges: Edge[] }) => void;
  clearFlow: () => void;
  newFlow: () => void;
}

const getNodeDefaults = (type: NodeType): Record<string, unknown> => {
  const defaults: Record<NodeType, Record<string, unknown>> = {
    input: { inputType: 'text', placeholder: 'Enter your input...' },
    output: { outputType: 'text' },
    llm: { model: 'gpt-4o-mini', temperature: 0.7, maxTokens: 2048, promptTemplate: 'custom' },
    agent: { agentRole: 'AI Assistant', maxIterations: 5, promptTemplate: 'rtf' },
    subAgent: { subFlowId: '' },
    tool: { toolType: 'function' },
    condition: { condition: 'true', conditionType: 'javascript' },
    router: { cases: [{ id: '1', label: 'Case 1', pattern: '' }], defaultOutput: '' },
    loop: { maxIterations: 10 },
    delay: { delayMs: 1000 },
    memory: { memoryType: 'context' },
    variable: { name: '', value: '' },
    template: { template: '' },
    jsonParser: { path: '' },
    textTransform: { transform: 'trim' },
    merge: { strategy: 'concat' },
    httpRequest: { url: '', method: 'GET' },
    search: { query: '', maxResults: 5 },
  };
  return defaults[type] || {};
};

const getNodeLabel = (type: NodeType): string => {
  const labels: Record<NodeType, string> = {
    input: 'Input',
    output: 'Output',
    llm: 'LLM',
    agent: 'Agent',
    subAgent: 'Sub-Agent',
    tool: 'Tool',
    condition: 'Condition',
    router: 'Router',
    loop: 'Loop',
    delay: 'Delay',
    memory: 'Memory',
    variable: 'Variable',
    template: 'Template',
    jsonParser: 'JSON Parser',
    textTransform: 'Text Transform',
    merge: 'Merge',
    httpRequest: 'HTTP Request',
    search: 'Search',
  };
  return labels[type] || type;
};

const getNodeColor = (type: NodeType): string => {
  const colors: Record<NodeType, string> = {
    input: '#10B981',
    output: '#F59E0B',
    llm: '#8B5CF6',
    agent: '#EF4444',
    subAgent: '#F97316',
    tool: '#A855F7',
    condition: '#F59E0B',
    router: '#64748B',
    loop: '#8B5CF6',
    delay: '#94A3B8',
    memory: '#0EA5E9',
    variable: '#6B7280',
    template: '#9CA3AF',
    jsonParser: '#6366F1',
    textTransform: '#EC4899',
    merge: '#14B8A6',
    httpRequest: '#06B6D4',
    search: '#84CC16',
  };
  return colors[type] || '#6B7280';
};

export const useFlowStore = create<FlowState>((set, get) => ({
  // Initial state
  flowId: null,
  flowName: 'Untitled Flow',
  flowDescription: '',
  isDirty: false,
  
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  selectedNode: null,
  selectedEdge: null,
  
  isExecuting: false,
  executionId: null,
  executionStatus: 'idle',
  nodeResults: {},
  executionError: null,
  executionInput: '',
  executionOutput: '',
  
  showAssistant: false,
  showConfigPanel: true,
  showExecutionPanel: false,
  sidebarCollapsed: false,
  
  history: {
    past: [],
    future: [],
  },
  
  // Actions
  setFlowId: (id) => set({ flowId: id }),
  setFlowName: (name) => set({ flowName: name, isDirty: true }),
  setFlowDescription: (description) => set({ flowDescription: description, isDirty: true }),
  setDirty: (dirty) => set({ isDirty: dirty }),
  
  setNodes: (nodesOrUpdater) => {
    const currentNodes = get().nodes;
    const newNodes = typeof nodesOrUpdater === 'function' 
      ? nodesOrUpdater(currentNodes) 
      : nodesOrUpdater;
    set({ nodes: newNodes, isDirty: true });
  },
  
  setEdges: (edgesOrUpdater) => {
    const currentEdges = get().edges;
    const newEdges = typeof edgesOrUpdater === 'function' 
      ? edgesOrUpdater(currentEdges) 
      : edgesOrUpdater;
    set({ edges: newEdges, isDirty: true });
  },
  
  addNode: (type, position) => {
    const id = uuidv4();
    const newNode: Node = {
      id,
      type: 'flowNode',
      position,
      data: {
        label: getNodeLabel(type),
        nodeType: type,
        config: getNodeDefaults(type),
        color: getNodeColor(type),
        status: 'idle',
      },
    };
    set((state) => ({ 
      nodes: [...state.nodes, newNode], 
      isDirty: true 
    }));
    get().saveToHistory();
  },
  
  updateNode: (nodeId, data) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      ),
      isDirty: true,
      selectedNode: state.selectedNode?.id === nodeId 
        ? { ...state.selectedNode, data: { ...state.selectedNode.data, ...data } }
        : state.selectedNode,
    }));
  },
  
  deleteNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      edges: state.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
      selectedNode: state.selectedNode?.id === nodeId ? null : state.selectedNode,
      isDirty: true,
    }));
    get().saveToHistory();
  },
  
  duplicateNode: (nodeId) => {
    const node = get().nodes.find((n) => n.id === nodeId);
    if (!node) return;
    
    const newNode: Node = {
      ...node,
      id: uuidv4(),
      position: {
        x: node.position.x + 50,
        y: node.position.y + 50,
      },
      data: { ...node.data },
    };
    
    set((state) => ({
      nodes: [...state.nodes, newNode],
      isDirty: true,
    }));
    get().saveToHistory();
  },
  
  addEdge: (edge) => {
    set((state) => ({
      edges: [...state.edges, edge],
      isDirty: true,
    }));
    get().saveToHistory();
  },
  
  deleteEdge: (edgeId) => {
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== edgeId),
      selectedEdge: state.selectedEdge?.id === edgeId ? null : state.selectedEdge,
      isDirty: true,
    }));
    get().saveToHistory();
  },
  
  setSelectedNode: (node) => set({ selectedNode: node, selectedEdge: null }),
  setSelectedEdge: (edge) => set({ selectedEdge: edge, selectedNode: null }),
  
  setViewport: (viewport) => set({ viewport }),
  
  setExecuting: (executing) => set({ isExecuting: executing }),
  setExecutionStatus: (status) => set({ executionStatus: status }),
  setNodeResult: (nodeId, result) => {
    set((state) => ({
      nodeResults: { ...state.nodeResults, [nodeId]: result },
    }));
  },
  clearNodeResults: () => set({ nodeResults: {} }),
  setExecutionError: (error) => set({ executionError: error }),
  setExecutionInput: (input) => set({ executionInput: input }),
  setExecutionOutput: (output) => set({ executionOutput: output }),
  
  toggleAssistant: () => set((state) => ({ showAssistant: !state.showAssistant })),
  toggleConfigPanel: () => set((state) => ({ showConfigPanel: !state.showConfigPanel })),
  toggleExecutionPanel: () => set((state) => ({ showExecutionPanel: !state.showExecutionPanel })),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  
  undo: () => {
    const { history } = get();
    if (history.past.length === 0) return;
    
    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);
    
    set((state) => ({
      nodes: previous.nodes,
      edges: previous.edges,
      history: {
        past: newPast,
        future: [{ nodes: state.nodes, edges: state.edges }, ...state.history.future],
      },
    }));
  },
  
  redo: () => {
    const { history } = get();
    if (history.future.length === 0) return;
    
    const next = history.future[0];
    const newFuture = history.future.slice(1);
    
    set((state) => ({
      nodes: next.nodes,
      edges: next.edges,
      history: {
        past: [...state.history.past, { nodes: state.nodes, edges: state.edges }],
        future: newFuture,
      },
    }));
  },
  
  saveToHistory: () => {
    set((state) => ({
      history: {
        past: [...state.history.past.slice(-49), { nodes: state.nodes, edges: state.edges }],
        future: [],
      },
    }));
  },
  
  loadFlow: (flow) => {
    set({
      flowId: flow.id,
      flowName: flow.name,
      flowDescription: flow.description || '',
      nodes: flow.nodes,
      edges: flow.edges,
      isDirty: false,
      selectedNode: null,
      selectedEdge: null,
      nodeResults: {},
      history: { past: [], future: [] },
    });
  },
  
  clearFlow: () => {
    set({
      nodes: [],
      edges: [],
      selectedNode: null,
      selectedEdge: null,
      nodeResults: {},
      executionInput: '',
      executionOutput: '',
      executionError: null,
      executionStatus: 'idle',
      history: { past: [], future: [] },
    });
  },
  
  newFlow: () => {
    set({
      flowId: null,
      flowName: 'Untitled Flow',
      flowDescription: '',
      nodes: [],
      edges: [],
      isDirty: false,
      selectedNode: null,
      selectedEdge: null,
      nodeResults: {},
      executionInput: '',
      executionOutput: '',
      executionError: null,
      executionStatus: 'idle',
      history: { past: [], future: [] },
    });
  },
}));
