import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Calendar, GraduationCap, Megaphone, Sparkles, AlertCircle } from "lucide-react";
import { noticeService, Notice } from "@/services/noticeService";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const NoticeBoard: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    try {
      setLoading(true);
      const data = await noticeService.getActiveNotices();
      setNotices(data);
    } catch (error) {
      console.error('Error loading notices:', error);
      toast.error('Failed to load notices');
    } finally {
      setLoading(false);
    }
  };

  const getNoticeIcon = (type: Notice['type']) => {
    switch (type) {
      case 'event':
        return <Calendar className="h-4 w-4" />;
      case 'webinar':
        return <GraduationCap className="h-4 w-4" />;
      case 'training':
        return <GraduationCap className="h-4 w-4" />;
      case 'feature_update':
        return <Sparkles className="h-4 w-4" />;
      case 'announcement':
        return <Megaphone className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNoticeColor = (type: Notice['type'], priority: Notice['priority']) => {
    if (priority === 'urgent') return 'bg-red-100 border-red-300 text-red-800';
    if (priority === 'high') return 'bg-orange-100 border-orange-300 text-orange-800';
    
    switch (type) {
      case 'event':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'webinar':
        return 'bg-purple-100 border-purple-300 text-purple-800';
      case 'training':
        return 'bg-indigo-100 border-indigo-300 text-indigo-800';
      case 'feature_update':
        return 'bg-emerald-100 border-emerald-300 text-emerald-800';
      case 'announcement':
        return 'bg-amber-100 border-amber-300 text-amber-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getPriorityBadge = (priority: Notice['priority']) => {
    const colors = {
      urgent: 'bg-red-500 text-white',
      high: 'bg-orange-500 text-white',
      normal: 'bg-blue-500 text-white',
      low: 'bg-gray-500 text-white',
    };

    if (priority === 'normal') return null;

    return (
      <Badge className={`${colors[priority]} text-[9px] px-1.5 py-0 h-4`}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const getTypeLabel = (type: Notice['type']) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <Card className="h-full border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 text-white">
            <Bell className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-lg">Notice Board</CardTitle>
            <CardDescription className="text-xs">
              Stay updated with latest news
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="px-4 pb-4 space-y-3">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : notices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">No announcements yet</p>
              </div>
            ) : (
              notices.map((notice) => (
                <Card
                  key={notice.id}
                  className={`border-2 ${getNoticeColor(notice.type, notice.priority)} transition-all duration-200 hover:shadow-md`}
                >
                  <CardHeader className="pb-2 pt-3 px-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1">
                        <div className="mt-0.5">
                          {getNoticeIcon(notice.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm leading-tight line-clamp-2">
                            {notice.title}
                          </CardTitle>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                              {getTypeLabel(notice.type)}
                            </Badge>
                            {getPriorityBadge(notice.priority)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-3 pb-3 pt-2">
                    <p className="text-xs leading-relaxed line-clamp-3">
                      {notice.content}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(notice.published_date), { addSuffix: true })}
                    </p>
                    {notice.expires_at && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <AlertCircle className="h-3 w-3 text-muted-foreground" />
                        <p className="text-[10px] text-muted-foreground">
                          Expires {formatDistanceToNow(new Date(notice.expires_at), { addSuffix: true })}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default NoticeBoard;

