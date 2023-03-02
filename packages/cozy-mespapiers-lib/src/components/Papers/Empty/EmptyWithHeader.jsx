import React from 'react'
import PropTypes from 'prop-types'

import flag from 'cozy-flags'

import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import List from 'cozy-ui/transpiled/react/MuiCozyTheme/List'
import ListSubheader from 'cozy-ui/transpiled/react/MuiCozyTheme/ListSubheader'
import ListItem from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItem'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'

import HarvestBanner from '../HarvestBanner'

const EmptyWithHeader = ({ connector, account }) => {
  const { t } = useI18n()

  return (
    <List
      subheader={
        <ListSubheader>
          <div className="u-ellipsis">{account.auth.login}</div>
        </ListSubheader>
      }
    >
      {flag('harvest.inappconnectors.enabled') && (
        <HarvestBanner connector={connector} account={account} />
      )}
      <ListItem>
        <ListItemText
          ellipsis={false}
          primary={t('Empty.connector.title')}
          secondary={t('Empty.connector.text', {
            connectorSlug: connector?.slug?.toUpperCase()
          })}
        />
      </ListItem>
    </List>
  )
}

EmptyWithHeader.propTypes = {
  connector: PropTypes.object,
  account: PropTypes.object.isRequired
}

export default EmptyWithHeader