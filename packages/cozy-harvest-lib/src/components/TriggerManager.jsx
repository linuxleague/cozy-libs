import React, { Component } from 'react'
import PropTypes from 'prop-types'
import get from 'lodash/get'
import flow from 'lodash/flow'

import { withClient } from 'cozy-client'
import { CozyFolder as CozyFolderClass, Account } from 'cozy-doctypes'

import { translate } from 'cozy-ui/transpiled/react/I18n'
import MuiCozyTheme from 'cozy-ui/transpiled/react/MuiCozyTheme'
import Spinner from 'cozy-ui/transpiled/react/Spinner'
import { ModalBackButton } from 'cozy-ui/transpiled/react/Modal'

import { VaultUnlocker, withVaultClient, CipherType } from 'cozy-keys-lib'

import AccountForm from './AccountForm'
import OAuthForm from './OAuthForm'
import accountsMutations from '../connections/accounts'
import { triggersMutations } from '../connections/triggers'
import { addPermission } from '../connections/permissions'
import accounts from '../helpers/accounts'
import { findAccount } from '../connections/accounts'
import konnectors from '../helpers/konnectors'
import triggers from '../helpers/triggers'
import TriggerLauncher from './TriggerLauncher'
import VaultCiphersList from './VaultCiphersList'
import manifest from '../helpers/manifest'
import HarvestVaultProvider from './HarvestVaultProvider'
import clone from 'lodash/clone'
import flag from 'cozy-flags'
import logger from '../logger'
import { findKonnectorPolicy } from '../konnector-policies'
import {
  UPDATE_EVENT
} from '../models/KonnectorJob'

const IDLE = 'IDLE'
const RUNNING = 'RUNNING'

const MODAL_PLACE_ID = 'coz-harvest-modal-place'

class ConnectionFlowStatus extends Component {
  handleUpdate() {
    this.forceUpdate()
  }
  componentDidMount() {
    this.handleUpdate = this.handleUpdate.bind(this)
    this.props.flow.on(UPDATE_EVENT, this.handleUpdate)
  }
  componentWillUnmount() {
    this.props.flow.removeListener(UPDATE_EVENT, this.handleUpdate)
  }
  render() {
    return <pre>{JSON.stringify(this.props.flow.getState(), null, 2)}</pre>
  }
}

/**
 * Wraps conditionally its children inside VaultUnlocker, only if
 * props.konnector's policy tells to saveInVault
 */
const KonnectorVaultUnlocker = ({ konnector, children, ...props }) => {
  const konnectorPolicy = findKonnectorPolicy(konnector)
  if (konnectorPolicy.saveInVault) {
    return <VaultUnlocker {...props}>{children}</VaultUnlocker>
  } else {
    logger.info(
      'Not rendering VaultUnlocker since konnectorPolicy.saveInVault = false'
    )
    return <>{children}</>
  }
}

/**
 * If the vault is not going to be unlocked, we go directly to accountForm
 * step
 * If we need the vault unlocker, the `null` step represents
 *
 * - either vault locked
 * - ciphers being loaded
 *
 * TODO Find a way not to have to check konnectorPolicy here and again through
 * KonnectorVaultUnlocker
 */
const getInitialStep = ({ account, konnector }) => {
  const konnectorPolicy = findKonnectorPolicy(konnector)
  if (konnectorPolicy.saveInVault) {
    return account ? 'accountForm' : null
  } else {
    return 'accountForm'
  }
}

/**
 * Displays the login form and on submission will create the account, triggers and folders.
 * After that it calls TriggerLauncher to run the konnector.
 *
 * @type {Component}
 */
export class DumbTriggerManager extends Component {
  constructor(props) {
    super(props)
    const { account } = props

    this.handleOAuthAccountId = this.handleOAuthAccountId.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleError = this.handleError.bind(this)
    this.handleCipherSelect = this.handleCipherSelect.bind(this)
    this.showCiphersList = this.showCiphersList.bind(this)
    this.handleVaultUnlock = this.handleVaultUnlock.bind(this)
    this.handleFlowUpdate = this.handleFlowUpdate.bind(this)

    this.state = {
      account,
      error: null,
      status: IDLE,
      step: getInitialStep(props),
      selectedCipher: undefined,
      showBackButton: false,
      ciphers: []
    }
  }

  componentDidMount() {
    const { flow } = this.props
    flow.on(UPDATE_EVENT, this.handleFlowUpdate)
  }

  componentWillUnmount() {
    const { flow } = this.props
    flow.removeListener(UPDATE_EVENT, this.handleFlowUpdate)
  }

  handleFlowUpdate() {
    const { flow } = this.props
    this.setState({ flowState: flow.getState() })
  }

  /**
   * OAuth Form success handler. OAuthForm retrieves an account id created by the
   * cozy stack
   * @param  {string}  accountId
   */
  async handleOAuthAccountId(accountId) {
    const { findAccount } = this.props
    try {
      this.setState({ error: null, status: RUNNING })
      const oAuthAccount = await findAccount(client, accountId)
      return await flow.ensureTriggerAndLaunch(client, {
        account: oAuthAccount,
        konnector: this.props.konnector,
        trigger: this.props.trigger
      })
    } catch (error) {
      this.handleError(error)
    } finally {
      this.setState({ status: IDLE })
    }
  }

  /**
   * Get the ID of the cipher selected by the user in the list
   *
   * @returns {string|null} the cipher ID
   */
  getSelectedCipherId() {
    const { selectedCipher } = this.state
    return selectedCipher && selectedCipher.id
  }

  async handleSubmit(data = {}) {
    const { client, flow, konnector, trigger, vaultClient } = this.props
    const { account } = this.state

    this.setState({
      error: null,
      status: RUNNING
    })

    try {
      const cipherId = this.getSelectedCipherId()
      await flow.handleFormSubmit({
        client,
        account: account || {},
        cipherId,
        konnector,
        trigger,
        userCredentials: data,
        vaultClient
      })
    } catch (error) {
      return this.handleError(error)
    } finally {
      this.setState({
        status: IDLE
      })
    }
  }
  /**
   * TODO rename state error to accountError
   */
  handleError(error) {
    const { onError } = this.props
    this.setState({ error })
    if (typeof onError === 'function') onError(error)
  }

  handleCipherSelect(selectedCipher) {
    const { konnector } = this.props
    const account = this.cipherToAccount(selectedCipher)
    const values = manifest.getFieldsValues(konnector, account)

    const hasValuesForRequiredFields = manifest.hasValuesForRequiredFields(
      konnector,
      values
    )

    if (hasValuesForRequiredFields) {
      this.setState(
        {
          selectedCipher
        },
        () => {
          this.handleSubmit(values)
        }
      )
    } else {
      this.setState({
        step: 'accountForm',
        selectedCipher,
        showBackButton: true
      })
    }
  }

  cipherToAccount(cipher) {
    if (cipher === undefined) {
      return null
    }

    const identifierProperty = manifest.getIdentifier(
      this.props.konnector.fields
    )

    const account = Account.fromCipher(cipher, {
      identifierProperty
    })

    return account
  }

  componentDidUpdate(prevProps) {
    if (this.props.error && this.props.error !== prevProps.error) {
      this.setState({ step: 'accountForm' })
    }
  }

  /**
   * Tells whether we currently have a cipher selected or not
   * selectedCipher === undefined means nothing has been selected
   * selectedCipher === null means « from another account has been selected »
   * selectedCipher === Object means a cipher has been selected
   */
  hasCipherSelected() {
    return this.state.selectedCipher !== undefined
  }

  showAccountForm() {
    this.setState({ step: 'accountForm', showBackButton: false })
  }

  showCiphersList(ciphers) {
    this.setState(prevState => {
      return {
        step: prevState.step === 'accountForm' ? 'accountForm' : 'ciphersList',
        ciphers: ciphers ? ciphers : prevState.ciphers
      }
    })
  }

  async handleVaultUnlock() {
    const { vaultClient, konnector } = this.props

    const encryptedCiphers = await vaultClient.getAll({
      type: CipherType.Login
    })

    if (encryptedCiphers.length === 0) {
      this.showAccountForm()
      return
    }

    try {
      const ciphers = await vaultClient.getAllDecrypted({
        type: CipherType.Login,
        uri: get(konnector, 'vendor_link')
      })

      if (ciphers.length === 0) {
        this.showAccountForm()
      } else {
        this.showCiphersList(ciphers)
      }
    } catch (err) {
      logger.error(
        `Error while getting decrypted ciphers for ${konnector.slug} konnector:`
      )
      logger.error(err)
    }
  }

  render() {
    const {
      error: triggerError,
      konnector,
      running: triggerRunning,
      showError,
      modalContainerId,
      t,
      onVaultDismiss,
      vaultClosable,
      flow
    } = this.props

    const flowState = flow.getState()
    const submitting = flowState.running

    const {
      account,
      error,
      status,
      step,
      selectedCipher,
      showBackButton,
      ciphers
    } = this.state

    const modalInto = modalContainerId || MODAL_PLACE_ID

    const { oauth } = konnector

    const showSpinner = submitting && selectedCipher && step === 'ciphersList'
    const showCiphersList = step === 'ciphersList'
    const showAccountForm = step === 'accountForm'

    if (oauth) {
      return (
        <OAuthForm
          account={account}
          konnector={konnector}
          onSuccess={this.handleOAuthAccountId}
        />
      )
    }

    if (showSpinner) {
      return (
        <div className="u-flex u-flex-column u-flex-items-center">
          <Spinner size="xxlarge" />
          <p>{t('triggerManager.connecting')}</p>
        </div>
      )
    }

    return (
      <KonnectorVaultUnlocker
        konnector={konnector}
        onDismiss={onVaultDismiss}
        closable={vaultClosable}
        onUnlock={this.handleVaultUnlock}
      >
        <div id={modalInto} />
        {showCiphersList && (
          <VaultCiphersList
            konnector={konnector}
            ciphers={ciphers}
            onSelect={this.handleCipherSelect}
          />
        )}
        <ConnectionFlowStatus flow={this.props.flow} />
        {showAccountForm && (
          <>
            {showBackButton && (
              <ModalBackButton
                onClick={() => this.showCiphersList()}
                label={t('back')}
              />
            )}
            <AccountForm
              account={
                this.hasCipherSelected()
                  ? this.cipherToAccount(selectedCipher)
                  : account
              }
              submitting={submitting}
              konnector={konnector}
              onSubmit={this.handleSubmit}
              showError={showError}
              onBack={() => this.showCiphersList()}
              readOnlyIdentifier={this.hasCipherSelected()}
            />
          </>
        )}
      </KonnectorVaultUnlocker>
    )
  }
}

DumbTriggerManager.propTypes = {
  /**
   * Account document. Used to get intial form values.
   * If no account is passed, AccountForm will use empty initial values.
   * @type {Object}
   */
  account: PropTypes.object,
  /**
   * Konnector document. AccountForm will check the `fields` object to compute
   * fields.
   * @type {Object}
   */
  konnector: PropTypes.object.isRequired,
  /**
   * Indicates if the TriggerManager has to show errors. Sometimes errors may be
   * displayed elsewhere. However, a KonnectorJobError corresponding to a login
   * error is always displayed. Transmitted to AccountForm.
   * @type {Boolean}
   */
  showError: PropTypes.bool,
  /**
   * Existing trigger document to manage.
   * @type {Object}
   */
  trigger: PropTypes.object,
  /**
   * Indicates if the given trigger is already running, i.e. if it has been
   * launched and if an associated job with status 'running' exists.
   * @type {[type]}
   */
  running: PropTypes.bool,
  /**
   * The current error for the job (string or KonnectorJob error)
   */
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  /**
   * Function to call to launch the job
   */
  onFormSubmit: PropTypes.func.isRequired,
  /**
   * Translation function
   */
  t: PropTypes.func,
  /**
   * What to do when the Vault unlock screen is dismissed without password
   */
  onVaultDismiss: PropTypes.func,
  /**
   * Whether the vault will be closable or not.
   * @type {Boolean}
   */
  vaultClosable: PropTypes.bool
}

const SmartTriggerManager = flow(
  translate(),
  withClient,
  withVaultClient
)(DumbTriggerManager)

// The TriggerManager is wrapped in the providers required for it to work by
// itself instead of receiving it from its parents because it is used as
// standalone in places like cozy-home intents
export const TriggerManager = props => {
  return (
    <HarvestVaultProvider>
      <MuiCozyTheme>
        <SmartTriggerManager {...props} />
      </MuiCozyTheme>
    </HarvestVaultProvider>
  )
}

// TriggerManager is exported wrapped in TriggerLauncher to avoid breaking changes.
const LegacyTriggerManager = props => {
  const {
    onLaunch,
    onSuccess,
    onLoginSuccess,
    onError,
    initialTrigger,
    ...otherProps
  } = props
  return (
    <TriggerLauncher
      onLaunch={onLaunch}
      onSuccess={onSuccess}
      onLoginSuccess={onLoginSuccess}
      onError={onError}
      initialTrigger={initialTrigger}
    >
      {({ error, launch, running, trigger, flow }) => (
        <TriggerManager
          {...otherProps}
          error={error}
          trigger={trigger}
          flow={flow}
        />
      )}
    </TriggerLauncher>
  )
}

export default LegacyTriggerManager
