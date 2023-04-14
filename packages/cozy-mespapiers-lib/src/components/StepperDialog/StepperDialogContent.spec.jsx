import { render } from '@testing-library/react'
import React from 'react'

import StepperDialogContent from './StepperDialogContent'
import AppLike from '../../../test/components/AppLike'
import { useStepperDialog } from '../Hooks/useStepperDialog'

/* eslint-disable react/display-name */
jest.mock('../ModelSteps/Scan', () => () => <div data-testid="Scan" />)
jest.mock('../ModelSteps/Information', () => () => (
  <div data-testid="Information" />
))
jest.mock('../ModelSteps/ContactWrapper', () => () => (
  <div data-testid="ContactWrapper" />
))
jest.mock('../Hooks/useStepperDialog')
/* eslint-enable react/display-name */

const mockAllCurrentSteps = [
  { stepIndex: 1, model: 'Scan' },
  { stepIndex: 2, model: 'Information' },
  { stepIndex: 3, model: 'Contact' }
]

describe('StepperDialogContent', () => {
  const setup = () => {
    return render(
      <AppLike>
        <StepperDialogContent />
      </AppLike>
    )
  }

  it('should contain only Scan component', () => {
    useStepperDialog.mockReturnValue({
      allCurrentSteps: mockAllCurrentSteps,
      currentStepIndex: 1
    })
    const { queryByTestId } = setup()

    expect(queryByTestId('Scan')).toBeTruthy()
    expect(queryByTestId('Information')).toBeNull()
    expect(queryByTestId('ContactWrapper')).toBeNull()
  })

  it('should contain only Information component', () => {
    useStepperDialog.mockReturnValue({
      allCurrentSteps: mockAllCurrentSteps,
      currentStepIndex: 2
    })
    const { queryByTestId } = setup()

    expect(queryByTestId('Information')).toBeTruthy()
    expect(queryByTestId('scan')).toBeNull()
    expect(queryByTestId('ContactWrapper')).toBeNull()
  })

  it('should contain only Contact component', () => {
    useStepperDialog.mockReturnValue({
      allCurrentSteps: mockAllCurrentSteps,
      currentStepIndex: 3
    })
    const { queryByTestId } = setup()

    expect(queryByTestId('ContactWrapper')).toBeTruthy()
    expect(queryByTestId('Scan')).toBeNull()
    expect(queryByTestId('Information')).toBeNull()
  })
})
