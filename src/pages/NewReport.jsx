import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function NewReport() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    project_name: '',
    inventory: {
      Cement: { opening: '', receipt: '', consumed: '', closing: '', remarks: '' },
      Steel: { opening: '', receipt: '', consumed: '', closing: '', remarks: '' },
      Sand: { opening: '', receipt: '', consumed: '', closing: '', remarks: '' },
      '3/4 Metal': { opening: '', receipt: '', consumed: '', closing: '', remarks: '' },
      '1/2 Metal': { opening: '', receipt: '', consumed: '', closing: '', remarks: '' },
      '6" Bricks': { opening: '', receipt: '', consumed: '', closing: '', remarks: '' },
      'Crush Sand': { opening: '', receipt: '', consumed: '', closing: '', remarks: '' },
      'Binding Wire': { opening: '', receipt: '', consumed: '', closing: '', remarks: '' }
    },
    cement_consumption: [{ activity: '', qty: '', bags: '' }],
    material_received: [{ description: '', challan: '', party: '', item: '', remarks: '' }],
    material_ordered: [{ description: '', requisition: '' }],
    urgent_requirements: '',
    visitors: ''
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const { data, error } = await supabase.from('projects').select('name').order('name');
    if (!error && data) {
      setProjectsList(data);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleInventoryChange = (item, field, value) => {
    setFormData(prev => ({
      ...prev,
      inventory: {
        ...prev.inventory,
        [item]: { ...prev.inventory[item], [field]: value }
      }
    }));
  };

  const handleArrayChange = (arrayName, index, field, value) => {
    setFormData(prev => {
      const newArray = [...prev[arrayName]];
      newArray[index][field] = value;
      return { ...prev, [arrayName]: newArray };
    });
  };

  const addRow = (arrayName, template) => {
    setFormData(prev => ({ ...prev, [arrayName]: [...prev[arrayName], template] }));
  };

  const removeRow = (arrayName, index) => {
    setFormData(prev => {
      const newArray = [...prev[arrayName]];
      newArray.splice(index, 1);
      return { ...prev, [arrayName]: newArray };
    });
  };

  const handleFileChange = (e) => {
    setPhotos(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let photoUrls = [];
      
      // Upload photos to Supabase Storage if any are selected
      if (photos.length > 0) {
        for (const file of photos) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${window.crypto.randomUUID()}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('report_photos')
            .upload(filePath, file);
            
          if (uploadError) throw uploadError;
          
          const { data } = supabase.storage.from('report_photos').getPublicUrl(filePath);
          photoUrls.push(data.publicUrl);
        }
      }
      
      const { error } = await supabase.from('reports').insert([
        { ...formData, user_id: user.id, photos: photoUrls }
      ]);
      
      if (error) throw error;
      
      toast.success('Report saved successfully!');
      navigate('/');
    } catch (error) {
      toast.error(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="p-4 sm:p-8 bg-white shadow-lg rounded-lg border-t-8 border-brand-yellow max-w-4xl mx-auto w-full">
      <h2 className="text-2xl font-bold text-brand-dark mb-6 border-b pb-2">New Daily Progress Report</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input type="date" name="date" required value={formData.date} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-yellow focus:ring-brand-yellow sm:text-sm p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Project Name</label>
            <select name="project_name" required value={formData.project_name} onChange={handleChange} className="mt-1 block w-full bg-white rounded-md border-gray-300 shadow-sm focus:border-brand-yellow focus:ring-brand-yellow sm:text-sm p-2 border">
              <option value="" disabled>Select a project...</option>
              {projectsList.length > 0 ? projectsList.map((proj, idx) => (
                <option key={idx} value={proj.name}>{proj.name}</option>
              )) : (
                <option value="Loading..." disabled>Loading projects...</option>
              )}
            </select>
          </div>
        </div>

        {/* A) Inventory */}
        <div className="mt-8 border-t pt-6">
          <h3 className="font-bold text-gray-800 mb-4 text-lg">A) Material Inventory</h3>
          <div className="overflow-x-auto shadow-sm ring-1 ring-black ring-opacity-5 rounded-lg">
            <table className="min-w-full divide-y divide-gray-300 bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border-r">Material</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border-r">Opening Bal.</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border-r">Day's Receipt</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border-r">Day's Cons.</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border-r">Closing Bal.</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.keys(formData.inventory).map(item => (
                  <tr key={item}>
                    <td className="whitespace-nowrap px-3 py-2 text-sm font-medium text-gray-900 border-r">{item}</td>
                    {['opening', 'receipt', 'consumed', 'closing', 'remarks'].map(field => (
                      <td key={field} className="px-1 py-1 border-r last:border-0">
                        <input type="text" className="block w-full rounded border-gray-300 focus:border-brand-yellow focus:ring-brand-yellow sm:text-sm p-1 border" value={formData.inventory[item][field]} onChange={(e) => handleInventoryChange(item, field, e.target.value)} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* B) Cement Consumption */}
        <div className="mt-8 border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 text-lg">B) Cement Consumption Statement</h3>
            <button type="button" onClick={() => addRow('cement_consumption', { activity: '', qty: '', bags: '' })} className="bg-gray-100 border text-sm px-3 py-1 rounded shadow-sm hover:bg-gray-200">+ Add Row</button>
          </div>
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[500px] space-y-2">
              <div className="grid grid-cols-12 gap-2 font-medium text-sm text-gray-600 px-1">
                <div className="col-span-5">Activity</div>
                <div className="col-span-3">Qty</div>
                <div className="col-span-3">No. of Bags</div>
                <div className="col-span-1 text-center">Act</div>
              </div>
              {formData.cement_consumption.map((row, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5"><input type="text" className="w-full border rounded p-2 text-sm" placeholder="Activity" value={row.activity} onChange={(e) => handleArrayChange('cement_consumption', i, 'activity', e.target.value)} /></div>
                  <div className="col-span-3"><input type="text" className="w-full border rounded p-2 text-sm" placeholder="Qty" value={row.qty} onChange={(e) => handleArrayChange('cement_consumption', i, 'qty', e.target.value)} /></div>
                  <div className="col-span-3"><input type="text" className="w-full border rounded p-2 text-sm" placeholder="Bags" value={row.bags} onChange={(e) => handleArrayChange('cement_consumption', i, 'bags', e.target.value)} /></div>
                  <div className="col-span-1 text-center"><button type="button" onClick={() => removeRow('cement_consumption', i)} className="text-red-500 hover:text-red-700 text-lg font-bold">&times;</button></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* C) Material Received */}
        <div className="mt-8 border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 text-lg">C) Material Received</h3>
            <button type="button" onClick={() => addRow('material_received', { description: '', challan: '', party: '', item: '', remarks: '' })} className="bg-gray-100 border text-sm px-3 py-1 rounded shadow-sm hover:bg-gray-200">+ Add Row</button>
          </div>
          <div className="space-y-2 overflow-x-auto pb-2">
            <div className="min-w-[700px]">
              <div className="grid grid-cols-12 gap-2 font-medium text-sm text-gray-600 px-1">
                <div className="col-span-3">Description</div>
                <div className="col-span-2">Challan No.</div>
                <div className="col-span-2">Party</div>
                <div className="col-span-2">Item</div>
                <div className="col-span-2">Remarks</div>
                <div className="col-span-1 text-center">Act</div>
              </div>
              {formData.material_received.map((row, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center mt-2">
                  <div className="col-span-3"><input type="text" className="w-full border rounded p-2 text-sm" value={row.description} onChange={(e) => handleArrayChange('material_received', i, 'description', e.target.value)} /></div>
                  <div className="col-span-2"><input type="text" className="w-full border rounded p-2 text-sm" value={row.challan} onChange={(e) => handleArrayChange('material_received', i, 'challan', e.target.value)} /></div>
                  <div className="col-span-2"><input type="text" className="w-full border rounded p-2 text-sm" value={row.party} onChange={(e) => handleArrayChange('material_received', i, 'party', e.target.value)} /></div>
                  <div className="col-span-2"><input type="text" className="w-full border rounded p-2 text-sm" value={row.item} onChange={(e) => handleArrayChange('material_received', i, 'item', e.target.value)} /></div>
                  <div className="col-span-2"><input type="text" className="w-full border rounded p-2 text-sm" value={row.remarks} onChange={(e) => handleArrayChange('material_received', i, 'remarks', e.target.value)} /></div>
                  <div className="col-span-1 text-center"><button type="button" onClick={() => removeRow('material_received', i)} className="text-red-500 hover:text-red-700 text-lg font-bold">&times;</button></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* D) Material Ordered */}
        <div className="mt-8 border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 text-lg">D) Material Ordered</h3>
            <button type="button" onClick={() => addRow('material_ordered', { description: '', requisition: '' })} className="bg-gray-100 border text-sm px-3 py-1 rounded shadow-sm hover:bg-gray-200">+ Add Row</button>
          </div>
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[500px] space-y-2">
              <div className="grid grid-cols-12 gap-2 font-medium text-sm text-gray-600 px-1">
                <div className="col-span-7">Description</div>
                <div className="col-span-4">Requisition No.</div>
                <div className="col-span-1 text-center">Act</div>
              </div>
              {formData.material_ordered.map((row, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center mt-2">
                  <div className="col-span-7"><input type="text" className="w-full border rounded p-2 text-sm" value={row.description} onChange={(e) => handleArrayChange('material_ordered', i, 'description', e.target.value)} /></div>
                  <div className="col-span-4"><input type="text" className="w-full border rounded p-2 text-sm" value={row.requisition} onChange={(e) => handleArrayChange('material_ordered', i, 'requisition', e.target.value)} /></div>
                  <div className="col-span-1 text-center"><button type="button" onClick={() => removeRow('material_ordered', i)} className="text-red-500 hover:text-red-700 text-lg font-bold">&times;</button></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* E & F */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 border-t pt-6">
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1">E) Urgent Requirements</label>
            <textarea name="urgent_requirements" rows="4" value={formData.urgent_requirements} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-yellow focus:ring-brand-yellow sm:text-sm p-2 border" placeholder="List any urgent materials or requirements..." />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1">F) Visitors</label>
            <textarea name="visitors" rows="4" value={formData.visitors} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-yellow focus:ring-brand-yellow sm:text-sm p-2 border" placeholder="1.&#10;2." />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Attach Photos</label>
          <input type="file" multiple accept="image/*" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-yellow file:text-brand-dark hover:file:bg-yellow-500" />
        </div>

        <div className="flex justify-end pt-4">
          <button type="button" onClick={() => navigate('/')} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-yellow mr-3">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-brand-dark bg-brand-yellow hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-yellow disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Report'}
          </button>
        </div>
      </form>
    </div>
  );
}