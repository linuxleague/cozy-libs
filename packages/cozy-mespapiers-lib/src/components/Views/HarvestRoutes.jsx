import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import { useQuery } from 'cozy-client'
import { Routes } from 'cozy-harvest-lib'
import datacardOptions from 'cozy-harvest-lib/dist/datacards/datacardOptions'

import {
  buildTriggersQueryByConnectorSlug,
  buildConnectorsQueryById
} from '../../helpers/queries'
import ExtraContent from '../Harvest/CannotConnectModal/ExtraContent'

const HarvestRoutes = () => {
  const { connectorSlug } = useParams()
  const navigate = useNavigate()

  const queryTriggers = buildTriggersQueryByConnectorSlug(
    connectorSlug,
    Boolean(connectorSlug)
  )
  const { data: triggers } = useQuery(
    queryTriggers.definition,
    queryTriggers.options
  )
  const trigger = triggers?.[0]

  const queryKonnector = buildConnectorsQueryById(
    `io.cozy.konnectors/${connectorSlug}`,
    Boolean(trigger)
  )
  const { data: konnectors } = useQuery(
    queryKonnector.definition,
    queryKonnector.options
  )
  const konnector = konnectors?.[0]

  const konnectorWithTriggers = konnector
    ? { ...konnector, triggers: { data: triggers } }
    : undefined

  return (
    <Routes
      konnector={konnectorWithTriggers}
      konnectorSlug={connectorSlug}
      datacardOptions={datacardOptions}
      onDismiss={() => navigate('..')}
      ComponentsProps={{
        CannotConnectModal: { extraContent: <ExtraContent /> }
      }}
    />
  )
}

export default HarvestRoutes
