'use client';

import { useEffect, useRef, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fadeOut, setFadeOut] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Set slow motion playback speed (0.4 = 40% speed)
    video.playbackRate = 0.4;
    video.play().catch(() => {
      // Autoplay blocked — skip splash after 3s
      setTimeout(() => triggerFadeOut(), 3000);
    });

    const handleEnded = () => triggerFadeOut();
    video.addEventListener('ended', handleEnded);
    return () => video.removeEventListener('ended', handleEnded);
  }, []);

  const triggerFadeOut = () => {
    setFadeOut(true);
    setTimeout(() => {
      setVisible(false);
      onFinish();
    }, 800); // fade duration
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'opacity 0.8s ease',
        opacity: fadeOut ? 0 : 1,
      }}
    >
      {/* Background Video */}
      <video
        ref={videoRef}
        src="/intro.mp4"
        muted
        playsInline
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 0.6,
        }}
      />

      {/* Overlay gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)',
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          padding: '2rem',
          animation: 'splashFadeIn 1.2s ease forwards',
        }}
      >
        {/* Logo / App Name */}
        <div
          style={{
            fontSize: 'clamp(2.5rem, 8vw, 5rem)',
            fontWeight: 900,
            letterSpacing: '0.08em',
            background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
            lineHeight: 1.1,
          }}
        >
          Sonoray ERP
        </div>

        {/* Tagline */}
        <p
          style={{
            color: 'rgba(255,255,255,0.75)',
            fontSize: 'clamp(0.85rem, 2.5vw, 1.1rem)',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            marginBottom: '3rem',
          }}
        >
          Field Service Management System
        </p>

        {/* Loading bar */}
        <div
          style={{
            width: '200px',
            height: '2px',
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '999px',
            margin: '0 auto 2.5rem',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #60a5fa, #a78bfa)',
              borderRadius: '999px',
              animation: 'loadBar 3s ease forwards',
            }}
          />
        </div>

        {/* Developer credit */}
        <p
          style={{
            color: 'rgba(255,255,255,0.45)',
            fontSize: 'clamp(0.7rem, 2vw, 0.85rem)',
            letterSpacing: '0.1em',
          }}
        >
          Developed by{' '}
          <span
            style={{
              color: '#a78bfa',
              fontWeight: 600,
            }}
          >
            Yugesh Elumalai
          </span>
        </p>
      </div>

      <style>{`
        @keyframes splashFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes loadBar {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );
}
