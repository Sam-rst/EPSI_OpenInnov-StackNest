import { useNavigate } from 'react-router-dom'

import { Button, Icon } from '../../../shared/components/ui'

export function ChatOpsHint() {
  const navigate = useNavigate()

  return (
    <div className="border-border bg-surface-elevated rounded-md border p-3.5">
      <div className="mb-1.5 flex items-center gap-2">
        <Icon name="sparkles" size={13} className="text-yellow" />
        <span className="text-text-primary text-[12px] font-semibold">
          Pas envie de chercher&nbsp;?
        </span>
      </div>
      <p className="text-text-secondary mb-2.5 text-[11.5px] leading-relaxed">
        Décris ton besoin en français, le ChatOps IA s'occupe du reste.
      </p>
      <Button size="sm" variant="cyan" icon="message-square" onClick={() => navigate('/chat')}>
        Ouvrir ChatOps
      </Button>
    </div>
  )
}
