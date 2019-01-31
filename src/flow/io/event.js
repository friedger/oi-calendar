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

export function fetchContactData() {
  return fetchFromBlocstack("Contacts");
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
  return putOnBlocstack(sharedUrl(eventInfo.uid), eventInfo, {
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
        return putOnBlocstack("Contacts", contacts).then(() => {
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

function fetchFromBlocstack(src, config, privateKey, errorData) {
  return getFile(src, config)
    .then(
      str => {
        if (privateKey) {
          str = decryptContent(str, { privateKey });
        }
        return str;
      },
      error => {
        return Promise.reject("Couldn't fetch from fetchFromBlocstack", {
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

function putOnBlocstack(src, text, config) {
  if (text && typeof text !== "string") {
    text = JSON.stringify(text);
  }
  putFile(src, text, config);
}

// ###########################################################################
// List of calendars
// ###########################################################################
export function getCalendars() {
  return fetchFromBlocstack("Calendars").then(objectToArray);
}

export function publishCalendars(calendars) {
  putOnBlocstack("Calendars", calendars);
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
    fn = fetchFromBlocstack;
  } else if (type === "private") {
    fn = fetchFromBlocstack;
  }
  return fn(data.src, config)
    .then(objectToArray)
    .then(events => {
      if (!events && type === "private" && name === "default") {
        // :Q: why save the default instead of waiting for a change?
        putOnBlocstack(data.src, defaultEvents);
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

export function ViewEventInQueryString(
  query,
  username,
  whenPrivateEvent,
  whenNewEvent,
  whenICSUrl
) {
  if (query) {
    const { u, e, p, intent, title, start, end, via, url } = parseQueryString(
      query
    );
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
      } else if (intent.toLowerCase === "addics") {
        whenICSUrl(url);
      }
    }
  }
}

function loadCalendarEventFromUser(username, eventUid, privateKey) {
  return fetchFromBlocstack(
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

function publishCalendar(text, filepath, contentType) {
  if (!text || !text.length) {
    console.log("empty calendar", filepath);
    return;
  }
  putOnBlocstack(filepath, text, {
    encrypt: false,
    contentType
  }).then(
    f => {
      console.log("public calendar at ", f);
    },
    error => {
      console.log("error publish event", error);
    }
  );
}

export function publishEvents(param, updatePublicEvents) {
  const publicEventPath = "public/AllEvents";
  fetchFromBlocstack(publicEventPath, { decrypt: false }).then(publicEvents => {
    if (publicEvents) {
      const { republish, newPublicEvents } = updatePublicEvents(
        param,
        publicEvents
      );
      if (republish) {
        publishCalendar(newPublicEvents, publicEventPath, "text/json");
        var ics = icsFromEvents(newPublicEvents);
        publishCalendar(ics, publicEventPath + ".ics", "text/calendar");
      }
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

  putOnBlocstack(calendarName + "/AllEvents", calendarEvents);
}
