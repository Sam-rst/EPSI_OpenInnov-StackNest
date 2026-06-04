import { PERSONAS, PERSONA_AUTOPLAY_MS } from './personas.data';
import { PersonasHeader } from './PersonasHeader';
import { PersonasStage } from './PersonasStage';
import { PersonasIndicators } from './PersonasIndicators';
import { useAutoCarousel } from './useAutoCarousel';

export function Personas() {
  const { active, paused, setActive, setPaused } = useAutoCarousel(PERSONAS.length, PERSONA_AUTOPLAY_MS);

  return (
    <section className="py-24 border-y border-hairline relative bg-surface">
      <div className="max-w-[1180px] mx-auto px-8">
        <PersonasHeader />
        <PersonasStage
          personas={PERSONAS}
          active={active}
          paused={paused}
          durationMs={PERSONA_AUTOPLAY_MS}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        />
        <PersonasIndicators personas={PERSONAS} active={active} onSelect={setActive} />
      </div>
    </section>
  );
}
