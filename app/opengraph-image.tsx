import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const alt = 'TipIn — Heren van Flatsoen'
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
          background: 'linear-gradient(135deg, #070b14 0%, #0f172a 55%, #172554 100%)',
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
            top: '-140px',
            right: '-100px',
            width: '520px',
            height: '520px',
            borderRadius: '9999px',
            background: 'radial-gradient(circle, rgba(37,99,235,0.28) 0%, rgba(37,99,235,0) 70%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-180px',
            left: '-80px',
            width: '460px',
            height: '460px',
            borderRadius: '9999px',
            background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, rgba(59,130,246,0) 70%)',
            display: 'flex',
          }}
        />

        {/* Left Column: Text & Badges */}
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
              background: 'rgba(37, 99, 235, 0.2)',
              border: '1px solid rgba(96, 165, 250, 0.35)',
              borderRadius: '9999px',
              padding: '8px 20px',
              marginBottom: '24px',
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
              Heren van Flatsoen • Anno 2016
            </span>
          </div>

          {/* Main Title */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '18px',
              marginBottom: '16px',
            }}
          >
            <span
              style={{
                fontSize: '96px',
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: '-0.03em',
                lineHeight: 1,
              }}
            >
              TipIn
            </span>
            <span
              style={{
                fontSize: '32px',
                fontWeight: 700,
                color: '#60a5fa',
              }}
            >
              Team App
            </span>
          </div>

          {/* Subtitle */}
          <p
            style={{
              fontSize: '30px',
              color: '#cbd5e1',
              lineHeight: 1.4,
              margin: '0 0 36px 0',
              fontWeight: 500,
            }}
          >
            Alles voor trainingen, wedstrijden, borrels, polls en de boetepot op één plek.
          </p>

          {/* Feature Pills */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            {['Agenda', 'Aanwezigheid', 'Polls', 'Boetepot & Adt-timer'].map(
              (item) => (
                <div
                  key={item}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    borderRadius: '14px',
                    padding: '10px 18px',
                    color: '#f8fafc',
                    fontSize: '20px',
                    fontWeight: 600,
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '9999px',
                      background: '#3b82f6',
                      display: 'flex',
                    }}
                  />
                  <span>{item}</span>
                </div>
              )
            )}
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
