
import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: 'hsl(220 20% 7%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'hsl(140 70% 50%)',
          borderRadius: '8px',
        }}
      >
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{ width: '65%', height: '65%' }}
        >
            <path d="M12 4c-3.5 4-3 10.5 0 16" />
            <path d="M12 4c3.5 4 3 10.5 0 16" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
