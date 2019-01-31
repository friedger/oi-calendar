import { SET_CURRENT_EVENT, UNSET_CURRENT_EVENT } from "../ActionTypes";

export function setCurrentEvent(eventDetail) {
  return async (dispatch, getState) => {
    dispatch({ type: SET_CURRENT_EVENT, payload: eventDetail });
  };
}

export function unsetCurrentEvent() {
  return async (dispatch, getState) => {
    dispatch({ type: UNSET_CURRENT_EVENT });
  };
}
