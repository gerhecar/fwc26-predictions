import { PredictionsFlow } from '@/components/predictions/predictions-flow'

const BG_URL =
  'https://images.unsplash.com/photo-1590459243251-d3e42c3dd700?fm=jpg&q=80&w=1920'

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
