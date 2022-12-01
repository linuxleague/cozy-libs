import React from 'react'
import { ShareButton } from './ShareButton'
import { SharedRecipients } from './SharedRecipients'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'
import SharingContext from './context'
import Grid from 'cozy-ui/transpiled/react/MuiCozyTheme/Grid'
import Skeleton from 'cozy-ui/transpiled/react/Skeleton'

export const ShareButtonWithRecipients = ({ docId, onClick, ...props }) => {
  const { isMobile } = useBreakpoints()

  return (
    <SharingContext.Consumer>
      {({ allLoaded }) => {
        return allLoaded ? (
          <Grid container alignItems="center" className="u-w-auto">
            {!isMobile && (
              <Grid item>
                <SharedRecipients docId={docId} onClick={onClick} size={32} />
              </Grid>
            )}
            <Grid item>
              <ShareButton docId={docId} onClick={onClick} {...props} />
            </Grid>
          </Grid>
        ) : (
          <Skeleton width={120} animation="wave" />
        )
      }}
    </SharingContext.Consumer>
  )
}