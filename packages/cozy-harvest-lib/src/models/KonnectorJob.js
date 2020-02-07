import MicroEE from 'microee'

import * as accounts from '../helpers/accounts'
import Realtime from 'cozy-realtime'

import {
  createOrUpdateAccount,
  updateAccount,
  ACCOUNTS_DOCTYPE
} from '../connections/accounts'
import { launchTrigger, prepareTriggerAccount } from '../connections/triggers'
import { watchKonnectorJob } from '../models/konnector/KonnectorJobWatcher'
import logger from '../logger'
import { findKonnectorPolicy } from '../konnector-policies'
import { createOrUpdateCipher } from '../models/cipherUtils'
import { ensureTrigger } from '../connections/triggers'
import assert from '../assert'

// events
export const ERROR_EVENT = 'error'
export const LOGIN_SUCCESS_EVENT = 'loginSuccess'
export const SUCCESS_EVENT = 'success'

export const TWO_FA_REQUEST_EVENT = 'twoFARequest'
export const TWO_FA_MISMATCH_EVENT = 'twoFAMismatch'

// statuses
export const IDLE = 'IDLE'
export const PENDING = 'PENDING'
export const ERRORED = 'ERRORED'
export const LOGIN_SUCCESS = 'LOGIN_SUCCESS'
export const SUCCESS = 'SUCCESS'
export const RUNNING_TWOFA = 'RUNNING_TWOFA'
export const TWO_FA_MISMATCH = 'TWO_FA_MISMATCH'
export const TWO_FA_REQUEST = 'TWO_FA_REQUEST'

const JOB_EVENTS = [
  ERROR_EVENT,
  LOGIN_SUCCESS_EVENT,
  SUCCESS_EVENT
]

const eventToStatus = {
  [ERROR_EVENT]: ERRORED,
  [LOGIN_SUCCESS_EVENT]: LOGIN_SUCCESS,
  [SUCCESS_EVENT]: SUCCESS
}
const stepEvents = [LOGIN_SUCCESS_EVENT]
const isStatusEvent = eventName => Boolean(jobEventToStatus[eventName])
const isStepEvent = eventName => stepEvents.includes(eventName)

/**
 * Event hub to launch and follow a konnector job.
 *
 * - Creates the job for a trigger
 * - Listens to changes on
 *   - the created job
 *   - the account linked to the trigger
 *
 * Transforms low-level events happening on the documents to higher-level events
 * closer to business logic.
 *
 * This should be the go to source of truth for the state of a Konnector Job.
 */
export class KonnectorJob {
  constructor(client, trigger) {
    this.client = client
    this.trigger = trigger
    this.account = null
    this.unsubscribeAllRealtime = null

    // Bind methods used as callbacks
    this.getTwoFACodeProvider = this.getTwoFACodeProvider.bind(this)
    this.getKonnectorSlug = this.getKonnectorSlug.bind(this)

    this.handleTwoFA = this.handleTwoFA.bind(this)
    this.launch = this.launch.bind(this)
    this.sendTwoFACode = this.sendTwoFACode.bind(this)
    this.unwatch = this.unwatch.bind(this)

    // status and setter/getters
    this._status = IDLE
    this.setStatus = this.setStatus.bind(this)
    this.getStatus = this.getStatus.bind(this)
    this.isRunning = this.isRunning.bind(this)
    this.isTwoFARunning = this.isTwoFARunning.bind(this)
    this.isTwoFARetry = this.isTwoFARetry.bind(this)

    this.realtime = new Realtime({ client })
    this.handleAccountUpdated = this.handleAccountUpdated.bind(this)
  }

  setStatus(status) {
    this._status = status
  }

  getStatus() {
    return this._status
  }

  isRunning() {
    return ![ERRORED, IDLE, SUCCESS].includes(this.getStatus())
  }

  isTwoFARunning() {
    return this.getStatus() === RUNNING_TWOFA
  }

  isTwoFARetry() {
    return this.getStatus() === TWO_FA_MISMATCH
  }

  getTwoFACodeProvider() {
    return accounts.getTwoFACodeProvider(this.account)
  }

  getKonnectorSlug() {
    return this.trigger.message.konnector
  }

  handleTwoFA(prevAccount) {
    const account = this.account

    const prevState = prevAccount && prevAccount.state
    const state = account.state

    if (prevState === state) {
      return
    }
    if (accounts.isTwoFANeeded(state)) {
      this.setStatus(TWO_FA_REQUEST)
      this.emit(TWO_FA_REQUEST_EVENT, this.account)
    } else if (accounts.isTwoFARetry(state)) {
      this.setStatus(TWO_FA_MISMATCH)
      this.emit(TWO_FA_MISMATCH_EVENT, this.account)
    }
  }

  triggerEvent(eventName, ...args) {
    if (isStepEvent(eventName)) {
      this.setState({ [eventName]: true })
    }
    if (eventToStatus[eventName]) {
      logger.debug(`Setting status ${eventToStatus[eventName]}`)
      this.setState({ status: eventToStatus[eventName] })
    }
    this.emit(eventName, ...args)
  }

  /**
   * "Sends" 2FA Code, saves it into account
   */
  async sendTwoFACode(code) {
    this.setStatus(RUNNING_TWOFA)
    try {
      await updateAccount(
        this.client,
        accounts.updateTwoFaCode(this.account, code)
      )
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error)
      this.setStatus(ERRORED)
    }
  }

  handleLoginSuccess() {
    this.jobWatcher.handleSuccess()
  }

  handleLoginSuccessHandled() {
    this.jobWatcher.disableSuccessTimer()
  }

  /**
   * - Creates io.cozy.accounts
   * - Links cipher to account
   * - Saves account
   * - Ensures trigger is existing for account
   * - Ensures a cipher is created for the authentication data
   *   Find cipher via identifier / password
   * - Launches konnector job
   */
  async handleFormSubmit(options) {
    const {
      client,
      konnector,
      cipherId,
      vaultClient,
      userCredentials
    } = options
    let { account, trigger } = options

    assert(client, 'No client')
    const konnectorPolicy = findKonnectorPolicy(konnector)
    logger.log(`Handling submit, with konnector policy ${konnectorPolicy.name}`)

    let cipher
    if (konnectorPolicy.saveInVault) {
      cipher = await createOrUpdateCipher(vaultClient, cipherId, {
        account,
        konnector,
        userCredentials
      })
    } else {
      logger.info(
        'Bypassing cipher creation because of konnector account policy'
      )
    }

    account = await createOrUpdateAccount({
      account,
      cipher,
      client,
      flow: this,
      konnector,
      konnectorPolicy,
      userCredentials
    })

    logger.info('Created account')

    await this.ensureTriggerAndLaunch(client, { trigger, account, konnector })
  }

  handleAccountUpdated(account) {
    const prevAccount = this.account

    // _type is not present in objects from realtime but we have to keep
    // it to be compatible with cozy-client's methods
    this.account = {
      _type: prevAccount._type,
      ...account
    }
    const { state } = this.account
    if (accounts.isTwoFANeeded(state) || accounts.isTwoFARetry(state)) {
      this.handleTwoFA(prevAccount)
    } else if (accounts.isLoginSuccessHandled(state)) {
      this.handleLoginSuccessHandled()
    } else if (accounts.isLoginSuccess(state)) {
      this.handleLoginSuccess()
    }
  }

  async ensureTriggerAndLaunch(client, { trigger, account, konnector }) {
    logger.info('Ensuring trigger...')
    trigger = await ensureTrigger(client, { trigger, account, konnector })
    logger.info('Trigger ensured')
    this.trigger = trigger
    this.emit(UPDATE_EVENT)
    await this.launch()
  }

  /**
   * Launches the job and sets everything up to follow execution.
   */
  async launch() {
    logger.info('Launching job...')
    this.setStatus(PENDING)

    this.account = await prepareTriggerAccount(this.client, this.trigger)
    this.realtime.subscribe(
      'updated',
      ACCOUNTS_DOCTYPE,
      this.account._id,
      this.handleAccountUpdated
    )
    this.job = await launchTrigger(this.client, this.trigger)
    this.realtime.subscribe(
      'updated',
      JOBS_DOCTYPE,
      this.job._id,
      this.handleJobUpdated.bind(this)
    )
    this.jobWatcher = watchKonnectorJob(this.client, this.job)
    logger.info(`Subscribed to ${JOBS_DOCTYPE}:${this.job._id}`)

    for (const ev of JOB_EVENTS) {
      this.jobWatcher.on(ev, () => this.triggerEvent(ev))
    }

    this.unsubscribeAllRealtime = () => {
      this.jobWatcher.unsubscribeAll()
      this.realtime.unsubscribeAll()
    }
    logger.info('Job finished...')
  }

  unwatch() {
    if (typeof this.unsubscribeAllRealtime === 'function') {
      this.unsubscribeAllRealtime()
    }
  }
}

MicroEE.mixin(KonnectorJob)

export default KonnectorJob
