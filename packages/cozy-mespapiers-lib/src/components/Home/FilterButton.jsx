import PropTypes from 'prop-types'
import React from 'react'

import Badge from 'cozy-ui/transpiled/react/Badge'
import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import { makeStyles } from 'cozy-ui/transpiled/react/styles'

const useStyles = makeStyles(theme => ({
  iconButton: {
    color: theme.palette.text.icon,
    boxShadow: theme.shadows[2],
    backgroundColor: theme.palette.background.paper,
    marginLeft: '0.5rem'
  }
}))

const FilterButton = ({ badge, onClick }) => {
  const styles = useStyles()

  const { active, content, showZero } = badge

  return active ? (
    <Badge
      badgeContent={content}
      showZero={showZero}
      color="primary"
      variant="standard"
      size="medium"
    >
      <IconButton
        data-testid="SwitchButton"
        className={styles.iconButton}
        size="medium"
        onClick={onClick}
      >
        <Icon icon="setting" />
      </IconButton>
    </Badge>
  ) : (
    <IconButton
      data-testid="SwitchButton"
      className={styles.iconButton}
      size="medium"
      onClick={onClick}
    >
      <Icon icon="setting" />
    </IconButton>
  )
}

FilterButton.defaultProps = {
  badge: {
    active: false,
    content: 0,
    showZero: undefined
  }
}

FilterButton.propTypes = {
  onClick: PropTypes.func,
  badge: PropTypes.shape({
    active: PropTypes.bool,
    content: PropTypes.number,
    showZero: PropTypes.bool
  })
}

export default FilterButton
