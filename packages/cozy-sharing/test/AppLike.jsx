import React from 'react'

import { CozyProvider, createMockClient } from 'cozy-client'
import { I18n } from 'cozy-ui/transpiled/react/I18n'
import { BreakpointsProvider } from 'cozy-ui/transpiled/react/hooks/useBreakpoints'

import langEn from '../locales/en.json'

const AppLike = ({ children, client }) => (
  <BreakpointsProvider>
    <I18n lang="en" dictRequire={() => langEn}>
      <CozyProvider client={client || createMockClient({})}>
        {children}
      </CozyProvider>
    </I18n>
  </BreakpointsProvider>
)

export default AppLike
