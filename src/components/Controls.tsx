import { useRef } from 'react';

interface Props {
  onExport: () => void;
  onImport: (json: string) => void;
  onRestart: () => void;
  onReset: () => void;
}

export function Controls({ onExport, onImport, onRestart, onReset }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onImport(reader.result);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset everything? This cannot be undone.')) {
      onReset();
    }
  };

  return (
    <div className="controls">
      <button className="ctrl-btn export-btn" onClick={onExport}>
        💾 Export
      </button>
      <button className="ctrl-btn import-btn" onClick={() => fileRef.current?.click()}>
        📂 Import
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        style={{ display: 'none' }}
      />
      <button className="ctrl-btn restart-btn" onClick={onRestart}>
        🔄 Restart
      </button>
      <button className="ctrl-btn reset-btn" onClick={handleReset}>
        🗑️ Reset All
      </button>
    </div>
  );
}
