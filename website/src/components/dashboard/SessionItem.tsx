import { FocusSession } from '@/hooks/useFocusSessions';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface SessionItemProps {
  session: FocusSession;
}

export function SessionItem({ session }: SessionItemProps) {
  const startDate = new Date(session.start_time);
  const dateStr = startDate.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const getStatusIcon = () => {
    switch (session.status) {
      case 'completed': return <CheckCircle size={16} className="text-green-500" />;
      case 'cancelled': return <XCircle size={16} className="text-red-500" />;
      default: return <Clock size={16} className="text-blue-500" />;
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-gray-100 rounded-lg">
          {getStatusIcon()}
        </div>
        <div>
          <h4 className="text-sm font-bold text-gray-900 font-mono uppercase tracking-tight">
            {session.url}
          </h4>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            {dateStr}
          </p>
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-black text-black">
          {session.target_duration}m
        </div>
        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">
          {session.status}
        </p>
      </div>
    </div>
  );
}
