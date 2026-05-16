import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import https from 'https';

const prisma = new PrismaClient();

// Helper for reverse geocoding using Nominatim
const reverseGeocode = (lat: number, lon: number): Promise<string | null> => {
  return new Promise((resolve) => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
    
    const options = {
      headers: {
        'User-Agent': 'ERP-Tracking-App' // Nominatim requires a user agent
      }
    };

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.display_name || null);
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', (err) => {
      console.error('Geocoding error:', err);
      resolve(null);
    });
  });
};

// POST /api/tracking/update
export const updateLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId, latitude, longitude, batteryLevel } = req.body;

    if (!employeeId || latitude === undefined || longitude === undefined) {
      res.status(400).json({ message: 'Missing required location fields' });
      return;
    }

    // Try to get address
    const address = await reverseGeocode(latitude, longitude);

    const log = await prisma.gpsLog.create({
      data: {
        employeeId,
        latitude,
        longitude,
        address,
        batteryLevel
      }
    });

    // Fetch employee name for the socket update
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { firstName: true, lastName: true }
    });

    // Notify admin via socket
    const io = req.app.get('socketio');
    if (io) {
      io.emit('employeeLocationUpdate', {
        employeeId,
        name: employee ? `${employee.firstName} ${employee.lastName}` : 'Employee',
        latitude,
        longitude,
        address,
        batteryLevel,
        timestamp: log.timestamp
      });
    }

    res.status(201).json({ message: 'Location updated', log });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/tracking/active
// For simplicity, we fetch the latest log for each employee from today.
export const getActiveLocations = async (req: Request, res: Response): Promise<void> => {
  try {
    // In a real production system, you might want a "LatestLocation" table or use Redis.
    // Here we query the latest GpsLog per employee.
    const employees = await prisma.employee.findMany({
      where: {
        user: {
          isActive: true
        }
      },
      include: {
        user: { select: { email: true, role: true } },
        gpsLogs: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      }
    });

    const activeLocations = employees
      .filter(emp => emp.gpsLogs.length > 0)
      .map(emp => ({
        employeeId: emp.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.user.email,
        role: emp.user.role,
        latitude: emp.gpsLogs[0].latitude,
        longitude: emp.gpsLogs[0].longitude,
        address: emp.gpsLogs[0].address,
        batteryLevel: emp.gpsLogs[0].batteryLevel,
        timestamp: emp.gpsLogs[0].timestamp
      }));

    res.json(activeLocations);
  } catch (error) {
    console.error('Get active locations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
