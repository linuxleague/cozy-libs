"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _react = _interopRequireDefault(require("react"));

var _react2 = require("@testing-library/react");

var _ScanMobileActions = _interopRequireDefault(require("./ScanMobileActions"));

var _AppLike = _interopRequireDefault(require("../../../test/components/AppLike"));

var setup = function setup() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      openFilePickerModal = _ref.openFilePickerModal,
      onChangeFile = _ref.onChangeFile;

  return (0, _react2.render)( /*#__PURE__*/_react.default.createElement(_AppLike.default, null, /*#__PURE__*/_react.default.createElement(_ScanMobileActions.default, {
    openFilePickerModal: openFilePickerModal ? openFilePickerModal : undefined,
    onChangeFile: onChangeFile ? onChangeFile : undefined
  })));
};

describe('ScanMobileActions', function () {
  it('should called openFilePickerModalAction function', function () {
    var openFilePickerModalAction = jest.fn();

    var _setup = setup({
      openFilePickerModal: openFilePickerModalAction
    }),
        getByTestId = _setup.getByTestId;

    var submitButton = getByTestId('selectPicFromCozy-btn');

    _react2.fireEvent.click(submitButton);

    expect(openFilePickerModalAction).toBeCalledTimes(1);
  });
  it('should have 2 inputs with type file attribute', function () {
    var _setup2 = setup(),
        container = _setup2.container;

    var inputFileButtons = container.querySelectorAll('input[type="file"]');
    expect(inputFileButtons).toHaveLength(2);
  });
  it('should called onChangeFileAction function', function () {
    var onChangeFileAction = jest.fn();

    var _setup3 = setup({
      onChangeFile: onChangeFileAction
    }),
        getByTestId = _setup3.getByTestId;

    var takePicButton = getByTestId('takePic-btn');
    var importPicFromMobileButton = getByTestId('importPicFromMobile-btn');

    _react2.fireEvent.change(takePicButton);

    expect(onChangeFileAction).toBeCalledTimes(1);
    jest.clearAllMocks();

    _react2.fireEvent.change(importPicFromMobileButton);

    expect(onChangeFileAction).toBeCalledTimes(1);
  });
});