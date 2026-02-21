'use client';

import { useState } from 'react';
import ImageUpload from './ImageUpload';
import MealForm from './MealForm';

export default function AIExtractionForm({ onSuccess }: { onSuccess?: () => void }) {
  const [extractedData, setExtractedData] = useState<any>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleExtractionComplete = (data: any) => {
    setExtractedData(data);
  };

  const handleImageUploaded = (url: string) => {
    setImageUrl(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">AI-Powered Nutrition Extraction</h2>
        <p className="text-sm text-gray-600 mb-4">
          Upload an image of a nutrition label or food plate, and we'll extract the nutritional information for you.
        </p>
        <ImageUpload
          onImageUploaded={handleImageUploaded}
          onExtractionComplete={handleExtractionComplete}
        />
      </div>

      {imageUrl && (
        <div>
          <h3 className="text-md font-semibold mb-2">Uploaded Image</h3>
          <img
            src={imageUrl}
            alt="Uploaded"
            className="max-w-full h-48 object-contain rounded border border-gray-200"
          />
        </div>
      )}

      {extractedData && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-md font-semibold text-green-900 mb-2">
            ✓ Nutrition data extracted successfully!
          </h3>
          <p className="text-sm text-green-700 mb-4">
            Review and adjust the information below, then save your meal entry.
          </p>
        </div>
      )}

      <div>
        <h3 className="text-md font-semibold mb-4">Meal Details</h3>
        <MealForm
          initialData={extractedData ? {
            foodName: extractedData.foodName || '',
            quantity: extractedData.quantity || '',
            calories: extractedData.calories || '',
            protein: extractedData.protein || '',
            carbs: extractedData.carbs || '',
            fat: extractedData.fat || '',
            micronutrients: extractedData.micronutrients || {},
          } : undefined}
          onSuccess={() => {
            setExtractedData(null);
            setImageUrl(null);
            onSuccess?.();
          }}
        />
      </div>
    </div>
  );
}
