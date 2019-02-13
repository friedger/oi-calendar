import { uuid, guaranteeHexColor, sharedUrl, objectToArray } from './eventFN'

import {
  lookupProfile,
  makeECPrivateKey,
  getPublicKeyFromPrivate,
  putFile,
  getFile,
  decryptContent,
} from 'blockstack'
import { iCalParseEvents, icsFromEvents } from './ical'
import { parseQueryString, encodeQueryString } from './queryString'

import { getUserAppFileUrl } from 'blockstack/lib/storage'
import { defaultCalendars } from './eventDefaults'

// ################
// Contacts
// ################
export function fetchContactData() {
  return fetchFromBlockstack('Contacts').then(contacts => {
    return contacts || {}
  })
}

export function publishContacts(contacts) {
  return putOnBlockstack('Contacts', contacts)
}

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
  chatSession
) {
  const username = user.username
  const eventInfo = asInviteEvent(eventInfoRaw, username)
  if (!eventInfo) {
    console.log('[ERROR]', eventInfoRaw, eventInfo)
    return
  }
  return putOnBlockstack(sharedUrl(eventInfo.uid), eventInfo, {
    encrypt: eventInfo.pubKey,
  }).then(readUrl => {
    eventInfo.readUrl = readUrl
    const addGuestResultHandler = guestProfile => {
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
          addGuestResultHandler(guestProfile)
        )
      } else {
        console.log('invalid guest ', guestProfile)
        return Promise.resolve({ contacts, eventInfo })
      }
    }
    return addGuestPromises.then(
      ({ contacts, eventInfo }) => {
        publishContacts(contacts)
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
    console.log('reusing room')
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
  const ahref = `<a href='${
    window.location.origin
  }${queryString}"'>${title}</a>`
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

function fetchFromBlockstack(src, config, privateKey, errorData) {
  return getFile(src, config)
    .then(
      str => {
        if (str && privateKey) {
          str = decryptContent(str, { privateKey })
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

function putOnBlockstack(src, text, config) {
  if (text && typeof text !== 'string') {
    text = JSON.stringify(text)
  }
  return putFile(src, text, config)
}

// ###########################################################################
// List of calendars
// ###########################################################################
export function fetchCalendars() {
  return fetchFromBlockstack('Calendars').then(calendars => {
    if (!Array.isArray(calendars)) {
      calendars = objectToArray(calendars)
    }

    return calendars
  })
}

export function publishCalendars(calendars) {
  if (!Array.isArray(calendars)) {
    calendars = Object.values(calendars || {})
  }
  const privateCalendarIndex = calendars.findIndex(
    c => c.type === 'private' && c.name === 'default'
  )
  if (privateCalendarIndex < 0) {
    calendars.splice(0, 0, defaultCalendars[0])
  }
  putOnBlockstack('Calendars', calendars)
}

// ###########################################################################
// List of all available import functions as promises
// :NOTE: As there is no more reliance on any knowledge of how these evens are managed
// by the app, all import functions could be moved to a separate file
// ###########################################################################
export function importCalendarEvents(calendar, user, defaultEvents) {
  const { type, data, name } = calendar || {}
  let fn = () => {}
  let config
  if (type === 'ics') {
    fn = fetchAndParseIcal
  } else if (type === 'blockstack-user') {
    config = { decrypt: false, username: data.user }
    fn = fetchFromBlockstack
  } else if (type === 'private') {
    fn = fetchFromBlockstack
  }

  return fn(data.src, config)
    .then(objectToArray)
    .then(events => {
      if (!events && type === 'private' && name === 'default') {
        putOnBlockstack(data.src, defaultEvents)
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

function applyCalendarDefaults(calendar, user) {
  const { hexColor, mode, type, data, name: calendarName } = calendar
  const eventMode =
    type === 'blockstack-user' && data && user && data.user === user.username
      ? undefined
      : mode
  const eventDefaults = {
    mode: eventMode,
    calendarName,
  }
  const eventOverrides = {
    hexColor: guaranteeHexColor(hexColor),
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

export function handleIntentsInQueryString(
  query,
  convertEvent,
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
      name,
    } = parseQueryString(query)
    if (u && e && p) {
      return loadCalendarEventFromUser(u, e, p).then(whenPrivateEvent)
    } else if (intent) {
      const intentAction = intent.toLowerCase()
      if (intentAction === 'addevent') {
        whenNewEvent(convertEvent(title, start, end, via))
      } else if (intentAction === 'addics') {
        whenICSUrl(url)
      } else if (intentAction === 'view') {
        whenPublicCalendar(name)
      } else {
        console.log('unsupported intent ' + intentAction)
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

export function loadPublicCalendar(calendarName, username) {
  const path = calendarName + '/AllEvents'
  return fetchFromBlockstack(path, {
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

function publishCalendar(eventsString, filepath, contentType) {
  putOnBlockstack(filepath, eventsString, {
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
export function publishEvents(param, updatePublicEvents) {
  const publicEventPath = 'public/AllEvents'
  fetchFromBlockstack(publicEventPath, {
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
      publishCalendar(
        JSON.stringify(newPublicEvents),
        publicEventPath,
        'text/json'
      )
      var ics = icsFromEvents(newPublicEvents)
      publishCalendar(ics, publicEventPath + '.ics', 'text/calendar')
    } else {
      console.log('nothing to publish')
    }
  })
}

export function saveEvents(calendarName, allEvents) {
  console.log('save', { calendarName, allEvents })
  const calendarEvents = Object.keys(allEvents)
    .filter(key => allEvents[key].calendarName === calendarName)
    .reduce((res, key) => {
      res[key] = allEvents[key]
      return res
    }, {})

  return putOnBlockstack(calendarName + '/AllEvents', calendarEvents)
}

export function fetchPreferences() {
  return fetchFromBlockstack('Preferences')
}

export function fetchIcsUrl(calendarName) {
  console.log('calendarName', calendarName)
  const parts = calendarName.split('@')
  const path = parts[0] + '/AllEvents.ics'
  const username = parts[1]
  return getUserAppFileUrl(path, username, window.location.origin)
}

export function savePreferences(preferences) {
  putOnBlockstack('Preferences', preferences)
}
