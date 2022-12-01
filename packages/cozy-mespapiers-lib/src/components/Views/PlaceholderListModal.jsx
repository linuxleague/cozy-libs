import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import { FixedDialog } from 'cozy-ui/transpiled/react/CozyDialogs'

import { useScannerI18n } from '../Hooks/useScannerI18n'
import PlaceholdersList from '../Placeholders/PlaceholderListModal/PlaceholdersList'
import PlaceholderThemesList from '../Placeholders/PlaceholderListModal/PlaceholderThemesList'

const defaultState = {
  onBack: false,
  currentQualifItems: [],
  qualificationLabel: ''
}

const PlaceholderListModal = () => {
  const { t } = useI18n()
  const navigate = useNavigate()
  const scannerT = useScannerI18n()
  const [state, setState] = useState(defaultState)

  const resetCurrentQualif = () => {
    setState({ ...defaultState, onBack: true })
  }

  const setQualifByTheme = theme => {
    setState(prev => ({
      ...prev,
      currentQualifItems: theme.items,
      qualificationLabel: theme.label
    }))
  }

  return state.currentQualifItems.length === 0 ? (
    <FixedDialog
      open
      disableGutters
      onClose={() => navigate(-1)}
      transitionDuration={state.onBack ? 0 : undefined}
      title={t('PlaceholdersList.title', { name: '' })}
      content={<PlaceholderThemesList setQualifByTheme={setQualifByTheme} />}
    />
  ) : (
    <FixedDialog
      open
      disableGutters
      onClose={() => navigate(-1)}
      onBack={resetCurrentQualif}
      transitionDuration={0}
      title={t('PlaceholdersList.title', {
        name: ` - ${scannerT(`themes.${state.qualificationLabel}`)}`
      })}
      content={
        <PlaceholdersList currentQualifItems={state.currentQualifItems} />
      }
    />
  )
}

export default PlaceholderListModal