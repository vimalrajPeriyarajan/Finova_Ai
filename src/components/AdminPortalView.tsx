import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  AlertTriangle,
  Users,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  ExternalLink,
  Phone,
  Mail,
  X,
  FileCheck,
  Check,
  Clock,
} from 'lucide-react';
import { api } from '../services/apiClient';
import { Resource } from '../types/resource';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const AdminPortalView: React.FC = () => {
  const { user, isAdmin, switchUser } = useAuth();
  const { t } = useLanguage();

  const [stats, setStats] = useState<any | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'RESOURCES' | 'REPORTS'>('RESOURCES');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // New Resource Modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newResource, setNewResource] = useState({
    name: '',
    category: 'Banks',
    authority: 'RBI (Reserve Bank of India)',
    registrationNumber: '',
    address: '',
    coordinates: '72.8238, 18.9272', // default Mumbai
    phone: '',
    email: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchAdminData = async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const [statsRes, resRes, repRes] = await Promise.all([
        api.admin.getStats(),
        api.admin.getResources(),
        api.admin.getReports(),
      ]);

      if (statsRes.success && statsRes.data) setStats(statsRes.data);
      if (resRes.success && resRes.data) setResources(resRes.data);
      if (repRes.success && repRes.data) setReports(repRes.data);
    } catch (err) {
      console.error('Failed to load admin compliance data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [isAdmin]);

  const handleUpdateStatus = async (
    id: string,
    status: 'VERIFIED' | 'NEEDS_RECHECK' | 'UNVERIFIED'
  ) => {
    try {
      const res = await api.admin.verifyResource(id, status);
      if (res.success) {
        fetchAdminData();
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    const parts = newResource.coordinates.split(',').map((p) => parseFloat(p.trim()));
    if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
      setErrorMsg('Please enter coordinates in "longitude, latitude" format (e.g. 72.82, 18.92)');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await api.admin.createResource({
        name: newResource.name.trim(),
        category: newResource.category as any,
        authority: newResource.authority.trim(),
        registrationNumber: newResource.registrationNumber.trim() || undefined,
        address: newResource.address.trim(),
        location: {
          type: 'Point',
          coordinates: [parts[0], parts[1]],
        },
        phone: newResource.phone.trim() || undefined,
        email: newResource.email.trim() || undefined,
        verificationStatus: 'VERIFIED',
      });

      if (res.success) {
        setShowAddModal(false);
        fetchAdminData();
      } else {
        setErrorMsg(res.message || 'Failed to create resource');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Server error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveReport = async (reportId: string, resolution: 'RESOLVED' | 'DISMISSED') => {
    const adminNotes = prompt(
      `Enter resolution comments for this report (${resolution}):`,
      resolution === 'RESOLVED' ? 'Verified registry and updated listing.' : 'Investigated and found compliant.'
    );
    if (adminNotes === null) return;

    try {
      const res = await api.admin.resolveReport(reportId, resolution, adminNotes);
      if (res.success) {
        fetchAdminData();
      }
    } catch (err) {
      console.error('Failed to resolve report', err);
    }
  };

  // If not admin, show graceful switcher
  if (!isAdmin) {
    return (
      <div className="p-8 max-w-lg mx-auto my-12 bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">Administrator Access Required</h2>
          <p className="text-xs text-slate-500 mt-1">
            This module manages official regulator directory sync, verified badges, and community dispute resolution queues.
          </p>
        </div>
        <button
          onClick={() => switchUser('ADMIN')}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          id="admin-switch-btn"
        >
          Switch to Compliance Admin Demo
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Regulatory Compliance & Audit Portal
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-100 text-indigo-800 border border-indigo-200">
              Admin Privilege
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit RBI, SEBI, BIS and IBBI registries and manage community discrepancy reports.
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMsg(null);
            setShowAddModal(true);
          }}
          className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
          id="admin-new-resource-btn"
        >
          <Plus className="w-4 h-4" />
          <span>Add Verified Entity</span>
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs text-slate-500 font-medium">Platform Users</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{stats.totalUsers}</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-1">Multi-tenant isolation</div>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs text-slate-500 font-medium">Directory Entities</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{stats.totalResources}</div>
            <div className="text-[10px] text-indigo-600 font-semibold mt-1">
              {stats.verifiedResources} fully verified
            </div>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs text-slate-500 font-medium">Dispute Reports</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{stats.pendingReports}</div>
            <div className="text-[10px] text-amber-600 font-semibold mt-1">Needs inspection</div>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs text-slate-500 font-medium">Audit Protocol</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">Active</div>
            <div className="text-[10px] text-slate-400 mt-1">Quarterly re-verification</div>
          </div>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('RESOURCES')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
            activeTab === 'RESOURCES'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Registered Entities ({resources.length})
        </button>
        <button
          onClick={() => setActiveTab('REPORTS')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
            activeTab === 'REPORTS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Community Reports ({reports.length})
        </button>
      </div>

      {/* TAB 1: Registered Entities Management */}
      {activeTab === 'RESOURCES' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <span className="text-xs font-bold text-slate-800">Entities Registry</span>
            <span className="text-[11px] text-slate-400">Authorized by RBI, SEBI, BIS, IBBI</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-[11px] text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="p-3.5">Entity Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Authority & Reg #</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resources.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{r.name}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">{r.address}</div>
                    </td>
                    <td className="p-3.5 font-medium text-slate-700">{r.category}</td>
                    <td className="p-3.5">
                      <div className="text-slate-800 font-semibold">{r.authority}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {r.registrationNumber || 'Pending Reg #'}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.verificationStatus === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.verificationStatus === 'NEEDS_RECHECK'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {r.verificationStatus}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                      {r.verificationStatus !== 'VERIFIED' && (
                        <button
                          onClick={() => handleUpdateStatus(r.id, 'VERIFIED')}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-[11px] transition-colors"
                        >
                          Verify
                        </button>
                      )}
                      {r.verificationStatus !== 'NEEDS_RECHECK' && (
                        <button
                          onClick={() => handleUpdateStatus(r.id, 'NEEDS_RECHECK')}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-lg text-[11px] transition-colors"
                        >
                          Flag Recheck
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Community Reports Queue */}
      {activeTab === 'REPORTS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <span className="text-xs font-bold text-slate-800">Community Discrepancy Queue</span>
            <span className="text-[11px] text-slate-400">Reports submitted by active users</span>
          </div>

          <div className="divide-y divide-slate-100">
            {reports.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No active discrepancy reports in queue.
              </div>
            ) : (
              reports.map((rep) => (
                <div key={rep.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        {rep.issueType}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        Listing ID: {rep.resourceId}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(rep.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      "{rep.notes}"
                    </p>

                    <div className="text-[11px] text-slate-400">
                      Status:{' '}
                      <span
                        className={`font-semibold ${
                          rep.status === 'PENDING'
                            ? 'text-amber-600'
                            : rep.status === 'RESOLVED'
                            ? 'text-emerald-600'
                            : 'text-slate-500'
                        }`}
                      >
                        {rep.status}
                      </span>
                      {rep.adminNotes && ` — Note: ${rep.adminNotes}`}
                    </div>
                  </div>

                  {rep.status === 'PENDING' && (
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <button
                        onClick={() => handleResolveReport(rep.id, 'RESOLVED')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                      >
                        Resolve & Update
                      </button>
                      <button
                        onClick={() => handleResolveReport(rep.id, 'DISMISSED')}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Add New Resource Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Add Registered Financial Entity</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateResource} className="p-5 space-y-3 overflow-y-auto">
              {errorMsg && (
                <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl text-xs">{errorMsg}</div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Entity Name *</label>
                <input
                  type="text"
                  value={newResource.name}
                  onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
                  placeholder="e.g. HDFC Bank Fort Branch"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newResource.category}
                    onChange={(e) => setNewResource({ ...newResource, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Banks">Banks</option>
                    <option value="Investment Advisers">Investment Advisers</option>
                    <option value="Jewellers">Jewellers</option>
                    <option value="Registered Valuers">Registered Valuers</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Land Registration Offices">Land Registration Offices</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Regulator / Authority *</label>
                  <input
                    type="text"
                    value={newResource.authority}
                    onChange={(e) => setNewResource({ ...newResource, authority: e.target.value })}
                    placeholder="e.g. RBI, SEBI, BIS"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Registration Number
                </label>
                <input
                  type="text"
                  value={newResource.registrationNumber}
                  onChange={(e) => setNewResource({ ...newResource, registrationNumber: e.target.value })}
                  placeholder="e.g. INA000018902 / RBI-B-0492"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Physical Address *</label>
                <input
                  type="text"
                  value={newResource.address}
                  onChange={(e) => setNewResource({ ...newResource, address: e.target.value })}
                  placeholder="Street, Landmark, City, State, PIN"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  GPS Coordinates (longitude, latitude) *
                </label>
                <input
                  type="text"
                  value={newResource.coordinates}
                  onChange={(e) => setNewResource({ ...newResource, coordinates: e.target.value })}
                  placeholder="e.g. 72.8238, 18.9272"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <span className="text-[10px] text-slate-400">
                  GeoJSON standard: Longitude first, then Latitude.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={newResource.phone}
                    onChange={(e) => setNewResource({ ...newResource, phone: e.target.value })}
                    placeholder="022-XXXXXXX"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Official Email</label>
                  <input
                    type="email"
                    value={newResource.email}
                    onChange={(e) => setNewResource({ ...newResource, email: e.target.value })}
                    placeholder="branch@domain.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                  id="submit-new-resource-btn"
                >
                  {isSubmitting ? 'Registering...' : 'Confirm & Publish to Directory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
