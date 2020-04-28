import React, { Component } from 'react'
import classNames from 'classnames'
import PropTypes from 'prop-types'
import { Spinner, MenuItem, withBreakpoints } from 'cozy-ui/transpiled/react'
import { translate } from 'cozy-ui/transpiled/react/I18n'
import { withClient } from 'cozy-client'
import MenuAwareMobile from './MenuAwareMobile'
import { AvatarPlusX, AvatarLink, Avatar } from './Avatar'

import styles from './recipient.styl'

import IconHourglass from '../../assets/icons/icon-hourglass-16.svg'
import IconEye from '../../assets/icons/icon-eye-16.svg'
import IconPen from '../../assets/icons/icon-pen-write-16.svg'
import IconTrash from '../../assets/icons/icon-trash-red.svg'

import { Contact } from '../models'
import Identity from './Identity'

const MAX_DISPLAYED_RECIPIENTS = 3
const DEFAULT_DISPLAY_NAME = 'Share.contacts.defaultDisplayName'

export const RecipientsAvatars = ({
  recipients,
  link,
  size = 'small-plus',
  className,
  onClick
}) => {
  // we reverse the recipients array because we use `flex-direction: row-reverse` to display them correctly
  // we slice first to clone the original array because reverse() mutates it
  const reversedRecipients = recipients.slice().reverse()
  return (
    <div
      className={classNames(
        styles['recipients-avatars'],
        {
          [styles['--interactive']]: onClick
        },
        className
      )}
      onClick={onClick}
    >
      {link && <AvatarLink size={size} />}
      {recipients.length > MAX_DISPLAYED_RECIPIENTS && (
        <AvatarPlusX
          extraRecipients={reversedRecipients
            .slice(MAX_DISPLAYED_RECIPIENTS)
            .map(recipient => Contact.getDisplayName(recipient))}
          size={size}
        />
      )}
      {reversedRecipients
        .slice(0, MAX_DISPLAYED_RECIPIENTS)
        .map((recipient, idx) => (
          <Avatar
            key={idx}
            text={Contact.getInitials(recipient)}
            size={size}
            textId={Contact.getDisplayName(recipient)}
          />
        ))}
    </div>
  )
}

export const UserAvatar = ({ url, size, ...rest }) => (
  <div className={styles['avatar']}>
    <Avatar
      text={Contact.getInitials(rest)}
      size={size}
      textId={Contact.getDisplayName(rest)}
    />
    <Identity name={Contact.getDisplayName(rest)} details={url} />
  </div>
)

export class Status extends Component {
  state = {
    revoking: false
  }

  onRevoke = async () => {
    const {
      onRevoke,
      document,
      sharingId,
      index,
      isOwner,
      onRevokeSelf
    } = this.props
    this.setState({ revoking: true })
    if (isOwner) {
      await onRevoke(document, sharingId, index)
    } else {
      await onRevokeSelf(document)
    }

    this.setState({ revoking: false })
  }

  getStatusIcon = type => {
    switch (type) {
      case 'one-way':
        return <IconEye />
      case 'two-way':
        return <IconPen />
      default:
        return <IconHourglass />
    }
  }

  render() {
    const {
      isOwner,
      status,
      instance,
      type,
      documentType,
      name,
      client,
      t
    } = this.props
    const { revoking } = this.state
    const isMe =
      instance !== undefined && instance === client.options.uri && !isOwner
    const shouldShowMenu = !revoking && status !== 'owner' && (isMe || isOwner)
    return (
      <div className={classNames(styles['recipient-status'], 'u-ml-1')}>
        {revoking && <Spinner />}
        {!shouldShowMenu && (
          <span className={styles['recipient-owner']}>
            {t(`Share.status.${status}`)}
          </span>
        )}
        {shouldShowMenu && (
          <MenuAwareMobile
            label={
              status === 'ready' && type
                ? t(`Share.type.${type}`)
                : t(`Share.status.${status}`)
            }
            className={styles['recipient-menu']}
            buttonClassName={styles['recipient-menu-btn']}
            position={'right'}
            popover
            itemsStyle={{
              maxWidth: '280px'
            }}
            name={name}
          >
            <MenuItem icon={this.getStatusIcon(status)}>
              {status === 'ready' && type
                ? t(`Share.type.${type}`)
                : t(`Share.status.${status}`)}
            </MenuItem>

            <hr />
            <MenuItem
              onSelect={this.onRevoke}
              onClick={this.onRevoke}
              icon={<IconTrash />}
            >
              <div className={styles['action-unshare']}>
                {isOwner
                  ? t(`${documentType}.share.revoke.title`)
                  : t(`${documentType}.share.revokeSelf.title`)}
              </div>
              <p className={styles['action-unshare-desc']}>
                {isOwner
                  ? t(`${documentType}.share.revoke.desc`)
                  : t(`${documentType}.share.revokeSelf.desc`)}
              </p>
            </MenuItem>
          </MenuAwareMobile>
        )}
      </div>
    )
  }
}

const StatusWithBreakpoints = withBreakpoints()(translate()(withClient(Status)))

const Recipient = (props, { client, t }) => {
  const { instance, isOwner, status, ...rest } = props
  const isMe =
    (isOwner && status === 'owner') || instance === client.options.uri
  const defaultDisplayName = t(DEFAULT_DISPLAY_NAME)
  const defaultInitials = defaultDisplayName[0].toUpperCase()
  const name = Contact.getDisplayName(rest, defaultDisplayName)
  return (
    <div className={classNames(styles['recipient'], 'u-mt-1')}>
      <Avatar
        text={Contact.getInitials(rest, defaultInitials)}
        size={'small-plus'}
        textId={name}
      />
      <div className={styles['recipient-ident-status']}>
        <Identity
          name={isMe ? t('Share.recipients.you') : name}
          details={instance}
        />
        <StatusWithBreakpoints {...props} name={name} />
      </div>
    </div>
  )
}

Recipient.contextTypes = {
  client: PropTypes.object.isRequired,
  t: PropTypes.func.isRequired
}

export default Recipient

export const RecipientWithoutStatus = ({ instance, ...rest }) => {
  const name = Contact.getDisplayName(rest)
  return (
    <div className={styles['recipient']}>
      <Avatar
        text={Contact.getInitials(rest)}
        size={'small-plus'}
        textId={name}
      />
      <div className={styles['recipient-ident-status']}>
        <Identity name={name} details={instance} />
      </div>
    </div>
  )
}

export const RecipientPlusX = ({ extraRecipients }, { t }) => (
  <div className={styles['recipient']}>
    <AvatarPlusX
      extraRecipients={extraRecipients.map(recipient =>
        Contact.getDisplayName(recipient)
      )}
    />
    <div className={styles['recipient-ident-status']}>
      <Identity
        name={t('Share.members.otherContacts', extraRecipients.length)}
      />
    </div>
  </div>
)

RecipientPlusX.contextTypes = {
  t: PropTypes.func.isRequired
}
