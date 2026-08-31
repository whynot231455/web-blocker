import React, { useState } from 'react';
import { Repeat } from 'lucide-react';
import { Modal } from '../ui/Modal';

interface SwitchAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Kick off the Google OAuth flow. Should resolve with an error message when
   * the redirect could not be started; on success the page navigates away, so
   * the modal simply stays in its pending state. (GitHub sign-in isn't
   * implemented yet, so Google is the only provider offered.)
   */
  onSelectProvider: () => Promise<{ error: string | null }>;
}

/** Google "G" mark — lucide-react ships no brand icons, so inline it. */
const GoogleIcon: React.FC<{ size?: number }> = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

const pixelStyle: React.CSSProperties = {
  letterSpacing: '0.02em',
  lineHeight: 1.15,
  WebkitFontSmoothing: 'none',
  textRendering: 'pixelated' as unknown as React.CSSProperties['textRendering'],
};

export const SwitchAccountModal: React.FC<SwitchAccountModalProps> = ({
  isOpen,
  onClose,
  onSelectProvider,
}) => {
  // The parent mounts this component only while the modal is open, so this
  // state starts fresh on every open — no reset effect needed.
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async () => {
    setPending(true);
    setError(null);
    const { error: selectError } = await onSelectProvider();
    if (selectError) {
      setError(selectError);
      setPending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="SWITCH ACCOUNT"
      maxWidth="sm"
      contentPaddingClass="px-5 py-5"
    >
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-11 h-11 bg-black text-white flex items-center justify-center border-2 border-black shadow-[3px_3px_0px_#000]">
          <Repeat size={20} />
        </div>

        <p className="text-[10px] text-gray-600 leading-relaxed" style={pixelStyle}>
          CHOOSE A DIFFERENT GOOGLE ACCOUNT. YOUR CURRENT SESSION IS REPLACED
          ONCE YOU FINISH SIGNING IN.
        </p>

        {error && (
          <div
            className="w-full p-3 bg-red-50 border-2 border-red-400 text-red-700"
            style={{ ...pixelStyle, fontSize: '9px' }}
          >
            {error}
          </div>
        )}

        <div className="w-full space-y-3 pt-1">
          <button
            type="button"
            onClick={handleSelect}
            disabled={pending}
            className="w-full py-2.5 px-3 bg-white text-black font-black uppercase border-2 border-black hover:bg-gray-100 transition-colors shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center justify-center gap-1.5 disabled:opacity-50"
            style={{ ...pixelStyle, fontSize: '9px' }}
          >
            <GoogleIcon size={12} />
            {pending ? 'REDIRECTING...' : 'CONTINUE WITH GOOGLE'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="w-full py-2.5 px-3 bg-white text-black font-black uppercase border-2 border-black hover:bg-gray-100 transition-colors shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-50"
            style={{ ...pixelStyle, fontSize: '9px' }}
          >
            CANCEL
          </button>
        </div>
      </div>
    </Modal>
  );
};
