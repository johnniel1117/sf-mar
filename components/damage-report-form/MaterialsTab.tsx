'use client'

import { Edit, Trash2, Search } from 'lucide-react'

interface Material {
  id: string
  barcode: string
  material_description: string
  category: string
}

interface MaterialsTabProps {
  materials: Material[]
  searchTerm: string
  isEditing: boolean
  editingMaterial: Material | null
  onSearchChange: (value: string) => void
  onEdit: (material: Material) => void
  onSave: () => void
  onDelete: (id: string) => void
  onEditingMaterialChange: (material: Material) => void
  onCancelEdit: () => void
}

export function MaterialsTab({
  materials,
  searchTerm,
  isEditing,
  editingMaterial,
  onSearchChange,
  onEdit,
  onSave,
  onDelete,
  onEditingMaterialChange,
  onCancelEdit,
}: MaterialsTabProps) {
  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search materials..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* Materials List */}
      <div className="space-y-3">
        {materials.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No materials found</p>
        ) : (
          materials.map((material) => (
            <div key={material.id} className="border border-gray-200 rounded-lg p-4">
              {isEditing && editingMaterial?.id === material.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                    <input
                      type="text"
                      value={editingMaterial.barcode}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Material Description</label>
                    <input
                      type="text"
                      value={editingMaterial.material_description}
                      onChange={(e) =>
                        onEditingMaterialChange({
                          ...editingMaterial,
                          material_description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={editingMaterial.category}
                      onChange={(e) =>
                        onEditingMaterialChange({
                          ...editingMaterial,
                          category: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option>Manual Entry</option>
                      <option>System Entry</option>
                      <option>Imported</option>
                    </select>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={onCancelEdit}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={onSave}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-mono text-sm text-gray-600 mb-1">{material.barcode}</p>
                    <h4 className="font-semibold text-gray-900 mb-2">{material.material_description}</h4>
                    <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      {material.category}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(material)}
                      className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(material.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
