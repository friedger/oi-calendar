import { SET_CALENDARS } from "../ActionTypes";

import { fetchCalendars, publishCalendars } from "../../io/event";
import { defaultCalendars } from "../../io/eventDefaults";

function asAction_setCalendars(calendars) {
  return { type: SET_CALENDARS, payload: { calendars } };
}

export function initializeCalendars() {
  return async (dispatch, getState) => {
    return fetchCalendars().then(calendars => {
      if (!calendars) {
        calendars = defaultCalendars;
        // :Q: why save the default instead of waiting for a change?
        publishCalendars(calendars);
      }
      dispatch(asAction_setCalendars(calendars));
      return calendars;
    });
  };
}

// ################
// In Settings
// ################
export function addCalendar(calendar) {
  return async (dispatch, getState) => {
    fetchCalendars().then(calendars => {
      // TODO check for duplicates
      calendars.push(calendar);
      publishCalendars(calendars);
      dispatch(asAction_setCalendars(calendars));
    });
  };
}

export function deleteCalendars(deleteList) {
  return async (dispatch, getState) => {
    fetchCalendars().then(calendars => {
      const uids = deleteList.map(d => d.uid);
      const newCalendars = calendars.filter(d => {
        return !uids.includes(d.uid);
      });
      publishCalendars(newCalendars);
      dispatch(asAction_setCalendars(newCalendars));
    });
  };
}
