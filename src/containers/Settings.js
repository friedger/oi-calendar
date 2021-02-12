import { connect } from 'react-redux'
import {
  initializeEvents,
  showAllCalendars,
  verifyNewCalendar,
  clearVerifyCalendar,
  enableRichNotif,
  disableRichNotif,
  saveRichNotifExcludeGuests,
  updateAllNotifEnabled,
} from '../store/event/eventActionLazy'

import {
  addCalendar,
  deleteCalendars,
  setCalendarData,
  showSettings,
} from '../store/event/calendarActionLazy'
import {
  addContact,
  deleteContacts,
  lookupContacts,
} from '../store/event/contactActionLazy'
import { uuid } from '../core/eventFN'
import Settings from '../components/Settings'

export default connect(
  (state, redux) => {
    const show = state.events.showPage === 'settings'
    const addCalendarUrl = state.events.showSettingsAddCalendarUrl
    var contacts = state.events.contacts
    const user = state.auth.user
    const {
      calendars,
      verifiedNewCalendarData,
      allNotifEnabled,
      richNotifEnabled,
      richNofifExclude,
      richNotifError,
      chatStatus,
    } = state.events
    console.log(state.events)
    return {
      show,
      contacts,
      calendars,
      addCalendarUrl,
      user,
      verifiedNewCalendarData,
      allNotifEnabled,
      richNotifEnabled,
      richNofifExclude,
      richNotifError,
      chatStatus,
    }
  },
  (dispatch, redux) => {
    return {
      showSettings: () => {
        dispatch(showSettings())
      },
      handleHide: history => {
        console.log('handle hide', history)
        dispatch(initializeEvents())
        dispatch(showAllCalendars(history))
      },
      lookupContacts: contactQuery => {
        return dispatch(lookupContacts(contactQuery))
      },
      addContact: contactFormData => {
        const username = contactFormData.username
        const contact = { username }
        dispatch(addContact(username, contact))
      },
      deleteContacts: contacts => {
        dispatch(deleteContacts(contacts))
      },
      addCalendar: calendar => {
        dispatch(addCalendar(calendar))
        dispatch(clearVerifyCalendar())
      },
      deleteCalendars: calendars => {
        dispatch(deleteCalendars(calendars))
      },
      setCalendarData: (calendar, data) => {
        dispatch(setCalendarData(calendar, data))
      },
      followContact: contact => {
        const calendar = {
          uid: uuid(),
          type: 'blockstack-user',
          name: 'public@' + contact.username,
          mode: 'read-only',
          data: {
            user: contact.username,
            src: 'public/AllEvents',
          },
        }
        dispatch(addCalendar(calendar))
      },
      unfollowContact: contact => {
        const { calendars } = redux.store.getState().events
        const calendarToDelete = calendars.find(
          c => c.name === 'public@' + contact.username
        )
        dispatch(deleteCalendars([calendarToDelete]))
      },
      verifyNewCalendar: calendar => {
        dispatch(verifyNewCalendar(calendar))
      },
      enableAllNotif: () => {
        dispatch(updateAllNotifEnabled(true))
      },
      disableAllNotif: () => {
        dispatch(updateAllNotifEnabled(false))
      },
      enableRichNotif: () => {
        dispatch(enableRichNotif())
      },
      disableRichNotif: () => {
        dispatch(disableRichNotif())
      },
      saveRichNotifExcludeGuests: guests => {
        dispatch(saveRichNotifExcludeGuests(guests))
      },
    }
  }
)(Settings)
