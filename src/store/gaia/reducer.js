import { SET_FILES } from '../ActionTypes'

export let initialState = {
  files: {},
}

export default function reduce(state = initialState, action = {}) {
  const { type, payload } = action
  let newState = state
  switch (type) {
    case SET_FILES:
      newState = { ...state, files: payload.files }
      break
    default:
      break
  }
  return newState
}
