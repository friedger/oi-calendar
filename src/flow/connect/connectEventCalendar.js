import { connect } from 'react-redux'

import { setCurrentEvent } from '../store/event/eventAction'
import {
  showAllCalendars,
  hideInstructions,
  setError,
} from '../store/event/eventActionLazy'

import { showSettingsAddCalendar } from '../store/event/calendarActionLazy'

export default connect(
  (state, redux) => {
    const { events, auth } = state
    const { EventDetails } = state.lazy
    const signedIn = !!auth.user
    console.log('[CALENDAR_REDUX]', events)
    const {
      currentEvent,
      currentEventType,
      myPublicCalendar,
      myPublicCalendarIcsUrl,
      publicCalendarEvents,
      publicCalendar,
      showInstructions,
      currentCalendarIndex,
      currentCalendarLength,
      currentError,
    } = events || {}

    let eventModal
    if (currentEvent) {
      const eventType = currentEventType || 'view' // "add", "edit"
      const eventInfo = currentEvent
      eventModal = { eventType, eventInfo }
    }

    const showGeneralInstructions = showInstructions
      ? showInstructions.general
      : false

    let showError = currentError && currentError.msg
    let error = currentError ? currentError.msg : null
    return {
      events,
      signedIn,
      views: {
        EventDetails,
      },
      eventModal,
      currentEvent,
      currentEventType,
      myPublicCalendar,
      myPublicCalendarIcsUrl,
      publicCalendarEvents,
      publicCalendar,
      showGeneralInstructions,
      currentCalendarIndex,
      currentCalendarLength,
      showError,
      error,
    }
  },
  dispatch => {
    return {
      initializeLazyActions: () => {},
      showAllCalendars: () => {
        dispatch(showAllCalendars())
      },
      hideInstructions: () => {
        dispatch(hideInstructions())
      },
      showSettingsAddCalendar: url => {
        dispatch(showSettingsAddCalendar(url))
      },
      pickEventModal: eventModal => {
        console.log('[pickEventModal]', eventModal)
        const {
          eventType: currentEventType,
          eventInfo: currentEvent,
        } = eventModal
        dispatch(setCurrentEvent(currentEvent, currentEventType))
      },
      markErrorAsRead: () => {
        dispatch(setError())
      },
    }
  }
)
