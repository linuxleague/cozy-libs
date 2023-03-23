import React from 'react'

import ActionMenuItemWrapper from 'cozy-ui/transpiled/react/ActionMenu/ActionMenuItemWrapper'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'

import withLocales from '../../../locales/withLocales'

export const rename = ({ setPaperBeingRenamedId }) => {
  return {
    name: 'renameWithOwnAction',
    action: files => setPaperBeingRenamedId(files[0].id),
    Component: withLocales(({ onClick, className }) => {
      const { t } = useI18n()

      return (
        <ActionMenuItemWrapper
          className={className}
          icon="rename"
          onClick={onClick}
        >
          {t('action.rename')}
        </ActionMenuItemWrapper>
      )
    })
  }
}
