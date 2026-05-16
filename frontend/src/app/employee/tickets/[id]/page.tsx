'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiCamera, FiEdit3, FiSave, FiMapPin, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

export default function ServiceReportPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  
  const [formData, setFormData] = useState({
    breakdownDetails: '',
    workDone: '',
    partsReplaced: '',
    status: 'COMPLETED'
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/service/report`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ticketId: id,
          ...formData,
          latitude: location?.lat,
          longitude: location?.lng
        })
      });

      if (res.ok) {
        alert('Service report submitted successfully!');
        router.push('/employee/tickets');
      }
    } catch (error) {
      console.error(error);
      alert('Error submitting report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.back()} className="text-sm text-slate-500 mb-6 hover:text-slate-800 transition-colors">← Back to Tickets</button>
        
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-blue-600 p-8 text-white">
            <h1 className="text-2xl font-bold">Service Completion Report</h1>
            <p className="text-blue-100 mt-1">Ticket ID: {id?.slice(0, 8)}</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <FiAlertCircle className="text-blue-500" /> Breakdown Details
              </label>
              <textarea 
                required
                className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                placeholder="What issue was reported by the customer?"
                rows={3}
                value={formData.breakdownDetails}
                onChange={(e) => setFormData({...formData, breakdownDetails: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <FiEdit3 className="text-blue-500" /> Work Done
              </label>
              <textarea 
                required
                className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                placeholder="Describe the service/repairs performed..."
                rows={3}
                value={formData.workDone}
                onChange={(e) => setFormData({...formData, workDone: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Parts Replaced</label>
              <input 
                type="text"
                className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                placeholder="e.g., Transducer cable, Power supply unit..."
                value={formData.partsReplaced}
                onChange={(e) => setFormData({...formData, partsReplaced: e.target.value})}
              />
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <button type="button" className="flex items-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors">
                <FiCamera /> Add Photo
              </button>
              <button type="button" className="flex items-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors">
                <FiMapPin /> {location ? 'Location Locked' : 'Capturing Location...'}
              </button>
            </div>

            <div className="pt-8">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Submitting...' : <><FiCheckCircle /> Submit Final Report</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
