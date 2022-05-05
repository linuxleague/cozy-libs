'use strict'
import React from 'react'
import { fireEvent, render } from '@testing-library/react'
import '@testing-library/jest-dom'

import AppLike from '../../../../test/components/AppLike'
import InputTextAdapter from './InputTextAdapter'

jest.mock('cozy-client/dist/models/document/locales', () => ({
  getBoundT: jest.fn(() => jest.fn())
}))

const mockAttrs = ({
  type = '',
  maxLength = 0,
  minLength = 0,
  required = false,
  mask = null,
  maskPlaceholder = '_'
} = {}) => {
  return {
    name: 'name01',
    inputLabel: 'PaperJSON.IDCard.number.inputLabel',
    required,
    minLength,
    maxLength,
    type,
    mask,
    maskPlaceholder
  }
}

const setup = ({ attrs = mockAttrs(), defaultValue = '' } = {}) => {
  return render(
    <AppLike>
      <InputTextAdapter
        attrs={attrs}
        defaultValue={defaultValue}
        setValue={jest.fn()}
        setValidInput={jest.fn()}
        setIsFocus={jest.fn()}
        idx={0}
      />
    </AppLike>
  )
}

describe('InputTextAdapter components:', () => {
  describe('With "mask" attribute', () => {
    it('should have the "minlength" property at 0', () => {
      const { getByTestId } = setup({ attrs: { minLength: 2, mask: '** **' } })
      const input = getByTestId('InputMask-TextField-input')

      expect(input).not.toHaveAttribute('minLength')
    })

    it('should have the "maxlength" property equal to max length default', () => {
      const { getByTestId } = setup({
        attrs: { minLength: 2, maxLength: 5, mask: '** **' }
      })
      const input = getByTestId('InputMask-TextField-input')

      expect(input).not.toHaveAttribute('maxLength')
    })

    it('should have a correctly formatted value', () => {
      const { getByTestId } = setup({
        attrs: { mask: '** **' }
      })
      const input = getByTestId('InputMask-TextField-input')
      fireEvent.change(input, { target: { value: 'text value' } })

      expect(input).toHaveAttribute('value', 'te xt')
    })

    it('should have a value with text and numbers', () => {
      const { getByTestId } = setup({
        attrs: { mask: '****' }
      })
      const input = getByTestId('InputMask-TextField-input')
      fireEvent.change(input, { target: { value: 'aB12' } })

      expect(input).toHaveAttribute('value', 'aB12')
    })

    it('should have no value if you type letters with the "mask" property accepts only numbers', () => {
      const { getByTestId } = setup({
        attrs: { mask: '9999' }
      })
      const input = getByTestId('InputMask-TextField-input')
      fireEvent.change(input, { target: { value: 'text' } })

      expect(input).toHaveAttribute('value', '')
    })

    it('should have no value if you type numbers with the "mask" property accepts only letters', () => {
      const { getByTestId } = setup({
        attrs: { mask: 'aaaa' }
      })
      const input = getByTestId('InputMask-TextField-input')
      fireEvent.change(input, { target: { value: '1234' } })

      expect(input).toHaveAttribute('value', '')
    })

    it('should have a "maskPlaceholder" defined to "_" by default', () => {
      const { getByTestId } = setup({
        attrs: { mask: '**' }
      })
      const input = getByTestId('InputMask-TextField-input')
      fireEvent.change(input, { target: { value: 'a' } })

      expect(input).toHaveAttribute('value', 'a_')
    })

    it('should have a "-" like "maskPlaceholder"', () => {
      const { getByTestId } = setup({
        attrs: { mask: '**', maskPlaceholder: '-' }
      })
      const input = getByTestId('InputMask-TextField-input')
      fireEvent.change(input, { target: { value: 'a' } })

      expect(input).toHaveAttribute('value', 'a-')
    })

    it('should have the "inputMode" property at "numeric" if mask cannot contain text', () => {
      const { getByTestId } = setup({
        attrs: { type: 'text', mask: '9999' }
      })
      const input = getByTestId('InputMask-TextField-input')

      expect(input).toHaveAttribute('inputMode', 'numeric')
    })

    it('should have the "inputMode" property at "text" if mask can contain text', () => {
      const { getByTestId } = setup({
        attrs: { type: 'number', mask: '99aa' }
      })
      const input = getByTestId('InputMask-TextField-input')

      expect(input).toHaveAttribute('inputMode', 'text')
    })
  })

  describe('Without "mask" attribute', () => {
    it('should have the "minlength" property at 2', () => {
      const { getByTestId } = setup({ attrs: { minLength: 2 } })
      const input = getByTestId('TextField-input')

      expect(input).toHaveAttribute('minLength', '2')
    })

    it('should have the "maxlength" property at 5', () => {
      const { getByTestId } = setup({ attrs: { maxLength: 5 } })
      const input = getByTestId('TextField-input')

      expect(input).toHaveAttribute('maxLength', '5')
    })

    it('should have the "inputMode" property at "numeric"', () => {
      const { getByTestId } = setup({ attrs: { type: 'number' } })
      const input = getByTestId('TextField-input')

      expect(input).toHaveAttribute('inputMode', 'numeric')
    })

    it('should have the "inputMode" property at "text"', () => {
      const { getByTestId } = setup({ attrs: { type: 'text' } })
      const input = getByTestId('TextField-input')

      expect(input).toHaveAttribute('inputMode', 'text')
    })

    it('should have the "inputMode" property at "text" by default', () => {
      const { getByTestId } = setup({ attrs: { type: '' } })
      const input = getByTestId('TextField-input')

      expect(input).toHaveAttribute('inputMode', 'text')
    })
  })
})
