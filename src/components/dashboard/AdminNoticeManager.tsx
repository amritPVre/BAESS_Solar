import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { noticeService, Notice, CreateNoticeData } from "@/services/noticeService";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Eye, EyeOff, Calendar } from "lucide-react";
import { format } from "date-fns";

export const AdminNoticeManager: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [formData, setFormData] = useState<CreateNoticeData>({
    title: '',
    content: '',
    type: 'announcement',
    priority: 'normal',
    is_active: true,
    expires_at: null,
  });

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    try {
      setLoading(true);
      const data = await noticeService.getAllNotices();
      setNotices(data);
    } catch (error) {
      console.error('Error loading notices:', error);
      toast.error('Failed to load notices');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingNotice) {
        await noticeService.updateNotice(editingNotice.id, formData);
        toast.success('Notice updated successfully');
      } else {
        await noticeService.createNotice(formData);
        toast.success('Notice created successfully');
      }
      
      setDialogOpen(false);
      resetForm();
      loadNotices();
    } catch (error) {
      console.error('Error saving notice:', error);
      toast.error('Failed to save notice');
    }
  };

  const handleEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      content: notice.content,
      type: notice.type,
      priority: notice.priority,
      is_active: notice.is_active,
      expires_at: notice.expires_at,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notice?')) return;

    try {
      await noticeService.deleteNotice(id);
      toast.success('Notice deleted successfully');
      loadNotices();
    } catch (error) {
      console.error('Error deleting notice:', error);
      toast.error('Failed to delete notice');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await noticeService.toggleNoticeStatus(id, !currentStatus);
      toast.success(`Notice ${!currentStatus ? 'activated' : 'deactivated'}`);
      loadNotices();
    } catch (error) {
      console.error('Error toggling notice status:', error);
      toast.error('Failed to update notice status');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'announcement',
      priority: 'normal',
      is_active: true,
      expires_at: null,
    });
    setEditingNotice(null);
  };

  const getTypeColor = (type: Notice['type']) => {
    const colors = {
      event: 'bg-blue-100 text-blue-800 border-blue-300',
      webinar: 'bg-purple-100 text-purple-800 border-purple-300',
      training: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      feature_update: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      announcement: 'bg-amber-100 text-amber-800 border-amber-300',
    };
    return colors[type];
  };

  const getPriorityColor = (priority: Notice['priority']) => {
    const colors = {
      urgent: 'bg-red-500 text-white',
      high: 'bg-orange-500 text-white',
      normal: 'bg-blue-500 text-white',
      low: 'bg-gray-500 text-white',
    };
    return colors[priority];
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Notice Management</h2>
          <p className="text-sm text-muted-foreground">Manage announcements for the notice board</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Notice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingNotice ? 'Edit Notice' : 'Create New Notice'}</DialogTitle>
              <DialogDescription>
                {editingNotice ? 'Update the notice details' : 'Add a new notice to the notice board'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter notice title"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter notice content"
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: Notice['type']) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="webinar">Webinar</SelectItem>
                      <SelectItem value="training">Training</SelectItem>
                      <SelectItem value="feature_update">Feature Update</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: Notice['priority']) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="expires_at">Expiration Date (Optional)</Label>
                <Input
                  id="expires_at"
                  type="datetime-local"
                  value={formData.expires_at ? format(new Date(formData.expires_at), "yyyy-MM-dd'T'HH:mm") : ''}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value || null })}
                  className="mt-1"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active (visible to users)</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setDialogOpen(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingNotice ? 'Update Notice' : 'Create Notice'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {notices.map((notice) => (
            <Card key={notice.id} className="border-2">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{notice.title}</CardTitle>
                      <Badge className={getPriorityColor(notice.priority)} variant="outline">
                        {notice.priority}
                      </Badge>
                      <Badge className={getTypeColor(notice.type)} variant="outline">
                        {notice.type.replace('_', ' ')}
                      </Badge>
                      {!notice.is_active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    <CardDescription className="text-sm">
                      Published: {format(new Date(notice.published_date), 'MMM dd, yyyy HH:mm')}
                      {notice.expires_at && (
                        <> • Expires: {format(new Date(notice.expires_at), 'MMM dd, yyyy HH:mm')}</>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleStatus(notice.id, notice.is_active)}
                    >
                      {notice.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(notice)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(notice.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{notice.content}</p>
              </CardContent>
            </Card>
          ))}
          {notices.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No notices yet. Create your first notice!</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

