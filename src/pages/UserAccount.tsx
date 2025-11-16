import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getCreditBalance } from '@/services/aiCreditService';
import { AICreditBalance } from '@/components/ai-credits/AICreditBalance';
import { SubscriptionPlans } from '@/components/ai-credits/SubscriptionPlans';
import { User, CreditCard, History, Settings, Trash2, ArrowLeft, Download, FileText, Sparkles, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { Helmet } from 'react-helmet';

interface CreditTransaction {
  id: string;
  transaction_type: string;
  credit_change: number;
  old_balance: number;
  new_balance: number;
  created_at: string;
  project_id: string | null;
}

interface CreditBalance {
  remaining: number;
  monthlyLimit: number;
  subscriptionTier: string;
  isSuperAdmin: boolean;
  nextResetDate: string;
}

export const UserAccount = () => {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [company, setCompany] = useState(user?.company || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setCompany(user.company || '');
      setPhone(user.phone || '');
      loadCreditBalance();
      loadTransactions();
    }
  }, [user]);

  const loadCreditBalance = async () => {
    try {
      const balance = await getCreditBalance();
      setCreditBalance(balance);
    } catch (error) {
      console.error('Error loading credit balance:', error);
    }
  };

  const loadTransactions = async () => {
    if (!user?.id) return;
    
    setLoadingTransactions(true);
    try {
      const { data, error } = await supabase
        .from('ai_credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load AI credit transaction history',
        variant: 'destructive'
      });
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      await updateProfile({
        name,
        company,
        phone
      });

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id) return;

    try {
      // Delete user's profile data
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Delete auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
      if (authError) throw authError;

      toast({
        title: 'Account Deleted',
        description: 'Your account has been permanently deleted',
      });

      // Logout and redirect to home
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete account. Please contact support.',
        variant: 'destructive'
      });
    }
  };

  const getTransactionTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'boq_generation': 'BOQ Generation',
      'boq_pricing': 'BOQ Pricing',
      'ai_report_generation': 'AI Report Generation',
      'admin_allocation': 'Admin Credit Allocation',
      'subscription_upgrade': 'Subscription Upgrade',
      'monthly_reset': 'Monthly Reset'
    };
    return labels[type] || type;
  };

  const getTransactionIcon = (creditChange: number) => {
    if (creditChange > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    }
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const getTierColor = (tier: string): string => {
    const colors: Record<string, string> = {
      'free': 'bg-gray-100 text-gray-800 border-gray-300',
      'pro': 'bg-blue-100 text-blue-800 border-blue-300',
      'advanced': 'bg-purple-100 text-purple-800 border-purple-300',
      'enterprise': 'bg-amber-100 text-amber-800 border-amber-300'
    };
    return colors[tier] || colors['free'];
  };

  const calculateUsagePercentage = (): number => {
    if (!creditBalance || creditBalance.isSuperAdmin) return 0;
    return ((creditBalance.monthlyLimit - creditBalance.remaining) / creditBalance.monthlyLimit) * 100;
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Account Settings | BAESS Labs</title>
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto py-8 px-4 max-w-7xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
                <p className="text-sm text-gray-600 mt-1">Manage your profile, subscription, and AI credits</p>
              </div>
            </div>
            
            {/* AI Credit Balance Display */}
            <AICreditBalance compact={true} />
          </div>

          {/* Main Content - All Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sticky Navigation Sidebar */}
            <aside className="lg:col-span-3">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle className="text-base">Quick Navigation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <a 
                    href="#profile" 
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors text-sm"
                  >
                    <User className="h-4 w-4 text-gray-500" />
                    <span>Profile Information</span>
                  </a>
                  <a 
                    href="#subscription" 
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors text-sm"
                  >
                    <CreditCard className="h-4 w-4 text-gray-500" />
                    <span>Subscription</span>
                  </a>
                  <a 
                    href="#credits" 
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors text-sm"
                  >
                    <Sparkles className="h-4 w-4 text-gray-500" />
                    <span>AI Credit Usage</span>
                  </a>
                  <a 
                    href="#billing" 
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors text-sm"
                  >
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span>Billing & Invoices</span>
                  </a>
                  <a 
                    href="#settings" 
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-red-50 hover:text-red-600 transition-colors text-sm"
                  >
                    <Trash2 className="h-4 w-4 text-gray-500" />
                    <span>Account Settings</span>
                  </a>
                </CardContent>
              </Card>
            </aside>

            {/* Main Content Sections */}
            <div className="lg:col-span-9 space-y-8">
            {/* Profile Section */}
            <section id="profile">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal information and contact details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        value={email}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500">Email cannot be changed</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company">Company / Organization</Label>
                      <Input
                        id="company"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Solar Energy Corp"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <Button
                      onClick={handleUpdateProfile}
                      disabled={isLoading}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>

            <Separator className="my-8" />

            {/* Subscription Section */}
            <section id="subscription">
              <div className="space-y-6">
                {/* Current Plan Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Current Subscription
                    </CardTitle>
                    <CardDescription>
                      View and manage your subscription plan
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {creditBalance && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                          <div>
                            <p className="text-sm text-gray-600">Current Plan</p>
                            <div className="flex items-center gap-3 mt-1">
                              <h3 className="text-2xl font-bold capitalize">{creditBalance.subscriptionTier}</h3>
                              <Badge className={getTierColor(creditBalance.subscriptionTier)}>
                                {creditBalance.isSuperAdmin ? 'Super Admin' : 'Active'}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Monthly AI Credits</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {creditBalance.isSuperAdmin ? '∞' : creditBalance.monthlyLimit}
                            </p>
                          </div>
                        </div>

                        {!creditBalance.isSuperAdmin && (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="p-4 bg-white rounded-lg border">
                                <p className="text-sm text-gray-600">Credits Remaining</p>
                                <p className="text-xl font-bold mt-1">{creditBalance.remaining}</p>
                              </div>
                              <div className="p-4 bg-white rounded-lg border">
                                <p className="text-sm text-gray-600">Credits Used</p>
                                <p className="text-xl font-bold mt-1">{creditBalance.monthlyLimit - creditBalance.remaining}</p>
                              </div>
                              <div className="p-4 bg-white rounded-lg border">
                                <p className="text-sm text-gray-600">Usage</p>
                                <p className="text-xl font-bold mt-1">{calculateUsagePercentage().toFixed(1)}%</p>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Next Reset Date</span>
                                <span className="font-medium flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  {format(new Date(creditBalance.nextResetDate), 'MMM dd, yyyy')}
                                </span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Available Plans */}
                {!creditBalance?.isSuperAdmin && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Upgrade Your Plan</CardTitle>
                      <CardDescription>
                        Choose a plan that fits your needs and get more AI credits
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <SubscriptionPlans showCurrentPlan={true} />
                    </CardContent>
                  </Card>
                )}
              </div>
            </section>

            <Separator className="my-8" />

            {/* AI Credits Section */}
            <section id="credits">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    AI Credit Usage History
                  </CardTitle>
                  <CardDescription>
                    View your AI credit transaction history and usage patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingTransactions ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Loading transactions...</p>
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-8">
                      <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No AI credit transactions yet</p>
                      <p className="text-sm text-gray-400 mt-1">Start using AI features to see your transaction history</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Transaction Type</TableHead>
                            <TableHead className="text-center">Credit Change</TableHead>
                            <TableHead className="text-right">Balance After</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell className="font-medium">
                                {format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm')}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Sparkles className="h-4 w-4 text-blue-600" />
                                  {getTransactionTypeLabel(transaction.transaction_type)}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-2">
                                  {getTransactionIcon(transaction.credit_change)}
                                  <span className={transaction.credit_change > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                                    {transaction.credit_change > 0 ? '+' : ''}{transaction.credit_change}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {transaction.new_balance === -1 ? '∞' : transaction.new_balance}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            <Separator className="my-8" />

            {/* Billing Section */}
            <section id="billing">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Billing & Invoices
                  </CardTitle>
                  <CardDescription>
                    Manage your billing information and download invoices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                      <Download className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Coming Soon</h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Billing management and invoice download features are currently under development. 
                      You'll be able to view payment history, update payment methods, and download invoices soon.
                    </p>
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 max-w-md mx-auto">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> For any billing inquiries, please contact our support team at billing@baesslabs.com
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <Separator className="my-8" />

            {/* Settings Section */}
            <section id="settings">
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <Trash2 className="h-5 w-5" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription>
                    Permanently delete your account and all associated data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <h4 className="font-semibold text-red-900 mb-2">Warning: This action cannot be undone</h4>
                      <p className="text-sm text-red-800">
                        Deleting your account will permanently remove:
                      </p>
                      <ul className="list-disc list-inside text-sm text-red-800 mt-2 space-y-1">
                        <li>Your profile and account information</li>
                        <li>All saved solar PV projects and designs</li>
                        <li>BOQ data and AI-generated reports</li>
                        <li>AI credit history and transactions</li>
                        <li>Subscription and billing information</li>
                      </ul>
                    </div>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full sm:w-auto">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete My Account
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription className="space-y-2">
                            <p>
                              This action cannot be undone. This will permanently delete your account
                              and remove all your data from our servers.
                            </p>
                            <p className="font-semibold text-red-600">
                              All your projects, BOQ data, and AI reports will be lost forever.
                            </p>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteAccount}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Yes, Delete My Account
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

