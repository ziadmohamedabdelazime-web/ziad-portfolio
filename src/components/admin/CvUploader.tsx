import { useState, type ChangeEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'

type CvUploaderProps = {
  label: string
  value: string
  onChange: (url: string) => void
  folder: string
  helpText?: string
}

const ACCEPTED_TYPES = '.pdf,.doc,.docx'

export default function CvUploader({
  label,
  value,
  onChange,
  folder,
  helpText,
}: CvUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function getStoragePathFromUrl(url: string) {
    const marker = '/storage/v1/object/public/portfolio-assets/'
    const index = url.indexOf(marker)

    if (index === -1) return null

    return decodeURIComponent(url.slice(index + marker.length))
  }

  function getFileNameFromUrl(url: string) {
    const path = getStoragePathFromUrl(url) ?? url
    const rawName = path.split('/').pop() ?? 'CV file'

    // بيشيل الـ timestamp اللي بيتحط قبل اسم الملف وقت الرفع (Date.now()-)
    return rawName.replace(/^\d+-/, '')
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) return

    if (!supabase) {
      setError('Supabase is not configured yet.')
      return
    }

    const allowedExtensions = ['pdf', 'doc', 'docx']
    const extension = file.name.split('.').pop()?.toLowerCase()

    if (!extension || !allowedExtensions.includes(extension)) {
      setError('Only PDF or Word files (.pdf, .doc, .docx) are allowed.')
      return
    }

    setUploading(true)
    setError(null)

    const safeFileName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '-')

    const filePath = `${folder}/${Date.now()}-${safeFileName}`

    const { error: uploadError } = await supabase.storage
      .from('portfolio-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    const oldStoragePath = getStoragePathFromUrl(value)

    const { data } = supabase.storage
      .from('portfolio-assets')
      .getPublicUrl(filePath)

    if (oldStoragePath) {
      await supabase.storage.from('portfolio-assets').remove([oldStoragePath])
    }

    onChange(data.publicUrl)
    setUploading(false)

    // بنفرغ الـ input عشان لو رفعت نفس اسم الملف تاني يشتغل onChange برضه
    event.target.value = ''
  }

  async function deleteCurrentFile() {
    if (!value) return

    setDeleting(true)
    setError(null)

    try {
      if (supabase) {
        const storagePath = getStoragePathFromUrl(value)

        if (storagePath) {
          const { error: deleteError } = await supabase.storage
            .from('portfolio-assets')
            .remove([storagePath])

          if (deleteError) {
            setError(deleteError.message)
            setDeleting(false)
            return
          }
        }
      }

      onChange('')
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : 'Failed to delete file.'
      )
    }

    setDeleting(false)
  }

  return (
    <div>
      <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>
        {label}
      </label>

      <div className="mt-1.5 flex flex-col gap-3">
        <label
          className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed px-4 py-3 text-sm transition-opacity hover:opacity-75"
          style={{ borderColor: 'var(--border)', color: 'var(--accent)' }}
        >
          <input
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />

          {uploading ? 'Uploading...' : value ? 'Replace CV' : 'Upload CV'}
        </label>
      </div>

      {helpText && (
        <p className="mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
          {helpText}
        </p>
      )}

      {error && (
        <p className="mt-2 text-xs" style={{ color: '#DC5B4B' }}>
          {error}
        </p>
      )}

      {value && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Current CV
            </p>

            <button
              type="button"
              onClick={deleteCurrentFile}
              disabled={deleting}
              className="rounded-lg border px-3 py-1.5 text-xs transition-opacity hover:opacity-75 disabled:opacity-50"
              style={{ borderColor: '#DC5B4B', color: '#DC5B4B' }}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>

          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            download
            className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-opacity hover:opacity-80"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-mono text-[10px]"
              style={{ backgroundColor: 'var(--surface-2)', color: 'var(--accent)' }}
            >
              FILE
            </span>

            <span className="min-w-0 flex-1 truncate">{getFileNameFromUrl(value)}</span>

            <span style={{ color: 'var(--accent)' }}>Download →</span>
          </a>
        </div>
      )}
    </div>
  )
}