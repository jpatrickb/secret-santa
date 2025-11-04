import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Copy,
  Users,
  Gift,
  Settings,
  Shuffle,
  Plus,
  ExternalLink,
  Check,
  X,
  Star,
  Crown,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { groups as groupsApi, assignments as assignmentsApi, wishlist as wishlistApi } from '@/lib/api';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Card';

type Tab = 'wishlist' | 'members' | 'assignments' | 'settings';

export default function GroupDetail() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [group, setGroup] = useState<any>(null);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('wishlist');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Wishlist form
  const [showAddItem, setShowAddItem] = useState(false);
  const [itemTitle, setItemTitle] = useState('');
  const [itemUrl, setItemUrl] = useState('');
  const [itemNotes, setItemNotes] = useState('');

  // Assignment
  const [selectedGiverId, setSelectedGiverId] = useState('');
  const [selectedReceiverId, setSelectedReceiverId] = useState('');

  const [copiedInvite, setCopiedInvite] = useState(false);

  useEffect(() => {
    if (groupId) {
      loadGroup();
      loadWishlist();
      loadAssignments();
    }
  }, [groupId]);

  const loadGroup = async () => {
    try {
      const data = await groupsApi.get(groupId!);
      setGroup(data.group);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadWishlist = async () => {
    try {
      const data = await wishlistApi.list(groupId!);
      setWishlistItems(data.items);
    } catch (err: any) {
      console.error('Error loading wishlist:', err);
    }
  };

  const loadAssignments = async () => {
    try {
      const data = await assignmentsApi.list(groupId!);
      setAssignments(data.assignments);
    } catch (err: any) {
      console.error('Error loading assignments:', err);
    }
  };

  const handleAddWishlistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await wishlistApi.create(groupId!, {
        title: itemTitle,
        url: itemUrl || undefined,
        notes: itemNotes || undefined,
      });
      setItemTitle('');
      setItemUrl('');
      setItemNotes('');
      setShowAddItem(false);
      loadWishlist();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteWishlistItem = async (itemId: string) => {
    try {
      await wishlistApi.delete(itemId);
      loadWishlist();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleClaimItem = async (itemId: string) => {
    try {
      await wishlistApi.claim(itemId);
      loadWishlist();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUnclaimItem = async (itemId: string) => {
    try {
      await wishlistApi.unclaim(itemId);
      loadWishlist();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGenerateAssignments = async () => {
    try {
      await assignmentsApi.generate(groupId!);
      loadAssignments();
      setError('Assignments generated successfully!');
      setTimeout(() => setError(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateManualAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await assignmentsApi.create(groupId!, {
        giverId: selectedGiverId,
        receiverId: selectedReceiverId,
      });
      setSelectedGiverId('');
      setSelectedReceiverId('');
      loadAssignments();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateAssignmentMode = async (mode: string) => {
    try {
      await groupsApi.updateAssignmentMode(groupId!, mode);
      loadGroup();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const copyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/join/${group.inviteCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Group not found</div>
      </div>
    );
  }

  const isAdmin = group.members.find((m: any) => m.userId === user?.id)?.role === 'ADMIN';
  const myAssignment = assignments.find((a) => a.giverId === user?.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{group.name}</h1>
              {group.description && (
                <p className="text-sm text-muted-foreground">{group.description}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('wishlist')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'wishlist'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Gift className="w-4 h-4 inline mr-2" />
              Wishlists
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'members'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Members
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'assignments'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Shuffle className="w-4 h-4 inline mr-2" />
              Assignments
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'settings'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-2" />
                Settings
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Wishlist Tab */}
        {activeTab === 'wishlist' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Gift Wishlists</h2>
              <Button onClick={() => setShowAddItem(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>

            {/* My Assignment */}
            {myAssignment && (
              <Card className="mb-6 bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Star className="w-6 h-6 text-primary" />
                    <div>
                      <p className="font-semibold">You're Secret Santa for:</p>
                      <p className="text-xl font-bold text-primary">{myAssignment.receiver.name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-6">
              {group.members.map((member: any) => {
                const memberItems = wishlistItems.filter((item) => item.userId === member.userId);
                const isMyWishlist = member.userId === user?.id;

                return (
                  <Card key={member.userId}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {member.user.name}
                        {member.role === 'ADMIN' && <Crown className="w-4 h-4 text-yellow-500" />}
                        {isMyWishlist && <span className="text-sm font-normal text-muted-foreground">(You)</span>}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {memberItems.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No items yet</p>
                      ) : (
                        <div className="space-y-3">
                          {memberItems.map((item) => {
                            const isClaimed = !!item.claim;
                            const isClaimedByMe = item.claim?.claimedById === user?.id;

                            return (
                              <div
                                key={item.id}
                                className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                              >
                                <div className="flex-1">
                                  <h4 className="font-medium">{item.title}</h4>
                                  {item.notes && (
                                    <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                                  )}
                                  {item.url && (
                                    <a
                                      href={item.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                                    >
                                      View item <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                  {!isMyWishlist && isClaimed && (
                                    <div className="flex items-center gap-2 mt-2">
                                      <Check className="w-4 h-4 text-accent" />
                                      <span className="text-sm text-accent font-medium">
                                        {isClaimedByMe
                                          ? 'You claimed this'
                                          : `Claimed by ${item.claim.claimedBy.name}`}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  {isMyWishlist ? (
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleDeleteWishlistItem(item.id)}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  ) : (
                                    <>
                                      {isClaimedByMe ? (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleUnclaimItem(item.id)}
                                        >
                                          Unclaim
                                        </Button>
                                      ) : !isClaimed ? (
                                        <Button
                                          size="sm"
                                          onClick={() => handleClaimItem(item.id)}
                                        >
                                          <Check className="w-4 h-4 mr-1" />
                                          Claim
                                        </Button>
                                      ) : null}
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Members</h2>
              <Button variant="outline" onClick={copyInviteLink}>
                {copiedInvite ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Invite Link
                  </>
                )}
              </Button>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {group.members.map((member: any) => (
                    <div
                      key={member.userId}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          {member.user.name}
                          {member.role === 'ADMIN' && <Crown className="w-4 h-4 text-yellow-500" />}
                        </p>
                        <p className="text-sm text-muted-foreground">{member.user.email}</p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {member.role === 'ADMIN' ? 'Admin' : 'Member'}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Invite Code</CardTitle>
                <CardDescription>Share this code with friends to invite them</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Input value={group.inviteCode} readOnly className="font-mono" />
                  <Button variant="outline" onClick={copyInviteLink}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Gift Assignments</h2>

            {!isAdmin && myAssignment && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-lg mb-2">You're buying a gift for:</p>
                    <p className="text-3xl font-bold text-primary">{myAssignment.receiver.name}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {!isAdmin && !myAssignment && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    No assignment yet. The group admin will assign Secret Santas soon!
                  </p>
                </CardContent>
              </Card>
            )}

            {isAdmin && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Current Assignments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {assignments.length === 0 ? (
                      <p className="text-muted-foreground">No assignments yet</p>
                    ) : (
                      <div className="space-y-2">
                        {assignments.map((assignment) => (
                          <div
                            key={assignment.id}
                            className="flex items-center justify-between p-3 rounded-lg border"
                          >
                            <div>
                              <span className="font-medium">{assignment.giver?.name || 'Unknown'}</span>
                              <span className="mx-2 text-muted-foreground">→</span>
                              <span className="font-medium">{assignment.receiver.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {group.assignmentMode === 'MANUAL' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Create Manual Assignment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleCreateManualAssignment} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Gift Giver</label>
                          <select
                            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                            value={selectedGiverId}
                            onChange={(e) => setSelectedGiverId(e.target.value)}
                            required
                          >
                            <option value="">Select a member</option>
                            {group.members.map((m: any) => (
                              <option key={m.userId} value={m.userId}>
                                {m.user.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Gift Receiver</label>
                          <select
                            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                            value={selectedReceiverId}
                            onChange={(e) => setSelectedReceiverId(e.target.value)}
                            required
                          >
                            <option value="">Select a member</option>
                            {group.members.map((m: any) => (
                              <option key={m.userId} value={m.userId}>
                                {m.user.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Button type="submit">Create Assignment</Button>
                      </form>
                    </CardContent>
                  </Card>
                )}

                {group.assignmentMode === 'RANDOM' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Generate Random Assignments</CardTitle>
                      <CardDescription>
                        Automatically assign each member to buy a gift for someone else
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button onClick={handleGenerateAssignments}>
                        <Shuffle className="w-4 h-4 mr-2" />
                        Generate Assignments
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && isAdmin && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Group Settings</h2>

            <Card>
              <CardHeader>
                <CardTitle>Assignment Mode</CardTitle>
                <CardDescription>
                  Choose how Secret Santa assignments are managed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    group.assignmentMode === 'RANDOM'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleUpdateAssignmentMode('RANDOM')}
                >
                  <div className="flex items-center gap-3">
                    <Shuffle className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Random Assignment</p>
                      <p className="text-sm text-muted-foreground">
                        Automatically generate random assignments
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    group.assignmentMode === 'MANUAL'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleUpdateAssignmentMode('MANUAL')}
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Manual Assignment</p>
                      <p className="text-sm text-muted-foreground">
                        Manually assign who buys for whom
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    group.assignmentMode === 'OPEN'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleUpdateAssignmentMode('OPEN')}
                >
                  <div className="flex items-center gap-3">
                    <Gift className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Open (No Assignments)</p>
                      <p className="text-sm text-muted-foreground">
                        No specific assignments, everyone can see all wishlists
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Add Wishlist Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add Wishlist Item</CardTitle>
              <CardDescription>Add something you'd like to receive</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddWishlistItem} className="space-y-4">
                <Input
                  label="Item Name"
                  placeholder="The perfect gift"
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  required
                />
                <Input
                  label="URL (optional)"
                  type="url"
                  placeholder="https://amazon.com/..."
                  value={itemUrl}
                  onChange={(e) => setItemUrl(e.target.value)}
                />
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Notes (optional)
                  </label>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Size, color, or other preferences..."
                    value={itemNotes}
                    onChange={(e) => setItemNotes(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowAddItem(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Add Item
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
