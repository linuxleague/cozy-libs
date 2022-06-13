import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useClient } from 'cozy-client'
import Button from 'cozy-ui/transpiled/react/MuiCozyTheme/Buttons'
import Popup from 'cozy-ui/transpiled/react/Popup'
import ListItem from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItem'
import { findKonnectorPolicy } from '../../../konnector-policies'
import { isFlagshipApp } from 'cozy-device-helper'
import InAppBrowser from '../../InAppBrowser'
import withLocales from '../../hoc/withLocales'
import { intentsApiProptype } from '../../../helpers/proptypes'

const BIContractActivationWindow = ({ konnector, account, t, intentsApi }) => {
  const [initialUrl, setInitialUrl] = useState(null)
  const [isWindowVisible, setWindowVisible] = useState(false)
  const [shouldRefreshContracts, setShouldRefreshContracts] = useState(false)

  const konnectorPolicy = findKonnectorPolicy(konnector)
  const client = useClient()

  const onPopupClosed = () => {
    setWindowVisible(false)
    setShouldRefreshContracts(true)
  }

  useEffect(() => {
    async function refreshContracts() {
      await konnectorPolicy.refreshContracts({ client, account, konnector })
      setShouldRefreshContracts(false)
    }
    if (shouldRefreshContracts) {
      refreshContracts()
    }
  }, [account, client, konnectorPolicy, shouldRefreshContracts, konnector])

  useEffect(() => {
    async function handleLinkFetch() {
      const result = await konnectorPolicy.fetchContractSynchronizationUrl({
        client,
        account,
        konnector
      })
      setInitialUrl(result)
    }
    if (konnectorPolicy.fetchContractSynchronizationUrl) {
      handleLinkFetch()
    }
  }, [konnector, account, client, konnectorPolicy])

  return konnectorPolicy.fetchContractSynchronizationUrl ? (
    <ListItem>
      <Button disabled={!initialUrl} onClick={() => setWindowVisible(true)}>
        {t('contracts.handle-synchronization')}
      </Button>
      {isWindowVisible &&
        (isFlagshipApp() ? (
          <InAppBrowser
            url={initialUrl}
            onClose={onPopupClosed}
            intentsApi={intentsApi}
          />
        ) : (
          <Popup
            initialUrl={initialUrl}
            width="800"
            height="800"
            onClose={onPopupClosed}
          />
        ))}
    </ListItem>
  ) : null
}

BIContractActivationWindow.propTypes = {
  t: PropTypes.func,
  account: PropTypes.object,
  konnector: PropTypes.object,
  /** custom intents api. Can have fetchSessionCode, showInAppBrowser, closeInAppBrowser at the moment */
  intentsApi: intentsApiProptype
}

export default withLocales(BIContractActivationWindow)
