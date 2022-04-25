import React from 'react'

import { useStepperDialog } from '../Hooks/useStepperDialog'
import Scan from '../ModelSteps/Scan'
import Information from '../ModelSteps/Information'
import Contact from '../ModelSteps/Contact'

const StepperDialogContent = ({ onClose }) => {
  const { allCurrentSteps, currentStepIndex } = useStepperDialog()

  return allCurrentSteps.map(currentStep => {
    if (currentStep.stepIndex === currentStepIndex) {
      const modelPage = currentStep.model.toLowerCase()
      switch (modelPage) {
        case 'scan':
          return <Scan key={currentStep.stepIndex} currentStep={currentStep} />
        case 'information':
          return (
            <Information
              key={currentStep.stepIndex}
              currentStep={currentStep}
            />
          )
        case 'contact':
          return (
            <Contact
              key={currentStep.stepIndex}
              currentStep={currentStep}
              onClose={onClose}
            />
          )
      }
    }
  })
}

export default StepperDialogContent