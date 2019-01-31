import { connect } from "react-redux";
import EventCalendar from "../components/event-calendar/EventCalendar";

import { UNSET_CURRENT_EVENT, SET_CURRENT_EVENT } from "../store/ActionTypes";

export default connect(
  (state, redux) => {
    const { events, auth } = state;
    const { EventDetails } = state.lazy;
    const signedIn = !!auth.user;
    console.log("[CALENDAR_REDUX]", events);
    const { currentEvent, currentEventType } = events || {};
    let eventModal;
    if (currentEvent) {
      const eventType = currentEventType || "view"; // "add", "edit", "read-only"
      const eventInfo = currentEvent;
      eventModal = { eventType, eventInfo };
    }

    return {
      events,
      signedIn,
      views: {
        EventDetails
      },
      eventModal
    };
  },
  dispatch => {
    return {
      initializeEvents: () => {},
      unsetCurrentEvent: () => {
        dispatch({ type: UNSET_CURRENT_EVENT });
      },
      setEventModal: eventModal => {
        console.log("[setEventModal]", eventModal);
        const {
          eventType: currentEventType,
          eventInfo: currentEvent
        } = eventModal;
        dispatch({
          type: SET_CURRENT_EVENT,
          payload: { currentEvent, currentEventType }
        });
      }
    };
  }
)(EventCalendar);
