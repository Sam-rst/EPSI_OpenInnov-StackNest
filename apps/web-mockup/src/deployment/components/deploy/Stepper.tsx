import { Fragment } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@core/ui';
import { DEPLOY_STEPS } from '../../data/deploymentLogs';
import { StepperCircle, type StepState } from './StepperCircle';

interface StepperProps {
  currentStep: number;
}

const computeState = (index: number, current: number): StepState => {
  if (index < current) return 'done';
  if (index === current) return 'active';
  return 'pending';
};

const computeWidth = (index: number, current: number): string => {
  if (index < current) return '100%';
  if (index === current) return '50%';
  return '0%';
};

export function Stepper({ currentStep }: StepperProps) {
  return (
    <Card className="p-6 mb-5">
      <div className="flex items-center">
        {DEPLOY_STEPS.map((step, i) => {
          const state = computeState(i, currentStep);
          const isLast = i === DEPLOY_STEPS.length - 1;
          return (
            <Fragment key={step.label}>
              <div className="flex flex-col items-center gap-2 shrink-0 min-w-[80px]">
                <StepperCircle state={state} index={i} />
                <div className={`text-[11.5px] font-medium ${state === 'pending' ? 'text-text-muted' : 'text-text-primary'}`}>
                  {step.label}
                </div>
              </div>
              {!isLast && (
                <div className="flex-1 h-0.5 mx-2 rounded-full overflow-hidden bg-surface-sunken">
                  <motion.div
                    animate={{ width: computeWidth(i, currentStep) }}
                    transition={{ duration: 0.5 }}
                    className={`h-full ${i < currentStep ? 'bg-success' : 'bg-cyan'}`}
                  />
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    </Card>
  );
}
