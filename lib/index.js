'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addReducer = exports.useMiddleware = exports.store = undefined;
exports.createModule = createModule;
exports.connect = connect;

var _reduxThunk = require('redux-thunk');

var _reduxThunk2 = _interopRequireDefault(_reduxThunk);

var _store = require('./store');

var _module = require('./module');

var _module2 = _interopRequireDefault(_module);

var _connector = require('./connector');

var _connector2 = _interopRequireDefault(_connector);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_store.StoreManager.useMiddleware(_reduxThunk2.default);
_store.StoreManager.buildInstance();
_connector2.default.use(_store.StoreManager);

var store = exports.store = _store.StoreManager.getInstance();

var useMiddleware = _store.StoreManager.useMiddleware,
    addReducer = _store.StoreManager.addReducer;
exports.useMiddleware = useMiddleware;
exports.addReducer = addReducer;
function createModule(name, initialState, callback) {
  var module = new _module2.default(name, initialState, store);
  var api = {
    setState: module.setState,
    getState: module.getState,
    createAction: module.createAction,
    handleAction: module.handleAction
  };

  callback.call(api, api);

  return module;
}

function connect(component, module) {
  return _connector2.default.connect(component, module);
}

exports.default = createModule;