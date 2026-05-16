'use client';

import { useState, useEffect } from 'react';
import { FiX, FiSave, FiPackage, FiCalendar, FiPlusSquare, FiHash, FiShield } from 'react-icons/fi';

interface AddMachineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddMachineModal({ isOpen, onClose, onSuccess }: AddMachineModalProps) {
  const [loading, setLoading] = useState(false);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [isManual, setIsManual] = useState(false);
  
  const [formData, setFormData] = useState({
    serialNumber: '',
    machineName: '',
    customerId: '',
    manualCustomer: {
      companyName: '',
      contactName: '',
      phone: '',
      address: '',
      email: ''
    },
    installationDate: new Date().toISOString().split('T')[0],
    warrantyStartDate: new Date().toISOString().split('T')[0],
    warrantyEndDate: '',
    amcStartDate: '',
    amcEndDate: '',
    amount: '',
    contractType: 'WARRANTY',
    probe1Model: '', probe1Serial: '',
    probe2Model: '', probe2Serial: '',
    probe3Model: '', probe3Serial: '',
    probe4Model: '', probe4Serial: '',
    probe5Model: '', probe5Serial: '',
    otherDevice: ''
  });

  useEffect(() => {
    if (isOpen) fetchHospitals();
  }, [isOpen]);

  const fetchHospitals = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/hospitals`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setHospitals(data);
    } catch (error) {
      console.error(error);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Prepare payload
    const payload = { ...formData };
    if (!isManual) delete (payload as any).manualCustomer;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/machines`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const err = await res.json();
        alert(err.message || 'Error adding machine');
      }
    } catch (error) {
      console.error(error);
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 my-8">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <FiPackage className="text-blue-600" /> New Installation
            </h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Register machine & accessories</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-50 rounded-2xl transition-colors">
            <FiX className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Section: Machine Core */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-[0.2em]">
                <div className="h-px bg-blue-100 flex-1"></div>
                Unit & Financials
                <div className="h-px bg-blue-100 flex-1"></div>
             </div>
             <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Serial Number</label>
                  <div className="relative group">
                    <FiHash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    <input 
                      required
                      type="text" 
                      placeholder="SN-99201"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
                      value={formData.serialNumber}
                      onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Machine Model</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Ultrasound V7"
                    className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
                    value={formData.machineName}
                    onChange={(e) => setFormData({...formData, machineName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sale Amount</label>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  />
                </div>
             </div>
          </div>

          {/* Section: Hospital/Customer */}
          <div className="space-y-4 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
             <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hospital / Customer Information</label>
                <button 
                  type="button"
                  onClick={() => setIsManual(!isManual)}
                  className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-full border transition-all ${
                    isManual ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'
                  }`}
                >
                  {isManual ? 'Manual Entry Active' : 'Select from List'}
                </button>
             </div>

             {!isManual ? (
               <div className="relative group">
                 <FiPlusSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                 <select 
                   required
                   className="w-full pl-12 pr-4 py-4 bg-white border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/5 outline-none appearance-none cursor-pointer"
                   value={formData.customerId}
                   onChange={(e) => setFormData({...formData, customerId: e.target.value})}
                 >
                   <option value="">Choose Existing Hospital...</option>
                   {hospitals.map((h: any) => (
                     <option key={h.id} value={h.id}>{h.companyName}</option>
                   ))}
                 </select>
               </div>
             ) : (
               <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                  <input 
                    required
                    type="text" 
                    placeholder="Hospital Name / Company Name"
                    className="w-full px-6 py-4 bg-white border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/5 outline-none"
                    value={formData.manualCustomer.companyName}
                    onChange={(e) => setFormData({...formData, manualCustomer: {...formData.manualCustomer, companyName: e.target.value}})}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      type="text" 
                      placeholder="Primary Contact Number"
                      className="w-full px-6 py-4 bg-white border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/5 outline-none"
                      value={formData.manualCustomer.phone}
                      onChange={(e) => setFormData({...formData, manualCustomer: {...formData.manualCustomer, phone: e.target.value}})}
                    />
                    <input 
                      type="text" 
                      placeholder="Email (Optional)"
                      className="w-full px-6 py-4 bg-white border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/5 outline-none"
                      value={formData.manualCustomer.email}
                      onChange={(e) => setFormData({...formData, manualCustomer: {...formData.manualCustomer, email: e.target.value}})}
                    />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Full Physical Address"
                    className="w-full px-6 py-4 bg-white border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/5 outline-none"
                    value={formData.manualCustomer.address}
                    onChange={(e) => setFormData({...formData, manualCustomer: {...formData.manualCustomer, address: e.target.value}})}
                  />
               </div>
             )}
          </div>

          {/* Section: Probe Details */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
                <div className="h-px bg-slate-100 flex-1"></div>
                Probe Configurations
                <div className="h-px bg-slate-100 flex-1"></div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="flex gap-3 items-center bg-slate-50/30 p-2 rounded-2xl border border-slate-100/50">
                    <div className="w-6 text-[10px] font-black text-slate-300 text-center">{i}</div>
                    <div className="flex-1 space-y-2">
                      <input 
                        type="text" 
                        placeholder={`Probe ${i} Model`}
                        className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all"
                        value={(formData as any)[`probe${i}Model`]}
                        onChange={(e) => setFormData({...formData, [`probe${i}Model`]: e.target.value})}
                      />
                      <input 
                        type="text" 
                        placeholder="Serial Number"
                        className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all"
                        value={(formData as any)[`probe${i}Serial`]}
                        onChange={(e) => setFormData({...formData, [`probe${i}Serial`]: e.target.value})}
                      />
                    </div>
                  </div>
                ))}
                <div className="flex flex-col justify-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Other Accessories</label>
                  <textarea 
                    placeholder="e.g. UPS, Stabilizer, Printer details..."
                    className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all h-20 resize-none"
                    value={formData.otherDevice}
                    onChange={(e) => setFormData({...formData, otherDevice: e.target.value})}
                  />
                </div>
             </div>
          </div>

          {/* Section: Dates & Contract */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
                <div className="h-px bg-slate-100 flex-1"></div>
                Service & Contract Lifecycle
                <div className="h-px bg-slate-100 flex-1"></div>
             </div>
             
             <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contract Type</label>
                  <select 
                    className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/5 outline-none"
                    value={formData.contractType}
                    onChange={(e) => setFormData({...formData, contractType: e.target.value})}
                  >
                    <option value="WARRANTY">Warranty</option>
                    <option value="AMC">AMC (Labour Only)</option>
                    <option value="CMC">CMC (Labour + Parts)</option>
                    <option value="NAMC">NAMC (New AMC)</option>
                    <option value="NONE">No Contract</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Installation Date</label>
                  <input 
                    required
                    type="date" 
                    className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/5 outline-none"
                    value={formData.installationDate}
                    onChange={(e) => setFormData({...formData, installationDate: e.target.value})}
                  />
                </div>
             </div>

             <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4 p-4 bg-emerald-50/50 rounded-[1.5rem] border border-emerald-100/50">
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest text-center">Warranty Period</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[8px] font-bold text-emerald-400 uppercase ml-1">Start</label>
                      <input type="date" className="w-full bg-white border-none rounded-xl p-2 text-xs font-bold text-slate-700 outline-none" value={formData.warrantyStartDate} onChange={e => setFormData({...formData, warrantyStartDate: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[8px] font-bold text-emerald-400 uppercase ml-1">End</label>
                      <input type="date" className="w-full bg-white border-none rounded-xl p-2 text-xs font-bold text-slate-700 outline-none" value={formData.warrantyEndDate} onChange={e => setFormData({...formData, warrantyEndDate: e.target.value})} />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4 p-4 bg-blue-50/50 rounded-[1.5rem] border border-blue-100/50">
                  <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest text-center">AMC Period (If Applicable)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[8px] font-bold text-blue-400 uppercase ml-1">Start</label>
                      <input type="date" className="w-full bg-white border-none rounded-xl p-2 text-xs font-bold text-slate-700 outline-none" value={formData.amcStartDate} onChange={e => setFormData({...formData, amcStartDate: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[8px] font-bold text-blue-400 uppercase ml-1">End</label>
                      <input type="date" className="w-full bg-white border-none rounded-xl p-2 text-xs font-bold text-slate-700 outline-none" value={formData.amcEndDate} onChange={e => setFormData({...formData, amcEndDate: e.target.value})} />
                    </div>
                  </div>
                </div>
             </div>
          </div>

          <div className="pt-8 flex gap-4 sticky bottom-0 bg-white pb-2">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-2"
            >
              {loading ? 'Registering...' : <><FiSave className="w-4 h-4" /> Save Installation</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
