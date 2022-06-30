import React, { Fragment, useCallback } from 'react'
import PropTypes from 'prop-types'
import get from 'lodash/get'
import { useHistory } from 'react-router-dom'

import { useClient } from 'cozy-client'
import makeStyles from 'cozy-ui/transpiled/react/helpers/makeStyles'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'
import List from 'cozy-ui/transpiled/react/MuiCozyTheme/List'
import ListSubheader from 'cozy-ui/transpiled/react/MuiCozyTheme/ListSubheader'
import ListItem from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import Icon from 'cozy-ui/transpiled/react/Icon'
import Divider from 'cozy-ui/transpiled/react/MuiCozyTheme/Divider'
import MuiCardMedia from 'cozy-ui/transpiled/react/CardMedia'
import { FileImageLoader } from 'cozy-ui/transpiled/react/FileImageLoader'
import Typography from 'cozy-ui/transpiled/react/Typography'

import { useScannerI18n } from '../Hooks/useScannerI18n'
import { getLinksType } from '../../utils/getLinksType'

const useStyles = makeStyles({
  root: { textIndent: '1rem' }
})

const PaperGroup = ({ allPapersByCategories }) => {
  const classes = useStyles()
  const client = useClient()
  const { isMobile } = useBreakpoints()
  const history = useHistory()
  const { t } = useI18n()
  const scannerT = useScannerI18n()

  const goPapersList = useCallback(
    category => {
      history.push({
        pathname: `/paper/files/${category}`
      })
    },
    [history]
  )


  return (
    <List>
      <ListSubheader classes={isMobile ? classes : undefined}>
        {t('PapersList.subheader')}
      </ListSubheader>
      <div className="u-pv-half">
        {allPapersByCategories.length === 0 ? (
          <Typography
            className="u-ml-1 u-mv-1"
            variant="body2"
            color="textSecondary"
          >
            {t('PapersList.empty')}
          </Typography>
        ) : (
          allPapersByCategories.map((paper, index) => {
            const category = get(paper, 'metadata.qualification.label')

            return (
              <Fragment key={paper.id}>
                <ListItem button onClick={() => goPapersList(category)}>
                  <ListItemIcon>
                    <FileImageLoader
                      client={client}
                      file={paper}
                      linkType={getLinksType(paper)}
                      render={src => (
                        <MuiCardMedia
                          component="img"
                          width={32}
                          height={32}
                          image={src}
                        />
                      )}
                      renderFallback={() => (
                        <Icon icon="file-type-image" size={32} />
                      )}
                    />
                  </ListItemIcon>
                  <ListItemText primary={scannerT(`items.${category}`)} />
                  <Icon
                    icon="right"
                    size={16}
                    color="var(--secondaryTextColor)"
                  />
                </ListItem>
                {index !== allPapersByCategories.length - 1 && (
                  <Divider variant="inset" component="li" />
                )}
              </Fragment>
            )
          })
        )}
      </div>
    </List>
  )
}

PaperGroup.propTypes = {
  allPapersByCategories: PropTypes.arrayOf(PropTypes.object)
}

export default PaperGroup
