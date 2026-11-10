import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const alt = 'Welkom bij TipIn — Heren van Flatsoen'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  const logoBuffer = await readFile(join(process.cwd(), 'public', 'HvF-Logo.jpg'))
  const logoSrc = `data:image/jpeg;base64,${logoBuffer.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #070b14 0%, #0f172a 50%, #1e3a8a 100%)',
          padding: '64px 80px',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative background glow circles */}
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            right: '-80px',
            width: '500px',
            height: '500px',
            borderRadius: '9999px',
            background: 'radial-gradient(circle, rgba(59,130,246,0.32) 0%, rgba(59,130,246,0) 70%)',
            display: 'flex',
          }}
        />

        {/* Left Column */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            maxWidth: '640px',
            zIndex: 10,
          }}
        >
          {/* Top Pill Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              alignSelf: 'flex-start',
              gap: '10px',
              background: 'rgba(37, 99, 235, 0.25)',
              border: '1px solid rgba(96, 165, 250, 0.45)',
              borderRadius: '9999px',
              padding: '8px 20px',
              marginBottom: '22px',
            }}
          >
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '9999px',
                background: '#60a5fa',
                display: 'flex',
              }}
            />
            <span
              style={{
                color: '#93c5fd',
                fontSize: '20px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Nieuw bij Heren van Flatsoen
            </span>
          </div>

          {/* Main Title */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginBottom: '18px',
            }}
          >
            <span
              style={{
                fontSize: '74px',
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: '-0.03em',
                lineHeight: 1.05,
              }}
            >
              Welkom bij TipIn
            </span>
          </div>

          {/* Subtitle */}
          <p
            style={{
              fontSize: '29px',
              color: '#cbd5e1',
              lineHeight: 1.4,
              margin: '0 0 36px 0',
              fontWeight: 500,
            }}
          >
            Zet de app in 2 stappen op je beginscherm en maak direct je HVF-teamaccount aan.
          </p>

          {/* Step Pills */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#2563eb',
                borderRadius: '16px',
                padding: '12px 22px',
                color: '#ffffff',
                fontSize: '21px',
                fontWeight: 700,
              }}
            >
              1. Zet op beginscherm
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '16px',
                padding: '12px 22px',
                color: '#f8fafc',
                fontSize: '21px',
                fontWeight: 700,
              }}
            >
              2. Account aanmaken
            </div>
          </div>
        </div>

        {/* Right Column: HVF Logo Card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '360px',
            height: '360px',
            borderRadius: '48px',
            background: '#000000',
            border: '3px solid rgba(255, 255, 255, 0.16)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            padding: '20px',
            zIndex: 10,
          }}
        >
          <img
            src={logoSrc}
            alt="Heren van Flatsoen Logo"
            width={316}
            height={316}
            style={{
              borderRadius: '32px',
              objectFit: 'contain',
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
