import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Zap, 
  FileText, 
  Calculator, 
  Settings,
  ExternalLink,
  ArrowLeft,
  Boxes,
  Bot,
  Wrench
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSandboxApiKey } from '@/hooks/sandbox/useSandboxApiKey';

/**
 * Sandbox Home - Dashboard for all mini apps
 */
const SandboxHome: React.FC = () => {
  const navigate = useNavigate();
  const { selectedModel, setSelectedModel, availableModels } = useSandboxApiKey();

  // Mini apps configuration - Add more apps here as you develop them
  const miniApps = [
    {
      id: 'coming-soon-1',
      name: 'Quick Cable Sizer',
      description: 'Instantly calculate cable sizes based on current, length, and voltage drop requirements',
      icon: Zap,
      category: 'non-ai',
      status: 'coming-soon',
      color: 'from-amber-500 to-orange-600',
    },
    {
      id: 'coming-soon-2',
      name: 'AI Document Analyzer',
      description: 'Upload solar datasheets and get AI-powered insights and comparisons',
      icon: FileText,
      category: 'ai',
      status: 'coming-soon',
      color: 'from-purple-500 to-indigo-600',
    },
    {
      id: 'coming-soon-3',
      name: 'Quick ROI Calculator',
      description: 'Simple solar ROI and payback calculator without complex inputs',
      icon: Calculator,
      category: 'non-ai',
      status: 'coming-soon',
      color: 'from-emerald-500 to-teal-600',
    },
    {
      id: 'coming-soon-4',
      name: 'AI Code Assistant',
      description: 'Get help with solar engineering calculations and code snippets',
      icon: Bot,
      category: 'ai',
      status: 'coming-soon',
      color: 'from-blue-500 to-cyan-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="h-6 w-px bg-white/20" />
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600">
                  <Boxes className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">BAESS Sandbox</h1>
                  <p className="text-xs text-white/60">Experimental Mini Apps</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Model Selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/60">AI Model:</span>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {availableModels.map((model) => (
                    <option key={model.id} value={model.id} className="bg-slate-800">
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/sandbox/settings')}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 mb-4">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span className="text-sm text-purple-300">Experimental Zone</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">
            Welcome to the Sandbox
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            A collection of mini apps and tools that are useful but not part of the main platform.
            These tools use your own OpenRouter API key - you pay OpenRouter directly based on your usage.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-amber-400/80">
            <ExternalLink className="h-4 w-4" />
            <span>Billing handled by OpenRouter • No BAESS subscription required</span>
          </div>
        </motion.div>

        {/* Apps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {miniApps.map((app, index) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer group">
                <CardHeader>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${app.color} text-white shadow-lg`}>
                      <app.icon className="h-6 w-6" />
                    </div>
                    <div className="flex gap-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${app.category === 'ai' ? 'border-purple-500/50 text-purple-400' : 'border-emerald-500/50 text-emerald-400'}`}
                      >
                        {app.category === 'ai' ? 'AI' : 'Tool'}
                      </Badge>
                      {app.status === 'coming-soon' && (
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                          Soon
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-lg text-white group-hover:text-purple-300 transition-colors">
                    {app.name}
                  </CardTitle>
                  <CardDescription className="text-white/60">
                    {app.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    disabled={app.status === 'coming-soon'}
                    className={`w-full ${
                      app.status === 'coming-soon'
                        ? 'bg-white/10 text-white/50 cursor-not-allowed'
                        : `bg-gradient-to-r ${app.color} hover:opacity-90 text-white`
                    }`}
                  >
                    {app.status === 'coming-soon' ? (
                      <>
                        <Wrench className="h-4 w-4 mr-2" />
                        Coming Soon
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Launch App
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/10"
        >
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            About Sandbox Apps
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm text-white/70">
            <div>
              <h4 className="font-medium text-white mb-1">🔑 Your API Key</h4>
              <p>These apps use your OpenRouter API key. You control your usage and billing directly with OpenRouter.</p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-1">🧪 Experimental</h4>
              <p>Sandbox apps are experimental and may change. They're useful tools that don't fit the main platform.</p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-1">💡 Suggestions?</h4>
              <p>Have an idea for a mini app? Let us know and we might build it for the sandbox!</p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default SandboxHome;

