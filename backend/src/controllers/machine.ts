import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllMachines = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search } = req.query;
    const machines = await prisma.machineInstallation.findMany({
      where: search ? {
        OR: [
          { serialNumber: { contains: search as string } },
          { machineName: { contains: search as string } },
          { customer: { companyName: { contains: search as string } } }
        ]
      } : {},
      include: { customer: true }
    });
    res.json(machines);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createMachine = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      serialNumber, machineName, installationDate, 
      customerId, manualCustomer, amount, 
      warrantyStartDate, warrantyEndDate, 
      amcStartDate, amcEndDate,
      contractType,
      probe1Model, probe1Serial,
      probe2Model, probe2Serial,
      probe3Model, probe3Serial,
      probe4Model, probe4Serial,
      probe5Model, probe5Serial,
      otherDevice
    } = req.body;

    let finalCustomerId = customerId;

    // Handle manual customer creation if requested
    if (!customerId && manualCustomer) {
      const { companyName, contactName, phone, address, email } = manualCustomer;
      
      // Create a placeholder user for the manual customer
      const newUser = await prisma.user.create({
        data: {
          email: email || `cust_${Date.now()}@ultaserve.com`,
          passwordHash: 'manual_entry_no_login',
          role: 'CUSTOMER',
          isActive: false
        }
      });

      const newCustomer = await prisma.customer.create({
        data: {
          userId: newUser.id,
          companyName,
          contactName: contactName || 'Primary Contact',
          phone: phone || '0000000000',
          address: address || 'N/A',
          email
        }
      });
      finalCustomerId = newCustomer.id;
    }

    const machine = await prisma.machineInstallation.create({
      data: {
        serialNumber,
        machineName,
        installationDate: new Date(installationDate),
        customerId: finalCustomerId,
        amount: amount ? parseFloat(amount) : 0,
        warrantyStartDate: warrantyStartDate ? new Date(warrantyStartDate) : null,
        warrantyEndDate: warrantyEndDate ? new Date(warrantyEndDate) : null,
        amcStartDate: amcStartDate ? new Date(amcStartDate) : null,
        amcEndDate: amcEndDate ? new Date(amcEndDate) : null,
        contractType: contractType || 'WARRANTY',
        status: 'ACTIVE',
        probe1Model, probe1Serial,
        probe2Model, probe2Serial,
        probe3Model, probe3Serial,
        probe4Model, probe4Serial,
        probe5Model, probe5Serial,
        otherDevice
      }
    });
    res.status(201).json(machine);
  } catch (error) {
    console.error('Create machine error:', error);
    res.status(500).json({ message: 'Server error: ' + (error as any).message });
  }
};

export const updateMachine = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    
    // Parse numeric and date fields
    if (data.amount) data.amount = parseFloat(data.amount);
    if (data.installationDate) data.installationDate = new Date(data.installationDate);
    if (data.warrantyStartDate) data.warrantyStartDate = new Date(data.warrantyStartDate);
    if (data.warrantyEndDate) data.warrantyEndDate = new Date(data.warrantyEndDate);
    if (data.amcStartDate) data.amcStartDate = new Date(data.amcStartDate);
    if (data.amcEndDate) data.amcEndDate = new Date(data.amcEndDate);

    const machine = await prisma.machineInstallation.update({
      where: { id: id as string },
      data
    });
    res.json(machine);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteMachine = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.machineInstallation.delete({ where: { id: id as string } });
    res.json({ message: 'Machine deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
