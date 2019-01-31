import { connect } from "react-redux";
import moment from "moment";

import { setCurrentEvent, unsetCurrentEvent } from "../store/event/eventAction";

import {
  loadGuestList,
  sendInvites,
  addEvent,
  deleteEvent,
  updateEvent
} from "../../flow/store/event/eventActionLazy";

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
  (dispatch, redux) => {
    return {
      unsetCurrentEvent: () => {
        dispatch(unsetCurrentEvent());
      },
      loadGuestList: (guests, asyncReturn) => {
        const contacts = redux.store.getState().events.contacts;
        loadGuestList(guests, contacts, asyncReturn);
      },
      updateCurrentEvent: eventDetail => {
        dispatch(setCurrentEvent(eventDetail));
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
