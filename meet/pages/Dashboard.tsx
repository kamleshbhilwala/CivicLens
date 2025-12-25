import React, { useEffect, useState } from 'react';
import { getComplaints, updateComplaintStatus } from '../services/storageService';
import { ComplaintData, ComplaintStatus } from '../types';
import { FileText, Calendar, ChevronDown, CheckCircle, Clock, Send, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const [complaints, setComplaints] = useState<ComplaintData[]>([]);

  useEffect(() => {
    setComplaints(getComplaints());
  }, []);

  const handleStatusChange = (id: string, newStatus: ComplaintStatus) => {
    updateComplaintStatus(id, newStatus);
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
  };

  const getStatusColor = (status: ComplaintStatus) => {
    switch(status) {
      case ComplaintStatus.RESOLVED: return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800';
      case ComplaintStatus.SUBMITTED: return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
      case ComplaintStatus.DOWNLOADED: return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800';
      default: return 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
    }
  };

  if (complaints.length === 0) {
    return (
      <div className="text-center py-24 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 shadow-sm animate-fade-in">
         <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300 dark:text-gray-600">
           <FileText className="w-10 h-10" />
         </div>
         <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{t('dashboard.empty')}</h3>
         <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto leading-relaxed">{t('dashboard.createFirst')}</p>
         <Link to="/create" className="px-8 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-bold shadow-lg shadow-primary-500/25 transition-all hover:-translate-y-1">
           {t('nav.newComplaint')}
         </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white font-sans tracking-tight">{t('dashboard.title')}</h1>
           <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and track all your generated complaints.</p>
        </div>
        <div className="relative">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
           <input 
             type="text" 
             placeholder="Search complaints..." 
             className="pl-9 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none w-full md:w-64"
           />
        </div>
      </div>

      <div className="grid gap-5">
        {complaints.map((c) => (
          <div key={c.id} className="group bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row justify-between lg:items-center gap-6">
            <div className="flex-grow space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider">
                  {c.type}
                </span>
                <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(c.dateCreated).toLocaleDateString()}
                </div>
                {c.locationDetails?.city && (
                  <span className="text-gray-500 dark:text-gray-400 text-xs font-semibold px-2 border-l border-gray-200 dark:border-gray-700">
                    {c.locationDetails.city}
                  </span>
                )}
              </div>
              <h3 className="font-serif text-gray-600 dark:text-gray-300 text-sm line-clamp-2 leading-relaxed group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                {c.generatedLetter.slice(0, 160)}...
              </h3>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 min-w-[200px]">
               {/* Status Dropdown */}
               <div className="relative group/status">
                 <button className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border transition-colors ${getStatusColor(c.status || ComplaintStatus.DRAFT)}`}>
                   {c.status ? t(`status.${c.status.toLowerCase()}`, c.status) : t('status.draft')}
                   <ChevronDown className="w-3 h-3 opacity-60" />
                 </button>
                 <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl shadow-gray-200/50 dark:shadow-black/50 hidden group-hover/status:block z-10 p-1">
                    {Object.values(ComplaintStatus).map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(c.id, status)}
                        className="w-full text-left px-4 py-2.5 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium transition-colors"
                      >
                         {t(`status.${status.toLowerCase()}`, status)}
                      </button>
                    ))}
                 </div>
               </div>

               <div className="flex items-center gap-4">
                {c.image && (
                  <div className="relative group/img">
                    <img src={c.image} alt="Evidence" className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-gray-700 shadow-sm" />
                    <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                       <Search className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(c.generatedLetter);
                    alert("Content copied!");
                  }}
                  className="text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                >
                  {t('btn.copy')}
                </button>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;