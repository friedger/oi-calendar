import { uuid, guaranteeHexColor, sharedUrl, objectToArray } from "./eventFN";

import {
  lookupProfile,
  makeECPrivateKey,
  getPublicKeyFromPrivate,
  putFile,
  getFile,
  decryptContent
} from "blockstack";
import { iCalParseEvents, icsFromEvents } from "./ical";
import { parseQueryString, encodeQueryString } from "./queryString";

import {
  parse as iCalParse,
  Component as iCalComponent,
  Event as iCalEvent
} from "ical.js";

import { BlockstackNetwork } from "blockstack/lib/network";
import { getUserAppFileUrl } from "blockstack/lib/storage";

export function fetchContactData() {
  return fetchFromBlockstack("Contacts");
}

export function publishContacts(contacts) {
  return putOnBlockstack("Contacts", contacts);
}

export function loadGuestProfiles(guests, contacts) {
  const profiles = {};
  var profilePromises = Promise.resolve({ profiles, contacts });

  for (var i in guests) {
    const guest = guests[i];
    if (guest && guest.length > 0) {
      profilePromises = profilePromises.then(({ profiles, contacts }) => {
        return lookupProfile(guest).then(
          guestProfile => {
            profiles[guest] = guestProfile;
            return { profiles, contacts };
          },
          error => {
            console.log("invalid guest " + guest, error);
            return Promise.resolve({ profiles, contacts });
          }
        );
      });
    }
  }
  return profilePromises;
}

function asInviteEvent(d, username) {
  const privKey = makeECPrivateKey();
  const pubKey = getPublicKeyFromPrivate(privKey);
  d.privKey = privKey;
  d.pubKey = pubKey;
  d.uid = d.uid || uuid();
  d.owner = username;
}

export function sendInvitesToGuests(state, eventInfo, guests) {
  const contacts = state.events.contacts;
  eventInfo = asInviteEvent(eventInfo, state.auth.user.username);
  return putOnBlockstack(sharedUrl(eventInfo.uid), eventInfo, {
    encrypt: eventInfo.pubKey
  }).then(readUrl => {
    eventInfo.readUrl = readUrl;
    var addGuestPromises = Promise.resolve({ contacts, eventInfo });
    for (var i in guests) {
      const guest = guests[i];
      if (guest && guest.length > 0) {
        addGuestPromises = addGuestPromises.then(({ contacts, eventInfo }) => {
          return lookupProfile(guest).then(
            guestProfile => {
              console.log("found guest ", guestProfile.name);
              return addGuest(guest, eventInfo, contacts, state);
            },
            error => {
              console.log("invalid guest " + guest, error);
              return Promise.resolve({ contacts, eventInfo });
            }
          );
        });
      }
    }
    return addGuestPromises.then(
      ({ contacts, eventInfo }) => {
        console.log("contacts", contacts);
        return publishContacts(contacts).then(() => {
          return { contacts, eventInfo };
        });
      },
      error => {
        return Promise.reject(error);
      }
    );
  });
}

function addGuest(guest, eventInfo, contacts, state) {
  var roomPromise;
  if (contacts[guest] && contacts[guest].roomId) {
    console.log("reusing room");
    roomPromise = Promise.resolve({ room_id: contacts[guest].roomId });
  } else {
    console.log("creating new room");
    if (!contacts[guest]) {
      contacts[guest] = {};
    }
    roomPromise = state.events.userSessionChat.createNewRoom(
      "Events with " + state.events.user.username,
      "Invitations, Updates,.."
    );
  }

  return roomPromise.then(
    roomResult => {
      var roomId = roomResult.room_id;
      Object.assign(contacts[guest], { roomId });

      return sendInviteMessage(
        guest,
        state.events.userSessionChat,
        roomId,
        eventInfo,
        state.auth.user.username,
        getUserAppAccount(state.auth.user)
      )
        .then(() => {
          return { contacts, eventInfo };
        })
        .catch(error => {
          console.log("Invitation not sent", error);
          return { contacts, eventInfo };
        });
    },
    error => {
      console.log("room failure", error);
      return Promise.reject(error);
    }
  );
}

function getUserAppAccount(user) {
  const gaiaUrl = user.apps[window.location.origin];
  if (gaiaUrl) {
    const urlParts = gaiaUrl.split("/");
    var appUserAddress = urlParts[urlParts.length - 2];
    return addressToAccount(appUserAddress);
  }
}

function addressToAccount(address) {
  // TODO lookup home server for user
  return "@" + address.toLowerCase() + ":openintents.modular.im";
}

function sendInviteMessage(
  guest,
  userSessionChat,
  roomId,
  eventInfo,
  username,
  userAppAccount
) {
  const { title, uid, privKey } = eventInfo;
  const queryString = encodeQueryString({
    u: username,
    e: uid,
    p: privKey,
    r: roomId,
    s: userAppAccount
  });
  const ahref = `<a href='${
    window.location.origin
  }${queryString}"'>${title}</a>`;
  return userSessionChat.sendMessage(guest, roomId, {
    msgtype: "m.text",
    body: `You are invited to ${title}`,
    format: "org.matrix.custom.html",
    formatted_body: `You are invited to ${ahref}`
  });
}

export function respondToInvite(
  userSessionChat,
  eventInfo,
  rsvp,
  senderAppAccount,
  roomId
) {
  var text;
  if (rsvp) {
    text = "I will come to " + eventInfo.title;
  } else {
    text = "I won't come to " + eventInfo.title;
  }
  return userSessionChat.sendMessage(senderAppAccount, roomId, {
    msgtype: "m.text",
    body: text
  });
}

// ###########################################################################
// Blockstack helpers
// ###########################################################################

function fetchFromBlockstack(src, config, privateKey, errorData) {
  return getFile(src, config)
    .then(
      str => {
        if (privateKey) {
          str = decryptContent(str, { privateKey });
        }
        return str;
      },
      error => {
        return Promise.reject({
          msg: "Couldn't fetch from fetchFromBlockstack",
          ...errorData,
          error
        });
      }
    )
    .then(d => {
      if (d && typeof d === "string") {
        d = JSON.parse(d);
      }
      return d;
    });
}

function putOnBlockstack(src, text, config) {
  if (text && typeof text !== "string") {
    text = JSON.stringify(text);
  }
  return putFile(src, text, config);
}

// ###########################################################################
// List of calendars
// ###########################################################################
export function fetchCalendars() {
  return fetchFromBlockstack("Calendars").then(objectToArray);
}

export function publishCalendars(calendars) {
  putOnBlockstack("Calendars", calendars);
}

// ###########################################################################
// List of all available import functions as promises
// :NOTE: As there is no more reliance on any knowledge of how these evens are managed
// by the app, all import functions could be moved to a separate file
// ###########################################################################
export function importCalendarEvents(calendar, defaultEvents) {
  const { type, data, name } = calendar;
  let fn = () => {};
  let config;
  if (type === "ics") {
    fn = fetchAndParseIcal;
  } else if (type === "blockstack-user") {
    config = { decrypt: false, username: data.user };
    fn = fetchFromBlockstack;
  } else if (type === "private") {
    fn = fetchFromBlockstack;
  }
  return fn(data.src, config)
    .then(objectToArray)
    .then(events => {
      if (!events && type === "private" && name === "default") {
        // :Q: why save the default instead of waiting for a change?
        putOnBlockstack(data.src, defaultEvents);
        events = Object.values(defaultEvents);
      }
      return (events || [])
        .map(applyCalendarDefaults(calendar))
        .reduce((acc, d) => {
          acc[d.uid] = d;
          return acc;
        }, {});
    });
}

function applyCalendarDefaults(calendar) {
  const { type, hexColor, mode, name: calendarName } = calendar;
  const eventDefaults = {
    hexColor: guaranteeHexColor(hexColor),
    mode: mode,
    calendarName: type === "private" ? calendarName : null
  };

  return d => {
    return { ...eventDefaults, uid: uuid(), ...d };
  };
}

function fetchAndParseIcal(src) {
  return fetch(src)
    .then(result => result.text())
    .then(iCalParseEvents);
}

export function handleIntentsInQueryString(
  query,
  username,
  whenPrivateEvent,
  whenNewEvent,
  whenICSUrl,
  whenPublicCalendar
) {
  if (query) {
    const {
      u,
      e,
      p,
      intent,
      title,
      start,
      end,
      via,
      url,
      name
    } = parseQueryString(query);
    if (u && e && p) {
      return loadCalendarEventFromUser(u, e, p).then(whenPrivateEvent);
    } else if (intent) {
      if (intent.toLowerCase() === "addevent") {
        const eventInfo = {};
        eventInfo.title = title || "New Event";
        eventInfo.start = start != null ? new Date(start) : new Date();
        eventInfo.end = end != null ? new Date(end) : null;
        eventInfo.owner = via != null ? via : username;
        whenNewEvent(eventInfo);
      } else if (intent.toLowerCase() === "addics") {
        whenICSUrl(url);
      } else if (intent.toLowerCase() === "view") {
        whenPublicCalendar(name);
      } else {
        console.log("unsupported intent " + intent);
      }
    }
  }
}

function loadCalendarEventFromUser(username, eventUid, privateKey) {
  return fetchFromBlockstack(
    sharedUrl(eventUid),
    { decrypt: false, username },
    privateKey,
    { username, eventUid }
  );
}

/* This is here just to demonstrate how to load an event from a user */
loadCalendarEventFromUser(
  "friedger.id",
  "307baf34-9ceb-492f-8dab-ab595f2a09df",
  "e5f33c486af118a2c04f2d26fb1c4f698b22693e539600bb590510e24617dbc6"
);

// END of import options

export function addPublicEvent(eventInfo, publicEvents) {
  eventInfo.uid = eventInfo.uid || uuid();
  publicEvents[eventInfo.uid] = eventInfo;
  return { republish: true, publicEvents };
}

export function updatePublicEvent(eventInfo, publicEvents) {
  publicEvents[eventInfo.uid] = eventInfo;
  return { republish: true, publicEvents };
}

export function removePublicEvent(eventUid, publicEvents) {
  if (!publicEvents[eventUid]) {
    //nothing to do
    return { republish: false, publicEvents };
  } else {
    delete publicEvents[eventUid];
    return { republish: true, publicEvents };
  }
}

export function loadPublicCalendar(calendarName, username) {
  const path = calendarName + "/AllEvents";
  console.log("username", username);
  return fetchFromBlockstack(path, {
    username,
    decrypt: false
  }).then(allEvents => {
    const calendar = {
      type: "blockstack-user",
      mode: "read-only",
      data: { user: username, src: path },
      name: calendarName + "@" + username
    };
    allEvents = Object.values(allEvents);
    return { allEvents, calendar };
  });
}

function publishCalendar(events, filepath, contentType) {
  putOnBlockstack(filepath, JSON.stringify(events), {
    encrypt: false,
    contentType
  }).then(
    f => {
      console.log("public calendar at ", f);
    },
    error => {
      console.log("error publish calendar", error);
    }
  );
}
export function publishEvents(param, updatePublicEvents) {
  const publicEventPath = "public/AllEvents";
  fetchFromBlockstack(publicEventPath, {
    decrypt: false
  }).then(publicEvents => {
    if (!publicEvents) {
      publicEvents = {};
    }
    const { republish, publicEvents: newPublicEvents } = updatePublicEvents(
      param,
      publicEvents
    );
    if (republish) {
      publishCalendar(newPublicEvents, publicEventPath, "text/json");
      var ics = icsFromEvents(newPublicEvents);
      publishCalendar(ics, publicEventPath + ".ics", "text/calendar");
    } else {
      console.log("nothing to publish");
    }
  });
}

export function saveEvents(calendarName, allEvents) {
  console.log("save", { calendarName, allEvents });
  const calendarEvents = Object.keys(allEvents)
    .filter(key => allEvents[key].calendarName === calendarName)
    .reduce((res, key) => {
      res[key] = allEvents[key];
      return res;
    }, {});

  putOnBlockstack(calendarName + "/AllEvents", calendarEvents);
}

export function fetchPreferences() {
  return fetchFromBlockstack("Preferences");
}

export function fetchIcsUrl(calendarName) {
  console.log("calendarName", calendarName);
  const parts = calendarName.split("@");
  const path = parts[0] + "/AllEvents.ics";
  const username = parts[1];
  return getUserAppFileUrl(path, username, window.location.origin);
}

export function savePreferences(preferences) {
  putOnBlockstack("Preferences", preferences);
}
