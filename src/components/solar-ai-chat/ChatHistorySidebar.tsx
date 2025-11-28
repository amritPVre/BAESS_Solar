import React, { useState } from 'react';
import { ChatSession } from '@/types/solar-ai-chat';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronLeft, 
  ChevronRight, 
  MessageSquare, 
  Plus, 
  Trash2,
  Clock,
  Pencil,
  Check,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ChatHistorySidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newTitle: string) => void;
}

export const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleStartEdit = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveEdit = (sessionId: string) => {
    if (editTitle.trim()) {
      onRenameSession(sessionId, editTitle.trim());
    }
    setEditingSessionId(null);
    setEditTitle('');
  };

  const handleCancelEdit = () => {
    setEditingSessionId(null);
    setEditTitle('');
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const groupedSessions = sessions.reduce((groups, session) => {
    const date = formatDate(session.updatedAt);
    if (!groups[date]) groups[date] = [];
    groups[date].push(session);
    return groups;
  }, {} as Record<string, ChatSession[]>);

  if (isCollapsed) {
    return (
      <div className="chat-sidebar-collapsed w-16 border-r bg-gray-50 flex flex-col items-center py-4 gap-3 theme-transition">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          title="Expand sidebar"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onNewChat}
          title="New chat"
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          <Plus className="h-5 w-5" />
        </Button>
        <div className="flex-1 flex flex-col gap-2 items-center">
          {sessions.slice(0, 5).map((session) => (
            <button
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                session.id === currentSessionId
                  ? "bg-blue-100 text-blue-700"
                  : "hover:bg-gray-200 text-gray-600"
              )}
              title={session.title}
            >
              <MessageSquare className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="chat-sidebar w-72 border-r bg-gray-50 flex flex-col theme-transition">
      {/* Header */}
      <div className="p-4 border-b bg-white theme-transition">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Chat History</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(true)}
            title="Collapse sidebar"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>
        <Button 
          onClick={onNewChat} 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Chat Sessions List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {sessions.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No chat history yet</p>
              <p className="text-xs text-gray-400 mt-1">Start a new conversation</p>
            </div>
          ) : (
            Object.entries(groupedSessions).map(([date, dateSessions]) => (
              <div key={date} className="mb-4">
                <div className="flex items-center gap-2 px-3 py-1.5 mb-1">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {date}
                  </h3>
                </div>
                <div className="space-y-1">
                  {dateSessions.map((session) => (
                    <div
                      key={session.id}
                      className={cn(
                        "chat-session-item group relative rounded-lg transition-all duration-200 theme-transition",
                        session.id === currentSessionId
                          ? "active bg-blue-100 border border-blue-200"
                          : "hover:bg-gray-100"
                      )}
                    >
                      {editingSessionId === session.id ? (
                        // Edit Mode
                        <div className="p-2">
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(session.id);
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            className="text-sm mb-2"
                            autoFocus
                            placeholder="Chat title..."
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(session.id)}
                              className="flex-1 h-7 text-xs bg-blue-600 hover:bg-blue-700"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                              className="flex-1 h-7 text-xs"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // Normal Mode
                        <>
                          <button
                            onClick={() => onSelectSession(session.id)}
                            className="w-full text-left p-3 pr-20"
                          >
                            <h4 className={cn(
                              "chat-session-title text-sm font-medium line-clamp-2 mb-1 theme-transition",
                              session.id === currentSessionId
                                ? "text-blue-900"
                                : "text-gray-900"
                            )}>
                              {session.title}
                            </h4>
                            <p className={cn(
                              "chat-session-meta text-xs line-clamp-1 theme-transition",
                              session.id === currentSessionId
                                ? "text-blue-600"
                                : "text-gray-500"
                            )}>
                              {session.messages.length} message{session.messages.length !== 1 ? 's' : ''}
                              {session.calculationType && ` • ${session.calculationType.replace(/_/g, ' ')}`}
                            </p>
                          </button>
                          
                          <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                              onClick={(e) => handleStartEdit(session, e)}
                              title="Rename chat"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                                  onClick={(e) => e.stopPropagation()}
                                  title="Delete chat"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Chat Session?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete "{session.title}" and all its messages. 
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => onDeleteSession(session.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

