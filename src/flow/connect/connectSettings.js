import { connect } from "react-redux";
import { HIDE_SETTINGS } from "../store/ActionTypes";
import {
  addCalendar,
  deleteCalendars
} from "../store/event/calendarActionLazy";
import { addContact, deleteContacts } from "../store/event/contactActionLazy";

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
      deleteContacts: contacts => {
        dispatch(deleteContacts(contacts));
      },
      addCalendar: calendar => {
        dispatch(addCalendar(calendar));
      },
      deleteCalendars: calendars => {
        dispatch(deleteCalendars(calendars));
      }
    };
  }
);
