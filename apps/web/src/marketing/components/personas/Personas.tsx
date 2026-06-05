import { PERSONA_AUTOPLAY_MS, PERSONAS } from '../../data/personas.data'
import { PersonasHeader } from './PersonasHeader'
import { PersonasIndicators } from './PersonasIndicators'
import { PersonasStage } from './PersonasStage'
import { useAutoCarousel } from './useAutoCarousel'

/** Carousel auto-défilant des personas cibles (étudiant, senior, lead). */
export function Personas() {
  const { active, paused, setActive, setPaused } = useAutoCarousel(
    PERSONAS.length,
    PERSONA_AUTOPLAY_MS,
  )

  return (
    <section className="border-hairline bg-surface relative border-y py-24">
      <div className="mx-auto max-w-[1180px] px-8">
        <PersonasHeader />
        <PersonasStage
          personas={PERSONAS}
          active={active}
          paused={paused}
          durationMs={PERSONA_AUTOPLAY_MS}
          onMouseEnter={() => {
            setPaused(true)
          }}
          onMouseLeave={() => {
            setPaused(false)
          }}
        />
        <PersonasIndicators personas={PERSONAS} active={active} onSelect={setActive} />
      </div>
    </section>
  )
}
