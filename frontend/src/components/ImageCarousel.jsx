import { useState, useCallback, useEffect } from 'react'

function ImageCarousel({ images, productName, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const goTo = useCallback(
    (index) => {
      setCurrentIndex(((index % images.length) + images.length) % images.length)
    },
    [images.length]
  )

  const goNext = useCallback(
    () => goTo(currentIndex + 1),
    [currentIndex, goTo]
  )
  const goPrev = useCallback(
    () => goTo(currentIndex - 1),
    [currentIndex, goTo]
  )

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose, goPrev, goNext])

  return (
    <div
      className="fixed inset-0 z-50 bg-void/95 backdrop-blur-sm flex items-center justify-center animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Visor de imágenes: ${productName}`}
    >
      <button
        className="absolute top-4 right-4 text-bone-400/60 hover:text-bone-100 text-3xl transition-colors z-10 p-2"
        onClick={onClose}
        aria-label="Cerrar visor"
      >
        &times;
      </button>

      {images.length > 1 && (
        <>
          <button
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 text-bone-300/60 hover:text-goth-300 text-5xl transition-colors p-2"
            onClick={(e) => {
              e.stopPropagation()
              goPrev()
            }}
            aria-label="Imagen anterior"
          >
            &#8249;
          </button>
          <button
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 text-bone-300/60 hover:text-goth-300 text-5xl transition-colors p-2"
            onClick={(e) => {
              e.stopPropagation()
              goNext()
            }}
            aria-label="Imagen siguiente"
          >
            &#8250;
          </button>
        </>
      )}

      <img
        src={images[currentIndex]}
        alt={`${productName} - Imagen ${currentIndex + 1} de ${images.length}`}
        className="max-w-full max-h-[85vh] object-contain p-4 select-none"
        onClick={(e) => e.stopPropagation()}
      />

      {images.length > 1 && (
        <div className="absolute bottom-6 flex gap-2" role="tablist" aria-label="Navegación de imágenes">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation()
                goTo(i)
              }}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                i === currentIndex
                  ? 'bg-goth-400 scale-110'
                  : 'bg-goth-700/60 hover:bg-goth-600'
              }`}
              aria-label={`Ver imagen ${i + 1}`}
              role="tab"
              aria-selected={i === currentIndex}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default ImageCarousel
