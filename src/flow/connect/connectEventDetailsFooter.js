import { connect } from 'react-redux'
import moment from 'moment'

import { setCurrentEvent, unsetCurrentEvent } from '../store/event/eventAction'

import {
  addEvent,
  deleteEvent,
  updateEvent,
  saveAllEvents,
} from '../store/event/eventActionLazy'

import {
  sendInvites,
  unsetCurrentInvites,
} from '../store/event/contactActionLazy'

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
    console.log('[ConnectedEventDetailsFooter]', state)
    const { currentEvent, currentEventType } = state.events
    const { GuestList } = state.lazy

    return {
      eventDetail: Object.assign({}, eventDefaults, currentEvent),
      eventType: currentEventType,
      views: { GuestList },
    }
  },
  (dispatch, redux) => {
    return {
      unsetCurrentEvent: () => {
        dispatch(unsetCurrentEvent())
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
    }
  }
)
