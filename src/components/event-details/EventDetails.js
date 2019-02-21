import React, { Component } from 'react'
import { Modal, Button } from 'react-bootstrap'

// Styles
import '../../css/datetime.css'
import '../../css/EventDetails.css'

export function checkHasGuests(str) {
  if (!str || !str.length) {
    return false
  }
  const guests = str.split(/[,\s]+/g)
  return guests.filter(g => g.length > 0).length > 0
}

class EventDetails extends Component {
  constructor(props) {
    super(props)
    this.bound = ['handleClose'].reduce((acc, d) => {
      acc[d] = this[d].bind(this)
      delete this[d]
      return acc
    }, {})
  }
  handleClose() {
    console.log('HANDLE_CLOSE')
    const { unsetCurrentEvent } = this.props
    unsetCurrentEvent()
  }

  render() {
    const {
      views,
      addingConferencing,
      removingConferencing,
      richNofifExclude,
      createConferencingRoom,
      removeConferencingRoom,
    } = this.props
    const { EventDetailsBody, EventDetailsFooter } = views

    const { handleClose } = this.bound
    return (
      <Modal
        size="lg"
        show
        onHide={handleClose}
        centered
        style={{ height: '100%' }}
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title">Event Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <EventDetailsBody
            addingConferencing={addingConferencing}
            removingConferencing={removingConferencing}
            richNofifExclude={richNofifExclude}
            createConferencingRoom={createConferencingRoom}
            removeConferencingRoom={removeConferencingRoom}
          />
        </Modal.Body>
        <Modal.Footer>
          <EventDetailsFooter handleClose={handleClose} />
          <Button onClick={handleClose}>Close</Button>
        </Modal.Footer>
      </Modal>
    )
  }
}

export default EventDetails
