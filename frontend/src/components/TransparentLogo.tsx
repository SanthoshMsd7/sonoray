'use client';

import { useEffect, useRef, useState } from 'react';

interface TransparentLogoProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function TransparentLogo({ src, alt, className, style }: TransparentLogoProps) {
  const [transparentSrc, setTransparentSrc] = useState<string | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Threshold below which pixels are considered black
      const threshold = 35;
      const transitionRange = 60; // range over which alpha transitions to 255

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Find the maximum color channel value
        const maxVal = Math.max(r, g, b);

        if (maxVal <= threshold) {
          data[i + 3] = 0; // Fully transparent
        } else if (maxVal < threshold + transitionRange) {
          // Smooth transition for anti-aliasing edges
          const ratio = (maxVal - threshold) / transitionRange;
          data[i + 3] = Math.round(ratio * 255);
        }
      }

      ctx.putImageData(imgData, 0, 0);
      setTransparentSrc(canvas.toDataURL('image/png'));
    };
  }, [src]);

  if (!transparentSrc) {
    // Return placeholder with low opacity during initial canvas processing
    return <img src={src} alt={alt} className={className} style={{ ...style, opacity: 0 }} />;
  }

  return <img src={transparentSrc} alt={alt} className={className} style={style} />;
}
