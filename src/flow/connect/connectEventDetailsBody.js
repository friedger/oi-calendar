import { connect } from 'react-redux'
import moment from 'moment'

import { setCurrentEvent, unsetCurrentEvent } from '../store/event/eventAction'

import {
  addEvent,
  deleteEvent,
  updateEvent,
  saveAllEvents,
  createConferencingRoom,
  removeConferencingRoom,
} from '../../flow/store/event/eventActionLazy'

import {
  sendInvites,
  unsetCurrentInvites,
  loadGuestList,
} from '../../flow/store/event/contactActionLazy'

const eventDefaults = {
  start: moment(),
  end: moment(),
  allDay: false,
  hexColor: '#265985',
  reminderTime: 10,
  reminderTimeUnit: 'minutes',
}

export default connect(
  (state, redux) => {
    console.log('[ConnectedEventDetails]', state)
    const { GuestList } = state.lazy
    const { currentEvent, currentEventType } = state.events
    const inviteError = state.events.inviteError
    const inviteSuccess = state.events.inviteSuccess
    const addingConferencing = state.events.addingConferencing
    const removingConferencing = state.events.removingConferencing
    const richNotifEnabled = state.events.richNotifEnabled
    const richNofifExclude = state.events.richNofifExclude

    return {
      inviteError,
      inviteSuccess,
      views: { GuestList },
      eventDetail: Object.assign({}, eventDefaults, currentEvent),
      eventType: currentEventType,
      addingConferencing,
      removingConferencing,
      richNotifEnabled,
      richNofifExclude,
    }
  },
  (dispatch, redux) => {
    return {
      unsetCurrentEvent: () => {
        dispatch(unsetCurrentEvent())
      },
      loadGuestList: (guests, asyncReturn) => {
        const contacts = redux.store.getState().events.contacts
        loadGuestList(guests, contacts, asyncReturn)
      },
      updateCurrentEvent: eventDetail => {
        dispatch(setCurrentEvent(eventDetail))
      },
      sendInvites: (eventInfo, guests, actionType) =>
        dispatch(sendInvites(eventInfo, guests)).then(() => {
          let { allEvents } = redux.store.getState().events
          if (actionType === 'add' || actionType === 'edit') {
            allEvents[eventInfo.uid] = eventInfo
          }
          dispatch(saveAllEvents(allEvents))
        }),
      unsetInviteError: () => {
        dispatch(unsetCurrentInvites())
      },
      deleteEvent: obj => dispatch(deleteEvent(obj)),
      addEvent: obj => {
        dispatch(addEvent(obj))
      },
      updateEvent: obj => dispatch(updateEvent(obj)),
      createConferencingRoom: (eventDetail, guests) =>
        dispatch(createConferencingRoom(eventDetail, guests)),
      removeConferencingRoom: obj => dispatch(removeConferencingRoom(obj)),
    }
  }
)
