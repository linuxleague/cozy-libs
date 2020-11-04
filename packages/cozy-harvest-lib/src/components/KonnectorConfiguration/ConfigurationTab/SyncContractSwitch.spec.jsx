import React from 'react'
import { DumbSyncContractSwitch } from './SyncContractSwitch'
import { render, fireEvent, act } from '@testing-library/react'
import { models } from 'cozy-client'

import { findKonnectorPolicy } from '../../../konnector-policies'
import { trackerShim } from '../../hoc/tracking'

jest.mock('../../../konnector-policies', () => ({
  findKonnectorPolicy: jest.fn()
}))

const accountModels = models.account

describe('SyncContractSwitch', () => {
  const mockAccount = {
    relationships: {
      contracts: {
        data: [
          { _id: 'contract-1', metadata: { imported: true } },
          { _id: 'contract-2', metadata: { imported: false } }
        ]
      }
    }
  }
  const mockContract1 = { _id: 'contract-1' }
  const mockContract2 = { _id: 'contract-2' }

  const setup = ({ account, contract }) => {
    const mockClient = {
      save: jest.fn()
    }
    const root = render(
      <DumbSyncContractSwitch
        client={mockClient}
        tracker={trackerShim}
        accountCol={{ data: account, fetchStatus: 'loaded' }}
        contract={contract}
        t={x => x}
        switchProps={{
          inputProps: { 'data-testid': 'switch' }
        }}
      />
    )
    return { root, client: mockClient }
  }

  beforeEach(() => {
    jest.spyOn(accountModels, 'setContractSyncStatusInAccount')
    jest.spyOn(accountModels, 'getContractSyncStatusFromAccount')
  })

  it('should correctly render (contract synced)', () => {
    const { root } = setup({ account: mockAccount, contract: mockContract1 })
    const input = root.getByTestId('switch')
    expect(input.checked).toBe(true)
  })

  it('should correctly render (contract is not synced)', () => {
    const { root } = setup({ account: mockAccount, contract: mockContract2 })
    const input = root.getByTestId('switch')
    expect(input.checked).toBe(false)
  })

  describe('unexisting contract', () => {
    beforeEach(() => {
      jest.spyOn(console, 'warn').mockImplementation(() => {})
    })

    afterEach(() => {
      // eslint-disable-next-line no-console
      console.warn.mockRestore()
    })

    it('should correctly render (contract does not exist)', () => {
      const unexistingContract = { ...mockContract2, _id: 'contract-3' }
      const { root } = setup({
        account: mockAccount,
        contract: unexistingContract
      })
      expect(root.queryByTestId('switch')).toBe(null)
    })
  })

  it('should correctly behave', async () => {
    const setSyncProm = Promise.resolve()
    const setSync = jest.fn().mockReturnValue(setSyncProm)
    findKonnectorPolicy.mockReturnValue({ setSync })
    const { root, client } = setup({
      account: mockAccount,
      contract: mockContract2
    })
    act(() => {
      const input = root.getByTestId('switch')
      fireEvent.click(input)
    })

    expect(setSync).toHaveBeenCalledWith(
      expect.objectContaining({
        syncStatus: true
      })
    )
    await setSyncProm
    expect(client.save).toHaveBeenCalledWith(
      expect.objectContaining({
        relationships: {
          contracts: {
            data: [
              { _id: 'contract-1', metadata: { imported: true } },
              { _id: 'contract-2', metadata: { imported: true } }
            ]
          }
        }
      })
    )
  })
})