import queryString from 'query-string'
import {
  isUserSignedIn,
  isSignInPending,
  handlePendingSignIn,
  loadUserData,
} from 'blockstack'

import {
  AUTH_CONNECTED,
  AUTH_DISCONNECTED,
  SET_EVENTS,
  USER,
  INITIALIZE_CHAT,
  SHOW_MY_PUBLIC_CALENDAR,
  SHOW_ALL_CALENDARS,
  SET_PUBLIC_CALENDAR_EVENTS,
  SHOW_INSTRUCTIONS,
  SET_LOADING_CALENDARS,
  SET_ERROR,
} from '../ActionTypes'

import { defaultEvents } from '../../io/eventDefaults'
import { createSessionChat } from '../../io/chat'
import { uuid } from '../../io/eventFN'

import {
  saveEvents,
  publishEvents,
  handleIntentsInQueryString,
  updatePublicEvent,
  removePublicEvent,
  loadPublicCalendar,
  savePreferences,
  fetchPreferences,
  fetchIcsUrl,
  importCalendarEvents,
} from '../../io/event'
import { initializeContactData } from './contactActionLazy'
import {
  initializeCalendars,
  showSettingsAddCalendar,
} from './calendarActionLazy'

import { setCurrentEvent } from './eventAction'

// #########################
// Chat
// #########################

function initializeChatAction(chat) {
  return { type: INITIALIZE_CHAT, payload: chat }
}

export function initializeChat() {
  return async (dispatch, getState) => {
    let chat = createSessionChat()
    dispatch(initializeChatAction(chat))
  }
}

// ################
// LOAD USER DATA
// ################

function authenticatedAction(userData) {
  return { type: AUTH_CONNECTED, user: userData }
}

function disconnectedAction() {
  return { type: AUTH_DISCONNECTED }
}

function userAction(userData) {
  return { type: USER, user: userData }
}

function setEventsAction(allEvents) {
  return { type: SET_EVENTS, allEvents }
}

function initializeQueryString(query, username) {
  function eventFromIntent(username) {
    return (title, start, end, via) => {
      const eventInfo = {}
      eventInfo.title = title || 'New Event'
      eventInfo.start = start != null ? new Date(start) : new Date()
      eventInfo.end = end != null ? new Date(end) : null
      eventInfo.owner = via != null ? via : username
      return eventInfo
    }
  }
  return (dispatch, getState) => {
    handleIntentsInQueryString(
      query,
      eventFromIntent(username),
      eventInfo => {
        dispatch(setCurrentEvent(eventInfo, username ? 'add' : 'view'))
      },
      eventInfo => dispatch(setCurrentEvent(eventInfo, 'add')),
      url => dispatch(showSettingsAddCalendar(url)),
      name => dispatch(viewPublicCalendar(name))
    )
  }
}

export function initializeEvents() {
  return (dispatch, getState) => {
    dispatch(initializeCalendars())
      .then(calendars => {
        dispatch(setLoadingCalendars(0, calendars.length))
        const user = getState().auth.user
        const allEventsPromise = loadCalendarEvents(calendars, user, dispatch)
        return allEventsPromise
      })
      .then(allEvents => {
        dispatch(setLoadingCalendars(0, 0))
        dispatch(setEventsAction(allEvents))
      })
  }
}

export function initializeLazyActions() {
  const query = window.location.search
  return async (dispatch, getState) => {
    if (isUserSignedIn()) {
      console.log('is signed in')
      const userData = loadUserData()
      dispatch(authenticatedAction(userData))
      dispatch(userAction(userData))
      dispatch(initializeQueryString(query, userData.username))
      dispatch(initializePreferences())
      dispatch(initializeEvents())
      dispatch(initializeContactData())
    } else if (isSignInPending()) {
      console.log('handling pending sign in')
      handlePendingSignIn().then(userData => {
        window.location.search = removeAuthResponse(window.location.search)
        dispatch(authenticatedAction(userData))
      })
    } else {
      dispatch(disconnectedAction())
      dispatch(initializeQueryString(query, null))
    }
  }
}

function removeAuthResponse(search) {
  const parsed = queryString.parse(search)
  if (parsed.authResponse) {
    delete parsed.authResponse
    return queryString.stringify(parsed)
  } else {
    return search
  }
}

function setPublicCalendarEventsAction(allEvents, calendar) {
  return { type: SET_PUBLIC_CALENDAR_EVENTS, payload: { allEvents, calendar } }
}

export function setError(type, msg, error) {
  return { type: SET_ERROR, payload: { type, msg, error } }
}

function viewPublicCalendar(name) {
  return async (dispatch, getState) => {
    console.log('viewpubliccalendar', name)
    if (name) {
      const parts = name.split('@')
      if (parts.length === 2) {
        const calendarName = parts[0]
        const username = parts[1]
        loadPublicCalendar(calendarName, username).then(
          ({ allEvents, calendar }) => {
            dispatch(setPublicCalendarEventsAction(allEvents, calendar))
          },
          error => {
            const msg = 'failed to load public calendar ' + name
            console.log(msg, error)
            dispatch(setError('publicCalendar', msg, error))
          }
        )
      }
    }
  }
}

// ################
// Preferences
// ################

export function showInstructionsAction(show) {
  return { type: SHOW_INSTRUCTIONS, payload: { show } }
}

export function initializePreferences() {
  return async (dispatch, getState) => {
    fetchPreferences().then(preferences => {
      dispatch(
        showInstructionsAction(
          preferences && preferences.showInstructions
            ? preferences.showInstructions.general
            : true
        )
      )
    })
  }
}

export function hideInstructions() {
  return async (dispatch, getState) => {
    fetchPreferences().then(prefs => {
      prefs.showInstructions = { general: false }
      savePreferences(prefs)
      dispatch(showInstructionsAction(false))
    })
  }
}

// ################
// Events
// ################

export function saveAllEvents(allEvents) {
  return (dispatch, getState) => {
    saveEvents('default', allEvents)
    dispatch(setEventsAction(allEvents))
  }
}

function setLoadingCalendars(index, length) {
  return { type: SET_LOADING_CALENDARS, payload: { index, length } }
}

function loadCalendarEvents(calendars, user, dispatch) {
  const calendarCount = calendars.length
  const allCalendars = []
  var promises = calendars.map(function(calendar, index) {
    if (calendar.disabled) {
      dispatch(setLoadingCalendars(index, calendarCount))
      return {}
    } else {
      return importCalendarEvents(calendar, user, defaultEvents).then(
        events => {
          const calendarEvents = { name: calendar.name, events }
          allCalendars.push(calendarEvents)
          const allEventsSoFar = allCalendars.reduce((acc, cur) => {
            const events = cur.events
            return { ...acc, ...events }
          }, {})
          console.log('all events so far', index, allEventsSoFar)
          dispatch(setEventsAction(allEventsSoFar))
          dispatch(setLoadingCalendars(index, calendarCount))
          return calendarEvents
        },
        error => {
          dispatch(setLoadingCalendars(index, calendarCount))
          let msg
          if (
            calendar.name &&
            calendar.name.startsWith('https://calendar.google.com/')
          ) {
            msg =
              'Failed to load a Google calendar. Have you enabled CORS calls?'
          } else {
            msg = 'Failed to load calendar ' + calendar.name
          }
          dispatch(setError('loadCalendar', msg, error))
          console.log('[ERROR.loadCalendarEvents]', error, calendar)
          return { name: calendar.name, events: {} }
        }
      )
    }
  })

  return Promise.all(promises).then(
    allCalendars => {
      return allCalendars.reduce((acc, cur) => {
        const events = cur.events
        return { ...acc, ...events }
      }, {})
    },
    error => {
      return Promise.reject(error)
    }
  )
}

// ################
// Edit Event
// ################

export function deleteEvent(event) {
  return async (dispatch, getState) => {
    let { allEvents } = getState().events
    delete allEvents[event.uid]
    publishEvents(event.uid, removePublicEvent)
    saveEvents('default', allEvents)
    dispatch(setEventsAction(allEvents))
  }
}

export function addEvent(event) {
  return async (dispatch, getState) => {
    let state = getState()
    let { allEvents } = state.events
    event.calendarName = 'default'
    event.uid = uuid()
    allEvents[event.uid] = event
    saveEvents('default', allEvents)
    if (event.public) {
      publishEvents(event, updatePublicEvent)
    }
    window.history.pushState({}, 'OI Calendar', '/')
    delete state.currentEvent
    delete state.currentEventType
    dispatch(setEventsAction(allEvents))
  }
}

export function updateEvent(event) {
  return async (dispatch, getState) => {
    let { allEvents } = getState().events
    var eventInfo = event
    eventInfo.uid = eventInfo.uid || uuid()
    allEvents[eventInfo.uid] = eventInfo
    if (eventInfo.public) {
      publishEvents(eventInfo, updatePublicEvent)
    } else {
      publishEvents(eventInfo.uid, removePublicEvent)
    }
    saveEvents('default', allEvents)
    dispatch(setEventsAction(allEvents))
  }
}

// ################
// Calendars
// ################

export function showMyPublicCalendarAction(name, icsUrl) {
  return { type: SHOW_MY_PUBLIC_CALENDAR, payload: { name, icsUrl } }
}

export function showMyPublicCalendar(name) {
  return async dispatch => {
    dispatch(setLoadingCalendars(0, 1))
    fetchIcsUrl(name).then(url => {
      console.log('icsurl', url)
      dispatch(showMyPublicCalendarAction(name, url))
      dispatch(setLoadingCalendars(0, 0))
    })
  }
}

export function showAllCalendarsAction() {
  return { type: SHOW_ALL_CALENDARS }
}

export function showAllCalendars() {
  return async (dispatch, getState) => {
    window.history.pushState({}, 'OI Calendar', '/')
    dispatch(showAllCalendarsAction())
  }
}
