import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/tickets — All tickets (Admin)
export const getAllTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    const tickets = await prisma.ticket.findMany({
      include: {
        customer: { select: { companyName: true, address: true } },
        machine: { select: { machineName: true, serialNumber: true } },
        assignedTo: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tickets);
  } catch (error) {
    console.error('Get all tickets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/tickets/my — Tickets assigned to current engineer
export const getMyTickets = async (req: any, res: Response): Promise<void> => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      res.json([]); // No employee record, no tickets
      return;
    }
    const tickets = await prisma.ticket.findMany({
      where: { assignedToId: employeeId },
      include: {
        customer: { select: { companyName: true, address: true } },
        machine: { select: { machineName: true, serialNumber: true } },
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tickets);
  } catch (error) {
    console.error('Get my tickets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/tickets/:id — Single ticket detail
export const getTicketById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const ticket = await prisma.ticket.findUnique({
      where: { id: id as string },
      include: {
        customer: { select: { companyName: true, address: true, phone: true } },
        machine: { select: { machineName: true, serialNumber: true, warrantyEndDate: true } },
        assignedTo: { select: { firstName: true, lastName: true, phone: true } },
        serviceReports: {
          include: { engineer: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!ticket) {
      res.status(404).json({ message: 'Ticket not found' });
      return;
    }
    res.json(ticket);
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/tickets — Create ticket (Admin/Manager)
export const createTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId, machineId, assignedToId, title, description, priority } = req.body;
    const ticket = await prisma.ticket.create({
      data: { customerId, machineId, assignedToId, title, description, priority }
    });
    res.status(201).json(ticket);
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/tickets/:id/status — Update ticket status
export const updateTicketStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const ticket = await prisma.ticket.update({
      where: { id: id as string },
      data: { status }
    });
    res.json(ticket);
  } catch (error) {
    console.error('Update ticket status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
