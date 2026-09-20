import React, { useState, useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import {
  MapPin,
  ShieldCheck,
  Building2,
  Gem,
  Award,
  FileCheck2,
  Landmark,
  Phone,
  Mail,
  Navigation as NavigationIcon,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  ExternalLink,
  X,
  Compass,
} from 'lucide-react';
import { api } from '../services/apiClient';
import { Resource } from '../types/resource';
import { useLanguage } from '../context/LanguageContext';

const RESOURCE_CATEGORIES = [
  'ALL',
  'Banks',
  'Investment Advisers',
  'Jewellers',
  'Registered Valuers',
  'Insurance',
  'Land Registration Offices',
];

const PRESET_CITIES = [
  { name: 'Mumbai', coordinates: [72.8238, 18.9272] },
  { name: 'Delhi', coordinates: [77.2195, 28.6315] },
  { name: 'Bengaluru', coordinates: [77.6084, 12.9754] },
  { name: 'Chennai', coordinates: [80.2612, 13.0628] },
  { name: 'Hyderabad', coordinates: [78.4619, 17.4241] },
  { name: 'Kolkata', coordinates: [88.3512, 22.5489] },
];

export const ResourceMapView: React.FC = () => {
  const { t } = useLanguage();

  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [verificationFilter, setVerificationFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeResource, setActiveResource] = useState<Resource | null>(null);

  // Proximity search state
  const [searchCenter, setSearchCenter] = useState<[number, number]>([72.8238, 18.9272]); // default Mumbai
  const [radiusKm, setRadiusKm] = useState<number>(50);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Report Modal
  const [reportingResource, setReportingResource] = useState<Resource | null>(null);
  const [reportIssueType, setReportIssueType] = useState<string>('WRONG_ADDRESS');
  const [reportNotes, setReportNotes] = useState<string>('');
  const [reportSuccess, setReportSuccess] = useState<boolean>(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState<boolean>(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // Fetch Resources (nearby query)
  const fetchResources = async () => {
    setIsLoading(true);
    try {
      const res = await api.resources.getNearby({
        lng: searchCenter[0],
        lat: searchCenter[1],
        radiusKm,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
      });

      if (res.success && res.data) {
        let filtered = res.data;
        if (verificationFilter !== 'ALL') {
          filtered = filtered.filter((r) => r.verificationStatus === verificationFilter);
        }
        if (searchQuery) {
          const s = searchQuery.toLowerCase();
          filtered = filtered.filter(
            (r) =>
              r.name.toLowerCase().includes(s) ||
              r.address.toLowerCase().includes(s) ||
              r.authority.toLowerCase().includes(s)
          );
        }
        setResources(filtered);
      }
    } catch (err) {
      console.error('Failed to fetch nearby resources', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [searchCenter, radiusKm, selectedCategory, verificationFilter, searchQuery]);

  // Initialize MapLibre GL Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Use free OpenStreetMap style raster/vector tiles
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: [
              'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: searchCenter,
      zoom: 11,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map center when searchCenter changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: searchCenter,
        zoom: 11,
        essential: true,
      });
    }
  }, [searchCenter]);

  // Update Map Markers when resources change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add new markers
    resources.forEach((r) => {
      const [lng, lat] = r.location.coordinates;
      const isVerified = r.verificationStatus === 'VERIFIED';

      // Custom marker DOM element
      const el = document.createElement('div');
      el.className = 'cursor-pointer transform hover:scale-110 transition-transform';
      el.innerHTML = `
        <div class="flex items-center justify-center w-8 h-8 rounded-full ${
          isVerified ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
        } shadow-md border-2 border-white">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      `;

      el.addEventListener('click', () => {
        setActiveResource(r);
        mapInstanceRef.current?.flyTo({
          center: [lng, lat],
          zoom: 14,
        });
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(mapInstanceRef.current!);

      markersRef.current.push(marker);
    });
  }, [resources]);

  // GPS Geolocation Handler
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setSearchCenter([pos.coords.longitude, pos.coords.latitude]);
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation failed or permission denied:', err);
        alert('Could not determine your GPS location. Please select a city above.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleOpenReport = (r: Resource) => {
    setReportingResource(r);
    setReportIssueType('WRONG_ADDRESS');
    setReportNotes('');
    setReportSuccess(false);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingResource || !reportNotes.trim()) return;

    setIsSubmittingReport(true);
    try {
      const res = await api.resources.report(reportingResource.id, {
        issueType: reportIssueType,
        notes: reportNotes.trim(),
      });
      if (res.success) {
        setReportSuccess(true);
        setTimeout(() => {
          setReportingResource(null);
          setReportSuccess(false);
        }, 2000);
      }
    } catch (err) {
      console.error('Report submission error', err);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Geolocation Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Verified Financial Discovery
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
              GeoJSON 2dsphere
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Discover RBI banks, SEBI advisers, BIS jewellers, IBBI valuers & land registry offices.
          </p>
        </div>

        <button
          onClick={handleLocateMe}
          disabled={isLocating}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors self-start sm:self-auto disabled:opacity-50"
          id="gps-locate-btn"
        >
          <Compass className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Detecting GPS...' : 'Find Near Me'}</span>
        </button>
      </div>

      {/* Preset Hubs & Filter Bar */}
      <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* City Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex-shrink-0">
            Hubs:
          </span>
          {PRESET_CITIES.map((city) => (
            <button
              key={city.name}
              onClick={() => setSearchCenter(city.coordinates as [number, number])}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                searchCenter[0] === city.coordinates[0]
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {city.name}
            </button>
          ))}
        </div>

        {/* Search, Categories & Status */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, authority, or area..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
              id="search-resources-input"
            />
          </div>

          <div className="flex items-center space-x-2">
            {/* Category Select */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500"
              id="filter-res-category"
            >
              {RESOURCE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === 'ALL' ? 'All Authorities' : c}
                </option>
              ))}
            </select>

            {/* Verification Status */}
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500"
              id="filter-res-status"
            >
              <option value="ALL">All Statuses</option>
              <option value="VERIFIED">Verified Only</option>
              <option value="NEEDS_RECHECK">Needs Recheck</option>
              <option value="UNVERIFIED">Unverified</option>
            </select>
          </div>
        </div>
      </div>

      {/* Map & Resource List Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Map Canvas (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[480px]">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Interactive Geospatial Map (MapLibre GL)</span>
            </div>
            <div className="flex items-center space-x-2 text-[11px]">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span className="text-slate-600">Verified</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span className="text-slate-600">Review/Community</span>
              </span>
            </div>
          </div>

          <div ref={mapContainerRef} className="w-full flex-1" />
        </div>

        {/* Selected / Nearby List (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col h-[480px] bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <span className="text-xs font-bold text-slate-800">
              Nearby Results ({resources.length})
            </span>
            <span className="text-[11px] text-slate-500">Radius: {radiusKm} km</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
            {isLoading ? (
              <div className="p-12 text-center text-xs text-slate-500">Searching coordinates...</div>
            ) : resources.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                No matching financial resources found in this radius. Try selecting another city or increasing range.
              </div>
            ) : (
              resources.map((r) => {
                const isVerified = r.verificationStatus === 'VERIFIED';
                const isSelected = activeResource?.id === r.id;

                return (
                  <div
                    key={r.id}
                    onClick={() => {
                      setActiveResource(r);
                      mapInstanceRef.current?.flyTo({
                        center: r.location.coordinates,
                        zoom: 14,
                      });
                    }}
                    className={`p-3.5 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-50/80 border border-emerald-300'
                        : 'hover:bg-slate-50/80 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 leading-tight">{r.name}</h4>
                        <div className="flex items-center space-x-1.5 mt-1 text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-700">{r.category}</span>
                          {r.distanceKm !== undefined && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-700 font-bold">{r.distanceKm} km away</span>
                            </>
                          )}
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold flex-shrink-0 flex items-center space-x-1 ${
                          isVerified
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isVerified && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        <span>{r.verificationStatus}</span>
                      </span>
                    </div>

                    <div className="mt-2 text-[11px] text-slate-600 space-y-1">
                      <p className="font-medium text-slate-800">Authority: {r.authority}</p>
                      {r.registrationNumber && (
                        <p className="text-slate-500">Reg: {r.registrationNumber}</p>
                      )}
                      <p className="text-slate-500 truncate">{r.address}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      {r.phone ? (
                        <a
                          href={`tel:${r.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-emerald-600 font-semibold hover:underline flex items-center space-x-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{r.phone}</span>
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400">No phone listed</span>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenReport(r);
                        }}
                        className="text-[11px] text-slate-400 hover:text-rose-600"
                      >
                        Report Error
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Community Report Modal */}
      {reportingResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Report Listing Issue</h3>
                <p className="text-[11px] text-slate-500">{reportingResource.name}</p>
              </div>
              <button
                onClick={() => setReportingResource(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reportSuccess ? (
              <div className="p-8 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-900">Report Submitted</h4>
                <p className="text-xs text-slate-500">
                  Thank you! Our compliance administrators will inspect the official regulatory records.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Issue Type</label>
                  <select
                    value={reportIssueType}
                    onChange={(e) => setReportIssueType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="WRONG_ADDRESS">Wrong Address / Relocated</option>
                    <option value="CLOSED_DOWN">Branch Closed / Inactive</option>
                    <option value="SUSPICIOUS_ACTIVITY">Unregistered / Suspicious</option>
                    <option value="INCORRECT_PHONE">Incorrect Contact Number</option>
                    <option value="OTHER">Other Discrepancy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Details & Observations *
                  </label>
                  <textarea
                    value={reportNotes}
                    onChange={(e) => setReportNotes(e.target.value)}
                    rows={3}
                    placeholder="Provide details about what was inaccurate (e.g. relocated to new building, incorrect PIN)..."
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setReportingResource(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReport}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                  >
                    {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
