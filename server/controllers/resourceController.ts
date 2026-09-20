import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../config/database';

export const getResources = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category, verificationStatus, search } = req.query;

    const list = await db.resources.find((r) => {
      if (r.isArchived) return false;
      if (category && category !== 'ALL' && r.category !== category) return false;
      if (verificationStatus && verificationStatus !== 'ALL' && r.verificationStatus !== verificationStatus) return false;
      if (search) {
        const s = String(search).toLowerCase();
        const nameMatch = r.name.toLowerCase().includes(s);
        const addrMatch = r.address.toLowerCase().includes(s);
        const authMatch = r.authority.toLowerCase().includes(s);
        if (!nameMatch && !addrMatch && !authMatch) return false;
      }
      return true;
    });

    return res.status(200).json({ success: true, data: list });
  } catch (err: any) {
    console.error('Get resources error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve resources' });
  }
};

export const getNearbyResources = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { lng, lat, radiusKm, category, verificationStatus } = req.query;

    const parsedLng = parseFloat(String(lng));
    const parsedLat = parseFloat(String(lat));
    const maxRadius = Math.min(200, Math.max(1, parseFloat(String(radiusKm || '50'))));

    if (isNaN(parsedLng) || isNaN(parsedLat)) {
      return res.status(400).json({
        success: false,
        message: 'Valid longitude and latitude coordinates are required for GPS proximity search',
      });
    }

    const matches = await db.resources.findNear(parsedLng, parsedLat, maxRadius, (r) => {
      if (r.isArchived) return false;
      if (category && category !== 'ALL' && r.category !== category) return false;
      if (verificationStatus && verificationStatus !== 'ALL' && r.verificationStatus !== verificationStatus) return false;
      return true;
    });

    return res.status(200).json({
      success: true,
      data: matches,
      count: matches.length,
      searchCenter: [parsedLng, parsedLat],
      radiusKm: maxRadius,
    });
  } catch (err: any) {
    console.error('Nearby search error:', err);
    return res.status(500).json({ success: false, message: 'Failed to calculate nearby resources' });
  }
};

export const getResourceById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const resource = await db.resources.findById(id);

    if (!resource || resource.isArchived) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    return res.status(200).json({ success: true, data: resource });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch resource details' });
  }
};

export const reportResource = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { issueType, notes } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    const resource = await db.resources.findById(id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Target resource not found' });
    }

    if (!issueType || !notes || !notes.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Issue type and descriptive notes are required',
      });
    }

    const user = await db.users.findById(userId);

    const report = await db.resourceReports.insert({
      resourceId: id,
      resourceName: resource.name,
      reportedBy: userId,
      reporterName: user?.name || 'Community User',
      issueType,
      notes: notes.trim(),
      status: 'PENDING',
      adminNotes: '',
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you. Your report has been submitted to the compliance verification queue.',
      data: report,
    });
  } catch (err: any) {
    console.error('Report resource error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit report' });
  }
};
