import React, { useState } from 'react'

import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import DropdownButton from 'cozy-ui/transpiled/react/DropdownButton'
import ActionMenu, {
  ActionMenuItem,
  ActionMenuRadio
} from 'cozy-ui/transpiled/react/ActionMenu'
import Typography from 'cozy-ui/transpiled/react/Typography'
import Icon from 'cozy-ui/transpiled/react/Icon'
import TrashIcon from 'cozy-ui/transpiled/react/Icons/Trash'
import Alerter from 'cozy-ui/transpiled/react/Alerter'
import Spinner from 'cozy-ui/transpiled/react/Spinner'

import { checkIsReadOnlyPermissions } from '../../helpers/permissions'
import logger from '../../logger'

const LinkRecipientPermissions = ({
  className,
  document,
  documentType,
  permissions,
  onChangePermissions,
  onDisable
}) => {
  const { t } = useI18n()
  const [menuIsOpen, setMenuIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const isReadOnlyPermissions = checkIsReadOnlyPermissions(permissions)

  const toggleMenu = () => {
    setMenuIsOpen(!menuIsOpen)
  }

  const deleteShareLink = async () => {
    try {
      setLoading(true)
      await onDisable(document)
    } catch (e) {
      Alerter.error(t(`${documentType}.share.error.revoke`))
      logger.log(e)
    } finally {
      setLoading(false)
    }
  }

  const updateLinkPermissions = ({ isReadOnly }) => {
    const verbs = isReadOnly ? ['GET'] : ['GET', 'POST', 'PUT', 'PATCH']
    try {
      onChangePermissions(document, verbs)
    } catch (err) {
      Alerter.error(t(`${documentType}.share.shareByLink.permserror`))
      logger.log(err)
    }
  }
  const buttonRef = React.createRef()

  return (
    <div className={className}>
      {loading && <Spinner />}
      {!loading && (
        <>
          <DropdownButton
            onClick={toggleMenu}
            ref={buttonRef}
            textVariant="body2"
          >
            {t(
              `Share.type.${isReadOnlyPermissions ? 'one-way' : 'two-way'}`
            ).toLowerCase()}
          </DropdownButton>
          {menuIsOpen && (
            <ActionMenu onClose={toggleMenu} anchorElRef={buttonRef}>
              <ActionMenuItem
                left={
                  <ActionMenuRadio
                    name="permissionLinkMenu"
                    value="true"
                    checked={isReadOnlyPermissions}
                  />
                }
                onClick={() => {
                  toggleMenu()
                  updateLinkPermissions({ isReadOnly: true })
                }}
              >
                <>
                  {t('Share.permissionLink.read')}
                  <Typography
                    className="u-mt-half"
                    variant="caption"
                    color="textSecondary"
                  >
                    {t(t('Share.permissionLink.readDescription'))}
                  </Typography>
                </>
              </ActionMenuItem>
              <ActionMenuItem
                left={
                  <ActionMenuRadio
                    name="permissionLinkMenu"
                    value="false"
                    checked={!isReadOnlyPermissions}
                  />
                }
                onClick={() => {
                  toggleMenu()
                  updateLinkPermissions({ isReadOnly: false })
                }}
              >
                <>
                  {t('Share.permissionLink.write')}
                  <Typography
                    className="u-mt-half"
                    variant="caption"
                    color="textSecondary"
                  >
                    {t('Share.permissionLink.writeDescription')}
                  </Typography>
                </>
              </ActionMenuItem>
              <hr />
              <ActionMenuItem
                left={<Icon icon={TrashIcon} color="var(--errorColor)" />}
                onClick={() => {
                  toggleMenu()
                  deleteShareLink()
                }}
              >
                <Typography className="u-error" variant="body1">
                  {t('Share.permissionLink.deactivate')}
                </Typography>
              </ActionMenuItem>
            </ActionMenu>
          )}
        </>
      )}
    </div>
  )
}

export default LinkRecipientPermissions