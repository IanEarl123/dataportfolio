/**
 * The one image frame used by Certifications, Projects, Blog and Shop cards, so
 * every cover has the same shape and padding.
 *   fit="contain" (default): the whole image shows, for logos with transparent backgrounds.
 *   fit="cover": the image fills the frame, for screenshots and photos.
 */
export default function MediaFrame({ src, alt = '', icon = 'fa-solid fa-image', fit = 'contain', className = '', children }) {
  const cover = fit === 'cover'
  return (
    <div className={`relative w-full p-2.5 ${className}`}>
      <div className="media-panel relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-xl">
        {src ? (
          <img
            src={src}
            alt={alt}
            loading="lazy"
            className={`h-full w-full transition-transform duration-500 group-hover:scale-105 ${cover ? 'object-cover' : 'media-img object-contain p-2'}`}
          />
        ) : (
          <i className={`${icon} text-3xl text-accent-ink/60 transition-transform duration-500 group-hover:scale-110`} />
        )}
      </div>
      {children}
    </div>
  )
}
