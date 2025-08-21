import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { db } from '../../database';
import { Medicine } from '../../types';
import { usePharmacyStore } from '../../store';
import { AddMedicineModal } from './AddMedicineModal';

export const InventoryList: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { addNotification } = usePharmacyStore();

  const fetchMedicines = async () => {
    try {
      const allMedicines = await db.medicines.toArray();
      setMedicines(allMedicines);
    } catch (error) {
      console.error('Error fetching medicines:', error);
      addNotification('error', 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const handleMedicineAdded = () => {
    fetchMedicines(); // Refresh the list
    setIsAddModalOpen(false);
  };

  if (loading) {
    return <div className="p-6 text-center">Loading inventory...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Manage your medicine stock and batches.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Medicine
        </button>
      </div>

      {medicines.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">No medicines found in inventory.</p>
          <p className="text-gray-400 text-sm mt-2">Click "Add Medicine" to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">All Medicines ({medicines.length})</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {medicines.map((medicine) => (
              <div key={medicine.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg">{medicine.brandName}</h3>
                    <p className="text-gray-600 mt-1">{medicine.name}</p>
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      <span>Manufacturer: {medicine.manufacturer}</span>
                      <span>HSN: {medicine.hsn}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        medicine.scheduleType === 'H1' 
                          ? 'bg-red-100 text-red-800' 
                          : medicine.scheduleType === 'H'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {medicine.scheduleType}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-500">GST: {medicine.gstPercentage}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AddMedicineModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onMedicineAdded={handleMedicineAdded}
      />
    </div>
  );
};