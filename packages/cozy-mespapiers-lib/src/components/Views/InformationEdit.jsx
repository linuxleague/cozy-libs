import cx from 'classnames'
import React, { useState } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'

import { useClient } from 'cozy-client'
import { isIOS } from 'cozy-device-helper'
import Button from 'cozy-ui/transpiled/react/Buttons'
import { Dialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import Spinner from 'cozy-ui/transpiled/react/Spinner'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'

import IlluGenericInputDate from '../../assets/icons/IlluGenericInputDate.svg'
import IlluGenericInputText from '../../assets/icons/IlluGenericInputText.svg'
import { FILES_DOCTYPE } from '../../doctypes'
import { makeInputsInformationStep } from '../../helpers/makeInputsInformationStep'
import CompositeHeader from '../CompositeHeader/CompositeHeader'
import { useScannerI18n } from '../Hooks/useScannerI18n'
import {
  isInformationEditPermitted,
  updateFileMetadata
} from '../ModelSteps/Edit/helpers'
import styles from '../ModelSteps/Edit/styles.styl'
import { useCurrentEditInformations } from '../ModelSteps/Edit/useCurrentEditInformations'

const InformationEdit = () => {
  const { fileId } = useParams()
  const client = useClient()
  const { t } = useI18n()
  const { isMobile } = useBreakpoints()
  const scannerT = useScannerI18n()
  const navigate = useNavigate()

  const [value, setValue] = useState({})
  const [validInput, setValidInput] = useState({})
  const [isFocus, setIsFocus] = useState(false)
  const [isBusy, setIsBusy] = useState(false)

  const currentEditInformations = useCurrentEditInformations(
    fileId,
    'information'
  )
  const currentAttributes = currentEditInformations?.currentStep?.attributes
  const defaultValue =
    currentEditInformations?.file?.metadata?.[
      currentEditInformations?.searchParams?.metadataName
    ]
  const { Component, attrs } =
    makeInputsInformationStep(currentAttributes)[0] || {}
  const dialogTitle = currentEditInformations?.paperDef?.label
    ? scannerT(`items.${currentEditInformations.paperDef.label}`)
    : ''

  const onClose = () => {
    navigate('..')
  }

  const onConfirm = async () => {
    setIsBusy(true)
    let newMetadata = updateFileMetadata({
      file: currentEditInformations.file,
      type: currentEditInformations.currentStep.attributes[0].type,
      metadataName: currentEditInformations.searchParams.metadataName,
      value
    })

    await client
      .collection(FILES_DOCTYPE)
      .updateMetadataAttribute(fileId, newMetadata)

    navigate('..')
  }

  if (
    !currentEditInformations.isLoading &&
    !isInformationEditPermitted(currentEditInformations)
  ) {
    return <Navigate to=".." />
  }

  const fallbackIcon =
    attrs?.[0]?.type === 'date' ? IlluGenericInputDate : IlluGenericInputText

  const text = currentEditInformations.currentStep?.text
    ? t(currentEditInformations.currentStep.text)
    : null

  return (
    <Dialog
      open
      onClose={onClose}
      title={dialogTitle}
      content={
        <div
          className={cx(styles['InformationEdit-Dialog-container'], {
            'is-focused': isFocus && isIOS()
          })}
        >
          {currentEditInformations.isLoading ? (
            <Spinner size="xlarge" />
          ) : (
            <CompositeHeader
              icon={currentEditInformations.currentStep?.illustration}
              fallbackIcon={fallbackIcon}
              iconSize="medium"
              title={text}
              text={
                <div
                  className={cx('u-mt-1', {
                    'u-mh-1': !isMobile
                  })}
                >
                  {Component && (
                    <Component
                      attrs={attrs}
                      defaultValue={defaultValue}
                      setValue={setValue}
                      setValidInput={setValidInput}
                      setIsFocus={setIsFocus}
                      idx={0}
                    />
                  )}
                </div>
              }
            />
          )}
        </div>
      }
      actions={
        <Button
          label={t('common.apply')}
          onClick={onConfirm}
          fullWidth
          disabled={!validInput[0]}
          busy={isBusy}
        />
      }
    />
  )
}

export default InformationEdit
