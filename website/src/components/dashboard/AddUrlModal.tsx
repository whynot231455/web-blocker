import React from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface AddUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (url: string) => void;
}

export const AddUrlModal: React.FC<AddUrlModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [url, setUrl] = React.useState('');
  const [error, setError] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      setError('URL is required');
      return;
    }
    // Simple URL validation (hostname)
    const hostnameRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    if (!hostnameRegex.test(url) && !url.includes('.')) {
      setError('Please enter a valid domain (e.g., example.com)');
      return;
    }
    
    onAdd(url);
    setUrl('');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Website to Block">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Website URL"
          placeholder="e.g. facebook.com, youtube.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          error={error}
          autoFocus
        />
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={onClose} type="button">
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
