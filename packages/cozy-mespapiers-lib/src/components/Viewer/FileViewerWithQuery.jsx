import React from 'react'

import { useQuery, useClient } from 'cozy-client'
import { SharingProvider } from 'cozy-sharing/dist/SharingProvider'

import { buildViewerFileQuery } from './queries'
import FileViewerLoading from './FileViewerLoading'
import FilesViewer from './FilesViewer'

import 'cozy-sharing/dist/stylesheet.css'

const FilesViewerWithQuery = props => {
  const { history, match } = props
  const client = useClient()

  const currentFileId = match?.params?.fileId ?? null
  const currentFileTheme = match?.params?.fileTheme
  const buildedFilesQuery = buildViewerFileQuery(currentFileId)
  const filesQuery = useQuery(
    buildedFilesQuery.definition,
    buildedFilesQuery.options
  )

  const handleClose = () => {
    return history.length > 0
      ? history.goBack()
      : history.push(`/paper/files/${currentFileTheme}`)
  }

  if (filesQuery.data?.length > 0) {
    return (
      <SharingProvider
        client={client}
        doctype="io.cozy.files"
        documentType="Files"
      >
        <FilesViewer
          fileId={currentFileId}
          files={filesQuery.data}
          filesQuery={filesQuery}
          onClose={handleClose}
          onChange={fileId => history.push(`/paper/file/${fileId}`)}
        />
      </SharingProvider>
    )
  } else {
    return <FileViewerLoading />
  }
}

export default FilesViewerWithQuery
