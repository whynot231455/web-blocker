import React, { useEffect } from 'react';


interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  contentPaddingClass?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'lg',
  contentPaddingClass = 'px-6 py-8',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className={`bg-white border-4 border-black shadow-[12px_12px_0px_#000] w-full ${maxWidthClasses[maxWidth]} transition-all relative`}>
        <div className="px-6 py-3 border-b-4 border-black flex justify-between items-center bg-[#FF4141]">
          <h3
            className="text-xs font-black uppercase text-white"
            style={{
              letterSpacing: '0.02em',
              lineHeight: '1.15',
              WebkitFontSmoothing: 'none',
              textRendering: 'pixelated' as unknown as React.CSSProperties['textRendering'],
            }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 border-2 border-black bg-white hover:bg-black hover:text-white shadow-[2px_2px_0px_#000] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] transition-all"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className={`${contentPaddingClass} max-h-[80vh] overflow-y-auto custom-scrollbar`}>{children}</div>
      </div>
    </div>
  );
};


