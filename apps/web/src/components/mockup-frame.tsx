type MockupFrameProps = {
  imageUrl?: string;
  alt?: string;
  width?: string | number;
  height?: string | number;
  className?: string;
};

export default function MockupFrame({
  imageUrl,
  alt = 'Mockup image',
  width = '100%',
  height = 420,
  className = '',
}: MockupFrameProps) {
  const heightValue = typeof height === 'number' ? `${height}px` : height;

  return (
    <div className={`mockup-root ${className}`} style={{ width }}>
      <div className="mockup-shell" role="figure" aria-label={alt}>
        <div className="mockup-notch" />
        <div className="mockup-screen">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={alt}
              className="mockup-img"
              style={{ width: '100%', height: heightValue, objectFit: 'cover' }}
            />
          ) : (
            <div className="mockup-placeholder" style={{ height: heightValue }}>
              Add image URL to preview mockup
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .mockup-root {
          display: inline-block;
          vertical-align: top;
        }
        .mockup-shell {
          border-radius: 28px;
          padding: 14px;
          background: linear-gradient(180deg, #f7f8fb 0%, #eef1f6 100%);
          box-shadow: 0 18px 36px rgba(15, 23, 42, 0.12);
          transform: translateZ(0);
          -webkit-backface-visibility: hidden;
        }
        .mockup-notch {
          width: 64px;
          height: 6px;
          background: rgba(0, 0, 0, 0.06);
          border-radius: 6px;
          margin: 6px auto 10px;
          box-shadow: inset 0 -2px 4px rgba(255, 255, 255, 0.6);
        }
        .mockup-screen {
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 200px;
        }
        .mockup-img {
          display: block;
        }
        .mockup-placeholder {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9aa4b2;
          font-size: 14px;
          background: repeating-linear-gradient(
            45deg,
            #ffffff,
            #ffffff 10px,
            #f7f8fb 10px,
            #f7f8fb 20px
          );
        }
      `}</style>
    </div>
  );
}