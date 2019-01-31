import { createStore, applyMiddleware, combineReducers } from "redux";
import thunk from "redux-thunk";

import events from "./event/eventReducer";
import auth from "./auth/authReducer";
import lazy from "./lazy/lazyReducer";

export function createReducer(asyncReducers) {
  return combineReducers({
    lazy,
    auth,
    ...asyncReducers
  });
}

export function createInitialStore(initialState) {
  let store = createStore(createReducer({ events }), applyMiddleware(thunk));
  store.asyncReducers = {};
  return store;
}
