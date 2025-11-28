import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage } from '@/types/solar-ai-chat';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Bot, User as UserIcon, Loader2, Copy, Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onOpenTaskSelector?: () => void;
  userName?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isLoading,
  onSendMessage,
  onOpenTaskSelector,
  userName = 'User',
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (inputMessage.trim() && !isLoading) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages Area */}
      <ScrollArea className="flex-1 px-6 py-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mb-4">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Solar Engineering AI Assistant
              </h3>
              <p className="text-gray-600 max-w-lg mx-auto">
                I'm here to help you with solar PV calculations, financial analysis, and system design. 
                Select a calculation task or ask me anything about solar engineering!
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-4 group",
                  message.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                    <AvatarFallback className="avatar-bot bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={cn(
                  "flex flex-col max-w-[80%]",
                  message.role === 'user' ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "rounded-2xl px-5 py-3 shadow-sm theme-transition",
                    message.role === 'user'
                      ? "message-user bg-gradient-to-br from-blue-600 to-indigo-600 text-white"
                      : "message-assistant bg-gray-100 text-gray-900"
                  )}>
                    {message.role === 'user' ? (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-headings:text-gray-900 prose-p:text-gray-800 prose-strong:text-gray-900 prose-ul:text-gray-800 prose-ol:text-gray-800 prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1 px-2">
                    <span className="message-timestamp text-xs text-gray-500 theme-transition">
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                    {message.role === 'assistant' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => copyToClipboard(message.content, message.id)}
                      >
                        {copiedId === message.id ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {message.role === 'user' && (
                  <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                    <AvatarFallback className="avatar-user bg-gradient-to-br from-purple-500 to-pink-600 text-white text-xs font-semibold">
                      {getUserInitials(userName)}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex gap-4">
              <Avatar className="h-8 w-8 mt-1">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-gray-100 rounded-2xl px-5 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-sm text-gray-600">Analyzing and calculating...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="chat-input-area border-t bg-white px-6 py-4 theme-transition">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask me about solar calculations, financial analysis, system sizing..."
                className="chat-textarea min-h-[52px] max-h-[200px] resize-none pr-12 theme-transition"
                disabled={isLoading}
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                {inputMessage.length}/2000
              </div>
            </div>
            {onOpenTaskSelector && (
              <Button
                onClick={onOpenTaskSelector}
                variant="outline"
                size="icon"
                className="h-[52px] w-[52px] border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                title="Select calculation task"
              >
                <Plus className="h-5 w-5 text-blue-600" />
              </Button>
            )}
            <Button
              onClick={handleSend}
              disabled={!inputMessage.trim() || isLoading}
              className="btn-primary h-[52px] px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white theme-transition"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};

