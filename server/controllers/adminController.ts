import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../config/database';

export const getAdminStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const totalUsers = db.users.count((u) => u.role !== 'ADMIN');
    const totalResources = db.resources.count((r) => !r.isArchived);
    const verifiedResources = db.resources.count((r) => !r.isArchived && r.verificationStatus === 'VERIFIED');
    const unverifiedResources = db.resources.count((r) => !r.isArchived && r.verificationStatus === 'UNVERIFIED');
    const needsRecheck = db.resources.count((r) => !r.isArchived && r.verificationStatus === 'NEEDS_RECHECK');
    const totalReports = db.resourceReports.count();
    const pendingReports = db.resourceReports.count((r) => r.status === 'PENDING');
    const publishedArticles = db.financialArticles.count((a) => a.isPublished);

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalResources,
        verifiedResources,
        unverifiedResources,
        needsRecheck,
        totalReports,
        pendingReports,
        publishedArticles,
      },
    });
  } catch (err: any) {
    console.error('Admin stats error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve admin stats' });
  }
};

export const createResource = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name,
      category,
      authority,
      registrationNumber,
      address,
      phone,
      email,
      coordinates,
      verificationStatus,
      sourceNotice,
    } = req.body;

    if (!name || !category || !authority || !address) {
      return res.status(400).json({
        success: false,
        message: 'Name, category, authority, and address are required',
      });
    }

    const coords = Array.isArray(coordinates) && coordinates.length === 2
      ? [Number(coordinates[0]), Number(coordinates[1])]
      : [72.8238, 18.9272]; // Default fallback

    const newResource = await db.resources.insert({
      name: name.trim(),
      category: category.trim(),
      authority: authority.trim(),
      registrationNumber: registrationNumber ? registrationNumber.trim() : '',
      address: address.trim(),
      phone: phone ? phone.trim() : '',
      email: email ? email.trim() : '',
      location: {
        type: 'Point',
        coordinates: coords as [number, number],
      },
      verificationStatus: verificationStatus || 'UNVERIFIED',
      lastVerifiedAt: verificationStatus === 'VERIFIED' ? new Date().toISOString() : null,
      verifiedBy: verificationStatus === 'VERIFIED' ? req.user?.userId : null,
      sourceNotice: sourceNotice || 'Administrative Registry Entry',
      isArchived: false,
    });

    return res.status(201).json({
      success: true,
      message: 'Resource registered successfully',
      data: newResource,
    });
  } catch (err: any) {
    console.error('Admin create resource error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create resource' });
  }
};

export const updateResource = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const existing = await db.resources.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    const updated = await db.resources.updateById(id, updates);

    return res.status(200).json({
      success: true,
      message: 'Resource updated successfully',
      data: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update resource' });
  }
};

export const updateVerificationStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { verificationStatus } = req.body;

    if (!['VERIFIED', 'UNVERIFIED', 'NEEDS_RECHECK'].includes(verificationStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be VERIFIED, UNVERIFIED, or NEEDS_RECHECK',
      });
    }

    const existing = await db.resources.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    const updated = await db.resources.updateById(id, {
      verificationStatus,
      lastVerifiedAt: verificationStatus === 'VERIFIED' ? new Date().toISOString() : existing.lastVerifiedAt,
      verifiedBy: req.user?.userId,
    });

    return res.status(200).json({
      success: true,
      message: `Resource status updated to ${verificationStatus}`,
      data: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update verification status' });
  }
};

export const archiveResource = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isArchived } = req.body;

    const existing = await db.resources.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    const updated = await db.resources.updateById(id, {
      isArchived: isArchived !== undefined ? Boolean(isArchived) : true,
    });

    return res.status(200).json({
      success: true,
      message: updated?.isArchived ? 'Resource archived' : 'Resource unarchived',
      data: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to archive resource' });
  }
};

export const getReports = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.query;

    const reports = await db.resourceReports.find((r) => {
      if (status && status !== 'ALL' && r.status !== status) return false;
      return true;
    });

    reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.status(200).json({ success: true, data: reports });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve reports' });
  }
};

export const resolveReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!['RESOLVED', 'DISMISSED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be RESOLVED or DISMISSED',
      });
    }

    const report = await db.resourceReports.findById(id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const updated = await db.resourceReports.updateById(id, {
      status,
      adminNotes: adminNotes ? adminNotes.trim() : '',
      resolvedAt: new Date().toISOString(),
    });

    // Notify the user who reported this
    await db.notifications.insert({
      userId: report.reportedBy,
      type: 'REPORT_UPDATE',
      title: 'Report Update',
      message: `Your report regarding "${report.resourceName}" was reviewed by our verification team and marked as ${status}.`,
      isRead: false,
      relatedEntityId: report.resourceId,
    });

    return res.status(200).json({
      success: true,
      message: `Report marked as ${status}`,
      data: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to resolve report' });
  }
};

export const createArticle = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category, title, shortExplanation, example, keyPoints, source, language } = req.body;

    if (!category || !title || !shortExplanation) {
      return res.status(400).json({ success: false, message: 'Category, title, and explanation required' });
    }

    const newArticle = await db.financialArticles.insert({
      category,
      title: title.trim(),
      shortExplanation: shortExplanation.trim(),
      example: example ? example.trim() : '',
      keyPoints: Array.isArray(keyPoints) ? keyPoints : [],
      source: source || 'Finova Financial Education',
      language: language || 'en',
      isPublished: true,
    });

    return res.status(201).json({
      success: true,
      message: 'Article created successfully',
      data: newArticle,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to create article' });
  }
};

export const updateArticle = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const existing = await db.financialArticles.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    const updated = await db.financialArticles.updateById(id, updates);

    return res.status(200).json({
      success: true,
      message: 'Article updated successfully',
      data: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update article' });
  }
};
