import AdminLayout from '../../components/layout/AdminLayout';
import { BarChart2, PieChart, Download, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ReportsPage() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    fetch('/api/dashboard/stats').then(r=>r.json()).then(setStats);
  }, []);
  const ap = stats?.applications || {};
  const metrics = [
    { label: 'Applications',  value: ap.total||0,    change: '+18%', color:'text-brand-600' },
    { label: 'Acceptance Rate', value: ap.total ? Math.round(((ap.accepted||0)/ap.total)*100)+'%' : '0%', change:'+5%', color:'text-emerald-600' },
    { label: 'Active Students', value: stats?.students?.active||0, change:'+12%', color:'text-amber-600' },
    { label: 'Active Agents', value: stats?.agents?.active||0, change:'+8%', color:'text-purple-600' },
  ];
  return (
    <AdminLayout title="Reports">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800" style={{fontFamily:'Georgia,serif'}}>Reports & Analytics</h2>
          <p className="text-sm text-slate-500">Live data from your portal</p>
        </div>
        <button className="flex items-center gap-2 border border-slate-200 text-slate-600 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-slate-50">
          <Download className="w-4 h-4" /> Export
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map(m=>(
          <div key={m.label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className={`text-2xl font-bold mb-1 ${m.color}`} style={{fontFamily:'Georgia,serif'}}>{m.value}</div>
            <div className="text-sm text-slate-500">{m.label}</div>
            <div className="text-xs font-semibold text-emerald-600 mt-1">{m.change} vs last month</div>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        {[['Applications by Status',PieChart],['Monthly Trend',BarChart2]].map(([title,Icon])=>(
          <div key={title} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">{title}</h3>
              <Icon className="w-4 h-4 text-slate-400" />
            </div>
            <div className="h-48 flex items-center justify-center bg-slate-50 rounded-xl">
              <div className="text-center text-slate-400">
                <Icon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">Connect recharts or chart.js</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
