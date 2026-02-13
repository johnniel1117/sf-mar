// Create a new component: SerialMappingManager.tsx
'use client'

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Trash2, Search, RefreshCw, AlertCircle } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface SerialMapping {
  id: string;
  serial_number: string;
  material_code: string;
  material_description: string;
  category: string;
  usage_count: number;
  last_used_at: string;
  created_at: string;
}

export default function SerialMappingManager() {
  const [mappings, setMappings] = useState<SerialMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadMappings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('serial_material_mapping')
        .select('*')
        .order('last_used_at', { ascending: false });

      if (error) throw error;
      setMappings(data || []);
    } catch (error) {
      console.error('Error loading mappings:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteMapping = async (id: string) => {
    try {
      const { error } = await supabase
        .from('serial_material_mapping')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadMappings();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting mapping:', error);
      alert('Failed to delete mapping');
    }
  };

  useEffect(() => {
    loadMappings();
  }, []);

  const filteredMappings = mappings.filter(mapping =>
    mapping.serial_number.toLowerCase().includes(search.toLowerCase()) ||
    mapping.material_description.toLowerCase().includes(search.toLowerCase()) ||
    mapping.material_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Serial Number Mappings</h3>
          <p className="text-gray-600">Manually entered material descriptions saved for future scans</p>
        </div>
        <button
          onClick={loadMappings}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by serial number or material description..."
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading mappings...</p>
        </div>
      ) : filteredMappings.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No serial number mappings found</p>
          <p className="text-gray-500 text-sm mt-1">
            {search ? 'Try a different search term' : 'Manual entries will appear here after saving'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                <th className="text-left p-3 font-semibold text-gray-700">Serial Number</th>
                <th className="text-left p-3 font-semibold text-gray-700">Material Description</th>
                <th className="text-left p-3 font-semibold text-gray-700">Material Code</th>
                <th className="text-left p-3 font-semibold text-gray-700">Usage Count</th>
                <th className="text-left p-3 font-semibold text-gray-700">Last Used</th>
                <th className="text-left p-3 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMappings.map((mapping) => (
                <tr key={mapping.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3  text-sm font-bold">{mapping.serial_number}</td>
                  <td className="p-3 font-medium">{mapping.material_description}</td>
                  <td className="p-3  text-sm">{mapping.material_code}</td>
                  <td className="p-3 text-center">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                      {mapping.usage_count}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-gray-600">
                    {new Date(mapping.last_used_at).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    {deleteConfirm === mapping.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => deleteMapping(mapping.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm font-semibold hover:bg-red-700"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm font-semibold hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(mapping.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete mapping"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}