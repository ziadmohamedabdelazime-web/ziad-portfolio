import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent,
  type TouchEvent,
} from 'react'
import { supabase } from '../../lib/supabaseClient'

type AssetUploaderProps = {
  label: string
  value: string
  onChange: (url: string) => void
  onMultipleChange?: (urls: string[]) => void
  folder: string
  accept?: string
  helpText?: string
  previewImage?: boolean
  cropShape?: 'circle' | 'square'
  multiple?: boolean
}

type Position = {
  x: number
  y: number
}

export default function AssetUploader({
  label,
  value,
  onChange,
  onMultipleChange,
  folder,
  accept = 'image/*',
  helpText,
  previewImage = true,
  cropShape = 'square',
  multiple = false,
}: AssetUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [cropping, setCropping] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState<Position>({
    x: 0,
    y: 0,
  })

  const [imageSize, setImageSize] = useState({
    width: 0,
    height: 0,
  })

  const [stageSize] = useState(520)

  const [dragging, setDragging] = useState(false)

  const dragStart = useRef({
    x: 0,
    y: 0,
  })

  const startPosition = useRef<Position>({
    x: 0,
    y: 0,
  })

  const cropStageRef = useRef<HTMLDivElement | null>(null)

  const cropIsCircle = cropShape === 'circle'

  useEffect(() => {
    if (!value) {
      setCropping(false)
      setZoom(1)
      setPosition({ x: 0, y: 0 })
      setImageSize({ width: 0, height: 0 })
    }
  }, [value])

  function openEditor() {
    setError(null)
    setZoom(1)
    setPosition({ x: 0, y: 0 })
    setImageSize({
      width: 0,
      height: 0,
    })
    setCropping(true)
  }

  function closeEditor() {
    setCropping(false)
    setDragging(false)
  }

  function resetCrop() {
    setZoom(1)
    setPosition({ x: 0, y: 0 })
  }

  function handleImageLoad(
    event: React.SyntheticEvent<HTMLImageElement>,
  ) {
    const image = event.currentTarget

    setImageSize({
      width: image.naturalWidth,
      height: image.naturalHeight,
    })
  }

  function getContainedImageSize() {
    if (!imageSize.width || !imageSize.height) {
      return {
        width: stageSize,
        height: stageSize,
      }
    }

    const scale = Math.min(
      stageSize / imageSize.width,
      stageSize / imageSize.height,
    )

    return {
      width: imageSize.width * scale,
      height: imageSize.height * scale,
    }
  }

  function getImageStyle() {
    const contained = getContainedImageSize()

    return {
      width: `${contained.width}px`,
      height: `${contained.height}px`,
      transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${zoom})`,
    }
  }

  function startDrag(clientX: number, clientY: number) {
    setDragging(true)

    dragStart.current = {
      x: clientX,
      y: clientY,
    }

    startPosition.current = {
      x: position.x,
      y: position.y,
    }
  }

  function moveDrag(clientX: number, clientY: number) {
    if (!dragging) return

    const deltaX = clientX - dragStart.current.x
    const deltaY = clientY - dragStart.current.y

    setPosition({
      x: startPosition.current.x + deltaX,
      y: startPosition.current.y + deltaY,
    })
  }

  function stopDrag() {
    setDragging(false)
  }

  function handleMouseDown(event: MouseEvent<HTMLDivElement>) {
    event.preventDefault()

    startDrag(
      event.clientX,
      event.clientY,
    )
  }

  function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
    moveDrag(
      event.clientX,
      event.clientY,
    )
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0]

    if (!touch) return

    startDrag(
      touch.clientX,
      touch.clientY,
    )
  }

  function handleTouchMove(event: TouchEvent<HTMLDivElement>) {
    event.preventDefault()

    const touch = event.touches[0]

    if (!touch) return

    moveDrag(
      touch.clientX,
      touch.clientY,
    )
  }

  function getStoragePathFromUrl(url: string) {
    const marker =
      '/storage/v1/object/public/portfolio-assets/'

    const index = url.indexOf(marker)

    if (index === -1) return null

    return decodeURIComponent(
      url.slice(index + marker.length),
    )
  }

  async function deleteCurrentImage() {
    if (!value) return

    setDeleting(true)
    setError(null)

    try {
      if (supabase) {
        const storagePath = getStoragePathFromUrl(value)

        if (storagePath) {
          const { error: deleteError } =
            await supabase.storage
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

      setZoom(1)
      setPosition({
        x: 0,
        y: 0,
      })

      setImageSize({
        width: 0,
        height: 0,
      })
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Failed to delete image.',
      )
    }

    setDeleting(false)
  }

  async function handleUpload(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const files = event.target.files

    if (!files || files.length === 0) return

    if (!supabase) {
      setError('Supabase is not configured yet.')
      return
    }

    setUploading(true)
    setError(null)

    const uploadedUrls: string[] = []

    try {
      for (const file of Array.from(files)) {
        const safeFileName = file.name
          .toLowerCase()
          .replace(/[^a-z0-9.-]/g, '-')

        const filePath = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${safeFileName}`

        const { error: uploadError } = await supabase.storage
          .from('portfolio-assets')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) {
          throw uploadError
        }

        const { data } = supabase.storage
          .from('portfolio-assets')
          .getPublicUrl(filePath)

        if (data?.publicUrl) {
          uploadedUrls.push(data.publicUrl)
        }
      }

      if (onMultipleChange && uploadedUrls.length > 0) {
        onMultipleChange(uploadedUrls)
      } else if (uploadedUrls[0]) {
        onChange(uploadedUrls[0])

        setZoom(1)
        setPosition({ x: 0, y: 0 })
        setImageSize({ width: 0, height: 0 })
        if (files.length === 1 && !multiple) {
          setCropping(true)
        }
      }
    } catch (uploadErr) {
      setError(
        uploadErr instanceof Error
          ? uploadErr.message
          : 'Failed to upload image(s).',
      )
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  async function applyCrop() {
    if (!value || !imageSize.width || !imageSize.height) {
      return
    }

    setUploading(true)
    setError(null)

    try {
      const image = new Image()

      image.crossOrigin = 'anonymous'

      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve()

        image.onerror = () =>
          reject(
            new Error(
              'Could not load the image for cropping.',
            ),
          )

        image.src = value
      })

      const canvas = document.createElement('canvas')

      const outputSize = 1000

      canvas.width = outputSize
      canvas.height = outputSize

      const context = canvas.getContext('2d')

      if (!context) {
        throw new Error(
          'Could not create image editor.',
        )
      }

      context.clearRect(
        0,
        0,
        outputSize,
        outputSize,
      )

      if (cropIsCircle) {
        context.beginPath()

        context.arc(
          outputSize / 2,
          outputSize / 2,
          outputSize / 2,
          0,
          Math.PI * 2,
        )

        context.closePath()
        context.clip()
      }

      const contained =
        getContainedImageSize()

      const baseScale =
        contained.width / image.naturalWidth

      const finalScale =
        baseScale * zoom

      const displayedWidth =
        image.naturalWidth * finalScale

      const displayedHeight =
        image.naturalHeight * finalScale

      const imageLeft =
        stageSize / 2 -
        displayedWidth / 2 +
        position.x

      const imageTop =
        stageSize / 2 -
        displayedHeight / 2 +
        position.y

      const cropScale =
        outputSize / stageSize

      context.drawImage(
        image,
        imageLeft * cropScale,
        imageTop * cropScale,
        displayedWidth * cropScale,
        displayedHeight * cropScale,
      )

      const blob =
        await new Promise<Blob | null>(
          (resolve) =>
            canvas.toBlob(
              resolve,
              'image/png',
              0.95,
            ),
        )

      if (!blob) {
        throw new Error(
          'Could not create cropped image.',
        )
      }

      if (!supabase) {
        throw new Error(
          'Supabase is not configured yet.',
        )
      }

      const croppedFileName =
        `cropped-${Date.now()}.png`

      const croppedPath =
        `${folder}/${croppedFileName}`

      const {
        error: croppedUploadError,
      } = await supabase.storage
        .from('portfolio-assets')
        .upload(
          croppedPath,
          blob,
          {
            contentType: 'image/png',
            cacheControl: '3600',
            upsert: false,
          },
        )

      if (croppedUploadError) {
        throw croppedUploadError
      }

      const { data } =
        supabase.storage
          .from('portfolio-assets')
          .getPublicUrl(
            croppedPath,
          )

      const oldStoragePath =
        getStoragePathFromUrl(value)

      if (oldStoragePath) {
        await supabase.storage
          .from('portfolio-assets')
          .remove([oldStoragePath])
      }

      onChange(data.publicUrl)

      setCropping(false)

      setZoom(1)

      setPosition({
        x: 0,
        y: 0,
      })
    } catch (cropError) {
      setError(
        cropError instanceof Error
          ? cropError.message
          : 'Failed to crop image.',
      )
    }

    setUploading(false)
  }

  return (
    <>
      <div>
        <label
          className="text-sm font-medium"
          style={{
            color: 'var(--text)',
          }}
        >
          {label}
        </label>

        <div className="mt-1.5 flex flex-col gap-3">
          <label
            className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed px-4 py-3 text-sm transition-opacity hover:opacity-75"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--accent)',
            }}
          >
            <input
              type="file"
              accept={accept}
              multiple={multiple}
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />

            {uploading
              ? 'Uploading...'
              : value
                ? 'Replace image'
                : 'Upload image(s)'}
          </label>
        </div>

        {helpText && (
          <p
            className="mt-1.5 text-xs"
            style={{
              color: 'var(--text-muted)',
            }}
          >
            {helpText}
          </p>
        )}

        {error && (
          <p
            className="mt-2 text-xs"
            style={{
              color: '#DC5B4B',
            }}
          >
            {error}
          </p>
        )}

        {value && previewImage && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p
                className="text-xs font-medium"
                style={{
                  color: 'var(--text-muted)',
                }}
              >
                Current image
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={openEditor}
                  className="rounded-lg border px-3 py-1.5 text-xs transition-opacity hover:opacity-75"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--accent)',
                  }}
                >
                  Edit image
                </button>

                <button
                  type="button"
                  onClick={deleteCurrentImage}
                  disabled={deleting}
                  className="rounded-lg border px-3 py-1.5 text-xs transition-opacity hover:opacity-75 disabled:opacity-50"
                  style={{
                    borderColor: '#DC5B4B',
                    color: '#DC5B4B',
                  }}
                >
                  {deleting
                    ? 'Deleting...'
                    : 'Delete'}
                </button>
              </div>
            </div>

            <div
              className={
                cropIsCircle
                  ? 'flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border'
                  : 'flex h-36 w-full items-center justify-center overflow-hidden rounded-xl border'
              }
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--bg)',
              }}
            >
              <img
                src={value}
                alt="Uploaded preview"
                className={
                  cropIsCircle
                    ? 'h-full w-full object-contain'
                    : 'h-full w-full object-contain'
                }
              />
            </div>
          </div>
        )}
      </div>

      {cropping && value && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4 sm:p-6"
        >
          <div
            className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border"
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--surface)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between border-b px-5 py-4"
              style={{
                borderColor: 'var(--border)',
              }}
            >
              <div>
                <h3
                  className="font-display text-lg font-semibold"
                  style={{
                    color: 'var(--text)',
                  }}
                >
                  Adjust image
                </h3>

                <p
                  className="mt-1 text-xs"
                  style={{
                    color: 'var(--text-muted)',
                  }}
                >
                  Move the full image and choose exactly
                  what appears inside the {cropIsCircle ? 'circle' : 'frame'}.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditor}
                className="flex h-9 w-9 items-center justify-center rounded-full border text-lg"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--text-muted)',
                }}
              >
                ×
              </button>
            </div>

            {/* Editor */}
            <div
              className="flex min-h-0 flex-1 items-center justify-center overflow-hidden p-5 sm:p-8"
              style={{
                backgroundColor: '#111',
              }}
            >
              <div
                ref={cropStageRef}
                className="relative aspect-square w-[min(78vw,520px)] overflow-hidden"
                style={{
                  backgroundColor: '#1c1c1c',
                  cursor: dragging ? 'grabbing' : 'grab',
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={stopDrag}
                onMouseLeave={stopDrag}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={stopDrag}
              >
                {/* Full image */}
                <img
                  src={value}
                  alt="Image editor"
                  onLoad={handleImageLoad}
                  draggable={false}
                  className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
                  style={{
                    ...getImageStyle(),
                    transformOrigin: 'center center',
                  }}
                />

                {/* Circle */}
                {cropIsCircle && (
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      borderRadius: '50%',
                      border: '2px solid white',
                      boxShadow:
                        '0 0 0 9999px rgba(0,0,0,0.58)',
                    }}
                  >
                    <div
                      className="absolute left-1/3 top-0 h-full w-px"
                      style={{
                        backgroundColor:
                          'rgba(255,255,255,0.25)',
                      }}
                    />

                    <div
                      className="absolute left-2/3 top-0 h-full w-px"
                      style={{
                        backgroundColor:
                          'rgba(255,255,255,0.25)',
                      }}
                    />

                    <div
                      className="absolute left-0 top-1/3 h-px w-full"
                      style={{
                        backgroundColor:
                          'rgba(255,255,255,0.25)',
                      }}
                    />

                    <div
                      className="absolute left-0 top-2/3 h-px w-full"
                      style={{
                        backgroundColor:
                          'rgba(255,255,255,0.25)',
                      }}
                    />
                  </div>
                )}

                {!cropIsCircle && (
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      border: '2px solid white',
                    }}
                  />
                )}

                <div
                  className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border px-4 py-2 text-xs"
                  style={{
                    borderColor:
                      'rgba(255,255,255,0.25)',
                    backgroundColor:
                      'rgba(0,0,0,0.65)',
                    color: 'white',
                  }}
                >
                  Drag image to reposition
                </div>
              </div>
            </div>

            {/* Controls */}
            <div
              className="border-t px-5 py-4"
              style={{
                borderColor: 'var(--border)',
              }}
            >
              <div className="mx-auto max-w-3xl">
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-medium"
                    style={{
                      color: 'var(--text)',
                    }}
                  >
                    Zoom
                  </span>

                  <span
                    className="font-mono text-xs"
                    style={{
                      color: 'var(--text-muted)',
                    }}
                  >
                    {Math.round(zoom * 100)}%
                  </span>
                </div>

                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.01"
                  value={zoom}
                  onChange={(event) =>
                    setZoom(
                      Number(event.target.value),
                    )
                  }
                  className="mt-2 w-full cursor-pointer"
                />

                <div className="mt-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={resetCrop}
                    className="rounded-xl border px-4 py-2.5 text-sm"
                    style={{
                      borderColor: 'var(--border)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    Reset
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={closeEditor}
                      className="rounded-xl border px-4 py-2.5 text-sm"
                      style={{
                        borderColor: 'var(--border)',
                        color: 'var(--text)',
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={applyCrop}
                      disabled={uploading}
                      className="primary-button px-5 py-2.5 text-sm disabled:opacity-50"
                    >
                      {uploading
                        ? 'Saving crop...'
                        : 'Apply crop'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}