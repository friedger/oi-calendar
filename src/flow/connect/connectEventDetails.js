import { connect } from 'react-redux'

import { unsetCurrentEvent } from '../store/event/eventAction'

export default connect(
  (state, redux) => {
    console.log('[ConnectedEventDetails]', state)
    const { EventDetailsBody, EventDetailsFooter } = state.lazy
    return {
      views: { EventDetailsBody, EventDetailsFooter },
    }
  },
  (dispatch, redux) => {
    return {
      unsetCurrentEvent: () => {
        dispatch(unsetCurrentEvent())
      },
    }
  }
)
