import { useRef } from 'react';

interface Props {
  onUpload: (files: File[]) => void;
}

export function ImageUpload({ onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      onUpload(imageFiles);
    }
  };

  return (
    <div className="image-upload">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        style={{ display: 'none' }}
      />
      <button className="upload-btn" onClick={() => inputRef.current?.click()}>
        📁 Upload Images
      </button>
      <div
        className="upload-drop-zone"
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.classList.add('drag-over');
        }}
        onDragLeave={(e) => {
          e.currentTarget.classList.remove('drag-over');
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove('drag-over');
          handleFiles(e.dataTransfer.files);
        }}
      >
        or drop images here
      </div>
    </div>
  );
}
