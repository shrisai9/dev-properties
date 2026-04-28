import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Download, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminDashboard() {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, incidents: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllReports();
  }, []);

  const fetchAllReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      toast.error('Failed to fetch reports for admin');
    } else {
      setReports(data || []);
      
      // Calculate Admin Analytics
      const pendingCount = data.filter(r => r.status === 'Pending Review' || !r.status).length;
      const incidentCount = data.filter(r => r.safety_incidents && r.safety_incidents.trim() !== '').length;
      
      setStats({
        total: data.length,
        pending: pendingCount,
        incidents: incidentCount
      });
    }
    setLoading(false);
  };

  const updateStatus = async (id, newStatus) => {
    const { error } = await supabase
      .from('reports')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success(`Report marked as ${newStatus}`);
      fetchAllReports(); // Refresh the list
    }
  };

  const exportToCSV = () => {
    if (reports.length === 0) return;
    
    const headers = ['Date', 'Project Name', 'Status', 'Urgent Requirements', 'Visitors'];
    const csvRows = reports.map(r => [
      r.date,
      `"${r.project_name || ''}"`,
      `"${r.status || 'Pending Review'}"`,
      `"${(r.urgent_requirements || '').replace(/\n/g, ' ')}"`,
      `"${(r.visitors || '').replace(/\n/g, ' ')}"`
    ]);
    
    const csvContent = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DPR_Admin_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="text-center py-10">Loading admin data...</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brand-dark text-white p-6 shadow rounded-lg border-l-4 border-brand-yellow">
        <h2 className="text-3xl font-bold">Admin Portal</h2>
        <button onClick={exportToCSV} className="w-full sm:w-auto flex justify-center items-center gap-2 bg-brand-yellow text-brand-dark px-4 py-3 sm:py-2 rounded-md font-bold hover:bg-yellow-500 transition">
          <Download size={18} /> Export All to CSV
        </button>
      </div>

      {/* Analytics Widget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border-t-4 border-blue-500 text-center">
          <p className="text-gray-500 text-sm font-semibold uppercase">Total Reports</p>
          <p className="text-4xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-t-4 border-yellow-500 text-center">
          <p className="text-gray-500 text-sm font-semibold uppercase">Pending Review</p>
          <p className="text-4xl font-bold text-gray-800">{stats.pending}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-t-4 border-red-500 text-center">
          <p className="text-gray-500 text-sm font-semibold uppercase">Reports w/ Incidents</p>
          <p className="text-4xl font-bold text-red-600">{stats.incidents}</p>
        </div>
      </div>

      {/* Approval Workflow Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reports.map((report) => (
              <tr key={report.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{report.project_name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    report.status === 'Approved' ? 'bg-green-100 text-green-800' :
                    report.status === 'Needs Revision' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {report.status || 'Pending Review'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {report.status !== 'Approved' && (
                    <button onClick={() => updateStatus(report.id, 'Approved')} className="text-green-600 hover:text-green-900 mx-2 inline-flex items-center gap-1">
                      <CheckCircle size={16} /> Approve
                    </button>
                  )}
                  {report.status !== 'Needs Revision' && (
                    <button onClick={() => updateStatus(report.id, 'Needs Revision')} className="text-red-600 hover:text-red-900 mx-2 inline-flex items-center gap-1">
                      <AlertTriangle size={16} /> Reject
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}