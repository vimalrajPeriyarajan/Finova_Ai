import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  Upload,
  FileText,
  File,
  Image,
  Trash2,
  Eye,
  Download,
  AlertCircle,
  CheckCircle2,
  Shield,
  X,
  Plus,
} from 'lucide-react';
import { api } from '../services/apiClient';
import { FinancialDocument } from '../types/education';
import { useLanguage } from '../context/LanguageContext';

const VAULT_CATEGORIES = ['ALL', 'Identity', 'Banking', 'Insurance', 'Education', 'Property', 'Other'];

export const DocumentVaultView: React.FC = () => {
  const { t } = useLanguage();

  const [documents, setDocuments] = useState<FinancialDocument[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Upload modal
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [docCategory, setDocCategory] = useState<string>('Identity');
  const [docNotes, setDocNotes] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Preview Modal
  const [previewDoc, setPreviewDoc] = useState<FinancialDocument | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await api.documents.getAll(selectedCategory !== 'ALL' ? selectedCategory : undefined);
      if (res.success && res.data) {
        setDocuments(res.data);
      }
    } catch (err) {
      console.error('Failed to load vault documents', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [selectedCategory]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      // 5 MB limit
      if (f.size > 5 * 1024 * 1024) {
        setUploadError('File size exceeds the 5 MB limit');
        setFileToUpload(null);
        return;
      }
      setUploadError(null);
      setFileToUpload(f);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToUpload) {
      setUploadError('Please choose a file to encrypt & upload');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Convert file to Base64 for safe transit
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = (reader.result as string) || '';

        const res = await api.documents.upload({
          name: fileToUpload.name,
          category: docCategory as any,
          fileSize: fileToUpload.size,
          mimeType: fileToUpload.type,
          dataBase64: base64Data,
          notes: docNotes,
        });

        if (res.success) {
          setShowUploadModal(false);
          setFileToUpload(null);
          setDocNotes('');
          fetchDocuments();
        } else {
          setUploadError(res.message || 'Upload failed');
        }
        setIsUploading(false);
      };

      reader.onerror = () => {
        setUploadError('Failed to read file from disk');
        setIsUploading(false);
      };

      reader.readAsDataURL(fileToUpload);
    } catch (err: any) {
      setUploadError(err?.message || 'Server error');
      setIsUploading(false);
    }
  };

  const handleViewDocument = async (doc: FinancialDocument) => {
    setIsLoadingPreview(true);
    try {
      const res = await api.documents.getById(doc.id);
      if (res.success && res.data) {
        setPreviewDoc(res.data);
      }
    } catch (err) {
      console.error('Failed to load document content', err);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this document from your vault?')) return;
    try {
      await api.documents.delete(id);
      fetchDocuments();
    } catch (err) {
      console.error('Delete document error', err);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Personal Document Vault
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-100 text-indigo-800 border border-indigo-200">
              Zero-Exposure Storage
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Store PAN, Aadhaar, bank statements, insurance policies & offer letters with strict user isolation.
          </p>
        </div>

        <button
          onClick={() => {
            setFileToUpload(null);
            setUploadError(null);
            setShowUploadModal(true);
          }}
          className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
          id="vault-upload-btn"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Security Reassurance Notice */}
      <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-start space-x-3 shadow-md">
        <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs space-y-0.5">
          <span className="font-bold text-emerald-400">Strict Cryptographic User Isolation</span>
          <p className="text-slate-300 leading-relaxed">
            Your documents are never served through public URLs. Every document request verifies your active JWT signature and checks resource ownership against your unique database ID before streaming.
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
        {VAULT_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat === 'ALL' ? 'All Folders' : cat}
          </button>
        ))}
      </div>

      {/* Documents Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-500">Loading your private vault...</div>
      ) : documents.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
          <Lock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">Your Vault is Empty</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Upload emergency medical insurance cards, PAN or Aadhaar copies, or educational certificates for safekeeping.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => {
            const isImage = doc.mimeType?.startsWith('image/');
            const isPdf = doc.mimeType === 'application/pdf';

            return (
              <div
                key={doc.id}
                className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                      {isImage ? (
                        <Image className="w-5 h-5" />
                      ) : isPdf ? (
                        <FileText className="w-5 h-5" />
                      ) : (
                        <File className="w-5 h-5" />
                      )}
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleViewDocument(doc)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg"
                        title="View / Decrypt"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                        title="Delete permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <h4 className="text-xs font-bold text-slate-900 truncate" title={doc.name}>
                      {doc.name}
                    </h4>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-1">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">
                        {doc.category}
                      </span>
                      <span>•</span>
                      <span>{formatBytes(doc.fileSize)}</span>
                    </div>
                  </div>

                  {doc.notes && (
                    <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {doc.notes}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                  <button
                    onClick={() => handleViewDocument(doc)}
                    className="text-indigo-600 font-bold hover:underline"
                  >
                    Open
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Upload to Private Vault</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-5 space-y-4">
              {uploadError && (
                <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* File Drop / Select Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/50 hover:bg-indigo-50/30 transition-all"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.txt"
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                {fileToUpload ? (
                  <div>
                    <span className="text-xs font-bold text-slate-900 block truncate">
                      {fileToUpload.name}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {formatBytes(fileToUpload.size)} • Click to change
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Click to choose document
                    </span>
                    <span className="text-[11px] text-slate-400">
                      PDF, JPEG, PNG or DOCX (Max 5 MB)
                    </span>
                  </div>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Folder Category</label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                >
                  {VAULT_CATEGORIES.filter((c) => c !== 'ALL').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Private Note / Tag (Optional)
                </label>
                <input
                  type="text"
                  value={docNotes}
                  onChange={(e) => setDocNotes(e.target.value)}
                  placeholder="e.g. Health insurance valid till 2027"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                  id="vault-confirm-upload-btn"
                >
                  {isUploading ? 'Securing & Encrypting...' : 'Secure & Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900 truncate max-w-md">
                  {previewDoc.name}
                </h3>
                <span className="text-[11px] text-slate-500">
                  {previewDoc.category} • {formatBytes(previewDoc.fileSize)}
                </span>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-100/50 min-h-[300px]">
              {previewDoc.dataBase64 ? (
                previewDoc.mimeType?.startsWith('image/') ? (
                  <img
                    src={previewDoc.dataBase64}
                    alt={previewDoc.name}
                    className="max-h-[60vh] max-w-full rounded-lg object-contain shadow-xs"
                  />
                ) : (
                  <div className="text-center p-8 bg-white rounded-xl border border-slate-200 max-w-md shadow-xs space-y-3">
                    <FileText className="w-12 h-12 text-indigo-600 mx-auto" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{previewDoc.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {previewDoc.mimeType || 'application/pdf'}
                      </p>
                    </div>
                    <a
                      href={previewDoc.dataBase64}
                      download={previewDoc.name}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Document</span>
                    </a>
                  </div>
                )
              ) : (
                <div className="text-xs text-slate-500">Document preview not available</div>
              )}
            </div>

            <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs bg-slate-50">
              <span className="text-slate-500">Note: {previewDoc.notes || 'None'}</span>
              {previewDoc.dataBase64 && (
                <a
                  href={previewDoc.dataBase64}
                  download={previewDoc.name}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
