'use client';

import { useEffect, useState } from 'react';
import { FiPlus, FiSearch, FiFilter, FiEdit2, FiTrash2, FiExternalLink } from 'react-icons/fi';
import AddMachineModal from '../../../components/AddMachineModal';
import EditMachineModal from '../../../components/EditMachineModal';

interface Machine {
  id: string;
  serialNumber: string;
  machineName: string;
  installationDate: string;
  warrantyStartDate: string | null;
  warrantyEndDate: string | null;
  amcStartDate: string | null;
  amcEndDate: string | null;
  customer: {
    companyName: string;
  };
  status: string;
  contractType: string;
  amount: number | null;
}

export default function MachineManagement() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [filteredMachines, setFilteredMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<keyof Machine | 'customer'>('machineName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);

  useEffect(() => {
    fetchMachines();
  }, []);

  useEffect(() => {
    let result = [...machines];
    
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(m => 
        (m.machineName?.toLowerCase() || '').includes(q) ||
        (m.serialNumber?.toLowerCase() || '').includes(q) ||
        (m.customer?.companyName?.toLowerCase() || '').includes(q)
      );
    }

    result.sort((a, b) => {
      let aVal: any = sortKey === 'customer' ? a.customer?.companyName : a[sortKey as keyof Machine];
      let bVal: any = sortKey === 'customer' ? b.customer?.companyName : b[sortKey as keyof Machine];
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredMachines(result);
  }, [search, machines, sortKey, sortOrder]);

  const fetchMachines = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/machines`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setMachines(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this installation?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/machines/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchMachines();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (machine: Machine) => {
    setSelectedMachine(machine);
    setIsEditModalOpen(true);
  };

  const toggleSort = (key: keyof Machine | 'customer') => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const getStatusBadge = (m: Machine) => {
    const isWarrantyExpired = m.warrantyEndDate && new Date(m.warrantyEndDate) < new Date();
    const needsNAMC = isWarrantyExpired && m.contractType === 'WARRANTY';
    
    if (needsNAMC) return <div className="flex flex-col gap-1">
      <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-rose-100">Action Required</span>
      <span className="text-[9px] font-bold text-rose-500 animate-pulse">Convert to NAMC</span>
    </div>;

    if (m.contractType === 'NAMC') return <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-blue-100 italic">NAMC ACTIVE</span>;
    
    return <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
      isWarrantyExpired ? 'bg-slate-50 text-slate-400 border-slate-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
    }`}>
      {isWarrantyExpired ? 'Standard Support' : 'Active Warranty'}
    </span>;
  };

  const getServiceProgress = (m: any) => {
    const services = m.serviceSchedules || [];
    const completed = services.filter((s: any) => s.status === 'COMPLETED').length;
    return (
      <div className="flex flex-col gap-1 w-24">
        <div className="flex justify-between text-[9px] font-black text-slate-400">
          <span>SERVICE</span>
          <span>{completed}/4</span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= completed ? 'bg-emerald-400' : 'bg-slate-100'}`}></div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Machine Installations</h1>
          <p className="text-slate-500 mt-1">Track and manage all ultrasound machines deployed in hospitals.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-all shadow-md shadow-blue-200 font-bold"
        >
          <FiPlus className="stroke-[3px]" /> New Installation
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4 items-center">
        <div className="relative flex-1 group">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search by serial, machine or hospital..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4 cursor-pointer hover:text-blue-600" onClick={() => toggleSort('serialNumber')}>Serial Number</th>
                <th className="px-6 py-4 cursor-pointer hover:text-blue-600" onClick={() => toggleSort('machineName')}>Machine</th>
                <th className="px-6 py-4 cursor-pointer hover:text-blue-600" onClick={() => toggleSort('customer')}>Hospital</th>
                <th className="px-6 py-4 cursor-pointer hover:text-blue-600" onClick={() => toggleSort('installationDate')}>Install Date</th>
                <th className="px-6 py-4 cursor-pointer hover:text-blue-600" onClick={() => toggleSort('warrantyEndDate')}>Warranty Until</th>
                <th className="px-6 py-4">Service Tracker</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-medium">Loading machines...</span>
                  </div>
                </td></tr>
              ) : filteredMachines.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-medium">No records found.</td></tr>
              ) : (
                filteredMachines.map((m) => (
                  <tr key={m.id} className="hover:bg-blue-50/30 transition-all group">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-blue-600">{m.serialNumber}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-800">{m.machineName}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">{m.customer?.companyName || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{new Date(m.installationDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">{m.warrantyEndDate ? new Date(m.warrantyEndDate).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-6 py-4">{getServiceProgress(m)}</td>
                    <td className="px-6 py-4">{getStatusBadge(m)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => handleEdit(m)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><FiEdit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(m.id)} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><FiTrash2 className="w-4 h-4" /></button>
                        <button className="p-2.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"><FiExternalLink className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddMachineModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchMachines} 
      />

      <EditMachineModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onSuccess={fetchMachines}
        machine={selectedMachine}
      />
    </div>
  );
}
