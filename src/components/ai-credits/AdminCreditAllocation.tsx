/**
 * Admin Credit Allocation Component
 * Allows super admins to allocate additional credits to users
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Plus, 
  Search, 
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { allocateCredits } from '@/services/aiCreditService';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  ai_credits_remaining: number;
  ai_credits_monthly_limit: number;
  subscription_tier: string;
  is_super_admin: boolean;
}

export const AdminCreditAllocation: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Allocation form state
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [creditsToAdd, setCreditsToAdd] = useState<string>('');
  const [allocationNote, setAllocationNote] = useState<string>('');
  const [allocating, setAllocating] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, users]);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setIsAdmin(data?.is_super_admin || false);
      setLoading(false);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, ai_credits_remaining, ai_credits_monthly_limit, subscription_tier, is_super_admin')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive'
      });
    }
  };

  const filterUsers = () => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(user =>
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  };

  const handleAllocateCredits = async () => {
    if (!selectedUserId || !creditsToAdd) {
      toast({
        title: 'Validation Error',
        description: 'Please select a user and enter credits amount',
        variant: 'destructive'
      });
      return;
    }

    const credits = parseInt(creditsToAdd);
    if (isNaN(credits) || credits <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid positive number',
        variant: 'destructive'
      });
      return;
    }

    setAllocating(true);
    try {
      const result = await allocateCredits(
        selectedUserId,
        credits,
        allocationNote || undefined
      );

      if (result.success) {
        toast({
          title: 'Success',
          description: `Successfully allocated ${credits} credits`,
        });

        // Refresh users list
        await loadUsers();

        // Reset form
        setSelectedUserId('');
        setCreditsToAdd('');
        setAllocationNote('');
      } else {
        toast({
          title: 'Allocation Failed',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error allocating credits:', error);
      toast({
        title: 'Error',
        description: 'Failed to allocate credits',
        variant: 'destructive'
      });
    } finally {
      setAllocating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Card className="p-8">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Access Denied</h3>
            <p className="text-sm text-gray-600 mt-2">
              This page is only accessible to super administrators.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-100 rounded-lg">
          <Shield className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Credit Allocation</h2>
          <p className="text-sm text-gray-600">Manage AI credits for users</p>
        </div>
      </div>

      {/* Allocation Form */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Allocate Credits</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="user-select">Select User</Label>
              <select
                id="user-select"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select a user --</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email}) - {user.ai_credits_remaining} credits
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="credits-amount">Credits to Add</Label>
              <Input
                id="credits-amount"
                type="number"
                min="1"
                placeholder="Enter number of credits"
                value={creditsToAdd}
                onChange={(e) => setCreditsToAdd(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="allocation-note">Note (Optional)</Label>
              <Textarea
                id="allocation-note"
                placeholder="Reason for allocation..."
                value={allocationNote}
                onChange={(e) => setAllocationNote(e.target.value)}
                rows={3}
              />
            </div>

            <Button
              onClick={handleAllocateCredits}
              disabled={allocating || !selectedUserId || !creditsToAdd}
              className="w-full"
            >
              {allocating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Allocating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Allocate Credits
                </>
              )}
            </Button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Allocation Guidelines</h4>
            <ul className="text-sm text-blue-700 space-y-2">
              <li>• Use this feature sparingly for special cases</li>
              <li>• Allocated credits are added to user's current balance</li>
              <li>• Allocations are logged for audit purposes</li>
              <li>• Consider upgrading user's subscription instead</li>
              <li>• Credits do not expire or roll over on monthly reset</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">All Users</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead className="text-right">Current Balance</TableHead>
                  <TableHead className="text-right">Monthly Limit</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{user.name}</span>
                          <span className="text-sm text-gray-500">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {user.subscription_tier}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {user.is_super_admin ? '∞' : user.ai_credits_remaining}
                      </TableCell>
                      <TableCell className="text-right text-gray-600">
                        {user.ai_credits_monthly_limit}
                      </TableCell>
                      <TableCell>
                        {user.is_super_admin ? (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-300">
                            <Shield className="h-3 w-3 mr-1" />
                            Admin
                          </Badge>
                        ) : user.ai_credits_remaining === 0 ? (
                          <Badge variant="destructive">
                            No Credits
                          </Badge>
                        ) : user.ai_credits_remaining < (user.ai_credits_monthly_limit * 0.2) ? (
                          <Badge className="bg-orange-100 text-orange-700 border-orange-300">
                            Low
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700 border-green-300">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminCreditAllocation;

