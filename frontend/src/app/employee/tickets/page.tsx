'use client';

import { useEffect, useState } from 'react';
import { FiCheckCircle, FiClock, FiAlertCircle, FiChevronRight } from 'react-icons/fi';
import Link from 'next/link';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  customer: {
    companyName: string;
    address: string;
  };
  createdAt: string;
}

export default function EmployeeTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/tickets/my`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(Array.isArray(data) ? data : []);
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error('Error:', error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-red-600 bg-red-50';
      case 'HIGH': return 'text-orange-600 bg-orange-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
      <div className="max-w-3xl mx-auto mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Assigned Service Tickets</h1>
        <p className="text-slate-500">Manage your active service requests and site visits.</p>
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse shadow-sm"></div>)
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center text-slate-400 shadow-sm border border-slate-100">
            <FiCheckCircle className="w-12 h-12 mx-auto mb-4 text-slate-200" />
            <p>No active tickets assigned to you.</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <Link 
              key={ticket.id} 
              href={`/employee/tickets/${ticket.id}`}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all group"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                  <span className="text-xs text-slate-400">#{ticket.id.slice(0, 8)}</span>
                </div>
                <h3 className="font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">{ticket.title}</h3>
                <p className="text-sm text-slate-600 mb-2">{ticket.customer.companyName}</p>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><FiClock className="w-3 h-3" /> {new Date(ticket.createdAt).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1 uppercase font-semibold text-blue-500">{ticket.status}</span>
                </div>
              </div>
              <FiChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors w-6 h-6" />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
