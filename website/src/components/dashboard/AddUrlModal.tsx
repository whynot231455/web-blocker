import React from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface AddUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (url: string) => void;
}

/** Strip protocol, paths and whitespace — return just the hostname */
function sanitizeInput(raw: string): string {
  return raw.trim().toLowerCase().replace(/^https?:\/\//i, '').split('/')[0];
}

/** Validate a clean hostname */
function isValidDomain(domain: string): boolean {
  return /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(domain);
}

export const AddUrlModal: React.FC<AddUrlModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [url, setUrl] = React.useState('');
  const [error, setError] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = sanitizeInput(url);

    if (!cleaned) {
      setError('Please enter a website URL');
      return;
    }
    if (!isValidDomain(cleaned)) {
      setError('Please enter a valid domain (e.g., youtube.com)');
      return;
    }

    onAdd(cleaned);
    setUrl('');
    setError('');
    onClose();
  };

  const handleClose = () => {
    setUrl('');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Website to Block">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Website URL"
          placeholder="e.g. facebook.com or youtube.com"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError(''); }}
          error={error}
          autoFocus
        />
        <p className="text-xs text-gray-400">
          You can paste a full URL — we&apos;ll extract the domain automatically.
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={handleClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Add to Block List
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddUrlModal;
