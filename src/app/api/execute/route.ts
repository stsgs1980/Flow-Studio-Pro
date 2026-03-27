import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// Type for ZAI instance
type ZAIInstance = Awaited<ReturnType<typeof ZAI.create>>;

// Node types
type NodeType = 'input' | 'output' | 'llm' | 'agent' | 'condition' | 'tool' | 'search' | 'httpRequest' | 'memory' | 'loop' | 'delay';

interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    nodeType: NodeType;
    config?: Record<string, any>;
    [key: string]: any;
  };
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

interface NodeResult {
  nodeId: string;
  nodeType: string;
  status: 'success' | 'error' | 'skipped';
  input: any;
  output: any;
  metadata: {
    duration: number;
    tokensUsed?: number;
    model?: string;
    error?: string;
  };
  timestamp: Date;
}

// Build prompt from template
function buildPromptFromTemplate(
  template: string,
  sections: Record<string, string>,
  context: string
): string {
  const templates: Record<string, (s: Record<string, string>) => string> = {
    RTF: (s) => `## Роль\n${s.role || ''}\n\n## Задача\n${s.task || ''}\n\n## Формат\n${s.format || ''}`,
    TAG: (s) => `## Задача\n${s.task || ''}\n\n## Действие\n${s.action || ''}\n\n## Цель\n${s.goal || ''}`,
    BAB: (s) => `## До\n${s.before || ''}\n\n## После\n${s.after || ''}\n\n## Мост\n${s.bridge || ''}`,
    CARE: (s) => `## Контекст\n${s.context || ''}\n\n## Действие\n${s.action || ''}\n\n## Результат\n${s.result || ''}\n\n## Пример\n${s.example || ''}`,
    RISE: (s) => `## Роль\n${s.role || ''}\n\n## Вход\n${s.input || ''}\n\n## Шаги\n${s.steps || ''}\n\n## Ожидание\n${s.expectation || ''}`,
    SOAP: (s) => `## Субъект\n${s.subject || ''}\n\n## Объект\n${s.objective || ''}\n\n## Действие\n${s.action || ''}\n\n## Продукт\n${s.product || ''}`,
    PARA: (s) => `## Проблема\n${s.problem || ''}\n\n## Анализ\n${s.analysis || ''}\n\n## Рекомендация\n${s.recommendation || ''}\n\n## Действие\n${s.action || ''}`,
    STAR: (s) => `## Ситуация\n${s.situation || ''}\n\n## Задача\n${s.task || ''}\n\n## Действие\n${s.action || ''}\n\n## Результат\n${s.result || ''}`,
    AIDA: (s) => `## Внимание\n${s.attention || ''}\n\n## Интерес\n${s.interest || ''}\n\n## Желание\n${s.desire || ''}\n\n## Действие\n${s.action || ''}`,
    CBA: (s) => `## Вызов\n${s.challenge || ''}\n\n## Барьер\n${s.barrier || ''}\n\n## Действие\n${s.action || ''}`,
    CUSTOM: (s) => `${s.system || ''}\n\n${s.context || ''}\n\n${s.instructions || ''}`,
  };
  
  const templateFunc = templates[template] || templates.CUSTOM;
  const basePrompt = templateFunc(sections);
  
  return `${basePrompt}\n\n## Контекст\n${context}`;
}

// Initialize ZAI singleton
let zaiInstance: ZAIInstance | null = null;

async function getZAI(): Promise<ZAIInstance> {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

// Execute flow
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { nodes, edges, input } = body as {
      nodes: FlowNode[];
      edges: FlowEdge[];
      input: string;
    };
    
    if (!nodes || nodes.length === 0) {
      return NextResponse.json({ error: 'В потоке нет узлов' }, { status: 400 });
    }
    
    // Build execution graph
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const outgoingEdges = new Map<string, FlowEdge[]>();
    const incomingEdges = new Map<string, FlowEdge[]>();
    
    edges.forEach((edge) => {
      if (!outgoingEdges.has(edge.source)) {
        outgoingEdges.set(edge.source, []);
      }
      outgoingEdges.get(edge.source)!.push(edge);
      
      if (!incomingEdges.has(edge.target)) {
        incomingEdges.set(edge.target, []);
      }
      incomingEdges.get(edge.target)!.push(edge);
    });
    
    // Find entry nodes (input nodes with no incoming edges)
    const entryNodes = nodes.filter(
      (n) => n.data.nodeType === 'input' || !incomingEdges.has(n.id)
    );
    
    // Results storage
    const nodeResults: Record<string, NodeResult> = {};
    const context: Record<string, any> = { input };
    
    // Get ZAI instance
    const zai = await getZAI();
    
    // Execute nodes in order
    const executedNodes = new Set<string>();
    const executeNode = async (nodeId: string): Promise<any> => {
      if (executedNodes.has(nodeId)) {
        return nodeResults[nodeId]?.output;
      }
      
      const node = nodeMap.get(nodeId);
      if (!node) return null;
      
      const nodeStartTime = Date.now();
      const nodeType = node.data.nodeType;
      const config = node.data.config || {};
      
      // Get inputs from connected nodes
      const incoming = incomingEdges.get(nodeId) || [];
      const inputs: any[] = [];
      
      for (const edge of incoming) {
        const sourceResult = await executeNode(edge.source);
        inputs.push(sourceResult);
      }
      
      // Combine inputs
      const nodeInput = inputs.length === 1 ? inputs[0] : inputs.length > 1 ? inputs : context;
      
      let output: any = null;
      let status: 'success' | 'error' = 'success';
      let error: string | undefined;
      let tokensUsed: number | undefined;
      
      try {
        switch (nodeType) {
          case 'input':
            output = input || config.defaultValue || '';
            break;
            
          case 'output':
            output = nodeInput;
            break;
            
          case 'llm': {
            const prompt = buildPromptFromTemplate(
              config.promptTemplate || 'CUSTOM',
              config.templateSections || {},
              JSON.stringify(nodeInput)
            );
            
            const model = config.model || 'gpt-4o-mini';
            
            const completion = await zai.chat.completions.create({
              messages: [
                { role: 'assistant', content: prompt },
                { role: 'user', content: typeof nodeInput === 'string' ? nodeInput : JSON.stringify(nodeInput) },
              ],
              thinking: { type: 'disabled' }
            });
            
            output = completion.choices[0]?.message?.content;
            break;
          }
          
          case 'agent': {
            const agentPrompt = buildPromptFromTemplate(
              config.promptTemplate || 'RTF',
              config.templateSections || {},
              JSON.stringify(nodeInput)
            );
            
            const role = config.agentRole || 'AI Ассистент';
            const goal = config.agentGoal || '';
            
            const systemPrompt = `Вы - ${role}. ${goal ? `Ваша цель: ${goal}` : ''}\n\n${agentPrompt}`;
            
            const completion = await zai.chat.completions.create({
              messages: [
                { role: 'assistant', content: systemPrompt },
                { role: 'user', content: typeof nodeInput === 'string' ? nodeInput : JSON.stringify(nodeInput) },
              ],
              thinking: { type: 'disabled' }
            });
            
            output = completion.choices[0]?.message?.content;
            break;
          }
          
          case 'condition': {
            const condition = config.condition || 'true';
            const conditionType = config.conditionType || 'javascript';
            
            if (conditionType === 'javascript') {
              try {
                // Simple condition evaluation
                const inputObj = typeof nodeInput === 'object' ? nodeInput : { value: nodeInput };
                output = { result: eval(condition), input: nodeInput };
              } catch {
                output = { result: true, input: nodeInput };
              }
            } else {
              // LLM-based condition
              const completion = await zai.chat.completions.create({
                messages: [
                  {
                    role: 'assistant',
                    content: 'Вы - оценщик условий. Отвечайте только "true" или "false".',
                  },
                  {
                    role: 'user',
                    content: `Оцените это условие: "${condition}"\n\nКонтекст: ${JSON.stringify(nodeInput)}`,
                  },
                ],
                thinking: { type: 'disabled' }
              });
              
              const response = completion.choices[0]?.message?.content || '';
              output = {
                result: response.toLowerCase().includes('true'),
                input: nodeInput,
              };
            }
            break;
          }
          
          case 'httpRequest': {
            const url = config.url;
            const method = config.method || 'GET';
            
            if (!url) {
              throw new Error('Узел HTTP-запроса требует URL');
            }
            
            const response = await fetch(url, {
              method,
              headers: config.headers || {},
              body: method !== 'GET' ? config.body : undefined,
            });
            
            output = await response.text();
            try {
              output = JSON.parse(output as string);
            } catch {
              // Keep as string if not JSON
            }
            break;
          }
          
          case 'search': {
            // Web search simulation - in production, use actual search API
            output = {
              query: nodeInput,
              results: [
                { title: 'Результат поиска 1', snippet: 'Это пример результата поиска...' },
                { title: 'Результат поиска 2', snippet: 'Еще один релевантный результат...' },
              ],
            };
            break;
          }
          
          case 'memory': {
            const memoryType = config.memoryType || 'context';
            // Memory node stores/retrieves context
            output = { stored: nodeInput, memoryType };
            break;
          }
          
          case 'loop': {
            output = nodeInput;
            // Loop logic would be implemented here
            break;
          }
          
          case 'delay': {
            const delayMs = config.delayMs || 1000;
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            output = nodeInput;
            break;
          }
          
          default:
            output = nodeInput;
        }
      } catch (e: any) {
        status = 'error';
        error = e.message;
        output = null;
      }
      
      const duration = Date.now() - nodeStartTime;
      
      nodeResults[nodeId] = {
        nodeId,
        nodeType,
        status,
        input: nodeInput,
        output,
        metadata: {
          duration,
          tokensUsed,
          model: config.model,
          error,
        },
        timestamp: new Date(),
      };
      
      executedNodes.add(nodeId);
      
      // Execute downstream nodes
      const outgoing = outgoingEdges.get(nodeId) || [];
      for (const edge of outgoing) {
        await executeNode(edge.target);
      }
      
      return output;
    };
    
    // Execute from entry nodes
    for (const entryNode of entryNodes) {
      await executeNode(entryNode.id);
    }
    
    // Find output node result
    const outputNodes = nodes.filter((n) => n.data.nodeType === 'output');
    const finalOutput = outputNodes.length > 0
      ? nodeResults[outputNodes[outputNodes.length - 1].id]?.output
      : nodeResults[nodes[nodes.length - 1].id]?.output;
    
    return NextResponse.json({
      output: typeof finalOutput === 'object' ? JSON.stringify(finalOutput, null, 2) : String(finalOutput || ''),
      nodeResults: Object.fromEntries(
        Object.entries(nodeResults).map(([id, result]) => [
          id,
          {
            ...result,
            timestamp: result.timestamp.toISOString(),
          },
        ])
      ),
      duration: Date.now() - startTime,
    });
    
  } catch (error: any) {
    console.error('Ошибка выполнения:', error);
    return NextResponse.json(
      { error: error.message || 'Ошибка выполнения' },
      { status: 500 }
    );
  }
}
