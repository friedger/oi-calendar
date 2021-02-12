import {
  SET_EVENTS,
  USER,
  SET_CONTACTS,
  SET_INVITE_SEND_STATUS,
  INVITES_SENT_OK,
  INVITES_SENT_FAIL,
  SET_CURRENT_GUESTS,
  SET_CURRENT_EVENT,
  UNSET_CURRENT_EVENT,
  INITIALIZE_CHAT,
  SHOW_SETTINGS,
  HIDE_SETTINGS,
  SHOW_SETTINGS_ADD_CALENDAR,
  SET_CALENDARS,
  SHOW_MY_PUBLIC_CALENDAR,
  SHOW_ALL_CALENDARS,
  SET_PUBLIC_CALENDAR_EVENTS,
  SHOW_INSTRUCTIONS,
  AUTH_SIGN_OUT,
  UNSET_CURRENT_INVITES,
  SET_LOADING_CALENDARS,
  SET_ERROR,
  CREATE_CONFERENCING_ROOM,
  REMOVE_CONFERENCING_ROOM,
  VERIFY_NEW_CALENDAR,
  SHOW_FILES,
  SET_RICH_NOTIF_ENABLED,
  SET_RICH_NOTIF_ERROR,
  SET_RICH_NOTIF_EXCLUDE_GUESTS,
  SET_CHAT_STATUS,
  SET_REMINDERS_INFO_REQUEST,
  SET_ALL_NOTIF_ENABLED,
} from '../ActionTypes'

let initialState = {
  allEvents: [],
  calendars: [],
  contacts: [],
  user: '',
  verifiedNewCalendarData: {
    status: '',
  },
}

export default function reduce(state = initialState, action = {}) {
  console.log('EventReducer', action)
  const { type, payload } = action
  let newState = state
  switch (type) {
    case INITIALIZE_CHAT:
      newState = { ...state, userSessionChat: payload }
      break

    case USER:
      newState = { ...state, user: action.user }
      break

    case SET_CONTACTS:
      newState = { ...state, contacts: payload }
      break

    case SET_EVENTS:
      newState = { ...state, allEvents: action.allEvents }
      break

    case SET_CURRENT_EVENT:
      console.log('SET_CURRENT_EVENT', payload)
      newState = {
        ...state,
        currentEvent: payload.currentEvent,
      }
      if (payload.hasOwnProperty('currentEventType')) {
        newState.currentEventType = payload.currentEventType
      }
      if (payload.hasOwnProperty('currentEventUid')) {
        newState.currentEventUid = payload.currentEventUid
      }
      break

    case UNSET_CURRENT_EVENT:
      newState = {
        ...state,
        currentEvent: undefined,
        currentEventType: undefined,
        currentEventUid: undefined,
        currentGuests: undefined,
        inviteStatus: undefined,
        inviteSuccess: undefined,
        inviteError: undefined,
      }
      break
    case SET_INVITE_SEND_STATUS:
      console.log('SET_INVITE_SEND_STATUS')
      newState = {
        ...state,
        inviteStatus: payload.status,
      }
      break
    case INVITES_SENT_OK:
      console.log('INVITES_SENT_OK')
      newState = {
        ...state,
        currentEvent: undefined,
        currentEventType: undefined,
        currentGuests: undefined,
        inviteStatus: undefined,
        inviteSuccess: true,
        inviteError: undefined,
      }
      break

    case INVITES_SENT_FAIL:
      console.log('INVITES_SENT_FAIL')
      newState = {
        ...state,
        currentEvent: payload.eventInfo,
        currentEventType: payload.eventType,
        inviteStatus: undefined,
        inviteSuccess: false,
        inviteError: payload.error,
      }
      break
    case UNSET_CURRENT_INVITES:
      newState = {
        ...state,
        inviteSuccess: undefined,
        inviteError: undefined,
      }
      break

    case SET_CURRENT_GUESTS:
      newState = {
        ...state,
        currentGuests: payload.profiles,
        inviteSuccess: undefined,
        inviteError: undefined,
      }
      break

    case SHOW_SETTINGS:
      newState = {
        ...state,
        showPage: 'settings',
        myPublicCalendar: undefined,
        myPublicCalendarIcsUrl: undefined,
        publicCalendar: undefined,
        publicCalendarEvents: undefined,
      }
      break

    case SHOW_SETTINGS_ADD_CALENDAR:
      newState = {
        ...state,
        showPage: 'settings',
        myPublicCalendar: undefined,
        myPublicCalendarIcsUrl: undefined,
        publicCalendar: undefined,
        publicCalendarEvents: undefined,
        showSettingsAddCalendarUrl: payload.url,
      }
      break

    case HIDE_SETTINGS:
      newState = { ...state, showPage: 'all' }
      break
    case SET_REMINDERS_INFO_REQUEST:
      newState = { ...state, showRemindersInfo: payload.show }
      break
    case SET_CALENDARS:
      newState = { ...state, calendars: payload }
      break
    case SHOW_MY_PUBLIC_CALENDAR:
      newState = {
        ...state,
        myPublicCalendar: payload.name,
        myPublicCalendarIcsUrl: payload.icsUrl,
        publicCalendar: undefined,
        publicCalendarEvents: undefined,
        showPage: 'public',
      }
      break
    case SHOW_ALL_CALENDARS:
      newState = {
        ...state,
        myPublicCalendar: undefined,
        myPublicCalendarIcsUrl: undefined,
        publicCalendar: undefined,
        publicCalendarEvents: undefined,
        showPage: 'all',
      }
      break
    case SET_PUBLIC_CALENDAR_EVENTS:
      newState = {
        ...state,
        myPublicCalendar: undefined,
        myPublicCalendarIcsUrl: undefined,
        publicCalendarEvents: payload.allEvents,
        publicCalendar: payload.calendar.name,
      }
      break
    case SET_LOADING_CALENDARS:
      const currentIndex = state.currentCalendarIndex || 0
      const currentCalendarIndex =
        payload.index > currentIndex ? payload.index : currentIndex
      const done = payload.index >= payload.length
      newState = {
        ...state,
        currentCalendarIndex: done ? undefined : currentCalendarIndex,
        currentCalendarLength: done ? undefined : payload.length,
      }
      break
    case SHOW_INSTRUCTIONS:
      newState = {
        ...state,
        showInstructions: { general: payload.show },
      }
      break
    case SHOW_FILES:
      newState = {
        ...state,
        showFiles: { all: action.payload.show },
        showPage: 'files',
      }
      break
    case AUTH_SIGN_OUT:
      newState = initialState
      break
    case SET_ERROR:
      newState = {
        ...state,
        currentError: payload,
      }
      break
    case CREATE_CONFERENCING_ROOM:
      console.log('CREATE_CONFERENCING_ROOM', payload)
      if (payload.status === 'added') {
        newState = {
          ...state,
          addingConferencing: false,
          currentEvent: Object.assign({}, state.currentEvent, {
            url: payload.url,
          }),
        }
      } else {
        newState = {
          ...state,
          addingConferencing: payload.status === 'adding',
        }
      }
      break
    case REMOVE_CONFERENCING_ROOM:
      console.log('REMOVE_CONFERENCING_ROOM', payload)
      if (payload.status === 'removed') {
        newState = {
          ...state,
          removingConferencing: false,
          currentEvent: Object.assign({}, state.currentEvent, {
            url: null,
          }),
        }
      } else {
        newState = {
          ...state,
          removingConferencing: payload.status === 'removing',
        }
      }
      break
    case VERIFY_NEW_CALENDAR:
      newState = {
        ...state,
        verifiedNewCalendarData: payload,
      }
      break
    case SET_ALL_NOTIF_ENABLED:
      newState = {
        ...state,
        allNotifEnabled: payload.isEnabled,
      }
      break
    case SET_RICH_NOTIF_ERROR:
      newState = {
        ...state,
        richNotifError: payload.error,
      }
      break
    case SET_RICH_NOTIF_ENABLED:
      newState = {
        ...state,
        richNotifEnabled: payload.isEnabled,
        richNotifError: payload.error,
      }
      break
    case SET_RICH_NOTIF_EXCLUDE_GUESTS:
      newState = {
        ...state,
        richNofifExclude: payload.guests,
      }
      break
    case SET_CHAT_STATUS:
      newState = {
        ...state,
        chatStatus: payload.status,
      }
      break
    default:
      newState = state
      break
  }

  return newState
}
