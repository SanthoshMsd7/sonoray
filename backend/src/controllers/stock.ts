import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const stock = await prisma.stock.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(stock);
  } catch (error) {
    console.error('Get stock error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      stockId, machineName, category, quantity, warehouseLocation, 
      supplierName, purchaseDate, unitPrice, stockStatus,
      make, modelNumber, serialNumber, technicalSpecs
    } = req.body;

    const newStock = await prisma.stock.create({
      data: {
        stockId,
        machineName,
        category,
        quantity: quantity ? parseInt(quantity.toString()) : 0,
        warehouseLocation,
        supplierName,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        unitPrice: unitPrice ? parseFloat(unitPrice.toString()) : 0,
        stockStatus: stockStatus || 'IN_STOCK',
        make,
        modelNumber,
        serialNumber,
        technicalSpecs
      }
    });

    res.status(201).json(newStock);
  } catch (error) {
    console.error('Create stock error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { 
      stockId, machineName, category, quantity, warehouseLocation, 
      supplierName, purchaseDate, unitPrice, stockStatus,
      make, modelNumber, serialNumber, technicalSpecs
    } = req.body;

    const updatedStock = await prisma.stock.update({
      where: { id },
      data: {
        stockId,
        machineName,
        category,
        quantity: quantity ? parseInt(quantity.toString()) : 0,
        warehouseLocation,
        supplierName,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        unitPrice: unitPrice ? parseFloat(unitPrice.toString()) : 0,
        stockStatus: stockStatus || 'IN_STOCK',
        make,
        modelNumber,
        serialNumber,
        technicalSpecs
      }
    });

    res.json(updatedStock);
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    await prisma.stock.delete({ where: { id } });
    res.json({ message: 'Stock item deleted' });
  } catch (error) {
    console.error('Delete stock error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
