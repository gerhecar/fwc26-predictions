import { PredictionsFlow } from '@/components/predictions/predictions-flow'

const BG_URL =
  'https://media.bolavip.com/wp-content/uploads/sites/13/2026/03/12190255/nueva-cancha-estadio-azteca-1200x740.webp'

export default function PredictionsPage() {
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: `url(${BG_URL})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="min-h-screen bg-[#0a0e1a]/70 backdrop-blur-[2px]">
        <PredictionsFlow />
      </div>
    </div>
  )
}
