import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

export interface CollectionItem {
  id: string;
  _id?: string;
  [key: string]: any;
}

const DB_DIR = path.resolve(process.cwd(), '.finova_db');

// Ensure DB directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

export class Collection<T extends CollectionItem> {
  private name: string;
  private filePath: string;
  private items: Map<string, T> = new Map();
  private isLoaded: boolean = false;

  constructor(name: string) {
    this.name = name;
    this.filePath = path.join(DB_DIR, `${name}.json`);
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const list: T[] = JSON.parse(raw);
        this.items.clear();
        for (const item of list) {
          const id = item.id || item._id || crypto.randomUUID();
          item.id = id;
          item._id = id;
          this.items.set(id, item);
        }
      } else {
        this.persist();
      }
      this.isLoaded = true;
    } catch (err) {
      console.error(`Error loading collection ${this.name}:`, err);
      this.items = new Map();
    }
  }

  private persist(): void {
    try {
      const list = Array.from(this.items.values());
      fs.writeFileSync(this.filePath, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      console.error(`Error persisting collection ${this.name}:`, err);
    }
  }

  public async insert(data: Omit<T, 'id' | '_id'> & { id?: string; _id?: string }): Promise<T> {
    const id = data.id || data._id || crypto.randomBytes(12).toString('hex');
    const fullItem = {
      ...data,
      id,
      _id: id,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as unknown as T;

    this.items.set(id, fullItem);
    this.persist();
    return fullItem;
  }

  public async findById(id: string): Promise<T | null> {
    const item = this.items.get(id);
    return item ? { ...item } : null;
  }

  public async findOne(predicate: (item: T) => boolean): Promise<T | null> {
    for (const item of this.items.values()) {
      if (predicate(item)) {
        return { ...item };
      }
    }
    return null;
  }

  public async find(predicate?: (item: T) => boolean): Promise<T[]> {
    const results: T[] = [];
    for (const item of this.items.values()) {
      if (!predicate || predicate(item)) {
        results.push({ ...item });
      }
    }
    return results;
  }

  public async updateById(id: string, updates: Partial<T>): Promise<T | null> {
    const existing = this.items.get(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      id,
      _id: id,
      updatedAt: new Date().toISOString(),
    };

    this.items.set(id, updated);
    this.persist();
    return { ...updated };
  }

  public async deleteById(id: string): Promise<boolean> {
    const existed = this.items.delete(id);
    if (existed) {
      this.persist();
    }
    return existed;
  }

  public async deleteMany(predicate: (item: T) => boolean): Promise<number> {
    let count = 0;
    for (const [id, item] of this.items.entries()) {
      if (predicate(item)) {
        this.items.delete(id);
        count++;
      }
    }
    if (count > 0) {
      this.persist();
    }
    return count;
  }

  public count(predicate?: (item: T) => boolean): number {
    if (!predicate) return this.items.size;
    let count = 0;
    for (const item of this.items.values()) {
      if (predicate(item)) count++;
    }
    return count;
  }

  // 2dsphere Geospatial Search using Haversine formula
  public async findNear(
    targetLng: number,
    targetLat: number,
    maxDistanceKm: number = 50,
    filterPredicate?: (item: T) => boolean
  ): Promise<(T & { distanceKm: number })[]> {
    const matches: (T & { distanceKm: number })[] = [];

    for (const item of this.items.values()) {
      if (filterPredicate && !filterPredicate(item)) continue;

      const loc = item.location as GeoPoint | undefined;
      if (loc && loc.type === 'Point' && Array.isArray(loc.coordinates)) {
        const [lng, lat] = loc.coordinates;
        const dist = haversineDistance(targetLat, targetLng, lat, lng);
        if (dist <= maxDistanceKm) {
          matches.push({
            ...item,
            distanceKm: Math.round(dist * 10) / 10,
          });
        }
      }
    }

    // Sort ascending by distance (nearest first)
    matches.sort((a, b) => a.distanceKm - b.distanceKm);
    return matches;
  }
}

// Great-circle distance between two points on the Earth's surface (in kilometers)
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Database schema collections
export const db = {
  users: new Collection('users'),
  transactions: new Collection('transactions'),
  budgets: new Collection('budgets'),
  savingsGoals: new Collection('savings_goals'),
  documents: new Collection('documents'),
  resources: new Collection('resources'),
  resourceReports: new Collection('resource_reports'),
  notifications: new Collection('notifications'),
  financialArticles: new Collection('financial_articles'),
};

console.log('FINOVA Database engine initialized with 2dsphere indexing & disk persistence');
