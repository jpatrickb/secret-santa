import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { authMiddleware, AuthRequest, generateToken, hashPassword, comparePassword } from './auth';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ============ VALIDATION SCHEMAS ============

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const createGroupSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const updateAssignmentModeSchema = z.object({
  mode: z.enum(['RANDOM', 'MANUAL', 'OPEN']),
});

const createAssignmentSchema = z.object({
  giverId: z.string(),
  receiverId: z.string(),
});

const createWishlistItemSchema = z.object({
  title: z.string().min(1),
  url: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  notes: z.string().optional(),
  priority: z.number().optional(),
});

// ============ AUTH ROUTES ============

app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    const token = generateToken({ userId: user.id, email: user.email });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await comparePassword(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({ userId: user.id, email: user.email });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============ GROUP ROUTES ============

app.post('/api/groups', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = createGroupSchema.parse(req.body);
    const userId = req.user!.userId;

    const inviteCode = nanoid(10);

    const group = await prisma.group.create({
      data: {
        name,
        description,
        inviteCode,
        createdById: userId,
        members: {
          create: {
            userId,
            role: 'ADMIN',
          },
        },
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    res.json({ group });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/groups', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        _count: {
          select: { wishlistItems: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ groups });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/groups/:groupId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const userId = req.user!.userId;

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const isMember = group.members.some(m => m.userId === userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    res.json({ group });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/groups/:inviteCode/join', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { inviteCode } = req.params;
    const userId = req.user!.userId;

    const group = await prisma.group.findUnique({
      where: { inviteCode },
      include: { members: true },
    });

    if (!group) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    const alreadyMember = group.members.some(m => m.userId === userId);
    if (alreadyMember) {
      return res.status(400).json({ error: 'Already a member of this group' });
    }

    await prisma.groupMembership.create({
      data: {
        userId,
        groupId: group.id,
        role: 'MEMBER',
      },
    });

    const updatedGroup = await prisma.group.findUnique({
      where: { id: group.id },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    res.json({ group: updatedGroup });
  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/groups/:groupId/assignment-mode', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const { mode } = updateAssignmentModeSchema.parse(req.body);
    const userId = req.user!.userId;

    const membership = await prisma.groupMembership.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    });

    if (!membership || membership.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can change assignment mode' });
    }

    const group = await prisma.group.update({
      where: { id: groupId },
      data: { assignmentMode: mode },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    res.json({ group });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update assignment mode error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============ ASSIGNMENT ROUTES ============

app.post('/api/groups/:groupId/assignments/generate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const userId = req.user!.userId;

    const membership = await prisma.groupMembership.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    });

    if (!membership || membership.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can generate assignments' });
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true },
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const memberIds = group.members.map(m => m.userId);

    if (memberIds.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 members to generate assignments' });
    }

    // Delete existing assignments
    await prisma.assignment.deleteMany({
      where: { groupId },
    });

    // Shuffle array using Fisher-Yates algorithm
    const shuffled = [...memberIds];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Create assignments in a circle (each person gives to the next)
    const assignments = shuffled.map((giverId, index) => {
      const receiverId = shuffled[(index + 1) % shuffled.length];
      return {
        groupId,
        giverId,
        receiverId,
      };
    });

    await prisma.assignment.createMany({
      data: assignments,
    });

    const createdAssignments = await prisma.assignment.findMany({
      where: { groupId },
      include: {
        giver: {
          select: { id: true, name: true, email: true },
        },
        receiver: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.json({ assignments: createdAssignments });
  } catch (error) {
    console.error('Generate assignments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/groups/:groupId/assignments', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const { giverId, receiverId } = createAssignmentSchema.parse(req.body);
    const userId = req.user!.userId;

    const membership = await prisma.groupMembership.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    });

    if (!membership || membership.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can create assignments' });
    }

    if (giverId === receiverId) {
      return res.status(400).json({ error: 'User cannot be assigned to themselves' });
    }

    const assignment = await prisma.assignment.upsert({
      where: {
        groupId_giverId: {
          groupId,
          giverId,
        },
      },
      create: {
        groupId,
        giverId,
        receiverId,
      },
      update: {
        receiverId,
      },
      include: {
        giver: {
          select: { id: true, name: true, email: true },
        },
        receiver: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.json({ assignment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create assignment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/groups/:groupId/assignments', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const userId = req.user!.userId;

    const membership = await prisma.groupMembership.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    const isAdmin = membership.role === 'ADMIN';

    if (isAdmin) {
      // Admins can see all assignments
      const assignments = await prisma.assignment.findMany({
        where: { groupId },
        include: {
          giver: {
            select: { id: true, name: true, email: true },
          },
          receiver: {
            select: { id: true, name: true, email: true },
          },
        },
      });
      return res.json({ assignments });
    } else {
      // Regular members only see who they're assigned to
      const assignment = await prisma.assignment.findUnique({
        where: {
          groupId_giverId: {
            groupId,
            giverId: userId,
          },
        },
        include: {
          receiver: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      if (assignment) {
        return res.json({
          assignments: [{
            id: assignment.id,
            groupId: assignment.groupId,
            giverId: assignment.giverId,
            receiverId: assignment.receiverId,
            receiver: assignment.receiver,
          }],
        });
      }

      return res.json({ assignments: [] });
    }
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/groups/:groupId/assignments/:assignmentId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { groupId, assignmentId } = req.params;
    const userId = req.user!.userId;

    const membership = await prisma.groupMembership.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    });

    if (!membership || membership.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can delete assignments' });
    }

    await prisma.assignment.delete({
      where: { id: assignmentId },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============ WISHLIST ROUTES ============

app.post('/api/groups/:groupId/wishlist', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const userId = req.user!.userId;
    const data = createWishlistItemSchema.parse(req.body);

    const membership = await prisma.groupMembership.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    const item = await prisma.wishlistItem.create({
      data: {
        ...data,
        userId,
        groupId,
      },
    });

    res.json({ item });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create wishlist item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/groups/:groupId/wishlist', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const userId = req.user!.userId;

    const membership = await prisma.groupMembership.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    const items = await prisma.wishlistItem.findMany({
      where: { groupId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        claim: {
          include: {
            claimedBy: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Filter out claim information for the item owner
    const filteredItems = items.map(item => {
      if (item.userId === userId) {
        // Hide claim details from the owner
        return {
          ...item,
          claim: item.claim ? { id: item.claim.id, itemId: item.claim.itemId, claimedAt: item.claim.claimedAt, isClaimed: true } : null,
        };
      }
      return item;
    });

    res.json({ items: filteredItems });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/wishlist/:itemId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { itemId } = req.params;
    const userId = req.user!.userId;
    const data = createWishlistItemSchema.partial().parse(req.body);

    const item = await prisma.wishlistItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (item.userId !== userId) {
      return res.status(403).json({ error: 'You can only edit your own wishlist items' });
    }

    const updatedItem = await prisma.wishlistItem.update({
      where: { id: itemId },
      data,
    });

    res.json({ item: updatedItem });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update wishlist item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/wishlist/:itemId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { itemId } = req.params;
    const userId = req.user!.userId;

    const item = await prisma.wishlistItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (item.userId !== userId) {
      return res.status(403).json({ error: 'You can only delete your own wishlist items' });
    }

    await prisma.wishlistItem.delete({
      where: { id: itemId },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete wishlist item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============ GIFT CLAIM ROUTES ============

app.post('/api/wishlist/:itemId/claim', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { itemId } = req.params;
    const userId = req.user!.userId;

    const item = await prisma.wishlistItem.findUnique({
      where: { id: itemId },
      include: { claim: true },
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (item.userId === userId) {
      return res.status(400).json({ error: 'You cannot claim your own wishlist items' });
    }

    if (item.claim) {
      return res.status(400).json({ error: 'Item already claimed' });
    }

    const claim = await prisma.giftClaim.create({
      data: {
        itemId,
        claimedById: userId,
      },
      include: {
        claimedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.json({ claim });
  } catch (error) {
    console.error('Claim item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/wishlist/:itemId/claim', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { itemId } = req.params;
    const userId = req.user!.userId;

    const claim = await prisma.giftClaim.findUnique({
      where: { itemId },
    });

    if (!claim) {
      return res.status(404).json({ error: 'No claim found' });
    }

    if (claim.claimedById !== userId) {
      return res.status(403).json({ error: 'You can only unclaim items you claimed' });
    }

    await prisma.giftClaim.delete({
      where: { itemId },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Unclaim item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============ START SERVER ============

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
