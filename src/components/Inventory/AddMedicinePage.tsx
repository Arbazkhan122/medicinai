import React, { useState } from 'react';
import { ArrowLeft, Package, Save } from 'lucide-react';
import { db } from '../../database';
import { Medicine, Batch } from '../../types';
import { usePharmacyStore } from '../../store';

interface AddMedicinePageProps {
  onBack: () => void;
  onMedicineAdded: () => void;
}

export const AddMedicinePage: React.FC<AddMedicinePageProps> = ({
  onBack,
  onMedicineAdded
}) => {
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    brandName: '',
    dosage: '',
    medicineType: '',
    manufacturer: '',
    scheduleType: 'GENERAL' as 'H' | 'H1' | 'X' | 'GENERAL',
    hsn: '',
    gst: 12,
    description: '',
    // Initial batch data
    initialBatchNumber: '',
    initialMrp: 0,
    initialPurchasePrice: 0,
    initialSellingPrice: 0,
    initialStockQuantity: 0,
    initialMinStock: 10,
    initialMaxStock: 100,
    initialExpiryDate: '',
    supplierId: 'DEFAULT'
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
      // Create new medicine
      const newMedicine: Medicine = {
        id: crypto.randomUUID(),
        name: formData.name,
        genericName: formData.genericName,
        brandName: formData.brandName,
        dosage: formData.dosage,
        medicineType: formData.medicineType,
        manufacturer: formData.manufacturer,
        scheduleType: formData.scheduleType,
        hsn: formData.hsn,
        gst: formData.gst,
        description: formData.description,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.medicines.add(newMedicine);

      // Create initial batch if stock quantity is provided
      if (formData.initialStockQuantity > 0) {
        const newBatch: Batch = {
          id: crypto.randomUUID(),
          medicineId: newMedicine.id,
          batchNumber: formData.initialBatchNumber || `BATCH-${Date.now()}`,
          expiryDate: formData.initialExpiryDate ? new Date(formData.initialExpiryDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          mrp: formData.initialMrp,
          purchasePrice: formData.initialPurchasePrice,
          sellingPrice: formData.initialSellingPrice,
          currentStock: formData.initialStockQuantity,
          minStock: formData.initialMinStock,
          maxStock: formData.initialMaxStock,
          supplierId: formData.supplierId,
          receivedDate: new Date()
        };

        await db.batches.add(newBatch);
      }

      addNotification('success', `Medicine ${formData.brandName} added successfully`);
      onMedicineAdded();
      onBack();
    } catch (error) {
      console.error('Error adding medicine:', error);
      addNotification('error', 'Failed to add medicine');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Add New Medicine</h1>
                  <p className="text-sm text-gray-600">Create a new medicine record with initial stock</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Medicine Information Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
              <Package className="w-5 h-5 text-blue-600" />
              <span>Medicine Information</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Medicine Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medicine Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Paracetamol 500mg"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Crocin"
                />
              </div>

              {/* Generic Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Generic Name
                </label>
                <input
                  type="text"
                  value={formData.genericName}
                  onChange={(e) => handleInputChange('genericName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Paracetamol"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., GSK, Cipla, Sun Pharma"
                />
              </div>

              {/* Dosage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dosage *
                </label>
                <input
                  type="text"
                  value={formData.dosage}
                  onChange={(e) => handleInputChange('dosage', e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 500mg, 10ml, 250mg/5ml"
                />
              </div>

              {/* Medicine Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medicine Type *
                </label>
                <select
                  value={formData.medicineType}
                  onChange={(e) => handleInputChange('medicineType', e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Type</option>
                  <option value="Tablet">Tablet</option>
                  <option value="Capsule">Capsule</option>
                  <option value="Syrup">Syrup</option>
                  <option value="Injection">Injection</option>
                  <option value="Cream">Cream</option>
                  <option value="Ointment">Ointment</option>
                  <option value="Drops">Drops</option>
                  <option value="Powder">Powder</option>
                  <option value="Inhaler">Inhaler</option>
                  <option value="Spray">Spray</option>
                </select>
              </div>

              {/* Schedule Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule Type *
                </label>
                <select
                  value={formData.scheduleType}
                  onChange={(e) => handleInputChange('scheduleType', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18%</option>
                  <option value={28}>28%</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional information about the medicine, usage instructions, side effects, etc."
              />
            </div>
          </div>

          {/* Initial Stock Information Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Initial Stock Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Batch Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch Number
                </label>
                <input
                  type="text"
                  value={formData.initialBatchNumber}
                  onChange={(e) => handleInputChange('initialBatchNumber', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Auto-generated if empty"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.initialSellingPrice}
                  onChange={(e) => handleInputChange('initialSellingPrice', parseFloat(e.target.value) || 0)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Selling price per unit"
                />
              </div>

              {/* MRP */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  MRP (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.initialMrp}
                  onChange={(e) => handleInputChange('initialMrp', parseFloat(e.target.value) || 0)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Maximum Retail Price"
                />
              </div>

              {/* Purchase Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purchase Price (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.initialPurchasePrice}
                  onChange={(e) => handleInputChange('initialPurchasePrice', parseFloat(e.target.value) || 0)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Cost price from supplier"
                />
              </div>

              {/* Stock Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.initialStockQuantity}
                  onChange={(e) => handleInputChange('initialStockQuantity', parseInt(e.target.value) || 0)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Initial stock quantity"
                />
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date *
                </label>
                <input
                  type="date"
                  value={formData.initialExpiryDate}
                  onChange={(e) => handleInputChange('initialExpiryDate', e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Min Stock */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Stock Level
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.initialMinStock}
                  onChange={(e) => handleInputChange('initialMinStock', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Alert when stock falls below this"
                />
              </div>

              {/* Max Stock */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Stock Level
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.initialMaxStock}
                  onChange={(e) => handleInputChange('initialMaxStock', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Maximum stock to maintain"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onBack}
                className="px-8 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 font-medium"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Save className="w-5 h-5" />
                )}
                <span>{loading ? 'Adding Medicine...' : 'Add Medicine'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};