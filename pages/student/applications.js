import { useEffect, useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { StatusBadge, Spinner, EmptyState, PageHeader } from '../../components/ui/index';
import { FileText } from 'lucide-react';

export default function StudentApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/api/applications').then(r=>r.json()).then(d=>{setApps(d.applications||[]); setLoading(false);});
  }, []);
  return (
    <AdminLayout title="My Applications">
      <PageHeader title="My Applications" subtitle={`${apps.length} applications`} />
      {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        : apps.length === 0 ? <EmptyState icon={FileText} title="No applications yet" description="Your agent will submit applications on your behalf." />
        : <div className="space-y-3">
            {apps.map(app=>(
              <div key={app.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-bold text-slate-800">{app.university_name}</div>
                    <div className="text-sm text-slate-500 mt-0.5">{app.program_name||'—'}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      Intake: {app.intake||'—'} · Applied: {app.applied_date ? new Date(app.applied_date).toLocaleDateString('en-US',{day:'numeric',month:'short',year:'numeric'}) : '—'}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={app.status} />
                    <div className="text-xs font-mono text-slate-400">{app.app_code}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
      }
    </AdminLayout>
  );
}
