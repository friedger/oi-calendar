import { connect } from "react-redux";
import moment from "moment";

import { setCurrentEvent, unsetCurrentEvent } from "../store/event/eventAction";

import {
  addEvent,
  deleteEvent,
  updateEvent,
  saveAllEvents
} from "../../flow/store/event/eventActionLazy";

import {
  sendInvites,
  loadGuestList
} from "../../flow/store/event/contactActionLazy";

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
      sendInvites: (eventInfo, guests, actionType) =>
        dispatch(sendInvites(eventInfo, guests)).then(() => {
          let { allEvents } = redux.store.getState().events;
          if (actionType === "add") {
            allEvents[eventInfo.uid] = eventInfo;
          }
          dispatch(saveAllEvents(allEvents));
        }),
      deleteEvent: obj => dispatch(deleteEvent(obj)),
      addEvent: obj => {
        dispatch(addEvent(obj));
      },
      updateEvent: obj => dispatch(updateEvent(obj))
    };
  }
);
