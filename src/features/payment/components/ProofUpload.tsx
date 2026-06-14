import { useState, useRef } from 'react'

interface ProofUploadProps {
  onUpload: (file: File) => void
  disabled?: boolean
}

export default function ProofUpload({ onUpload, disabled = false }: ProofUploadProps) {
  const [fileName, setFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      onUpload(file)
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
        aria-label="Anexar comprovante"
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-[#FAFAFC] py-5 text-sm font-semibold text-muted transition-colors hover:border-brand hover:text-brand disabled:opacity-50"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 3v10M5 8l5-5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 16h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
        {fileName ?? 'Anexar comprovante (imagem ou PDF)'}
      </button>
      {fileName && (
        <p className="mt-2 text-center text-xs text-positive">✓ {fileName} selecionado</p>
      )}
    </div>
  )
}
