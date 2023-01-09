import React from 'react'

import Avatar from 'cozy-ui/transpiled/react/Avatar'

import styles from './recipient.styl'
import { getDisplayName, getInitials } from '../../models'
import Identity from './Identity'

const OwnerIdentity = ({ url, size, ...rest }) => (
  <div className={styles['avatar']}>
    <Avatar
      text={getInitials(rest)}
      size={size}
      textId={getDisplayName(rest)}
    />
    <Identity name={getDisplayName(rest)} details={url} />
  </div>
)

export default OwnerIdentity