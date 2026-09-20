import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../config/database';

export const getDocuments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    const { category } = req.query;
    const docs = await db.documents.find((d) => {
      if (d.userId !== userId) return false;
      if (category && category !== 'ALL' && d.category !== category) return false;
      return true;
    });

    docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Omit heavy dataBase64 from listing for fast bandwidth
    const list = docs.map(({ dataBase64, ...rest }) => rest);

    return res.status(200).json({ success: true, data: list });
  } catch (err: any) {
    console.error('Get documents error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve documents' });
  }
};

export const uploadDocument = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    const { name, category, fileSize, mimeType, dataBase64, notes } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Document name is required' });
    }

    const size = Number(fileSize) || 0;
    // Max 5 MB limit (5 * 1024 * 1024 bytes)
    if (size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'File exceeds the maximum allowed size of 5 MB',
      });
    }

    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];

    if (mimeType && !allowedMimeTypes.includes(mimeType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Supported formats: PDF, JPEG, PNG, WEBP, DOCX, TXT',
      });
    }

    const validCategories = ['Identity', 'Banking', 'Insurance', 'Education', 'Property', 'Other'];
    const validCat = validCategories.includes(category) ? category : 'Other';

    const newDoc = await db.documents.insert({
      userId,
      name: name.trim(),
      category: validCat,
      fileSize: size || 1024,
      mimeType: mimeType || 'application/pdf',
      dataBase64: dataBase64 || '',
      notes: notes ? notes.trim() : '',
    });

    const { dataBase64: _, ...safeDoc } = newDoc;

    return res.status(201).json({
      success: true,
      message: 'Document stored securely in private vault',
      data: safeDoc,
    });
  } catch (err: any) {
    console.error('Upload document error:', err);
    return res.status(500).json({ success: false, message: 'Failed to upload document' });
  }
};

export const getDocumentById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const doc = await db.documents.findById(id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Strict Ownership check
    if (doc.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden: Document access denied' });
    }

    return res.status(200).json({ success: true, data: doc });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch document' });
  }
};

export const deleteDocument = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const doc = await db.documents.findById(id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Ownership check
    if (doc.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this document' });
    }

    await db.documents.deleteById(id);

    return res.status(200).json({
      success: true,
      message: 'Document removed from private vault',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to delete document' });
  }
};
