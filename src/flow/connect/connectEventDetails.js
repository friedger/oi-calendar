import { connect } from "react-redux";
import moment from "moment";
import { SET_CURRENT_EVENT } from "../../flow/store/ActionTypes";

import {
  loadGuestList,
  sendInvites,
  addEvent,
  deleteEvent,
  updateEvent
} from "../../flow/store/event/eventAction";

const eventDefaults = {
  start: moment(),
  end: moment(),
  allDay: false,
  hexColor: "#265985"
};

export default connect(
  (state, redux) => {
    console.log("[ConnectedEventDetails]", state);
    const { GuestList } = state.lazy;
    const { currentEvent, currentEventType } = state.events;
    const inviteError = state.events.inviteError;
    const inviteSuccess = state.events.inviteSuccess;

    return {
      inviteError,
      inviteSuccess,
      views: { GuestList },
      eventDetail: Object.assign({}, eventDefaults, currentEvent),
      eventType: currentEventType
    };
  },
  dispatch => {
    return {
      loadGuestList: (guests, details) => {
        console.log("[loadGuestList]", guests, details);
        dispatch(loadGuestList(guests, details));
      },
      updateCurrentEvent: eventDetail => {
        dispatch({ type: SET_CURRENT_EVENT, payload: eventDetail });
      },
      sendInvites: (details, guests, eventType) =>
        dispatch(sendInvites(details, guests, eventType)),
      deleteEvent: obj => dispatch(deleteEvent(obj)),
      addEvent: obj => {
        dispatch(addEvent(obj));
      },
      updateEvent: obj => dispatch(updateEvent(obj))
    };
  }
);
