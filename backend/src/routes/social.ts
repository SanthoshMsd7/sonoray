import { Router } from 'express';
import { getPosts, createPost, toggleLike, addComment } from '../controllers/social';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getPosts);
router.post('/', authenticate, createPost);
router.post('/:id/like', authenticate, toggleLike);
router.post('/:id/comment', authenticate, addComment);

export default router;
