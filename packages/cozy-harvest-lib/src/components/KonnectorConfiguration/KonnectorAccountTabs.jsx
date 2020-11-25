import React, { useState } from 'react'
import PropTypes from 'prop-types'

import { Tab, Tabs } from 'cozy-ui/transpiled/react/MuiTabs'
import Icon from 'cozy-ui/transpiled/react/Icon'
import Divider from 'cozy-ui/transpiled/react/MuiCozyTheme/Divider'

import FlowProvider from '../FlowProvider'
import DataTab from './DataTab'
import ConfigurationTab from './ConfigurationTab'
import tabSpecs from './tabSpecs'

import { useI18n } from 'cozy-ui/transpiled/react/I18n'

import WarningIcon from 'cozy-ui/transpiled/react/Icons/Warning'

const WarningError = () => (
  <Icon icon={WarningIcon} size={13} className="u-ml-half" />
)

const tabIndexes = {
  data: 0,
  configuration: 1
}

const DumbKonnectorAccountTabs = props => {
  const {
    konnector,
    trigger: initialTrigger,
    account,
    onAccountDeleted,
    initialActiveTab,

    // TODO rename to onAddAccount
    addAccount,
    showNewAccountButton,
    flow
  } = props
  const { t } = useI18n()
  const [tab, setTab] = useState(
    initialActiveTab
      ? tabIndexes[initialActiveTab]
      : hasLoginError
      ? tabIndexes.configuration
      : tabIndexes.data
  )
  const handleTabChange = (ev, newTab) => setTab(newTab)

  const flowState = flow.getState()
  const { error } = flowState
  const hasError = !!error
  const hasLoginError = hasError && error.isLoginError()

  return (
    <>
      <Tabs onChange={handleTabChange} value={tab}>
        <Tab label="data">
          {t('modal.tabs.data')}
          {tabSpecs.data.errorShouldBeDisplayed(error, flowState) && (
            <WarningError />
          )}
        </Tab>
        <Tab label="configuration">
          {t('modal.tabs.configuration')}
          {tabSpecs.configuration.errorShouldBeDisplayed(error, flowState) && (
            <WarningError />
          )}
        </Tab>
      </Tabs>
      <Divider />
      <div className="u-pt-1-half u-pb-0">
        {tab === 0 && (
          <DataTab konnector={konnector} trigger={initialTrigger} flow={flow} />
        )}
        {tab === 1 && (
          <ConfigurationTab
            konnector={konnector}
            account={account}
            flow={flow}
            addAccount={addAccount}
            onAccountDeleted={onAccountDeleted}
            showNewAccountButton={showNewAccountButton}
          />
        )}
      </div>
    </>
  )
}

export const KonnectorAccountTabs = props => {
  return (
    <FlowProvider
      initialTrigger={props.initialTrigger}
      konnector={props.konnector}
    >
      {({ flow }) => <DumbKonnectorAccountTabs {...props} flow={flow} />}
    </FlowProvider>
  )
}

KonnectorAccountTabs.propTypes = {
  konnector: PropTypes.object.isRequired,
  trigger: PropTypes.object.isRequired,
  account: PropTypes.object.isRequired,
  onAccountDeleted: PropTypes.func.isRequired,
  addAccount: PropTypes.func.isRequired,

  /** @type {string} Can be used to force the initial tab */
  initialActiveTab: PropTypes.oneOf(['configuration', 'data'])
}

export default KonnectorAccountTabs
