import {
  SET_EVENTS,
  INVITES_SENT_OK,
  INVITES_SENT_FAIL,
  SET_CURRENT_GUESTS,
  USER,
  SET_CONTACTS,
  SET_CURRENT_EVENT,
  ADD_CALENDAR,
  INITIALIZE_CHAT
} from "../ActionTypes";

import { AUTH_CONNECTED, AUTH_DISCONNECTED } from "../ActionTypes";

import {
  saveEvents,
  publishEvents,
  ViewEventInQueryString as handleIntentsInQueryString,
  importCalendarEvents,
  getCalendars,
  publishCalendars,
  sendInvitesToGuests,
  loadGuestProfiles,
  fetchContactData,
  updatePublicEvent,
  removePublicEvent
  // addPublicEvent, :WARN: NOT IN USE
} from "../../io/event";
import { createSessionChat } from "../../io/chat";
import { defaultEvents, defaultCalendars } from "../../io/eventDefaults";

import { uuid } from "../../io/eventFN";

import {
  isUserSignedIn,
  isSignInPending,
  handlePendingSignIn,
  loadUserData
} from "blockstack";

// #########################
// Chat
// #########################

function asAction_initializeChat(chat) {
  return { type: INITIALIZE_CHAT, payload: chat };
}

export function initializeChat() {
  return async (dispatch, getState) => {
    let chat = createSessionChat();
    dispatch(asAction_initializeChat(chat));
  };
}

// #########################
// INVITES
// #########################

function asAction_invitesSentOk(eventInfo, type) {
  return {
    type: INVITES_SENT_OK,
    payload: { eventInfo, type }
  };
}

function asAction_invitesSentFail(error) {
  return {
    type: INVITES_SENT_FAIL,
    payload: { error }
  };
}

export function sendInvites(eventInfo, guests, type) {
  return async (dispatch, getState) => {
    sendInvitesToGuests(getState(), eventInfo, guests).then(
      ({ eventInfo, contacts }) => {
        let { allEvents } = getState();
        if (type === "add") {
          allEvents[eventInfo.uid] = eventInfo;
          saveEvents("default", allEvents);
        }
        dispatch(asAction_invitesSentOk(allEvents));
      },
      error => {
        dispatch(asAction_invitesSentFail(error));
      }
    );
  };
}

// #########################
// GUESTS
// #########################
function asAction_setGuests(profiles, eventInfo) {
  return {
    type: SET_CURRENT_GUESTS,
    payload: { profiles, eventInfo }
  };
}

export function loadGuestList(guests, eventInfo) {
  return async (dispatch, getState) => {
    const contacts = getState().events.contacts;
    loadGuestProfiles(guests, contacts).then(
      ({ profiles, contacts }) => {
        console.log("profiles", profiles);
        dispatch(asAction_setGuests(profiles, eventInfo));
        dispatch(asAction_setGuests(profiles, eventInfo));
      },
      error => {
        console.log("load guest list failed", error);
      }
    );
  };
}

// ################
// LOAD USER DATA
// ################

function asAction_authenticated(userData) {
  return { type: AUTH_CONNECTED, user: userData };
}

function asAction_disconnected() {
  return { type: AUTH_DISCONNECTED };
}

function asAction_user(userData) {
  return { type: USER, user: userData };
}

function asAction_viewEvent(eventInfo, eventType) {
  let payload = { eventInfo };
  if (eventType) {
    payload.eventType = eventType;
  }
  return { type: SET_CURRENT_EVENT, payload };
}

function asAction_setEvents(allEvents) {
  return { type: SET_EVENTS, allEvents };
}

function asAction_setContacts(contacts) {
  return { type: SET_CONTACTS, payload: { contacts } };
}

function asAction_addCalendar(url) {
  return { type: ADD_CALENDAR, payload: { url } };
}

export function initializeEvents() {
  const query = window.location.search;
  return async (dispatch, getState) => {
    if (isUserSignedIn()) {
      console.log("is signed in");
      const userData = loadUserData();
      dispatch(asAction_authenticated(userData));
      dispatch(asAction_user(userData));

      handleIntentsInQueryString(
        query,
        userData.username,
        eventInfo => {
          dispatch(asAction_viewEvent(eventInfo));
        },
        eventInfo => dispatch(asAction_viewEvent(eventInfo, "add")),
        url => dispatch(asAction_addCalendar(url))
      );

      getCalendars().then(calendars => {
        if (!calendars) {
          calendars = defaultCalendars;
          // :Q: why save the default instead of waiting for a change?
          publishCalendars(calendars);
        }
        loadCalendarData(calendars).then(allEvents => {
          dispatch(asAction_setEvents(allEvents));
        });
        fetchContactData().then(contacts => {
          dispatch(asAction_setContacts(contacts));
        });
      });
    } else if (isSignInPending()) {
      console.log("handling pending sign in");
      handlePendingSignIn().then(userData => {
        console.log("redirecting to " + window.location.origin);
        window.location = window.location.origin;
        dispatch(asAction_authenticated(userData));
      });
    } else {
      dispatch(asAction_disconnected());
    }
  };
}

function loadCalendarData(calendars) {
  let calendarEvents = {};
  let calendarPromises = Promise.resolve(calendarEvents);
  for (let i in calendars) {
    const calendar = calendars[i];
    calendarPromises = calendarPromises.then(calendarEvents => {
      return importCalendarEvents(calendar, defaultEvents).then(
        events => {
          calendarEvents[calendar.name] = {
            name: calendar.name,
            allEvents: events
          };
          return calendarEvents;
        },
        error => {
          console.log(error);
          return calendarEvents;
        }
      );
    });
  }
  return calendarPromises.then(calendarEvents => {
    var allCalendars = Object.values(calendarEvents);
    console.log("allCalendars", allCalendars);
    var allEvents = allCalendars
      .map(c => c.allEvents)
      .reduce((acc, cur, i) => {
        return { ...acc, ...cur };
      }, {});
    return allEvents;
  });
}

// ################
// Edit Event
// ################

export function deleteEvent(event) {
  return async (dispatch, getState) => {
    let { allEvents } = getState();
    allEvents = allEvents.filter(function(obj) {
      return obj && obj.uid !== event.uid;
    });
    publishEvents(event.uid, removePublicEvent);
    saveEvents("default", allEvents);
    dispatch(asAction_setEvents(allEvents));
  };
}

export function addEvent(event, details) {
  return async (dispatch, getState) => {
    let state = getState();
    let { allEvents } = state;
    event.calendarName = "default";
    event.uid = uuid();
    allEvents[event.uid] = event;
    saveEvents("default", allEvents);
    // :Q: should there be a publishEvents(SOMETHING, addPublicEvent)
    window.history.pushState({}, "OI Calendar", "/");
    delete state.currentEvent;
    delete state.currentEventType;
    dispatch(asAction_setEvents(allEvents));
  };
}

export function updateEvent(event, details) {
  return async (dispatch, getState) => {
    let { allEvents } = getState();
    var eventInfo = event.obj;
    eventInfo.uid = eventInfo.uid || uuid();
    allEvents[eventInfo.uid] = eventInfo;
    if (eventInfo.public) {
      publishEvents(eventInfo, updatePublicEvent);
    } else {
      publishEvents(eventInfo.uid, removePublicEvent);
    }
    saveEvents("default", allEvents);
    dispatch(asAction_setEvents(allEvents));
  };
}
