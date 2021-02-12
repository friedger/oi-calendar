import { uuid, guaranteeHexColor, sharedUrl, objectToArray } from './eventFN'

import {
  lookupProfile,
  makeECPrivateKey,
  getPublicKeyFromPrivate,
} from 'blockstack'
import { iCalParseEvents, icsFromEvents } from './ical'
import { parseQueryString, encodeQueryString } from '../utils'

import { getUserAppFileUrl } from 'blockstack/lib/storage'
import { defaultCalendars } from './eventDefaults'

// ################
// Contacts
// ################

export function loadGuestProfiles(guests, contacts) {
  const profiles = {}
  var profilePromises = Promise.resolve({ profiles, contacts })

  for (var i in guests) {
    const guest = guests[i]
    if (guest && guest.length > 0) {
      profilePromises = profilePromises.then(({ profiles, contacts }) => {
        return lookupProfile(guest).then(
          guestProfile => {
            profiles[guest] = guestProfile
            return { profiles, contacts }
          },
          error => {
            console.log('invalid guest ' + guest, error)
            return Promise.resolve({ profiles, contacts })
          }
        )
      })
    }
  }
  return profilePromises
}

function asInviteEvent(d, username) {
  const privKey = makeECPrivateKey()
  const pubKey = getPublicKeyFromPrivate(privKey)
  d.privKey = privKey
  d.pubKey = pubKey
  d.uid = d.uid || uuid()
  d.owner = username
  return d
}

export function sendInvitesToGuests(
  contacts,
  user,
  eventInfoRaw,
  guestProfiles,
  chatSession,
  userOwnedStorage
) {
  const userSession = chatSession.userSession
  const username = user.username
  if (!eventInfoRaw) {
    console.log('[ERROR] no eventInfoRaw')
    return
  }
  const eventInfo = asInviteEvent(eventInfoRaw, username)
  return putOnBlockstack(userSession, sharedUrl(eventInfo.uid), eventInfo, {
    encrypt: eventInfo.pubKey,
  }).then(readUrl => {
    eventInfo.readUrl = readUrl
    const addGuestResultHandler = (guestUsername, guestProfile) => {
      return ({ contacts, eventInfo }) => {
        console.log('found guest ', guestProfile.name)
        return addGuest(
          guestUsername,
          guestProfile,
          eventInfo,
          contacts,
          chatSession,
          user
        )
      }
    }

    var addGuestPromises = Promise.resolve({ contacts, eventInfo })
    for (var guestUsername in guestProfiles) {
      const guestProfile = guestProfiles[guestUsername]
      if (guestProfile) {
        addGuestPromises = addGuestPromises.then(
          addGuestResultHandler(guestUsername, guestProfile)
        )
      } else {
        console.log('invalid guest ', guestProfile)
        return Promise.resolve({ contacts, eventInfo })
      }
    }
    return addGuestPromises.then(
      ({ contacts, eventInfo }) => {
        userOwnedStorage.publishContacts(contacts)
        return { contacts, eventInfo }
      },
      error => {
        return Promise.reject(error)
      }
    )
  })
}

function addGuest(
  guestUsername,
  guestProfile,
  eventInfo,
  contacts,
  chatSession,
  user
) {
  var roomPromise
  if (contacts[guestUsername] && contacts[guestUsername].roomId) {
    console.log('reusing room', { roomId: contacts[guestUsername].roomId })
    roomPromise = Promise.resolve({
      room_id: contacts[guestUsername].roomId,
    })
  } else {
    console.log('creating new room')
    if (!contacts[guestUsername]) {
      contacts[guestUsername] = {}
    }
    roomPromise = chatSession.createNewRoom(
      'Events with ' + user.username,
      'Invitations, Updates,..'
    )
  }

  return roomPromise.then(
    roomResult => {
      var roomId = roomResult.room_id
      Object.assign(contacts[guestUsername], {
        username: guestUsername,
        roomId,
      })

      return sendInviteMessage(
        guestUsername,
        chatSession,
        roomId,
        eventInfo,
        user.username,
        getUserAppAccount(user.profile)
      )
        .then(() => {
          return { contacts, eventInfo }
        })
        .catch(error => {
          console.log('Invitation not sent', error)
          return { contacts, eventInfo }
        })
    },
    error => {
      console.log('room failure', error)
      return Promise.reject(error)
    }
  )
}

function getUserAppAccount(userProfile) {
  const gaiaUrl = userProfile.apps[window.location.origin]
  if (gaiaUrl) {
    const urlParts = gaiaUrl.split('/')
    var appUserAddress = urlParts[urlParts.length - 2]
    return addressToAccount(appUserAddress)
  }
}

function addressToAccount(address) {
  // TODO lookup home server for user
  return '@' + address.toLowerCase() + ':openintents.modular.im'
}

function sendInviteMessage(
  guestUsername,
  userSessionChat,
  roomId,
  eventInfo,
  username,
  userAppAccount
) {
  const { title, uid, privKey } = eventInfo
  const queryString = encodeQueryString({
    u: username,
    e: uid,
    p: privKey,
    r: roomId,
    s: userAppAccount,
  })
  const ahref = `<a href='${window.location.origin}${queryString}"'>${title}</a>`
  return userSessionChat.sendMessage(guestUsername, roomId, {
    msgtype: 'm.text',
    body: `You are invited to ${title}`,
    format: 'org.matrix.custom.html',
    formatted_body: `You are invited to ${ahref}`,
  })
}

export function respondToInvite(
  userSessionChat,
  eventInfo,
  rsvp,
  senderAppAccount,
  roomId
) {
  var text
  if (rsvp) {
    text = 'I will come to ' + eventInfo.title
  } else {
    text = "I won't come to " + eventInfo.title
  }
  return userSessionChat.sendMessage(senderAppAccount, roomId, {
    msgtype: 'm.text',
    body: text,
  })
}

// ###########################################################################
// Blockstack helpers
// ###########################################################################

function fetchFromBlockstack(userSession, src, config, privateKey, errorData) {
  return userSession
    .getFile(src, config)
    .then(
      str => {
        if (str && privateKey) {
          str = userSession.decryptContent(str, { privateKey })
        }
        return str
      },
      error => {
        console.error(
          'failed to fetch ',
          src,
          config,
          !!privateKey,
          error,
          errorData
        )
        return Promise.reject(
          new Error(`Couldn't fetch from fetchFromBlockstack`)
        )
      }
    )
    .then(d => {
      if (d && typeof d === 'string') {
        d = JSON.parse(d)
      }
      return d
    })
}

function putOnBlockstack(userSession, src, text, config) {
  if (text && typeof text !== 'string') {
    text = JSON.stringify(text)
  }
  return userSession.putFile(src, text, config)
}

function applyCalendarDefaults(calendar, user) {
  const { hexColor, mode, name: calendarName } = calendar
  const eventDefaults = {
    mode: mode,
    calendarName,
  }
  const eventOverrides = {
    hexColor: guaranteeHexColor(hexColor),
  }
  if (
    calendar.type === 'blockstack-user' &&
    calendar.data &&
    user &&
    calendar.data.user === user.username
  ) {
    eventOverrides.mode = undefined
  }
  return d => {
    return { ...eventDefaults, uid: uuid(), ...d, ...eventOverrides }
  }
}

function fetchAndParseIcal(src) {
  return fetch(src)
    .then(result => result.text())
    .then(iCalParseEvents)
}

function fetchFromIcsRaw(src, config) {
  return Promise.resolve(iCalParseEvents(config.events))
}

export function handleIntentsInQueryString(
  query,
  convertEvent,
  whenPrivateEvent,
  whenNewEvent,
  whenICSUrl,
  whenViewPublicCalendar,
  whenViewEvent,
  userSession
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
      name,
      uid,
    } = parseQueryString(query)
    if (userSession && u && e && p) {
      // userSession shouldn't be needed here
      return loadCalendarEventFromUser(userSession, u, e, p).then(
        whenPrivateEvent
      )
    } else if (intent) {
      const intentAction = intent.toLowerCase()
      if (intentAction === 'addevent') {
        whenNewEvent(convertEvent(title, start, end, via))
      } else if (intentAction === 'addics') {
        whenICSUrl(url)
      } else if (intentAction === 'view') {
        if (name) {
          whenViewPublicCalendar(name)
        } else {
          whenViewEvent(uid)
        }
      } else {
        console.log('unsupported intent ' + intentAction)
      }
    }
  }
}

function loadCalendarEventFromUser(username, eventUid, privateKey) {
  return fetchFromBlockstack(
    this.userSession,
    sharedUrl(eventUid),
    { decrypt: false, username },
    privateKey,
    { username, eventUid }
  )
}

// END of import options

export function addPublicEvent(eventInfo, publicEvents) {
  eventInfo.uid = eventInfo.uid || uuid()
  publicEvents[eventInfo.uid] = eventInfo
  return { republish: true, publicEvents }
}

export function updatePublicEvent(eventInfo, publicEvents) {
  publicEvents[eventInfo.uid] = eventInfo
  return { republish: true, publicEvents }
}

export function removePublicEvent(eventUid, publicEvents) {
  if (!publicEvents[eventUid]) {
    // nothing to do
    return { republish: false, publicEvents }
  } else {
    delete publicEvents[eventUid]
    return { republish: true, publicEvents }
  }
}

export class UserOwnedStorage {
  constructor(userSession) {
    this.userSession = userSession
  }

  fetchContactData() {
    return fetchFromBlockstack(this.userSession, 'Contacts').then(contacts => {
      return contacts || {}
    })
  }

  publishContacts(contacts) {
    return putOnBlockstack(this.userSession, 'Contacts', contacts)
  }

  // ###########################################################################
  // List of calendars
  // ###########################################################################
  fetchCalendars() {
    return fetchFromBlockstack(this.userSession, 'Calendars').then(
      calendars => {
        if (!Array.isArray(calendars)) {
          calendars = objectToArray(calendars)
        }

        return calendars
      }
    )
  }

  publishCalendars(calendars) {
    if (!Array.isArray(calendars)) {
      calendars = Object.values(calendars || {})
    }
    const privateCalendarIndex = calendars.findIndex(
      c => c.type === 'private' && c.name === 'default'
    )
    if (privateCalendarIndex < 0) {
      console.log('adding calendar', defaultCalendars[0])
      calendars.splice(0, 0, defaultCalendars[0])
    }
    putOnBlockstack(this.userSession, 'Calendars', calendars)
  }

  // ###########################################################################
  // List of all available import functions as promises
  // :NOTE: As there is no more reliance on any knowledge of how these evens are managed
  // by the app, all import functions could be moved to a separate file
  // ###########################################################################
  importCalendarEvents(calendar, user, defaultEvents) {
    const { type, data, name } = calendar || {}
    let fn = () => {}
    let config

    if (type === 'ics') {
      fn = fetchAndParseIcal
    } else if (type === 'ics-raw') {
      fn = fetchFromIcsRaw
      config = { events: data.events }
    } else if (type === 'blockstack-user') {
      config = { decrypt: false, username: data.user }
      fn = (src, config) => fetchFromBlockstack(this.userSession, src, config)
    } else if (type === 'private') {
      fn = (src, config) => fetchFromBlockstack(this.userSession, src, config)
    }

    return fn(data.src, config)
      .then(objectToArray)
      .then(events => {
        if (!events && type === 'private' && name === 'default') {
          putOnBlockstack(this.userSession, data.src, defaultEvents)
          events = Object.values(defaultEvents)
        }
        return (events || [])
          .map(applyCalendarDefaults(calendar, user))
          .reduce((acc, d) => {
            acc[d.uid] = d
            return acc
          }, {})
      })
  }

  loadPublicCalendar(calendarName, username) {
    const path = calendarName + '/AllEvents'
    return fetchFromBlockstack(this.userSession, path, {
      username,
      decrypt: false,
    }).then(allEvents => {
      const calendar = {
        type: 'blockstack-user',
        mode: 'read-only',
        data: { user: username, src: path },
        name: calendarName + '@' + username,
      }
      allEvents = Object.values(allEvents)
      return { allEvents, calendar }
    })
  }

  publishCalendar(eventsString, filepath, contentType) {
    putOnBlockstack(this.userSession, filepath, eventsString, {
      encrypt: false,
      contentType,
    }).then(
      f => {
        console.log('public calendar at ', f)
      },
      error => {
        console.log('error publish calendar', error)
      }
    )
  }

  publishEvents(param, updatePublicEvents) {
    const publicEventPath = 'public/AllEvents'
    fetchFromBlockstack(this.userSession, publicEventPath, {
      decrypt: false,
    }).then(publicEvents => {
      if (!publicEvents) {
        publicEvents = {}
      }
      const { republish, publicEvents: newPublicEvents } = updatePublicEvents(
        param,
        publicEvents
      )
      if (republish) {
        this.publishCalendar(
          JSON.stringify(newPublicEvents),
          publicEventPath,
          'text/json'
        )
        var ics = icsFromEvents(newPublicEvents)
        this.publishCalendar(ics, publicEventPath + '.ics', 'text/calendar')
      } else {
        console.log('nothing to publish')
      }
    })
  }

  saveEvents(calendarName, allEvents) {
    console.log('save', { calendarName, allEvents })
    const calendarEvents = Object.keys(allEvents)
      .filter(key => allEvents[key].calendarName === calendarName)
      .reduce((res, key) => {
        res[key] = allEvents[key]
        return res
      }, {})

    return putOnBlockstack(
      this.userSession,
      calendarName + '/AllEvents',
      calendarEvents
    )
  }

  fetchPreferences() {
    return fetchFromBlockstack(this.userSession, 'Preferences').then(
      prefs => {
        if (prefs) {
          return prefs
        } else {
          return {}
        }
      },
      () => {
        // TODO check for 404 and only then return empty object, otherwise preferences are overwritten
        return {}
      }
    )
  }

  savePreferences(prefAttributes) {
    return this.fetchPreferences().then(preferences => {
      preferences = Object.assign(preferences, prefAttributes)
      return putOnBlockstack(this.userSession, 'Preferences', preferences)
    })
  }
}

export function fetchIcsUrl(calendarName) {
  console.log('calendarName', calendarName)
  const parts = calendarName.split('@')
  const path = parts[0] + '/AllEvents.ics'
  const username = parts[1]
  return getUserAppFileUrl(path, username, window.location.origin)
}
