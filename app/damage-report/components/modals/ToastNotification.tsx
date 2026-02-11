import React from 'react';
import { ICONS } from '../../utils/constants';

interface ToastNotificationProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({
  message,
  type,
  onClose,
}) => {
  const bgColor = type === 'success' ? 'bg-green-600' :
                  type === 'error' ? 'bg-red-600' :
                  'bg-blue-600';

  const Icon = type === 'success' ? ICONS.CheckCircle2 :
               type === 'error' ? ICONS.AlertCircle :
               ICONS.Info;

  return (
    <div className={`fixed bottom-4 right-4 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 text-white z-50 animate-slide-in ${bgColor}`}>
      <Icon className="w-5 h-5" />
      <span className="font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 p-1 hover:bg-white/20 rounded"
      >
        <ICONS.X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ToastNotification;