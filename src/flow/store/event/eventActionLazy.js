import {
  SET_EVENTS,
  INVITES_SENT_OK,
  INVITES_SENT_FAIL,
  SET_CURRENT_GUESTS,
  USER,
  SET_CONTACTS,
  VIEW_EVENT,
  SET_CALENDARS,
  SHOW_SETTINGS_ADD_CALENDAR,
  INITIALIZE_CHAT,
  SHOW_MY_PUBLIC_CALENDAR,
  SHOW_ALL_CALENDARS,
  SHOW_SETTINGS,
  SET_PUBLIC_CALENDAR_EVENTS,
  SHOW_INSTRUCTIONS
} from "../ActionTypes";

import { AUTH_CONNECTED, AUTH_DISCONNECTED } from "../ActionTypes";

import {
  saveEvents,
  publishEvents,
  handleIntentsInQueryString,
  importCalendarEvents,
  fetchCalendars,
  publishCalendars,
  sendInvitesToGuests,
  loadGuestProfiles,
  fetchContactData,
  updatePublicEvent,
  removePublicEvent,
  publishContacts,
  loadPublicCalendar,
  savePreferences,
  fetchPreferences,
  fetchIcsUrl
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

export function loadGuestList(guests, contacts, asyncReturn) {
  loadGuestProfiles(guests, contacts).then(asyncReturn, error => {
    console.log("load guest list failed", error);
  });
}

export function loadGuestListOld(guests, eventInfo) {
  return async (dispatch, getState) => {
    const contacts = getState().events.contacts;
    loadGuestProfiles(guests, contacts).then(
      ({ profiles, contacts }) => {
        console.log("profiles", profiles);
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
  return { type: VIEW_EVENT, payload };
}

function asAction_setEvents(allEvents) {
  return { type: SET_EVENTS, allEvents };
}

function asAction_setContacts(contacts) {
  return { type: SET_CONTACTS, payload: { contacts } };
}

function asAction_setCalendars(calendars) {
  return { type: SET_CALENDARS, payload: { calendars } };
}

function asAction_showSettingsAddCalendar(url) {
  return { type: SHOW_SETTINGS_ADD_CALENDAR, payload: { url } };
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
        url => dispatch(asAction_showSettingsAddCalendar(url)),
        name => dispatch(viewPublicCalendar(name))
      );

      fetchPreferences().then(preferences => {
        dispatch(
          asAction_showInstructions(
            preferences && preferences.showInstructions
              ? preferences.showInstructions.general
              : true
          )
        );
      });
      fetchCalendars().then(calendars => {
        if (!calendars) {
          calendars = defaultCalendars;
          // :Q: why save the default instead of waiting for a change?
          publishCalendars(calendars);
        }
        dispatch(asAction_setCalendars(calendars));
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

      handleIntentsInQueryString(
        query,
        null,
        eventInfo => {
          dispatch(asAction_viewEvent(eventInfo));
        },
        eventInfo => dispatch(asAction_viewEvent(eventInfo, "add")),
        url => dispatch(asAction_showSettingsAddCalendar(url)),
        name => dispatch(viewPublicCalendar(name))
      );
    }
  };
}

function asAction_setPublicCalendarEvents(allEvents, calendar) {
  return { type: SET_PUBLIC_CALENDAR_EVENTS, payload: { allEvents, calendar } };
}

function viewPublicCalendar(name) {
  return async (dispatch, getState) => {
    console.log("viewpubliccalendar", name);
    if (name) {
      const parts = name.split("@");
      if (parts.length === 2) {
        const calendarName = parts[0];
        const username = parts[1];
        loadPublicCalendar(calendarName, username).then(
          ({ allEvents, calendar }) => {
            dispatch(asAction_setPublicCalendarEvents(allEvents, calendar));
          },
          error => {
            console.log("failed to load public calendar " + name, error);
          }
        );
      }
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
    Object.delete(allEvents[event.uid]);
    publishEvents(event.uid, removePublicEvent);
    saveEvents("default", allEvents);
    dispatch(asAction_setEvents(allEvents));
  };
}

export function addEvent(event) {
  return async (dispatch, getState) => {
    let state = getState();
    let { allEvents } = state.events;
    event.calendarName = "default";
    event.uid = uuid();
    allEvents[event.uid] = event;
    saveEvents("default", allEvents);
    if (event.public) {
      publishEvents(event, updatePublicEvent);
    }
    window.history.pushState({}, "OI Calendar", "/");
    delete state.currentEvent;
    delete state.currentEventType;
    dispatch(asAction_setEvents(allEvents));
  };
}

export function updateEvent(event) {
  return async (dispatch, getState) => {
    let { allEvents } = getState().events;
    var eventInfo = event;
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

// ################
// Calendars
// ################
export function addCalendar(calendar) {
  return async (dispatch, getState) => {
    fetchCalendars().then(calendars => {
      // TODO check for duplicates
      calendars.push(calendar);
      publishCalendars(calendars);
      dispatch(asAction_setCalendars(calendars));
    });
  };
}

export function asAction_showSettings() {
  return {
    type: SHOW_SETTINGS
  };
}

export function asAction_showMyPublicCalendar(name, icsUrl) {
  return { type: SHOW_MY_PUBLIC_CALENDAR, payload: { name, icsUrl } };
}

export function showMyPublicCalendar(name) {
  return async dispatch => {
    fetchIcsUrl(name).then(url => {
      console.log("icsurl", url);
      dispatch(asAction_showMyPublicCalendar(name, url));
    });
  };
}

export function asAction_showAllCalendars() {
  return { type: SHOW_ALL_CALENDARS };
}

export function showAllCalendars() {
  return async (dispatch, getState) => {
    window.history.pushState({}, "OI Calendar", "/");
    dispatch(asAction_showAllCalendars());
  };
}

export function asAction_showInstructions(show) {
  return { type: SHOW_INSTRUCTIONS, payload: { show } };
}

export function hideInstructions() {
  return async (dispatch, getState) => {
    fetchPreferences().then(prefs => {
      prefs.showInstructions = { general: false };
      savePreferences(prefs);
      dispatch(asAction_showInstructions(false));
    });
  };
}

// ################
// Contacts
// ################
export function addContact(contact) {
  return async (dispatch, getState) => {
    fetchContactData().then(contacts => {
      // TODO check for duplicates
      contacts.push(contact);
      publishContacts(contacts);
      dispatch(asAction_setContacts(contacts));
    });
  };
}
