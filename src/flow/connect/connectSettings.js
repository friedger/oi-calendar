import { connect } from "react-redux";
import { HIDE_SETTINGS } from "../store/ActionTypes";
import { addCalendar, addContact } from "../store/event/eventActionLazy";

export default connect(
  (state, redux) => {
    const show = state.events.showSettings;
    const addCalendarUrl = state.events.showSettingsAddCalendarUrl;
    const contacts = state.events.contacts;
    const calendars = state.events.calendars;
    return { show, contacts, calendars, addCalendarUrl };
  },
  dispatch => {
    return {
      handleHide: () => {
        dispatch({ type: HIDE_SETTINGS });
      },
      lookupContacts: contactQuery => {
        return Promise.reject("not yet implemented");
      },
      addContact: contact => {
        dispatch(addContact(contact));
      },
      deleteContacts: () => {},
      addCalendar: calendar => {
        dispatch(addCalendar(calendar));
      }
    };
  }
);
