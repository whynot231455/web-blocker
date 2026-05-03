import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { WebsiteAutocomplete } from '../ui/WebsiteAutocomplete';
import { Info, ShieldAlert, Check } from 'lucide-react';
import { isValidDomain, sanitizeUrl } from '@/lib/url';

interface AddUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (url: string) => Promise<unknown>;
}

export const AddUrlModal: React.FC<AddUrlModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [url, setUrl] = React.useState('');
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = sanitizeUrl(url);

    if (!cleaned) {
      setError('Website URL is required');
      return;
    }
    if (!isValidDomain(cleaned)) {
      setError('Invalid domain format');
      return;
    }

    try {
      const result = await onAdd(cleaned);
      if (result) {
        setUrl('');
        setError('');
        onClose();
      } else {
        setError('Failed to add site. It may already be in your list.');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const handleClose = () => {
    setUrl('');
    setError('');
    onClose();
  };

  const handleSelect = (domain: string) => {
    setUrl(domain);
    setError('');
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Block New Website">
      <div className="mb-8 p-4 bg-gray-50 border-2 border-black border-dashed flex gap-4">
        <div className="w-10 h-10 flex-shrink-0 bg-black text-white flex items-center justify-center border-2 border-black shadow-[4px_4px_0px_#000]">
          <ShieldAlert size={20} />
        </div>
        <div>
          <h4 className="text-[10px] font-black uppercase mb-1">Stay Focused</h4>
          <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed">
            Enter the URL of the site you want to block. We&apos;ll automatically sync it to your extension.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <WebsiteAutocomplete
          value={url}
          onChange={(val) => { setUrl(val); setError(''); }}
          onSelect={handleSelect}
          error={error}
        />

        <div className="flex items-start gap-3 p-3 bg-blue-50 border-2 border-blue-200">
          <Info size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-[8px] font-bold text-blue-800 uppercase tracking-widest leading-loose">
            Tip: You can just type the name of common sites like <span className="bg-blue-200 px-1 italic">youtube</span> and select from the list.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 pt-4">
          <Button
            variant="secondary"
            onClick={handleClose}
            type="button"
            className="w-full"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            className="w-full flex items-center justify-center gap-2"
          >
            <Check size={16} />
            Add to List
          </Button>
        </div>
      </form>
    </Modal>
  );
};
