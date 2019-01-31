import { SET_LAZY_VIEW } from "../ActionTypes";

let initialState = {};

export default function reduce(state = initialState, action = {}) {
  // console.log("LazyReducer", state);
  let newState = state;
  let { type, payload } = action;
  switch (type) {
    case SET_LAZY_VIEW:
      newState = { ...state, ...payload };
      break;
    default:
      newState = state;
      break;
  }
  return newState;
}
