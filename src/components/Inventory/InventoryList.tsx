import React, { useEffect, useState } from 'react';
import { Search, Plus, Package, AlertTriangle, Calendar } from 'lucide-react';
import { db } from '../../database';
import { Medicine, Batch } from '../../types';
import { format } from 'date-fns';
import { usePharmacyStore } from '../../store';

interface MedicineWithBatches extends Medicine {
  batches: Batch[];
  totalStock: number;
  nearestExpiry: Date | null;
}

export const InventoryList: React.FC = () => {
  const [medicines, setMedicines] = useState<MedicineWithBatches[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'low-stock' | 'expiring'>('all');
  const { searchQuery, addNotification } = usePharmacyStore();

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const allMedicines = await db.medicines.toArray();
      const medicinesWithBatches: MedicineWithBatches[] = [];

      for (const medicine of allMedicines) {
        const batches = await db.batches
          .where('medicineId')
          .equals(medicine.id)
          .toArray();

        const totalStock = batches.reduce((sum, batch) => sum + batch.currentStock, 0);
        const validBatches = batches.filter(batch => batch.expiryDate > new Date());
        const nearestExpiry = validBatches.length > 0 
          ? new Date(Math.min(...validBatches.map(b => b.expiryDate.getTime())))
          : null;

        medicinesWithBatches.push({
          ...medicine,
          batches,
          totalStock,
          nearestExpiry
        });
      }

      setMedicines(medicinesWithBatches);
    } catch (error) {
      console.error('Error loading inventory:', error);
      addNotification('error', 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const filteredMedicines = medicines.filter(medicine => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!medicine.name.toLowerCase().includes(query) &&
          !medicine.brandName.toLowerCase().includes(query) &&
          !medicine.manufacturer.toLowerCase().includes(query)) {
        return false;
      }
    }

    // Category filter
    switch (filter) {
      case 'low-stock':
        return medicine.batches.some(batch => batch.currentStock <= batch.minStock);
      case 'expiring':
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        return medicine.nearestExpiry && medicine.nearestExpiry <= thirtyDaysFromNow;
      default:
        return true;
    }
  });

  const getStockStatus = (medicine: MedicineWithBatches) => {
    const hasLowStock = medicine.batches.some(batch => batch.currentStock <= batch.minStock);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const isExpiring = medicine.nearestExpiry && medicine.nearestExpiry <= thirtyDaysFromNow;

    if (hasLowStock) return { status: 'low-stock', color: 'text-red-600', bg: 'bg-red-50' };
    if (isExpiring) return { status: 'expiring', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { status: 'normal', color: 'text-green-600', bg: 'bg-green-50' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Manage your medicine stock and batches</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Medicine</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All Medicines' },
          { key: 'low-stock', label: 'Low Stock' },
          { key: 'expiring', label: 'Expiring Soon' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Medicine List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredMedicines.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredMedicines.map((medicine) => {
              const stockStatus = getStockStatus(medicine);
              
              return (
                <div key={medicine.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {medicine.brandName}
                          </h3>
                          <p className="text-gray-600">{medicine.name}</p>
                          <p className="text-sm text-gray-500">
                            {medicine.manufacturer} • HSN: {medicine.hsn}
                          </p>
                        </div>
                      </div>

                      {/* Batches */}
                      <div className="mt-4 space-y-2">
                        {medicine.batches.map((batch) => (
                          <div key={batch.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center space-x-4">
                              <span className="font-medium text-gray-900">
                                Batch: {batch.batchNumber}
                              </span>
                              <span className="text-sm text-gray-600">
                                Stock: {batch.currentStock}
                              </span>
                              <span className="text-sm text-gray-600">
                                MRP: ₹{batch.mrp}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                Exp: {format(new Date(batch.expiryDate), 'MMM yyyy')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="ml-4 text-right">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                        {stockStatus.status === 'low-stock' && <AlertTriangle className="w-4 h-4 mr-1" />}
                        {stockStatus.status === 'expiring' && <Calendar className="w-4 h-4 mr-1" />}
                        <span className="capitalize">{stockStatus.status.replace('-', ' ')}</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900 mt-2">
                        Total: {medicine.totalStock}
                      </p>
                      <p className="text-sm text-gray-600">
                        {medicine.scheduleType} Schedule
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No medicines found</h3>
            <p className="text-gray-600">
              {searchQuery ? 'Try adjusting your search terms' : 'Start by adding your first medicine'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};