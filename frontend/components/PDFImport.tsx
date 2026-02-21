'use client';

import { useState, useRef } from 'react';
import api from '@/lib/api';

interface ExtractedMeal {
  foodName: string;
  quantity?: number;
  mealType?: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  date?: string;
}

export default function PDFImport({ onSuccess }: { onSuccess?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ExtractedMeal[] | null>(null);
  const [error, setError] = useState('');
  const [mealType, setMealType] = useState('Lunch');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError('');
      setPreview(null);
    } else {
      setError('Please select a PDF file');
    }
  };

  const handleParse = async () => {
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('mealType', mealType);
      formData.append('date', date);

      const response = await api.post('/api/import/pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setPreview(response.data.meals);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to parse PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!preview || preview.length === 0) return;

    setLoading(true);
    setError('');

    try {
      await api.post('/api/import/pdf/confirm', {
        meals: preview.map((meal) => ({
          ...meal,
          mealType: meal.mealType || mealType,
          date: meal.date || date,
        })),
      });

      setFile(null);
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to import meals');
    } finally {
      setLoading(false);
    }
  };

  const handleEditMeal = (index: number, field: string, value: any) => {
    if (!preview) return;
    const updated = [...preview];
    updated[index] = { ...updated[index], [field]: value };
    setPreview(updated);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-4">Bulk Import from PDF</h3>
        <p className="text-sm text-gray-600 mb-4">
          Upload a PDF containing nutrition information to bulk import meal entries.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select PDF File
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {file && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Meal Type
                  </label>
                  <select
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Snacks">Snacks</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <button
                onClick={handleParse}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Parsing PDF...' : 'Parse PDF'}
              </button>
            </>
          )}
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}
      </div>

      {preview && preview.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-md font-semibold">
              Preview ({preview.length} meals found)
            </h4>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Importing...' : 'Confirm Import'}
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {preview.map((meal, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 rounded border border-gray-200"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div>
                    <label className="text-xs text-gray-600">Food Name</label>
                    <input
                      type="text"
                      value={meal.foodName}
                      onChange={(e) => handleEditMeal(index, 'foodName', e.target.value)}
                      className="w-full rounded border-gray-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Calories</label>
                    <input
                      type="number"
                      value={meal.calories}
                      onChange={(e) => handleEditMeal(index, 'calories', parseFloat(e.target.value))}
                      className="w-full rounded border-gray-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Protein (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={meal.protein || ''}
                      onChange={(e) => handleEditMeal(index, 'protein', e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-full rounded border-gray-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Carbs (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={meal.carbs || ''}
                      onChange={(e) => handleEditMeal(index, 'carbs', e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-full rounded border-gray-300 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
