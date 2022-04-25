import { Q, fetchPolicies } from 'cozy-client'

import { CONTACTS_DOCTYPE, FILES_DOCTYPE, SETTINGS_DOCTYPE } from '../doctypes'

const defaultFetchPolicy = fetchPolicies.olderThan(30 * 1000)

export const getAllQualificationLabel = papersDefinitions => {
  const papersLabel = papersDefinitions.map(paper => paper.label)
  return {
    definition: () =>
      Q(FILES_DOCTYPE)
        .where({
          'metadata.qualification.label': {
            $in: papersLabel
          }
        })
        .partialIndex({
          type: 'file',
          trashed: false
        })
        .indexFields(['metadata.qualification.label']),
    options: {
      as: `getAllQualificationLabel`,
      fetchPolicy: defaultFetchPolicy
    }
  }
}

export const getPapersByLabel = label => ({
  definition: () =>
    Q(FILES_DOCTYPE)
      .where({
        'metadata.qualification': {
          label: label
        }
      })
      .partialIndex({
        type: 'file',
        trashed: false
      })
      .indexFields(['created_at', 'metadata.qualification'])
      .sortBy([{ created_at: 'desc' }]),
  options: {
    as: `getPapersByLabel:${label}`,
    fetchPolicy: defaultFetchPolicy
  }
})

export const getOnboardingStatus = {
  definition: () => Q(SETTINGS_DOCTYPE),
  options: {
    as: `getOnboardingStatus`,
    fetchPolicy: fetchPolicies.noFetch()
  }
}

export const getContactByIds = (ids = []) => ({
  definition: () => Q(CONTACTS_DOCTYPE).getByIds(ids),
  options: {
    as: `getContactByIds/${ids.join('')}`,
    fetchPolicy: defaultFetchPolicy
  }
})