import React, { useState, useMemo, useCallback, useEffect } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import { useHistory, useLocation } from 'react-router-dom'
import { makeStyles } from '@material-ui/core/styles'

import IconStack from 'cozy-ui/transpiled/react/IconStack'
import Icon from 'cozy-ui/transpiled/react/Icon'
import FileDuotoneIcon from 'cozy-ui/transpiled/react/Icons/FileDuotone'
import List from 'cozy-ui/transpiled/react/MuiCozyTheme/List'
import ListItem from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItem'
import ListItemIcon, {
  smallSize,
  largeSize
} from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'

import { useScannerI18n } from '../Hooks/useScannerI18n'
import { findPlaceholdersByQualification } from '../../helpers/findPlaceholders'
import { usePapersDefinitions } from '../Hooks/usePapersDefinitions'
import ActionMenuImportDropdown from '../Placeholders/ActionMenuImportDropdown'

const useStyles = makeStyles(() => ({
  placeholderList: {
    minHeight: '15rem'
  },
  actionMenu: {
    position: 'absolute',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,

    '& >div:first-child': {
      position: 'relative !important',
      transform: 'none !important'
    }
  }
}))

const PlaceholdersList = ({ currentQualifItems }) => {
  const [isImportDropdownDisplayed, setIsImportDropdownDisplayed] =
    useState(false)
  const [placeholderSelected, setPlaceholderSelected] = useState(null)
  const { papersDefinitions } = usePapersDefinitions()
  const history = useHistory()
  const { search } = useLocation()
  const styles = useStyles()
  const scannerT = useScannerI18n()

  // Get the backgroundPath to pass it to the next modal
  // Otherwise the next modal will have the url of this modal in backgroundPath
  const backgroundPath = new URLSearchParams(search).get('backgroundPath')
  const allPlaceholders = useMemo(
    () =>
      findPlaceholdersByQualification(papersDefinitions, currentQualifItems),
    [currentQualifItems, papersDefinitions]
  )
  const hideImportDropdown = useCallback(() => {
    setIsImportDropdownDisplayed(false)
    setPlaceholderSelected(undefined)
  }, [])

  const shouldDisplayImportDropdown = () => {
    return !!isImportDropdownDisplayed && !!placeholderSelected
  }

  const selectPlaceholder = useCallback((placeholder, stepsExists) => {
    stepsExists ? setPlaceholderSelected(placeholder) : undefined
  }, [])

  useEffect(() => {
    if (placeholderSelected) setIsImportDropdownDisplayed(true)
  }, [placeholderSelected])

  return (
    <>
      <List className={styles.placeholderList}>
        {allPlaceholders.map((placeholder, idx) => {
          const stepsExists =
            placeholder.acquisitionSteps.length > 0 ||
            placeholder.connectorCriteria

          return (
            <ListItem
              button
              disableGutters
              key={idx}
              onClick={() => selectPlaceholder(placeholder, stepsExists)}
              className={cx({
                ['u-o-50']: !stepsExists
              })}
            >
              <ListItemIcon>
                <IconStack
                  backgroundIcon={
                    <Icon
                      icon={FileDuotoneIcon}
                      color="var(--primaryColor)"
                      size={largeSize}
                    />
                  }
                  foregroundIcon={
                    <Icon
                      icon={placeholder.icon}
                      color="var(--primaryColor)"
                      size={smallSize}
                    />
                  }
                />
              </ListItemIcon>
              <ListItemText primary={scannerT(`items.${placeholder.label}`)} />
            </ListItem>
          )
        })}
      </List>
      <ActionMenuImportDropdown
        className={styles.actionMenu}
        isOpened={shouldDisplayImportDropdown()}
        placeholder={placeholderSelected}
        onClose={hideImportDropdown}
        onClick={() =>
          history.push({
            pathname: `/paper/create/${placeholderSelected.label}`,
            search: `deepBack&backgroundPath=${backgroundPath}`
          })
        }
      />
    </>
  )
}

PlaceholdersList.propTypes = {
  currentQualifItems: PropTypes.arrayOf(
    PropTypes.exact({
      label: PropTypes.string,
      subjects: PropTypes.arrayOf(PropTypes.string),
      purpose: PropTypes.string,
      sourceCategory: PropTypes.string,
      sourceSubCategory: PropTypes.string
    })
  ).isRequired
}

export default PlaceholdersList