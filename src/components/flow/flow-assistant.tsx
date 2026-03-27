'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Bot,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Circle,
  ChevronRight,
  Loader2,
  Wand2,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import { useFlowStore } from '@/store/flow-store';
import type { NodeType } from '@/types/flow';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
}

interface Stage {
  id: string;
  name: string;
  questions: Question[];
}

interface Question {
  id: string;
  question: string;
  suggestions?: string[];
  suggestionDescriptions?: Record<string, string>;
  multiSelect?: boolean;
}

const STAGES: Stage[] = [
  {
    id: 'goal',
    name: 'Цель',
    questions: [
      {
        id: 'taskType',
        question: 'Какую задачу должен решать ваш AI-поток?',
        suggestions: [
          'Ответы на вопросы (Q&A)',
          'Генерация контента',
          'Анализ данных',
          'Автоматизация процесса',
          'Создание чат-бота',
        ],
        suggestionDescriptions: {
          'Ответы на вопросы (Q&A)': 'Создание системы, которая может отвечать на вопросы пользователей на основе предоставленного контекста',
          'Генерация контента': 'Создание статей, постов, писем или другого текстового контента',
          'Анализ данных': 'Обработка и анализ текста, чисел или документов',
          'Автоматизация процесса': 'Оптимизация повторяющихся задач с помощью AI',
          'Создание чат-бота': 'Создание разговорного AI-ассистента',
        },
      },
    ],
  },
  {
    id: 'audience',
    name: 'Аудитория',
    questions: [
      {
        id: 'audience',
        question: 'Кто будет взаимодействовать с вашим AI-потоком?',
        suggestions: [
          'Конечные пользователи (клиенты)',
          'Внутренние сотрудники',
          'Другие системы (API)',
          'Смешанная аудитория',
        ],
        suggestionDescriptions: {
          'Конечные пользователи (клиенты)': 'Внешние клиенты или пользователи вашего продукта',
          'Внутренние сотрудники': 'Члены команды внутри вашей организации',
          'Другие системы (API)': 'Автоматическая интеграция с другими приложениями',
          'Смешанная аудитория': 'Несколько типов пользователей будут взаимодействовать с системой',
        },
      },
    ],
  },
  {
    id: 'features',
    name: 'Функции',
    questions: [
      {
        id: 'features',
        question: 'Какие возможности должен иметь ваш AI-поток?',
        suggestions: [
          'Ответы на FAQ',
          'Поиск в интернете',
          'Вызов внешних API',
          'Запоминание диалога',
          'Обработка файлов',
          'Многошаговое мышление',
        ],
        suggestionDescriptions: {
          'Ответы на FAQ': 'Предоставление ответов на часто задаваемые вопросы',
          'Поиск в интернете': 'Поиск актуальной информации в интернете',
          'Вызов внешних API': 'Интеграция с внешними сервисами и инструментами',
          'Запоминание диалога': 'Сохранение контекста между несколькими взаимодействиями',
          'Обработка файлов': 'Обработка загруженных документов, изображений или других файлов',
          'Многошаговое мышление': 'Разбиение сложных задач на несколько шагов',
        },
        multiSelect: true,
      },
    ],
  },
  {
    id: 'model',
    name: 'Модель',
    questions: [
      {
        id: 'model',
        question: 'Какую AI-модель вы предпочитаете?',
        suggestions: [
          'GPT-4o (самая мощная)',
          'GPT-4o Mini (быстрая и эффективная)',
          'Claude 3.5 Sonnet (сбалансированная)',
          'Claude 3 Haiku (самая быстрая)',
          'Решу позже',
        ],
        suggestionDescriptions: {
          'GPT-4o (самая мощная)': 'Флагманская модель OpenAI, лучшая для сложных задач',
          'GPT-4o Mini (быстрая и эффективная)': 'Более быстрая и экономичная для простых задач',
          'Claude 3.5 Sonnet (сбалансированная)': 'Сбалансированная модель Anthropic для большинства случаев',
          'Claude 3 Haiku (самая быстрая)': 'Быстрые ответы для простых запросов',
          'Решу позже': 'Пропустить этот шаг и настроить позже',
        },
      },
    ],
  },
];

export function FlowAssistant() {
  const { showAssistant, toggleAssistant, nodes, setNodes, setEdges } = useFlowStore();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFlow, setGeneratedFlow] = useState(false);
  
  const currentStage = STAGES[currentStageIndex];
  const currentQuestion = currentStage?.questions[currentQuestionIndex];
  const progress = ((currentStageIndex + (currentQuestionIndex / (currentStage?.questions.length || 1))) / STAGES.length) * 100;
  
  const isLastQuestion = 
    currentStageIndex === STAGES.length - 1 && 
    currentQuestionIndex === (currentStage?.questions.length || 1) - 1;
  
  useEffect(() => {
    // Initial greeting
    if (showAssistant && messages.length === 0) {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: "Привет! Я ваш помощник по созданию потоков. Я помогу вам создать AI-поток шаг за шагом. Давайте начнем с понимания того, что вы хотите создать.",
          timestamp: new Date(),
        },
      ]);
    }
  }, [showAssistant, messages.length]);
  
  const handleSuggestionClick = (suggestion: string) => {
    if (currentQuestion?.multiSelect) {
      setSelectedSuggestions((prev) =>
        prev.includes(suggestion)
          ? prev.filter((s) => s !== suggestion)
          : [...prev, suggestion]
      );
    } else {
      setSelectedSuggestions([suggestion]);
    }
  };
  
  const handleNext = () => {
    const answer = currentQuestion?.multiSelect 
      ? selectedSuggestions 
      : (selectedSuggestions[0] || customInput);
    
    if (!answer && currentQuestion?.suggestions) return;
    
    // Save answer
    const questionId = currentQuestion?.id || '';
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: Array.isArray(answer) ? answer.join(', ') : answer,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    
    // Check if we should generate flow
    if (isLastQuestion) {
      generateFlow({ ...answers, [questionId]: answer });
      return;
    }
    
    // Move to next question
    setSelectedSuggestions([]);
    setCustomInput('');
    
    if (currentQuestionIndex < (currentStage?.questions.length || 1) - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setCurrentStageIndex((prev) => prev + 1);
      setCurrentQuestionIndex(0);
    }
    
    // Add assistant message for next question
    setTimeout(() => {
      const nextStageIndex = currentQuestionIndex < (currentStage?.questions.length || 1) - 1
        ? currentStageIndex
        : currentStageIndex + 1;
      const nextQuestionIndex = currentQuestionIndex < (currentStage?.questions.length || 1) - 1
        ? currentQuestionIndex + 1
        : 0;
      const nextStage = STAGES[nextStageIndex];
      const nextQuestion = nextStage?.questions[nextQuestionIndex];
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: nextQuestion?.question || "Давайте создадим ваш поток!",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 500);
  };
  
  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    } else if (currentStageIndex > 0) {
      setCurrentStageIndex((prev) => prev - 1);
      setCurrentQuestionIndex(STAGES[currentStageIndex - 1].questions.length - 1);
    }
    
    // Restore previous answer
    const prevStage = STAGES[currentStageIndex - (currentQuestionIndex === 0 ? 1 : 0)];
    const prevQuestionIndex = currentQuestionIndex === 0 
      ? prevStage.questions.length - 1 
      : currentQuestionIndex - 1;
    const prevQuestion = prevStage?.questions[prevQuestionIndex];
    const prevAnswer = answers[prevQuestion?.id || ''];
    
    if (Array.isArray(prevAnswer)) {
      setSelectedSuggestions(prevAnswer as string[]);
    } else if (prevAnswer) {
      setSelectedSuggestions([prevAnswer as string]);
    }
  };
  
  const generateFlow = async (allAnswers: Record<string, unknown>) => {
    setIsGenerating(true);
    
    const generatingMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Генерирую ваш AI-поток на основе ваших предпочтций...',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, generatingMessage]);
    
    // Simulate generation delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // Generate nodes based on answers
    const newNodes: any[] = [];
    const newEdges: any[] = [];
    
    let y = 100;
    
    // Always add input node
    newNodes.push({
      id: 'input-1',
      type: 'flowNode',
      position: { x: 100, y },
      data: {
        label: 'Ввод пользователя',
        nodeType: 'input',
        config: { inputType: 'text', placeholder: 'Введите ваш вопрос...' },
        color: '#10B981',
      },
    });
    y += 150;
    
    // Add LLM/Agent node based on task type
    const taskType = allAnswers.taskType as string || '';
    const model = (allAnswers.model as string || '').includes('GPT-4o Mini') 
      ? 'gpt-4o-mini' 
      : 'gpt-4o';
    
    if (taskType.includes('чат-бот') || taskType.includes('Q&A')) {
      newNodes.push({
        id: 'agent-1',
        type: 'flowNode',
        position: { x: 350, y },
        data: {
          label: 'AI Ассистент',
          nodeType: 'agent',
          config: { 
            agentRole: 'Полезный AI Ассистент',
            model,
            promptTemplate: 'rtf',
            templateSections: {
              role: 'Вы - полезный AI ассистент.',
              task: 'Помогайте пользователям с их вопросами и задачами.',
              format: 'Предоставляйте четкие, полезные ответы.',
            },
          },
          color: '#EF4444',
        },
      });
    } else {
      newNodes.push({
        id: 'llm-1',
        type: 'flowNode',
        position: { x: 350, y },
        data: {
          label: 'AI Обработка',
          nodeType: 'llm',
          config: { model, temperature: 0.7, maxTokens: 2048 },
          color: '#8B5CF6',
        },
      });
    }
    y += 150;
    
    // Add features based on answers
    const features = allAnswers.features as string[] || [];
    
    if (features.includes('Поиск в интернете')) {
      newNodes.push({
        id: 'search-1',
        type: 'flowNode',
        position: { x: 600, y },
        data: {
          label: 'Веб-поиск',
          nodeType: 'search',
          config: { maxResults: 5 },
          color: '#84CC16',
        },
      });
      y += 150;
    }
    
    if (features.includes('Вызов внешних API')) {
      newNodes.push({
        id: 'http-1',
        type: 'flowNode',
        position: { x: 600, y },
        data: {
          label: 'API Запрос',
          nodeType: 'httpRequest',
          config: { method: 'GET', url: '' },
          color: '#06B6D4',
        },
      });
      y += 150;
    }
    
    // Add output node
    newNodes.push({
      id: 'output-1',
      type: 'flowNode',
      position: { x: 850, y: 100 + (newNodes.length > 2 ? 75 : 0) },
      data: {
        label: 'Ответ',
        nodeType: 'output',
        config: { outputType: 'text' },
        color: '#F59E0B',
      },
    });
    
    // Create edges
    if (newNodes.length >= 2) {
      newEdges.push({
        id: 'e-input-llm',
        source: 'input-1',
        target: newNodes[1].id,
      });
      
      // Connect intermediate nodes
      for (let i = 2; i < newNodes.length - 1; i++) {
        newEdges.push({
          id: `e-${newNodes[i-1].id}-${newNodes[i].id}`,
          source: newNodes[i-1].id,
          target: newNodes[i].id,
        });
      }
      
      // Connect to output
      newEdges.push({
        id: `e-${newNodes[newNodes.length - 2].id}-output`,
        source: newNodes[newNodes.length - 2].id,
        target: 'output-1',
      });
    }
    
    // Set nodes and edges
    setNodes(newNodes);
    setEdges(newEdges);
    
    const completeMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: 'Готово! Я создал ваш AI-поток. Вы можете увидеть его на холсте. Настройте любой узел, нажав на него!',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, completeMessage]);
    
    setIsGenerating(false);
    setGeneratedFlow(true);
  };
  
  const handleClose = () => {
    toggleAssistant();
    // Reset state
    if (generatedFlow) {
      setCurrentStageIndex(0);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setSelectedSuggestions([]);
      setCustomInput('');
      setMessages([]);
      setGeneratedFlow(false);
    }
  };
  
  const handleStartOver = () => {
    setCurrentStageIndex(0);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setSelectedSuggestions([]);
    setCustomInput('');
    setMessages([]);
    setGeneratedFlow(false);
  };
  
  return (
    <Dialog open={showAssistant} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Помощник по потокам
          </DialogTitle>
          <DialogDescription>
            Я помогу вам создать AI-поток шаг за шагом
          </DialogDescription>
        </DialogHeader>
        
        {/* Progress */}
        <div className="px-4 py-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Прогресс</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          
          {/* Stage indicators */}
          <div className="flex items-center justify-between mt-3">
            {STAGES.map((stage, index) => (
              <div key={stage.id} className="flex items-center">
                <div className="flex items-center gap-1">
                  {index < currentStageIndex ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : index === currentStageIndex ? (
                    <Circle className="h-4 w-4 fill-primary text-primary" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={cn(
                    'text-xs',
                    index <= currentStageIndex ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {stage.name}
                  </span>
                </div>
                {index < STAGES.length - 1 && (
                  <ChevronRight className="h-3 w-3 mx-2 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>
        
        <Separator />
        
        {/* Messages */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 py-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
            
            {/* Current question suggestions */}
            {!generatedFlow && currentQuestion && (
              <div className="space-y-2">
                {currentQuestion.suggestions?.map((suggestion) => {
                  const isSelected = selectedSuggestions.includes(suggestion);
                  const description = currentQuestion.suggestionDescriptions?.[suggestion];
                  
                  return (
                    <button
                      key={suggestion}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={cn(
                        'w-full text-left p-3 rounded-lg border transition-all',
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          'h-4 w-4 rounded border flex items-center justify-center',
                          currentQuestion.multiSelect ? 'rounded-sm' : 'rounded-full',
                          isSelected && 'bg-primary border-primary'
                        )}>
                          {isSelected && (
                            <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                          )}
                        </div>
                        <span className="font-medium text-sm">{suggestion}</span>
                      </div>
                      {description && (
                        <p className="text-xs text-muted-foreground mt-1 ml-6">
                          {description}
                        </p>
                      )}
                    </button>
                  );
                })}
                
                {/* Custom input */}
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-1.5">Или введите свой ответ:</p>
                  <Textarea
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Введите ваш ответ..."
                    className="min-h-[60px] text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Actions */}
        <div className="p-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {currentStageIndex > 0 && !generatedFlow && (
                <Button variant="outline" size="sm" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Назад
                </Button>
              )}
              {generatedFlow && (
                <Button variant="outline" size="sm" onClick={handleStartOver}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Сначала
                </Button>
              )}
            </div>
            
            {!generatedFlow && (
              <Button 
                size="sm" 
                onClick={handleNext}
                disabled={(selectedSuggestions.length === 0 && !customInput) || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Генерация...
                  </>
                ) : isLastQuestion ? (
                  <>
                    <Wand2 className="h-4 w-4 mr-1" />
                    Создать поток
                  </>
                ) : (
                  <>
                    Далее
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            )}
            
            {generatedFlow && (
              <Button size="sm" onClick={handleClose}>
                Готово
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
