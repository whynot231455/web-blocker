import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { LogOut } from 'lucide-react';

interface SignOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const SignOutModal: React.FC<SignOutModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [isPending, setIsPending] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsPending(true);
      await onConfirm();
    } catch (error) {
      console.error('Sign out error:', error);
      setIsPending(false);
    }
  };

  const pixelStyle: React.CSSProperties = {
    letterSpacing: '0.02em',
    lineHeight: 1.15,
    WebkitFontSmoothing: 'none',
    textRendering: 'pixelated' as any,
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="SIGN OUT"
      maxWidth="sm"
      contentPaddingClass="px-5 py-5"
    >
      <div className="flex flex-col items-center text-center space-y-4">
        {/* Compact Icon Container */}
        <div className="w-11 h-11 bg-[#FF4141] text-white flex items-center justify-center border-2 border-black shadow-[3px_3px_0px_#000]">
          <LogOut size={20} />
        </div>

        {/* Compact Body Text */}
        <div>
          <h3
            className="text-xs font-black uppercase text-black"
            style={pixelStyle}
          >
            ARE YOU SURE?
          </h3>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 w-full pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="py-2.5 px-3 bg-white text-black font-black uppercase border-2 border-black hover:bg-gray-100 transition-colors shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-50"
            style={{ ...pixelStyle, fontSize: '9px' }}
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className="py-2.5 px-3 bg-[#FF4141] text-white font-black uppercase border-2 border-black hover:bg-[#e03838] transition-colors shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center justify-center gap-1.5 disabled:opacity-50"
            style={{ ...pixelStyle, fontSize: '9px' }}
          >
            {isPending ? (
              <span className="inline-block animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
            ) : (
              <LogOut size={12} />
            )}
            {isPending ? 'SIGNING OUT...' : 'SIGN OUT'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
