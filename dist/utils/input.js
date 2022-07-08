"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeConstraintsOfInput = exports.checkConstraintsOfIinput = void 0;

var _cozyLogger = _interopRequireDefault(require("cozy-logger"));

/**
 * @typedef {object} MakeConstraintsOfInputParam
 * @property {'text'|'number'} [type] - A string specifying the type of input
 * @property {boolean} [required] - Indicates that the user must specify a value for the input
 * @property {number} [minLength] - Defines the minimum number of characters can enter into the input
 * @property {number} [maxLength] - Defines the maximum number of characters can enter into the input
 */

/**
 * Make type and length properties
 * @param {MakeConstraintsOfInputParam} attrs - Definition of type & length of the input
 * @example
 * // For make input number with contraint length to 0 or 12
 * makeConstraintsOfInput({ type: 'number', minLength: 12, maxLength: 12 })
 * // For make input text with no contraint length
 * makeConstraintsOfInput()
 * // For make input number with contraint length to 12
 * makeConstraintsOfInput({ type: 'number', required: true, minLength: 12, maxLength: 12 })
 *
 * @returns {{ inputType: string, expectedLength: { min: number, max: number }, isRequired: boolean }}
 */
var makeConstraintsOfInput = function makeConstraintsOfInput(attrs) {
  var _mask$replace, _ref2, _ref3;

  var _ref = attrs || {},
      _ref$type = _ref.type,
      type = _ref$type === void 0 ? '' : _ref$type,
      _ref$required = _ref.required,
      required = _ref$required === void 0 ? false : _ref$required,
      mask = _ref.mask;

  var maskLength = mask === null || mask === void 0 ? void 0 : (_mask$replace = mask.replace(/\s/g, '')) === null || _mask$replace === void 0 ? void 0 : _mask$replace.length;
  var minLength = (_ref2 = maskLength !== null && maskLength !== void 0 ? maskLength : attrs === null || attrs === void 0 ? void 0 : attrs.minLength) !== null && _ref2 !== void 0 ? _ref2 : null;
  var maxLength = (_ref3 = maskLength !== null && maskLength !== void 0 ? maskLength : attrs === null || attrs === void 0 ? void 0 : attrs.maxLength) !== null && _ref3 !== void 0 ? _ref3 : null;
  var acceptedTypes = ['number', 'text'];
  var result = {
    inputType: '',
    expectedLength: {
      min: minLength,
      max: maxLength
    },
    isRequired: required
  };

  if (!acceptedTypes.includes(type.toLowerCase())) {
    (0, _cozyLogger.default)('warn', "'type' in 'attributes' property is not defined or unexpected, 'type' set to ".concat(acceptedTypes[1], " by default'"));
    result.inputType = acceptedTypes[1];
  } else result.inputType = type;

  return result;
};
/**
 * @param {number} valueLength - Length of input value
 * @param {number} expectedLength - Expected length of the input value
 * @param {boolean} isRequired - If value is required
 * @returns {boolean}
 */


exports.makeConstraintsOfInput = makeConstraintsOfInput;

var checkConstraintsOfIinput = function checkConstraintsOfIinput(valueLength, expectedLength, isRequired) {
  var min = expectedLength.min,
      max = expectedLength.max;
  return [valueLength !== 0 || !isRequired, valueLength === 0 || min == null || valueLength >= min, valueLength === 0 || max == null || valueLength <= max].every(Boolean);
};

exports.checkConstraintsOfIinput = checkConstraintsOfIinput;