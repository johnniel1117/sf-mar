'use client'

import React, { useState } from 'react';
import { useDamageReportForm } from '../../hooks/useDamageReportForm';
import { ICONS } from '../../utils/constants';

const MaterialsTab: React.FC = () => {
  const {
    materialMappings,
    editingMaterial,
    setEditingMaterial,
    isEditingMaterial,
    setIsEditingMaterial,
    searchTerm,
    setSearchTerm,
    loadMaterialMappings,
    showToast,
    saveMaterialMapping,
    updateMaterialMapping,
    deleteMaterialMapping,
    showConfirmation,
  } = useDamageReportForm();

  const [localSearchTerm, setLocalSearchTerm] = useState('');

  const handleMaterialSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchTerm(value);
    setSearchTerm(value);
    setTimeout(() => {
      loadMaterialMappings(value);
    }, 300);
  };

  const handleSaveMaterial = async () => {
    if (!editingMaterial) return;

    try {
      if (editingMaterial.id) {
        await updateMaterialMapping(editingMaterial.id, {
          material_description: editingMaterial.material_description,
          category: editingMaterial.category,
        });
      } else {
        await saveMaterialMapping(
          editingMaterial.serial_number,
          editingMaterial.material_description,
          editingMaterial.category
        );
      }
      
      setIsEditingMaterial(false);
      setEditingMaterial(null);
      loadMaterialMappings(searchTerm);
      showToast('Material saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving material:', error);
      showToast('Failed to save material', 'error');
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    showConfirmation(
      'Delete Material Mapping',
      'Are you sure you want to delete this material mapping?',
      async () => {
        try {
          await deleteMaterialMapping(id);
          loadMaterialMappings(searchTerm);
          showToast('Material deleted successfully!', 'success');
        } catch (error) {
          console.error('Error deleting material:', error);
          showToast('Failed to delete material', 'error');
        }
      }
    );
  };

  const handleEditMaterial = (material: any) => {
    setEditingMaterial(material);
    setIsEditingMaterial(true);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
            <ICONS.Star className="w-5 h-5" />
            Material Mappings
          </h3>
          <p className="text-sm text-gray-600">Manage saved material descriptions for barcodes</p>
        </div>
        
        <div className="w-full sm:w-auto flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <ICONS.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by serial or description..."
              value={localSearchTerm}
              onChange={handleMaterialSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            />
          </div>
          <button
            onClick={() => {
              setEditingMaterial({
                id: '',
                serial_number: '',
                material_description: '',
                category: 'Manual Entry',
                last_used_at: new Date().toISOString(),
                usage_count: 0
              });
              setIsEditingMaterial(true);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <ICONS.Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add New</span>
          </button>
        </div>
      </div>

      {/* Edit Material Modal */}
      {isEditingMaterial && editingMaterial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h4 className="text-lg font-bold text-gray-900 mb-4">
              {editingMaterial.id ? 'Edit Material' : 'Add New Material'}
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Serial Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingMaterial.serial_number}
                  onChange={(e) => setEditingMaterial({
                    ...editingMaterial,
                    serial_number: e.target.value
                  })}
                  disabled={!!editingMaterial.id}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Material Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={editingMaterial.material_description}
                  onChange={(e) => setEditingMaterial({
                    ...editingMaterial,
                    material_description: e.target.value
                  })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={editingMaterial.category}
                  onChange={(e) => setEditingMaterial({
                    ...editingMaterial,
                    category: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  placeholder="e.g., Electronics, Furniture, etc."
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => {
                  setIsEditingMaterial(false);
                  setEditingMaterial(null);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMaterial}
                disabled={!editingMaterial.serial_number || !editingMaterial.material_description}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Material
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Material Mappings List */}
      {materialMappings.length === 0 ? (
        <div className="py-12 text-center">
          <ICONS.Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No material mappings found</p>
          <p className="text-gray-500 text-sm mt-2">
            {searchTerm ? 'Try a different search term' : 'Scan barcodes or add materials manually to see them here'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {materialMappings.map((material) => (
            <div key={material.id} className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 hover:shadow-md transition-all bg-white">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <ICONS.Barcode className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <p className="font-mono text-sm font-bold text-gray-900 truncate">
                      {material.serial_number}
                    </p>
                  </div>
                  
                  <p className="text-base font-semibold text-gray-800 mb-2">
                    {material.material_description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                    {material.category && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                        {material.category}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <ICONS.Clock className="w-3 h-3" />
                      Last used: {new Date(material.last_used_at).toLocaleDateString()}
                    </span>
                    {material.usage_count && (
                      <span className="flex items-center gap-1">
                        <ICONS.Star className="w-3 h-3" />
                        Used {material.usage_count} times
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleEditMaterial(material)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <ICONS.Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteMaterial(material.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <ICONS.Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MaterialsTab;