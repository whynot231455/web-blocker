import React, { useState } from 'react';
import { Repeat } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { GitHubIcon, GoogleIcon } from './ProviderIcons';

export type OAuthProviderId = 'google' | 'github';

interface SwitchAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Kick off the OAuth flow for the chosen provider. Should resolve with an
   * error message when the redirect could not be started; on success the page
   * navigates away, so the modal simply stays in its pending state.
   */
  onSelectProvider: (provider: OAuthProviderId) => Promise<{ error: string | null }>;
}

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
  const [pending, setPending] = useState<OAuthProviderId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (provider: OAuthProviderId) => {
    setPending(provider);
    setError(null);
    const { error: selectError } = await onSelectProvider(provider);
    if (selectError) {
      setError(selectError);
      setPending(null);
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
          CHOOSE A DIFFERENT GOOGLE OR GITHUB ACCOUNT. YOUR CURRENT SESSION IS REPLACED
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
            onClick={() => handleSelect('google')}
            disabled={pending !== null}
            className="w-full py-2.5 px-3 bg-white text-black font-black uppercase border-2 border-black hover:bg-gray-100 transition-colors shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center justify-center gap-1.5 disabled:opacity-50"
            style={{ ...pixelStyle, fontSize: '9px' }}
          >
            <GoogleIcon size={12} />
            {pending === 'google' ? 'REDIRECTING...' : 'CONTINUE WITH GOOGLE'}
          </button>
          <button
            type="button"
            onClick={() => handleSelect('github')}
            disabled={pending !== null}
            className="w-full py-2.5 px-3 bg-white text-black font-black uppercase border-2 border-black hover:bg-gray-100 transition-colors shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center justify-center gap-1.5 disabled:opacity-50"
            style={{ ...pixelStyle, fontSize: '9px' }}
          >
            <GitHubIcon size={12} />
            {pending === 'github' ? 'REDIRECTING...' : 'CONTINUE WITH GITHUB'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={pending !== null}
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
