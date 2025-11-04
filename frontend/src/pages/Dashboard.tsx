import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Gift, Users, LogOut, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { groups as groupsApi } from '@/lib/api';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Card';

export default function Dashboard() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const data = await groupsApi.list();
      setGroups(data.groups);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await groupsApi.create({
        name: newGroupName,
        description: newGroupDescription,
      });
      setGroups([data.group, ...groups]);
      setShowCreateModal(false);
      setNewGroupName('');
      setNewGroupDescription('');
      navigate(`/groups/${data.group.id}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await groupsApi.join(inviteCode.trim());
      setGroups([data.group, ...groups]);
      setShowJoinModal(false);
      setInviteCode('');
      navigate(`/groups/${data.group.id}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold">Secret Santa</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {user?.name}
              </span>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">Your Groups</h2>
          <div className="flex gap-3">
            <Button onClick={() => setShowJoinModal(true)} variant="outline">
              <UserPlus className="w-4 h-4 mr-2" />
              Join Group
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          </div>
        </div>

        {groups.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Gift className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No groups yet</h3>
              <p className="text-muted-foreground mb-6">
                Create a new group or join an existing one to get started!
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => setShowJoinModal(true)} variant="outline">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Join Group
                </Button>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Group
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <Card
                key={group.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/groups/${group.id}`)}
              >
                <CardHeader>
                  <CardTitle>{group.name}</CardTitle>
                  {group.description && (
                    <CardDescription>{group.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{group.members.length} members</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Gift className="w-4 h-4" />
                      <span>{group._count.wishlistItems} items</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create New Group</CardTitle>
              <CardDescription>
                Start a new Secret Santa gift exchange
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <Input
                  label="Group Name"
                  placeholder="Family Christmas 2024"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Description (optional)
                  </label>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="A fun gift exchange for the family"
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Create
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Join Group</CardTitle>
              <CardDescription>
                Enter the invite code to join an existing group
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinGroup} className="space-y-4">
                <Input
                  label="Invite Code"
                  placeholder="ABC123XYZ"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  required
                />
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowJoinModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Join
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
