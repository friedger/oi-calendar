import queryString from 'query-string'
import { UserSession } from 'blockstack'

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
  CREATE_CONFERENCING_ROOM,
  REMOVE_CONFERENCING_ROOM,
  VERIFY_NEW_CALENDAR,
  SET_RICH_NOTIF_ENABLED,
  SET_RICH_NOTIF_EXCLUDE_GUESTS,
  SET_RICH_NOTIF_ERROR,
  SET_CHAT_STATUS,
  SET_REMINDERS_INFO_REQUEST,
  SET_CURRENT_GUESTS,
  SET_ALL_NOTIF_ENABLED,
} from '../ActionTypes'

import { defaultEvents } from '../../core/eventDefaults'
import { createSessionChat, lookupProfile } from '../../core/chat'
import { uuid } from '../../core/eventFN'

import {
  handleIntentsInQueryString,
  updatePublicEvent,
  removePublicEvent,
  fetchIcsUrl,
  UserOwnedStorage,
} from '../../core/event'
import { initializeContactData } from './contactActionLazy'
import {
  initializeCalendars,
  showSettingsAddCalendar,
} from './calendarActionLazy'
import { guestsStringToArray } from '../../components/EventDetails'
import {
  setCurrentEvent,
  setNewCurrentEvent,
  setCurrentEventUid,
} from './eventAction'

// Reminders
import { addReminder, initReminders } from '../../reminder'
import { AppConfig } from 'blockstack/lib/auth'
import { push } from 'connected-react-router'

// #########################
// Chat
// #########################

function initializeChatAction(chat) {
  console.log({ chat })
  return { type: INITIALIZE_CHAT, payload: chat }
}

export function initializeChat(userSession, userOwnedStorage) {
  return async dispatch => {
    console.log('init chat')
    userOwnedStorage
      .fetchPreferences()
      .then(
        prefs => {
          return prefs.selfRoomId
        },
        error => {
          console.log('No chat room found for notifications', error)
          return undefined
        }
      )
      .then(selfRoomId => {
        let chat = createSessionChat(selfRoomId, userSession, userOwnedStorage)
        initReminders(chat)
        dispatch(initializeChatAction(chat))
      })
  }
}

// ################
// LOAD USER DATA
// ################

function authenticatedAction(userData, userSession, userOwnedStorage) {
  return {
    type: AUTH_CONNECTED,
    payload: { user: userData, userSession, userOwnedStorage },
  }
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
        dispatch(setNewCurrentEvent(eventInfo, username ? 'add' : 'view'))
      },
      eventInfo => dispatch(setNewCurrentEvent(eventInfo, 'add')),
      url => dispatch(showSettingsAddCalendar(url)),
      name => dispatch(viewPublicCalendar(name)),
      uid => dispatch(setCurrentEventUid(uid, 'edit'))
    )
  }
}

export function initializeEvents() {
  return (dispatch, getState) => {
    dispatch(initializeCalendars())
      .then(calendars => {
        dispatch(setLoadingCalendars(0, calendars.length))
        const user = getState().auth.user
        const allEventsPromise = loadCalendarEvents(
          calendars,
          user,
          dispatch,
          getState
        )
        return allEventsPromise
      })
      .then(allEvents => {
        const currentEventUid = getState().events.currentEventUid
        if (currentEventUid) {
          const currentEvent = allEvents[currentEventUid]
          dispatch(setNewCurrentEvent(currentEvent, 'edit'))
        }
        dispatch(setLoadingCalendars(0, 0))
        dispatch(setEventsAction(allEvents))
      })
  }
}

export function initializeLazyActions() {
  const query = window.location.search
  return async (dispatch, getState) => {
    console.log('init')
    const userSession = new UserSession(
      new AppConfig(
        ['store_write', 'publish_data'],
        `${window.location.origin}`,
        `${window.location}`,
        `${window.location.origin}/manifest.json`
      )
    )
    console.log('check login state')
    if (userSession.isUserSignedIn()) {
      console.log('is signed in')
      const userData = userSession.loadUserData()
      const userOwnedStorage = new UserOwnedStorage(userSession)
      dispatch(authenticatedAction(userData, userSession, userOwnedStorage))
      dispatch(userAction(userData))
      dispatch(initializeQueryString(query, userData.username))
      dispatch(initializePreferences())
      dispatch(initializeEvents())
      dispatch(initializeContactData())
      dispatch(initializeChat(userSession, userOwnedStorage))
    } else if (userSession.isSignInPending()) {
      console.log('handling pending sign in')
      userSession.handlePendingSignIn().then(userData => {
        window.location.search = removeAuthResponse(window.location.search)
        dispatch(
          authenticatedAction(
            userData,
            userSession,
            new UserOwnedStorage(userSession)
          )
        )
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

export function viewPublicCalendar(name) {
  return async (dispatch, getState) => {
    const { userOwnedStorage } = getState().auth
    console.log('viewpubliccalendar', name)
    if (name) {
      const parts = name.split('@')
      if (parts.length === 2) {
        const calendarName = parts[0]
        const username = parts[1]
        userOwnedStorage.loadPublicCalendar(calendarName, username).then(
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

function setAllNotifEnabled(isEnabled) {
  return { type: SET_ALL_NOTIF_ENABLED, payload: { isEnabled } }
}

function setRichNotifEnabled(isEnabled, error) {
  return { type: SET_RICH_NOTIF_ENABLED, payload: { isEnabled, error } }
}

function setRichNotifExcludeGuests(guests) {
  return { type: SET_RICH_NOTIF_EXCLUDE_GUESTS, payload: { guests } }
}

function unsetRichNotifError() {
  return { type: SET_RICH_NOTIF_ERROR, payload: { error: null } }
}

export function initializePreferences() {
  return async (dispatch, getState) => {
    const { userOwnedStorage } = getState().auth
    userOwnedStorage.fetchPreferences().then(preferences => {
      dispatch(
        showInstructionsAction(
          preferences && preferences.showInstructions
            ? preferences.showInstructions.general
            : true
        )
      )

      dispatch(
        setAllNotifEnabled(
          preferences.hasOwnProperty('allNotifEnabled')
            ? preferences.allNotifEnabled
            : true
        )
      )
      dispatch(setRichNotifEnabled(preferences.richNotifEnabled))
      dispatch(setRichNotifExcludeGuests(preferences.richNofifExclude))
    })
  }
}

export function hideInstructions() {
  return async (dispatch, getState) => {
    const { userOwnedStorage } = getState().auth
    userOwnedStorage.savePreferences({
      showInstructions: { general: false },
    })
    dispatch(showInstructionsAction(false))
  }
}

export function setRemindersInfoRequest() {
  return { type: SET_REMINDERS_INFO_REQUEST, payload: { show: true } }
}

export function unsetRemindersInfoRequest() {
  return { type: SET_REMINDERS_INFO_REQUEST, payload: { show: undefined } }
}

export function updateAllNotifEnabled(status) {
  return async (dispatch, getState) => {
    const { userOwnedStorage } = getState().auth
    userOwnedStorage.savePreferences({ allNotifEnabled: status })
    dispatch(setAllNotifEnabled(status))
  }
}

export function enableRichNotif() {
  console.log('enableRichNotif')
  return async (dispatch, getState) => {
    const { userSessionChat } = getState().events
    const { userOwnedStorage } = getState().auth
    dispatch(unsetRichNotifError())
    dispatch(setChatStatus('checking'))
    userSessionChat
      .sendMessageToSelf(msg('Rich notifications have been enabled!'))
      .then(
        res => {
          console.log('rich notif enabeld', res)
          userOwnedStorage.savePreferences({ richNotifEnabled: true })
          dispatch(setRichNotifEnabled(true))
          dispatch(setChatStatus(null))
        },
        error => {
          console.log('failed to enabled rich notif', error)
          userOwnedStorage.savePreferences({ richNotifEnabled: false })
          dispatch(setRichNotifEnabled(false, error))
          dispatch(setChatStatus(null))
        }
      )
  }
}

export function disableRichNotif() {
  console.log('disableRichNotif')
  return async (dispatch, getState) => {
    const { userSessionChat } = getState().events
    const { userOwnedStorage } = getState().auth
    dispatch(unsetRichNotifError())
    userOwnedStorage.savePreferences({ richNotifEnabled: false })
    userSessionChat.sendMessageToSelf(
      msg('Rich notifications have been disabled!')
    )
    dispatch(setRichNotifEnabled(false))
  }
}

function msg(text) {
  return {
    msgtype: 'm.text',
    body: `${text}`,
  }
}

export function saveRichNotifExcludeGuests(guests) {
  console.log('saveRichNotifExcludeGuests', guests)
  return async (dispatch, getState) => {
    const { userOwnedStorage } = getState().auth
    userOwnedStorage.savePreferences({ richNofifExclude: guests })
    dispatch(setRichNotifExcludeGuests(guests))
  }
}

// ################
// Events
// ################

export function saveAllEvents(allEvents) {
  return (dispatch, getState) => {
    const { userOwnedStorage } = getState().auth
    userOwnedStorage.saveEvents('default', allEvents)
    dispatch(setEventsAction(allEvents))
  }
}

function setLoadingCalendars(index, length) {
  return { type: SET_LOADING_CALENDARS, payload: { index, length } }
}

function loadCalendarEvents(calendars, user, dispatch, getState) {
  const calendarCount = calendars.length
  const allCalendars = []
  var promises = calendars.map(function(calendar, index) {
    if (calendar.disabled) {
      dispatch(setLoadingCalendars(index, calendarCount))
      return {}
    } else {
      const { userOwnedStorage } = getState().auth
      return userOwnedStorage
        .importCalendarEvents(calendar, user, defaultEvents)
        .then(
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
              calendar.data &&
              calendar.data.src &&
              calendar.data.src.startsWith('https://calendar.google.com/')
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
    const { allEvents } = getState().events
    const { userOwnedStorage } = getState().auth
    delete allEvents[event.uid]
    userOwnedStorage.publishEvents(event.uid, removePublicEvent)
    userOwnedStorage.saveEvents('default', allEvents)
    dispatch(setEventsAction(allEvents))
  }
}

export function addEvent(event) {
  return async (dispatch, getState) => {
    let state = getState()
    let { allEvents, calendars, userSessionChat } = state.events
    const { userOwnedStorage } = getState().auth
    console.log('calendars', calendars, event)

    if (!event.hexColor) {
      const privateCalendar = calendars.find(
        c => c.type === 'private' && c.name === 'default'
      )
      if (privateCalendar) {
        event.hexColor = privateCalendar.hexColor
      }
    }

    if (!event.calendarName) {
      event.calendarName = 'default'
    }

    if (!event.uid) {
      event.uid = uuid()
    }

    allEvents[event.uid] = event

    // Save and Publish Events to Blockstack
    userOwnedStorage.saveEvents('default', allEvents)
    if (event.public) {
      userOwnedStorage.publishEvents(event, updatePublicEvent)
    }

    if (event.reminderEnabled) {
      // Add reminder to notify user
      guestsOf(event, getState().events.contacts).then(guests => {
        addReminder(event, guests, userSessionChat)
      })
    }

    dispatch(push('/'))
    delete state.currentEvent
    delete state.currentEventType
    dispatch(setEventsAction(allEvents))
  }
}

/**
 * @returns Result is a promise list like this:
 * [
    {
      username: 'fmdroid.id',
      identityAddress: '1Jx33eh9Ew9XJCZcCB3pcETHzUiVQhHz3x',
    },
  ]
 */
function guestsOf(event, contacts) {
  const guestList = guestsStringToArray(event.guests)
  const guestListPromises = guestList.map(g => {
    const contact = contacts[g]
    if (contact && contact.identityAddress) {
      return Promise.resolve(contact)
    } else {
      return lookupProfile(g)
    }
  })
  return Promise.all(guestListPromises)
}

export function updateEvent(event) {
  return async (dispatch, getState) => {
    const { allEvents, userSessionChat } = getState().events
    const { userOwnedStorage } = getState().auth
    let eventInfo = event
    eventInfo.uid = eventInfo.uid || uuid()
    allEvents[eventInfo.uid] = eventInfo
    if (eventInfo.public) {
      userOwnedStorage.publishEvents(eventInfo, updatePublicEvent)
    } else {
      userOwnedStorage.publishEvents(eventInfo.uid, removePublicEvent)
    }
    userOwnedStorage.saveEvents('default', allEvents)

    if (event.reminderEnabled) {
      // Add reminder to notify user
      guestsOf(event, getState().events.contacts).then(guests => {
        console.log('guests', guests)
        addReminder(event, guests, userSessionChat)
      })
    }

    dispatch(setEventsAction(allEvents))
  }
}

export function setCurrentGuests(profiles) {
  return { type: SET_CURRENT_GUESTS, payload: { profiles } }
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
    dispatch(push('/'))
    dispatch(showAllCalendarsAction())
  }
}

function setChatStatus(status) {
  return { type: SET_CHAT_STATUS, payload: { status } }
}

export function createConferencingRoomAction(status, url) {
  return { type: CREATE_CONFERENCING_ROOM, payload: { status, url } }
}

export function createConferencingRoom(eventDetails, guests) {
  return async (dispatch, getState) => {
    dispatch(setCurrentEvent(eventDetails))
    dispatch(createConferencingRoomAction('adding', null))
    const { userSessionChat, user } = getState().events
    userSessionChat
      .createNewRoom(
        eventDetails.title,
        'All about this event',
        guests,
        user.identityAddress
      )
      .then(
        room => {
          dispatch(
            createConferencingRoomAction(
              'added',
              'https://chat.openintents.org/#/room/' + room.room_id
            )
          )
        },
        error => {
          console.log('failed to create conferencing room', error)
          dispatch(setChatStatus('failedToCreateConferencingRoom', error))
        }
      )
  }
}

export function removeConferencingRoomAction(status) {
  return { type: REMOVE_CONFERENCING_ROOM, payload: { status } }
}

export function removeConferencingRoom(eventDetails, url) {
  console.log('removeConferencingRoom')
  return async (dispatch, getState) => {
    dispatch(removeConferencingRoomAction('removing'))
    setCurrentEvent(eventDetails)
    // TODO remove user from matrix room
    setTimeout(() => dispatch(removeConferencingRoomAction('removed')), 1000)
  }
}

export function setCalendarVerificationStatus(payload) {
  return { type: VERIFY_NEW_CALENDAR, payload }
}

export function verifyNewCalendar(calendar) {
  console.log('verifyCalendar')
  return async (dispatch, getState) => {
    if (calendar == null) {
      setCalendarVerificationStatus({ status: '' })
      return
    }
    const { userOwnedStorage } = getState().auth

    dispatch(
      setCalendarVerificationStatus({
        calendar,
        status: 'pending',
      })
    )

    userOwnedStorage
      .importCalendarEvents(calendar, getState().auth.user, defaultEvents)
      .then(
        events => {
          console.log('import ok')
          dispatch(
            setCalendarVerificationStatus({
              status: 'ok',
              calendar,
              eventsCount: Object.keys(events).length,
            })
          )
        },
        error => {
          const msg = 'failed to verify calendar'
          console.log(msg, error)
          dispatch(setCalendarVerificationStatus({ status: 'error', error }))
        }
      )
  }
}

export function clearVerifyCalendar() {
  console.log('clearVerifyCalendar')
  return async (dispatch, getState) => {
    dispatch(
      setCalendarVerificationStatus({
        status: '',
        clearShowSettingsAddCalendarUrl: true,
      })
    )
  }
}
