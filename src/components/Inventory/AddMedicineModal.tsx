import React, { useState } from 'react';
import { X, Package, Save } from 'lucide-react';
import { db } from '../../database';
import { Medicine } from '../../types';
import { usePharmacyStore } from '../../store';

interface AddMedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMedicineAdded: () => void;
}

export const AddMedicineModal: React.FC<AddMedicineModalProps> = ({
  isOpen,
  onClose,
  onMedicineAdded
}) => {
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    brandName: '',
    manufacturer: '',
    scheduleType: 'GENERAL' as 'H' | 'H1' | 'X' | 'GENERAL',
    hsn: '',
    gst: 12
  });
  const [loading, setLoading] = useState(false);
  const { addNotification } = usePharmacyStore();

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const newMedicine: Medicine = {
        id: crypto.randomUUID(),
        name: formData.name,
        genericName: formData.genericName,
        brandName: formData.brandName,
        manufacturer: formData.manufacturer,
        scheduleType: formData.scheduleType,
        hsn: formData.hsn,
        gst: formData.gst,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.medicines.add(newMedicine);
      addNotification('success', `Medicine ${formData.brandName} added successfully`);
      
      // Reset form
      setFormData({
        name: '',
        genericName: '',
        brandName: '',
        manufacturer: '',
        scheduleType: 'GENERAL',
        hsn: '',
        gst: 12
      });
      
      onMedicineAdded();
      onClose();
    } catch (error) {
      console.error('Error adding medicine:', error);
      addNotification('error', 'Failed to add medicine');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Add New Medicine</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Generic Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Generic Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Paracetamol"
              />
            </div>

            {/* Brand Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand Name *
              </label>
              <input
                type="text"
                value={formData.brandName}
                onChange={(e) => handleInputChange('brandName', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Crocin"
              />
            </div>

            {/* Manufacturer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manufacturer *
              </label>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., GSK"
              />
            </div>

            {/* Schedule Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule Type *
              </label>
              <select
                value={formData.scheduleType}
                onChange={(e) => handleInputChange('scheduleType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="GENERAL">General</option>
                <option value="H">Schedule H</option>
                <option value="H1">Schedule H1</option>
                <option value="X">Schedule X</option>
              </select>
            </div>

            {/* HSN Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HSN Code *
              </label>
              <input
                type="text"
                value={formData.hsn}
                onChange={(e) => handleInputChange('hsn', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 30049099"
              />
            </div>

            {/* GST Percentage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GST Percentage *
              </label>
              <select
                value={formData.gst}
                onChange={(e) => handleInputChange('gst', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={5}>5%</option>
                <option value={12}>12%</option>
                <option value={18}>18%</option>
                <option value={28}>28%</option>
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{loading ? 'Adding...' : 'Add Medicine'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};