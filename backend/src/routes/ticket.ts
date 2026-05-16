import { Router } from 'express';
import { getAllTickets, getMyTickets, getTicketById, createTicket, updateTicketStatus } from '../controllers/ticket';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, authorize(['ADMIN', 'SUPER_ADMIN', 'SERVICE_MANAGER', 'SALES_MANAGER']), getAllTickets);
router.get('/my', authenticate, getMyTickets);
router.get('/:id', authenticate, getTicketById);
router.post('/', authenticate, authorize(['ADMIN', 'SUPER_ADMIN', 'SERVICE_MANAGER']), createTicket);
router.patch('/:id/status', authenticate, updateTicketStatus);

export default router;
