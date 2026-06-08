import { Fragment } from 'react'
import { motion } from 'framer-motion'

import { Card } from '../common/Card'
import { StepperCircle, type StepState } from './StepperCircle'
import {
  DEPLOYMENT_STEPS,
  DEPLOYMENT_STEP_LABELS,
  type DeploymentStep,
} from '../../types/enums/DeploymentStep'

interface StepperProps {
  currentStep: DeploymentStep
  /** Le déploiement a échoué : on fige la progression sur l'étape courante. */
  failed?: boolean
}

function computeState(index: number, currentIndex: number): StepState {
  if (index < currentIndex) return 'done'
  if (index === currentIndex) return 'active'
  return 'pending'
}

function connectorWidth(index: number, currentIndex: number): string {
  if (index < currentIndex) return '100%'
  if (index === currentIndex) return '50%'
  return '0%'
}

/** Stepper Docker : Validation → Pull image → Création conteneur → Démarrage → Prêt. */
export function Stepper({ currentStep, failed = false }: StepperProps) {
  const currentIndex = DEPLOYMENT_STEPS.indexOf(currentStep)

  return (
    <Card className="mb-5 p-6">
      <div className="flex items-center">
        {DEPLOYMENT_STEPS.map((step, index) => {
          const state = computeState(index, currentIndex)
          const isLast = index === DEPLOYMENT_STEPS.length - 1
          return (
            <Fragment key={step}>
              <div className="flex min-w-[88px] shrink-0 flex-col items-center gap-2">
                <StepperCircle state={state} index={index} />
                <div
                  className={`text-[11.5px] font-medium ${
                    state === 'pending' ? 'text-text-muted' : 'text-text-primary'
                  }`}
                >
                  {DEPLOYMENT_STEP_LABELS[step]}
                </div>
              </div>
              {!isLast && (
                <div className="bg-surface-sunken mx-2 h-0.5 flex-1 overflow-hidden rounded-full">
                  <motion.div
                    animate={{ width: connectorWidth(index, currentIndex) }}
                    transition={{ duration: 0.5 }}
                    className={`h-full ${failed ? 'bg-error' : index < currentIndex ? 'bg-success' : 'bg-cyan'}`}
                  />
                </div>
              )}
            </Fragment>
          )
        })}
      </div>
    </Card>
  )
}
