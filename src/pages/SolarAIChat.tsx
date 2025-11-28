import React, { useState, useEffect } from 'react';
import { ChatHistorySidebar } from '@/components/solar-ai-chat/ChatHistorySidebar';
import { ChatInterface } from '@/components/solar-ai-chat/ChatInterface';
import { ArtifactCanvas } from '@/components/solar-ai-chat/ArtifactCanvas';
import { TaskSelector } from '@/components/solar-ai-chat/TaskSelector';
import { ChatSession, ChatMessage, CalculationType, ArtifactData } from '@/types/solar-ai-chat';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { solarAIChatService } from '@/services/solarAIChatService';
import { exportToPDF, exportToExcel, exportArtifactToPDF } from '@/utils/solarAIExportUtils';
import { toast } from 'sonner';
import { 
  Calculator, 
  Home, 
  Settings, 
  Sparkles,
  Loader2,
  Moon,
  Sun
} from 'lucide-react';
import { AICreditBalance } from '@/components/ai-credits/AICreditBalance';
import { Helmet } from 'react-helmet';
import { ThemeProvider, useTheme } from '@/hooks/useTheme';

const SolarAIChatContent: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isTaskSelectorOpen, setIsTaskSelectorOpen] = useState(true);
  const [selectedCalculationType, setSelectedCalculationType] = useState<CalculationType | null>(null);
  const [currentArtifact, setCurrentArtifact] = useState<ArtifactData | null>(null);
  const [isArtifactVisible, setIsArtifactVisible] = useState(true);

  // Load chat sessions on mount
  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  const loadSessions = async () => {
    if (!user) return;
    
    try {
      setIsLoadingSessions(true);
      const loadedSessions = await solarAIChatService.loadChatSessions(user.id);
      setSessions(loadedSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast.error('Failed to load chat history');
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const createNewSession = (calculationType: CalculationType): ChatSession => {
    return {
      id: crypto.randomUUID(),
      userId: user!.id,
      title: 'New Calculation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      calculationType,
    };
  };

  const handleSelectTask = (taskId: CalculationType) => {
    setSelectedCalculationType(taskId);
    const newSession = createNewSession(taskId);
    setCurrentSession(newSession);
    setIsTaskSelectorOpen(false);
  };

  const handleNewChat = () => {
    setIsTaskSelectorOpen(true);
    setCurrentSession(null);
    setCurrentArtifact(null);
    setSelectedCalculationType(null);
  };

  const handleSelectSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSession(session);
      setSelectedCalculationType(session.calculationType || null);
      setIsTaskSelectorOpen(false);
      
      // Try to restore artifact from last message
      const lastMessage = session.messages[session.messages.length - 1];
      if (lastMessage?.artifactData) {
        setCurrentArtifact(lastMessage.artifactData);
      }
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!user) return;
    
    try {
      const success = await solarAIChatService.deleteChatSession(sessionId, user.id);
      if (success) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        if (currentSession?.id === sessionId) {
          setCurrentSession(null);
          setCurrentArtifact(null);
          setIsTaskSelectorOpen(true);
        }
        toast.success('Chat session deleted');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete chat session');
    }
  };

  const handleRenameSession = async (sessionId: string, newTitle: string) => {
    if (!user) return;
    
    try {
      const success = await solarAIChatService.updateSessionTitle(sessionId, newTitle, user.id);
      if (success) {
        // Update in sessions list
        setSessions(prev => prev.map(s => 
          s.id === sessionId ? { ...s, title: newTitle } : s
        ));
        // Update current session if it's the one being renamed
        if (currentSession?.id === sessionId) {
          setCurrentSession(prev => prev ? { ...prev, title: newTitle } : null);
        }
        toast.success('Chat renamed');
      }
    } catch (error) {
      console.error('Error renaming session:', error);
      toast.error('Failed to rename chat');
    }
  };

  const handleSendMessage = async (messageContent: string) => {
    if (!currentSession || !selectedCalculationType || !user) return;

    // Create user message
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
      calculationType: selectedCalculationType,
    };

    // Update session with user message
    const updatedSession = {
      ...currentSession,
      messages: [...currentSession.messages, userMessage],
      updatedAt: new Date(),
    };
    setCurrentSession(updatedSession);

    // Generate title if first message
    if (currentSession.messages.length === 0) {
      solarAIChatService.generateSessionTitle(messageContent, selectedCalculationType)
        .then(title => {
          setCurrentSession(prev => prev ? { ...prev, title } : null);
        });
    }

    setIsLoading(true);

    try {
      // Get AI response
      const aiResponse = await solarAIChatService.sendMessage(
        messageContent,
        selectedCalculationType,
        currentSession.messages
      );

      // Create AI message
      const aiMessage: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        calculationType: selectedCalculationType,
      };

      // Create artifact from response
      const artifact: ArtifactData = {
        type: 'calculation',
        title: `${selectedCalculationType.replace(/_/g, ' ')} Results`,
        data: aiResponse,
        calculationType: selectedCalculationType,
        timestamp: new Date(),
      };
      setCurrentArtifact(artifact);
      aiMessage.artifactData = artifact;

      // Update session with AI message
      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, aiMessage],
        updatedAt: new Date(),
      };
      setCurrentSession(finalSession);

      // Save to database
      await solarAIChatService.saveChatSession(finalSession);
      
      // Update sessions list
      setSessions(prev => {
        const existingIndex = prev.findIndex(s => s.id === finalSession.id);
        if (existingIndex >= 0) {
          const newSessions = [...prev];
          newSessions[existingIndex] = finalSession;
          return newSessions;
        }
        return [finalSession, ...prev];
      });

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to get AI response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!currentSession) return;
    
    try {
      await exportToPDF(currentSession, currentArtifact);
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    }
  };

  const handleExportExcel = async () => {
    if (!currentSession) return;
    
    try {
      await exportToExcel(currentSession, currentArtifact);
      toast.success('Excel file exported successfully');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Failed to export Excel');
    }
  };

  const handleExportArtifactPDF = async () => {
    if (!currentArtifact) return;
    
    try {
      await exportArtifactToPDF(currentArtifact);
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    }
  };

  if (isLoadingSessions) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading AI Assistant...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Solar AI Assistant - AI-Powered Engineering Calculations</title>
        <meta name="description" content="AI-powered solar engineering calculations and financial analysis tool" />
      </Helmet>
      
      <div className="h-screen flex flex-col bg-white dark-theme:bg-[#0a0e1a] theme-transition">
        {/* Header */}
        <header className="solar-ai-header border-b bg-white px-6 py-3 flex items-center justify-between theme-transition">
          <div className="flex items-center gap-4">
            <img 
              src="/baess-logo.PNG" 
              alt="BAESS Labs" 
              className="h-10 w-auto" 
              onError={(e) => e.currentTarget.style.display = 'none'} 
            />
            <div className="h-8 w-px bg-gray-300" />
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Solar AI Assistant</h1>
                <p className="text-xs text-gray-600">Engineering Calculations & Analysis</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <AICreditBalance compact={true} />
            
            {currentSession && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPDF}
                  disabled={!currentSession.messages.length}
                >
                  Export PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportExcel}
                  disabled={!currentSession.messages.length}
                >
                  Export Excel
                </Button>
              </div>
            )}
            
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="theme-toggle h-10 w-10"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5 text-yellow-400" />
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat History Sidebar */}
          <ChatHistorySidebar
            sessions={sessions}
            currentSessionId={currentSession?.id || null}
            onSelectSession={handleSelectSession}
            onNewChat={handleNewChat}
            onDeleteSession={handleDeleteSession}
            onRenameSession={handleRenameSession}
          />

          {/* Chat Interface */}
          <div className="chat-interface flex-1 min-w-[400px] theme-transition">
            {!currentSession ? (
              <div className="chat-welcome h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 theme-transition">
                <div className="text-center px-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mb-4">
                    <Calculator className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Welcome to Solar AI Assistant
                  </h2>
                  <p className="text-gray-600 max-w-md mb-6">
                    Select a calculation task to get started with AI-powered solar engineering analysis
                  </p>
                  <Button 
                    onClick={() => setIsTaskSelectorOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Select Calculation Task
                  </Button>
                </div>
              </div>
            ) : (
              <ChatInterface
                messages={currentSession.messages}
                isLoading={isLoading}
                onSendMessage={handleSendMessage}
                onOpenTaskSelector={() => setIsTaskSelectorOpen(true)}
                userName={user?.name}
              />
            )}
          </div>

          {/* Artifact Canvas */}
          {currentSession && (
            <ArtifactCanvas
              artifact={currentArtifact}
              onExportPDF={handleExportArtifactPDF}
              onExportExcel={handleExportExcel}
              isVisible={isArtifactVisible}
              onToggleVisibility={() => setIsArtifactVisible(!isArtifactVisible)}
            />
          )}
        </div>

        {/* Task Selector Modal */}
        <TaskSelector
          isOpen={isTaskSelectorOpen}
          onClose={() => setIsTaskSelectorOpen(false)}
          onSelectTask={handleSelectTask}
        />
      </div>
    </>
  );
};

const SolarAIChat: React.FC = () => {
  return (
    <ThemeProvider>
      <SolarAIChatContent />
    </ThemeProvider>
  );
};

export default SolarAIChat;

