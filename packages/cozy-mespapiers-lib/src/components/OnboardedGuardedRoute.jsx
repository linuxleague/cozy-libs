import React, { useEffect } from 'react'
import {
  Navigate,
  Outlet,
  useLocation,
  useSearchParams
} from 'react-router-dom'

import { useQuery, hasQueryBeenLoaded, useClient } from 'cozy-client'
import log from 'cozy-logger'
import Spinner from 'cozy-ui/transpiled/react/Spinner'

import { useOnboarding } from './Hooks/useOnboarding'
import { SETTINGS_DOCTYPE } from '../doctypes'
import { getAppSettings } from '../helpers/queries'

const OnboardedGuardedRoute = () => {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { OnboardingComponent } = useOnboarding()
  const client = useClient()

  const skipOnboarding = searchParams.get('skipOnboarding') !== null
  const isOnboardingPage = location.pathname === '/paper/onboarding'

  const { data: settingsData, ...settingsQuery } = useQuery(
    getAppSettings.definition,
    getAppSettings.options
  )

  useEffect(() => {
    const setOnboardedTrue = async () => {
      try {
        await client.save({
          ...settingsData[0],
          onboarded: true,
          _type: SETTINGS_DOCTYPE
        })
      } catch (error) {
        log(
          'error',
          'Error when saving settings in OnboardedGuardedRoute',
          error
        )
      }
    }

    if (
      skipOnboarding &&
      settingsData?.length > 0 &&
      !settingsData[0].onboarded
    ) {
      setOnboardedTrue()
    }
  }, [client, settingsData, skipOnboarding])

  if (!hasQueryBeenLoaded(settingsQuery)) {
    return (
      <Spinner
        size="xxlarge"
        className="u-flex u-flex-justify-center u-mt-2 u-h-5"
      />
    )
  }

  const onboarded = settingsData?.[0]?.onboarded

  const isAlreadyOnboarded =
    (isOnboardingPage && onboarded === true) ||
    (isOnboardingPage && !OnboardingComponent)

  const isNotOnboarded =
    !isOnboardingPage && onboarded !== true && OnboardingComponent

  if (skipOnboarding || isAlreadyOnboarded) {
    return <Navigate to="/paper" replace />
  }

  if (isNotOnboarded) {
    return <Navigate to="onboarding" replace />
  }

  return <Outlet />
}

export default OnboardedGuardedRoute
