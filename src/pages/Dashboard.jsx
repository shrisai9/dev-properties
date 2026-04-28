import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Download, FileText, Search, Calendar } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'react-hot-toast';
import devLogo from '../assets/dev.jpeg';
import petalsLogo from '../assets/petals.jpeg';

export default function Dashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    fetchReports();
  }, [searchTerm, startDate, endDate]);

  const fetchReports = async () => {
    setLoading(true);
    let query = supabase.from('reports').select('*').order('date', { ascending: false });
    
    if (searchTerm) query = query.ilike('project_name', `%${searchTerm}%`);
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);
      
    const { data, error } = await query;
      
    if (error) toast.error("Error fetching reports");
    else setReports(data || []);
    
    setLoading(false);
  };

  const generatePDF = async (report, elementId) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const toastId = toast.loading('Generating PDF...');
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`DPR_${report.project_name}_${report.date}.pdf`);
      
      toast.success('PDF Downloaded!', { id: toastId });
    } catch (error) {
      toast.error('Failed to generate PDF', { id: toastId });
    }
  };

  const handleDownload = () => {
    if (!selectedReport) return;
    generatePDF(selectedReport, `report-${selectedReport.id}`);
  };

  if (loading && reports.length === 0) return <div className="text-center py-10">Loading reports...</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto items-start">
      
      {/* Sidebar (Filters & List) */}
      <div className="w-full lg:w-1/3 flex flex-col gap-4 sticky top-6">
        <div className="flex justify-between items-center bg-white p-4 shadow rounded-lg border-l-4 border-brand-yellow">
          <h2 className="text-xl font-bold text-brand-dark">Dashboard Overview</h2>
          <span className="text-gray-500 text-sm font-semibold">{reports.length} Reports</span>
        </div>

        {/* Filters Section */}
        <div className="bg-white p-4 shadow rounded-lg space-y-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input type="text" placeholder="Search project name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-brand-yellow focus:border-brand-yellow sm:text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="block w-full p-2 border border-gray-300 rounded-md sm:text-sm focus:ring-brand-yellow focus:border-brand-yellow" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">to</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="block w-full p-2 border border-gray-300 rounded-md sm:text-sm focus:ring-brand-yellow focus:border-brand-yellow" />
          </div>
        </div>

        {/* Reports List */}
        <div className="bg-white shadow rounded-lg max-h-[60vh] overflow-y-auto divide-y divide-gray-100">
          {reports.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">No reports found.</div>
          ) : (
            reports.map((report) => (
              <div 
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedReport?.id === report.id ? 'bg-yellow-50 border-l-4 border-brand-yellow' : 'border-l-4 border-transparent'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-gray-900 text-sm truncate pr-2">{report.project_name}</h3>
                  {report.status && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap ${
                      report.status === 'Approved' ? 'bg-green-100 text-green-800 border-green-800' :
                      report.status === 'Needs Revision' ? 'bg-red-100 text-red-800 border-red-800' :
                      'bg-yellow-100 text-yellow-800 border-yellow-800'
                    }`}>{report.status}</span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{report.date}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full lg:w-2/3">
        {!selectedReport ? (
          <div className="bg-white shadow-lg rounded-lg border border-gray-200 p-12 flex flex-col items-center justify-center text-center min-h-[60vh]">
            <FileText size={64} className="text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-700">Select a Report</h2>
            <p className="text-gray-500 mt-2 max-w-sm">Choose a report from the sidebar to view its details, see attached photos, and download it as a PDF.</p>
          </div>
        ) : (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200 mb-8">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedReport.project_name}</h3>
                <p className="text-sm text-gray-500">Submitted on {selectedReport.date}</p>
              </div>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 bg-brand-yellow text-brand-dark px-4 py-2 rounded-md font-medium hover:bg-yellow-500 transition-colors"
              >
                <Download size={16} /> Download PDF
              </button>
            </div>
            
            {/* PDF Report Area */}
            <div id={`report-${selectedReport.id}`} className="p-8 bg-white text-black relative">
              {/* Status Badge */}
              {selectedReport.status && (
                <div className="absolute top-8 right-8">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    selectedReport.status === 'Approved' ? 'bg-green-100 text-green-800 border-green-800' :
                    selectedReport.status === 'Needs Revision' ? 'bg-red-100 text-red-800 border-red-800' :
                    'bg-yellow-100 text-yellow-800 border-yellow-800'
                  }`}>{selectedReport.status}</span>
                </div>
              )}

              {/* Header mimicking paper form */}
              <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-6 mt-4">
                <img src={devLogo} alt="Dev Property Logo" className="h-20 w-20 object-contain" crossOrigin="anonymous" />
                <div className="text-center flex-1 px-4">
                  <h2 className="text-2xl font-bold underline mb-2 tracking-wide uppercase">DAILY PROGRESS REPORT</h2>
                  <h3 className="text-xl font-extrabold mb-1 uppercase">Dev Property</h3>
                  <p className="text-sm font-medium">G. No:- 347. Vandan Park, Fulmala Shirwat.</p>
                  <p className="text-sm font-medium">Tal:- Khandala, Dist Satara 412801</p>
                </div>
                <img src={petalsLogo} alt="Site Logo" className="h-20 w-20 object-contain" crossOrigin="anonymous" />
              </div>
              
              {/* General Info */}
              <div className="flex justify-between mb-6 text-sm font-bold">
                <div>Name of Site: <span className="font-normal underline ml-2">{selectedReport.project_name}</span></div>
                <div>Date: <span className="font-normal underline ml-2">{selectedReport.date}</span></div>
              </div>

              {/* A) Inventory Table */}
              {selectedReport.inventory && typeof selectedReport.inventory === 'object' && Object.keys(selectedReport.inventory).length > 0 && (
                <div className="mb-6">
                  <h4 className="font-bold text-sm mb-1">A) Material Inventory</h4>
                  <table className="w-full border-collapse border border-black text-xs text-left mb-2">
                    <thead>
                      <tr className="border-b border-black">
                        <th className="border-r border-black p-1 bg-gray-100">Material</th>
                        <th className="border-r border-black p-1 bg-gray-100">Opening Bal.</th>
                        <th className="border-r border-black p-1 bg-gray-100">Day's Receipt</th>
                        <th className="border-r border-black p-1 bg-gray-100">Day's Cons.</th>
                        <th className="border-r border-black p-1 bg-gray-100">Closing Bal.</th>
                        <th className="p-1 bg-gray-100">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(selectedReport.inventory).map(([item, data]) => (
                        <tr key={item} className="border-b border-black last:border-b-0">
                          <td className="border-r border-black p-1 font-bold bg-gray-50">{item}</td>
                          <td className="border-r border-black p-1">{data?.opening}</td>
                          <td className="border-r border-black p-1">{data?.receipt}</td>
                          <td className="border-r border-black p-1">{data?.consumed}</td>
                          <td className="border-r border-black p-1">{data?.closing}</td>
                          <td className="p-1">{data?.remarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* B) Cement Consumption */}
              {selectedReport.cement_consumption && selectedReport.cement_consumption.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-bold text-sm mb-1">B) Cement Consumption Statement</h4>
                  <table className="w-full border-collapse border border-black text-xs text-left">
                    <thead>
                      <tr className="border-b border-black">
                        <th className="border-r border-black p-1 w-12 text-center bg-gray-100">S. No.</th>
                        <th className="border-r border-black p-1 bg-gray-100">Activity</th>
                        <th className="border-r border-black p-1 bg-gray-100">Qty</th>
                        <th className="p-1 bg-gray-100">No. of Bags</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReport.cement_consumption.map((row, i) => (
                        <tr key={i} className="border-b border-black last:border-b-0">
                          <td className="border-r border-black p-1 text-center">{i + 1}</td>
                          <td className="border-r border-black p-1">{row.activity}</td>
                          <td className="border-r border-black p-1">{row.qty}</td>
                          <td className="p-1">{row.bags}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* C) Material Received */}
              {selectedReport.material_received && selectedReport.material_received.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-bold text-sm mb-1">C) Material Received</h4>
                  <table className="w-full border-collapse border border-black text-xs text-left">
                    <thead>
                      <tr className="border-b border-black">
                        <th className="border-r border-black p-1 w-12 text-center bg-gray-100">S. No.</th>
                        <th className="border-r border-black p-1 bg-gray-100">Description</th>
                        <th className="border-r border-black p-1 bg-gray-100">Challan No.</th>
                        <th className="border-r border-black p-1 bg-gray-100">Party</th>
                        <th className="border-r border-black p-1 bg-gray-100">Item</th>
                        <th className="p-1 bg-gray-100">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReport.material_received.map((row, i) => (
                        <tr key={i} className="border-b border-black last:border-b-0">
                          <td className="border-r border-black p-1 text-center">{i + 1}</td>
                          <td className="border-r border-black p-1">{row.description}</td>
                          <td className="border-r border-black p-1">{row.challan}</td>
                          <td className="border-r border-black p-1">{row.party}</td>
                          <td className="border-r border-black p-1">{row.item}</td>
                          <td className="p-1">{row.remarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* D) Material Ordered */}
              {selectedReport.material_ordered && selectedReport.material_ordered.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-bold text-sm mb-1">D) Material Ordered</h4>
                  <table className="w-full border-collapse border border-black text-xs text-left">
                    <thead>
                      <tr className="border-b border-black">
                        <th className="border-r border-black p-1 w-12 text-center bg-gray-100">S. No.</th>
                        <th className="border-r border-black p-1 bg-gray-100">Description</th>
                        <th className="p-1 bg-gray-100">Requisition No.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReport.material_ordered.map((row, i) => (
                        <tr key={i} className="border-b border-black last:border-b-0">
                          <td className="border-r border-black p-1 text-center">{i + 1}</td>
                          <td className="border-r border-black p-1">{row.description}</td>
                          <td className="p-1">{row.requisition}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* E) Urgent Requirements & F) Visitors */}
              <div className="grid grid-cols-2 gap-8 mb-6">
                <div>
                  <h4 className="font-bold text-sm mb-1">E) Urgent Requirements</h4>
                  <div className="border border-black p-2 min-h-[80px] text-sm whitespace-pre-wrap">
                    {selectedReport.urgent_requirements}
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-sm mb-1">F) Visitors</h4>
                  <div className="border border-black p-2 min-h-[80px] text-sm whitespace-pre-wrap">
                    {selectedReport.visitors}
                  </div>
                </div>
              </div>
              
              {/* Render Old Form Fields if they exist, to prevent data loss visually */}
              {(selectedReport.work_completed || selectedReport.weather) && (
                <div className="mb-6 border-t border-gray-300 pt-4 mt-4">
                  <h4 className="font-bold text-sm mb-2 text-gray-500">Additional Logs</h4>
                  <div className="text-xs text-gray-700 space-y-2">
                    {['weather', 'work_completed', 'contractors_on_site', 'equipment_used', 'materials_received', 'delays_issues', 'safety_incidents'].map((field) => selectedReport[field] ? (<div key={field}><span className="font-bold capitalize">{field.replace(/_/g, ' ')}:</span> {selectedReport[field]}</div>) : null)}
                  </div>
                </div>
              )}

              {selectedReport.photos && selectedReport.photos.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-bold text-sm mb-2">Attached Photos</h4>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {selectedReport.photos.map((url, i) => (
                      <img key={i} src={url} alt={`attachment-${i}`} className="h-48 w-48 object-cover rounded shadow-sm border border-black" crossOrigin="anonymous" />
                    ))}
                  </div>
                </div>
              )}

              {/* Signatures */}
              <div className="flex justify-between mt-16 pt-8 px-12">
                <div className="text-center">
                  <div className="border-t border-black w-40 mb-2"></div>
                  <p className="font-bold text-sm">Site Engineer</p>
                </div>
                <div className="text-center">
                  <div className="border-t border-black w-40 mb-2"></div>
                  <p className="font-bold text-sm">Checked By</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
