import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Gift } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { groups } from '@/lib/api';
import Button from '@/components/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Card';

export default function JoinGroup() {
  const { inviteCode } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate(`/login?redirect=/join/${inviteCode}`);
    }
  }, [user, inviteCode, navigate]);

  const handleJoin = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await groups.join(inviteCode!);
      navigate(`/groups/${data.group.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to join group');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-green-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mb-2">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Join Secret Santa Group</CardTitle>
          <CardDescription className="text-center">
            You've been invited to join a Secret Santa gift exchange!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">Invite Code:</p>
            <p className="text-2xl font-mono font-bold">{inviteCode}</p>
          </div>
          <Button onClick={handleJoin} className="w-full" disabled={loading}>
            {loading ? 'Joining...' : 'Join Group'}
          </Button>
          <Button variant="outline" onClick={() => navigate('/dashboard')} className="w-full">
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
