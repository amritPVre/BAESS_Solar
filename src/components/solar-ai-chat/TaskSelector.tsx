import React, { useState } from 'react';
import { CalculationTask, CalculationType } from '@/types/solar-ai-chat';
import { CALCULATION_TASKS } from '@/config/solar-calculation-prompts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Calculator, 
  DollarSign, 
  Zap, 
  Leaf, 
  Search,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTask: (taskId: CalculationType) => void;
}

const categoryIcons = {
  sizing: Calculator,
  financial: DollarSign,
  technical: Zap,
  environmental: Leaf,
};

const categoryColors = {
  sizing: 'from-blue-500 to-blue-600',
  financial: 'from-green-500 to-green-600',
  technical: 'from-purple-500 to-purple-600',
  environmental: 'from-emerald-500 to-emerald-600',
};

export const TaskSelector: React.FC<TaskSelectorProps> = ({
  isOpen,
  onClose,
  onSelectTask,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredTasks = CALCULATION_TASKS.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || task.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelectTask = (taskId: CalculationType) => {
    onSelectTask(taskId);
    onClose();
    setSearchQuery('');
    setSelectedCategory('all');
  };

  const categories = [
    { id: 'all', name: 'All Tasks', count: CALCULATION_TASKS.length },
    { id: 'sizing', name: 'System Sizing', count: CALCULATION_TASKS.filter(t => t.category === 'sizing').length },
    { id: 'financial', name: 'Financial Analysis', count: CALCULATION_TASKS.filter(t => t.category === 'financial').length },
    { id: 'technical', name: 'Technical Calculations', count: CALCULATION_TASKS.filter(t => t.category === 'technical').length },
    { id: 'environmental', name: 'Environmental Impact', count: CALCULATION_TASKS.filter(t => t.category === 'environmental').length },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] p-0 task-selector-modal">
        <DialogHeader className="px-6 pt-6 pb-4 border-b task-selector-header">
          <DialogTitle className="text-2xl font-bold task-selector-title">
            Select Calculation Task
          </DialogTitle>
          <DialogDescription className="task-selector-description">
            Choose a solar engineering or financial calculation to perform
          </DialogDescription>
          
          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search calculations..."
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="overflow-auto px-6 py-4" style={{ maxHeight: 'calc(85vh - 180px)' }}>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-5 mb-6">
              {categories.map((category) => (
                <TabsTrigger key={category.id} value={category.id} className="text-xs">
                  {category.name}
                  <Badge variant="secondary" className="ml-2 text-[10px] px-1.5">
                    {category.count}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedCategory} className="mt-0">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-600">No calculations found matching your search</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTasks.map((task) => {
                    const CategoryIcon = categoryIcons[task.category];
                    const colorClass = categoryColors[task.category];
                    
                    return (
                      <Card
                        key={task.id}
                        className="task-card cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-blue-300 theme-transition"
                        onClick={() => handleSelectTask(task.id)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className={cn(
                              "p-2 rounded-lg bg-gradient-to-br text-white",
                              colorClass
                            )}>
                              <CategoryIcon className="h-5 w-5" />
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {task.outputFormat}
                            </Badge>
                          </div>
                          <CardTitle className="text-base leading-tight">
                            {task.name}
                          </CardTitle>
                          <CardDescription className="text-xs mt-1 line-clamp-3">
                            {task.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                              {task.category}
                            </Badge>
                            <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                              {task.requiredInputs.length} inputs
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="border-t px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {filteredTasks.length} calculation{filteredTasks.length !== 1 ? 's' : ''} available
            </p>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

