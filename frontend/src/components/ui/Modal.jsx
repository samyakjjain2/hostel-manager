import React from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

export const Modal = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-850">{title}</h3>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-450 hover:bg-slate-50 hover:text-slate-800 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="py-4 text-slate-700 max-h-[70vh] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer !== undefined ? (
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            {footer}
          </div>
        ) : (
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={onClose}>Close</Button>
          </div>
        )}
      </div>
    </div>
  );
};
