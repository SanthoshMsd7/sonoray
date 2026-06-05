import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getPosts = async (req: Request, res: Response) => {
  try {
    const posts = await prisma.socialPost.findMany({
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            designation: true,
            department: true
          }
        },
        likes: true,
        comments: {
          include: {
            employee: {
              select: {
                firstName: true,
                lastName: true,
                designation: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Error fetching posts' });
  }
};

export const createPost = async (req: Request, res: Response) => {
  const { content, mediaUrl, mediaType } = req.body;
  const userId = (req as any).user.userId;

  try {
    let employee = await prisma.employee.findUnique({ where: { userId } });
    
    // Self-healing skeleton employee profile creation if missing (e.g. for super admins)
    if (!employee) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        employee = await prisma.employee.create({
          data: {
            userId: user.id,
            firstName: user.email.split('@')[0],
            lastName: 'User',
            designation: user.role || 'Admin',
            joiningDate: new Date()
          }
        });
      }
    }

    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const post = await prisma.socialPost.create({
      data: {
        content,
        mediaUrl,
        mediaType: mediaType || 'NONE',
        authorId: employee.id
      },
      include: {
        author: true,
        likes: true,
        comments: {
          include: {
            employee: {
              select: {
                firstName: true,
                lastName: true,
                designation: true
              }
            }
          }
        }
      }
    });

    // Broadcast to all connected users via socket.io
    const io = req.app.get('socketio');
    io.emit('newSocialPost', post);

    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Error creating post' });
  }
};

export const toggleLike = async (req: Request, res: Response) => {
  const postId = req.params.id as string;
  const userId = (req as any).user.userId;

  try {
    const employee = await prisma.employee.findUnique({ where: { userId } });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const existingLike = await prisma.socialLike.findUnique({
      where: {
        postId_employeeId: {
          postId,
          employeeId: employee.id
        }
      }
    });

    const io = req.app.get('socketio');

    if (existingLike) {
      await prisma.socialLike.delete({
        where: {
          id: existingLike.id
        }
      });
      
      // Broadcast unlike update to all connected users
      io.emit('socialPostLiked', { postId, employeeId: employee.id, action: 'UNLIKE' });

      return res.json({ message: 'Post unliked successfully', liked: false });
    } else {
      const newLike = await prisma.socialLike.create({
        data: {
          postId,
          employeeId: employee.id
        }
      });

      // Broadcast like update to all connected users
      io.emit('socialPostLiked', { postId, employeeId: employee.id, action: 'LIKE', like: newLike });

      return res.status(201).json({ message: 'Post liked successfully', liked: true, like: newLike });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ message: 'Error toggling like' });
  }
};

export const addComment = async (req: Request, res: Response) => {
  const postId = req.params.id as string;
  const { content } = req.body;
  const userId = (req as any).user.userId;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Comment content cannot be empty' });
  }

  try {
    const employee = await prisma.employee.findUnique({ where: { userId } });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const comment = await prisma.socialComment.create({
      data: {
        postId,
        employeeId: employee.id,
        content: content.trim()
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            designation: true
          }
        }
      }
    });

    // Broadcast comment update to all connected users
    const io = req.app.get('socketio');
    io.emit('socialPostCommented', { postId, comment });

    return res.status(201).json(comment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Error adding comment' });
  }
};

export const deletePost = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const userId = (req as any).user.userId;

  try {
    const employee = await prisma.employee.findUnique({ where: { userId } });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const post = await prisma.socialPost.findUnique({ where: { id } });
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Allow deletion if the user is the author OR if they are an admin/super_admin
    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
    if (post.authorId !== employee.id && !isAdmin) {
      return res.status(403).json({ message: 'Unauthorized to delete this post' });
    }

    await prisma.socialPost.delete({ where: { id } });

    // Broadcast delete event to all connected users
    const io = req.app.get('socketio');
    io.emit('socialPostDeleted', { postId: id });

    return res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    return res.status(500).json({ message: 'Error deleting post' });
  }
};
