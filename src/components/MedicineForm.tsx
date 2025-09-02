import React, { useImperativeHandle, forwardRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Package, Pill, Sparkles } from 'lucide-react';
import { googleAIService } from '../services/googleAI';

const medicineSchema = z.object({
  name: z.string().min(1, 'Medicine name is required'),
  genericName: z.string().optional(),
  brandName: z.string().optional(),
  dosage: z.string().optional(),
  medicineType: z.string().min(1, 'Medicine type is required'),
  manufacturer: z.string().optional(),
  scheduleType: z.enum(['H', 'H1', 'X', 'GENERAL']),
  hsn: z.string().optional(),
  gst: z.number().min(0).max(100),
  description: z.string().optional(),
  // Initial batch data
  initialBatchNumber: z.string().optional(),
  initialMrp: z.number().min(0).optional(),
  initialPurchasePrice: z.number().min(0).optional(),
  initialSellingPrice: z.number().min(0, 'Selling price must be positive'),
  initialStockQuantity: z.number().min(0).optional(),
  initialMinStock: z.number().min(0).optional(),
  initialMaxStock: z.number().min(0).optional(),
  initialExpiryDate: z.string().optional(),
  supplierId: z.string().default('DEFAULT')
});

export type MedicineFormData = z.infer<typeof medicineSchema>;

interface MedicineFormProps {
  onSubmit: (data: MedicineFormData) => Promise<void>;
  loading?: boolean;
  initialData?: Partial<MedicineFormData>;
  className?: string;
}

export const MedicineForm = forwardRef<any, MedicineFormProps>(({
  onSubmit,
  loading = false,
  initialData,
  className = ''
}, ref) => {
  const [generatingDescription, setGeneratingDescription] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    getValues
  } = useForm<MedicineFormData>({
    resolver: zodResolver(medicineSchema),
    defaultValues: {
      scheduleType: 'GENERAL',
      gst: 12,
      supplierId: 'DEFAULT',
      initialMinStock: 10,
      initialMaxStock: 100,
      ...initialData
    }
  });

  // Auto-fill form with AI processed data
  const autoFillFromAIData = (aiData: any) => {
    if (aiData.name) setValue('name', aiData.name);
    if (aiData.genericName) setValue('genericName', aiData.genericName);
    if (aiData.brandName) setValue('brandName', aiData.brandName);
    if (aiData.dosage) setValue('dosage', aiData.dosage);
    if (aiData.medicineType) setValue('medicineType', aiData.medicineType);
    if (aiData.manufacturer) setValue('manufacturer', aiData.manufacturer);
    if (aiData.scheduleType) setValue('scheduleType', aiData.scheduleType);
    if (aiData.hsn) setValue('hsn', aiData.hsn);
    if (aiData.batchNumber) setValue('initialBatchNumber', aiData.batchNumber);
    if (aiData.mrp) {
      setValue('initialMrp', aiData.mrp);
      // Auto-calculate selling price as 90% of MRP
      setValue('initialSellingPrice', aiData.mrp * 0.9);
      // Auto-calculate purchase price as 70% of MRP
      setValue('initialPurchasePrice', aiData.mrp * 0.7);
    }
    if (aiData.expiryDate) setValue('initialExpiryDate', aiData.expiryDate);
    
    // Auto-generate description after a short delay to let form populate
    setTimeout(() => {
      generateDescription();
    }, 1000);
  };

  const generateDescription = async () => {
    if (!googleAIService.isConfigured()) {
      return;
    }

    const formData = getValues();
    
    // Only generate if we have enough information
    if (!formData.name && !formData.brandName) {
      return;
    }

    setGeneratingDescription(true);
    
    try {
      const description = await googleAIService.generateMedicineDescription({
        name: formData.name,
        genericName: formData.genericName,
        brandName: formData.brandName,
        dosage: formData.dosage,
        medicineType: formData.medicineType,
        manufacturer: formData.manufacturer,
        scheduleType: formData.scheduleType
      });
      
      setValue('description', description);
    } catch (error) {
      console.error('Error generating description:', error);
    } finally {
      setGeneratingDescription(false);
    }
  };

  // Expose auto-fill function to parent component
  useImperativeHandle(ref, () => ({
    autoFillFromAIData,
    reset
  }));

  const onFormSubmit = async (data: MedicineFormData) => {
    try {
      await onSubmit(data);
      reset();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <div className={`space-y-8 ${className}`}>
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
        {/* Medicine Information Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
            <Pill className="w-5 h-5 text-blue-600" />
            <span>Medicine Information</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Medicine Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medicine Name *
              </label>
              <input
                {...register('name')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="e.g., Paracetamol 500mg"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Brand Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand Name
              </label>
              <input
                {...register('brandName')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="e.g., Crocin"
              />
              {errors.brandName && (
                <p className="mt-1 text-sm text-red-600">{errors.brandName.message}</p>
              )}
            </div>

            {/* Generic Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Generic Name
              </label>
              <input
                {...register('genericName')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="e.g., Paracetamol"
              />
            </div>

            {/* Manufacturer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manufacturer
              </label>
              <input
                {...register('manufacturer')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="e.g., GSK, Cipla, Sun Pharma"
              />
              {errors.manufacturer && (
                <p className="mt-1 text-sm text-red-600">{errors.manufacturer.message}</p>
              )}
            </div>

            {/* Dosage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dosage
              </label>
              <input
                {...register('dosage')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="e.g., 500mg, 10ml, 250mg/5ml"
              />
              {errors.dosage && (
                <p className="mt-1 text-sm text-red-600">{errors.dosage.message}</p>
              )}
            </div>

            {/* Medicine Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medicine Type *
              </label>
              <select
                {...register('medicineType')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
              {errors.medicineType && (
                <p className="mt-1 text-sm text-red-600">{errors.medicineType.message}</p>
              )}
            </div>

            {/* Schedule Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule Type
              </label>
              <select
                {...register('scheduleType')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
                HSN Code
              </label>
              <input
                {...register('hsn')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="e.g., 30049099"
              />
              {errors.hsn && (
                <p className="mt-1 text-sm text-red-600">{errors.hsn.message}</p>
              )}
            </div>

            {/* GST Percentage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GST Percentage
              </label>
              <select
                {...register('gst', { valueAsNumber: true })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <button
                type="button"
                onClick={generateDescription}
                disabled={generatingDescription || !googleAIService.isConfigured()}
                className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {generatingDescription ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    <span>Generate with AI</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="AI can generate a professional description based on the medicine information above, or you can write your own..."
            />
            {generatingDescription && (
              <p className="mt-1 text-sm text-blue-600">AI is generating a professional description...</p>
            )}
          </div>
        </div>
              Description
            </label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Additional information about the medicine, usage instructions, side effects, etc."
            />
          </div>
        </div>

        {/* Initial Stock Information Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
            <Package className="w-5 h-5 text-green-600" />
            <span>Initial Stock Information</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Batch Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch Number
              </label>
              <input
                {...register('initialBatchNumber')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Auto-generated if empty"
              />
            </div>

            {/* MRP */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                MRP (₹)
              </label>
              <input
                {...register('initialMrp', { valueAsNumber: true })}
                type="number"
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Maximum Retail Price"
              />
              {errors.initialMrp && (
                <p className="mt-1 text-sm text-red-600">{errors.initialMrp.message}</p>
              )}
            </div>

            {/* Purchase Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purchase Price (₹)
              </label>
              <input
                {...register('initialPurchasePrice', { valueAsNumber: true })}
                type="number"
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Cost price from supplier"
              />
              {errors.initialPurchasePrice && (
                <p className="mt-1 text-sm text-red-600">{errors.initialPurchasePrice.message}</p>
              )}
            </div>

            {/* Selling Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selling Price (₹) *
              </label>
              <input
                {...register('initialSellingPrice', { valueAsNumber: true })}
                type="number"
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Selling price per unit"
              />
              {errors.initialSellingPrice && (
                <p className="mt-1 text-sm text-red-600">{errors.initialSellingPrice.message}</p>
              )}
            </div>

            {/* Stock Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Quantity
              </label>
              <input
                {...register('initialStockQuantity', { valueAsNumber: true })}
                type="number"
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Initial stock quantity"
              />
              {errors.initialStockQuantity && (
                <p className="mt-1 text-sm text-red-600">{errors.initialStockQuantity.message}</p>
              )}
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date
              </label>
              <input
                {...register('initialExpiryDate')}
                type="date"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
              {errors.initialExpiryDate && (
                <p className="mt-1 text-sm text-red-600">{errors.initialExpiryDate.message}</p>
              )}
            </div>

            {/* Min Stock */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Stock Level
              </label>
              <input
                {...register('initialMinStock', { valueAsNumber: true })}
                type="number"
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Alert when stock falls below this"
              />
            </div>

            {/* Max Stock */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Stock Level
              </label>
              <input
                {...register('initialMaxStock', { valueAsNumber: true })}
                type="number"
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
              onClick={() => reset()}
              className="px-8 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Reset Form
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
  );
});

MedicineForm.displayName = 'MedicineForm';