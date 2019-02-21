import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Modal, Button } from 'react-bootstrap'
import moment from 'moment'

import SendInvitesModal from './SendInvitesModal'
import EventDetailsBody, { guestsStringToArray } from './EventDetailsBody'

// Styles
import '../../css/datetime.css'
import '../../css/EventDetails.css'

function checkHasGuests(str) {
  if (!str || !str.length) {
    return false
  }
  const guests = str.split(/[,\s]+/g)
  return guests.filter(g => g.length > 0).length > 0
}

class EventDetails extends Component {
  constructor(props) {
    super(props)

    const { eventDetail, inviteError, inviteSuccess } = props

    this.state = {
      showInvitesModal: (!!inviteSuccess && !inviteSuccess) || !!inviteError,
      sending: false,
      endDateOrDuration:
        eventDetail && eventDetail.duration ? 'duration' : 'endDate',
      addingConferencing: false,
      removingConferencing: false,
    }

    this.bound = [
      'handleInvitesHide',
      'handleClose',
      'popInvitesModal',
      'sendInvites',
      'addEvent',
      'updateEvent',
      'deleteEvent',
      'updateEndDateFromDuration',
    ].reduce((acc, d) => {
      acc[d] = this[d].bind(this)
      delete this[d]
      return acc
    }, {})
  }

  componentWillReceiveProps(nextProps) {
    const { showInvitesModal, sending } = this.state
    console.log('nextProp', nextProps)
    const notProcessedYet =
      (!!this.props.inviteSuccess && !this.props.inviteSuccess) ||
      !!this.props.inviteError
    this.setState({
      showInvitesModal: showInvitesModal && notProcessedYet,
      sending: sending && notProcessedYet,
    })
  }

  handleClose() {
    console.log('HANDLE_CLOSE')
    const { unsetCurrentEvent } = this.props
    unsetCurrentEvent()
  }

  popInvitesModal(eventDetail) {
    const { loadGuestList } = this.props
    this.setState({ showInvitesModal: true })
    const guestsString = eventDetail.guests
    const guests = guestsStringToArray(guestsString)
    loadGuestList(guests, ({ profiles, contacts }) => {
      this.setState({ guests: profiles })
    })
  }

  handleInvitesHide() {
    const { eventDetail, inviteError, unsetInviteError } = this.props
    this.setState({ showInvitesModal: false })
    unsetInviteError()
    eventDetail.noInvites = !inviteError
  }

  sendInvites() {
    const { sendInvites, eventType, eventDetail } = this.props
    const { guests } = this.state
    this.setState({ sending: true })
    sendInvites(eventDetail, guests, eventType)
  }

  addEvent() {
    const { addEvent, eventDetail } = this.props
    const {
      popInvitesModal,
      handleClose,
      updateEndDateFromDuration,
    } = this.bound
    const { guests, noInvites } = eventDetail

    updateEndDateFromDuration()

    console.log('add event', eventDetail, checkHasGuests(guests))
    if (noInvites || !checkHasGuests(guests)) {
      addEvent(eventDetail)
      handleClose()
    } else {
      popInvitesModal(eventDetail)
    }
  }

  updateEndDateFromDuration() {
    const { eventDetail } = this.props

    if (eventDetail.duration) {
      eventDetail['calculatedEndTime'] = moment(eventDetail.start).add(
        moment.duration(eventDetail.duration)
      )
      eventDetail['end'] = null
    }
  }

  hasGuests(guestsString) {
    return guestsStringToArray(guestsString).length > 0
  }

  deleteEvent(obj) {
    console.log('deleteEvent')
    const { handleClose } = this.bound
    const { deleteEvent } = this.props
    deleteEvent(obj)
    handleClose()
  }

  updateEvent(eventDetail) {
    console.log('[updateEvent]', eventDetail)
    const { handleClose, updateEndDateFromDuration } = this.bound
    const { updateEvent } = this.props

    updateEndDateFromDuration()

    updateEvent(eventDetail)
    handleClose()
  }

  render() {
    const { showInvitesModal, sending } = this.state
    const {
      views,
      inviteError,
      eventType,
      eventDetail,
      loadGuestList,
      addingConferencing,
      removingConferencing,
      richNofifExclude,
      createConferencingRoom,
      removeConferencingRoom,
    } = this.props
    const { GuestList } = views
    const {
      handleInvitesHide,
      popInvitesModal,
      sendInvites,
      addEvent,
      updateEvent,
      deleteEvent,
    } = this.bound
    const hasGuests = checkHasGuests(eventDetail.guests)
    var inviteErrorMsg = []
    if (inviteError) {
      const error = inviteError
      if (error.errcode === 'M_CONSENT_NOT_GIVEN') {
        var linkUrl = error.consent_uri
        inviteErrorMsg = (
          <div>
            Sending not possible. Please review and accept{' '}
            <a target="_blank" rel="noopener noreferrer" href={linkUrl}>
              the T&amp;C of your chat provider
            </a>{' '}
            openintents.modular.im (OI Chat)
          </div>
        )
      }
    }
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
            eventDetail={eventDetail}
            addingConferencing={addingConferencing}
            removingConferencing={removingConferencing}
            richNofifExclude={richNofifExclude}
            createConferencingRoom={createConferencingRoom}
            removeConferencingRoom={removeConferencingRoom}
          />
        </Modal.Body>
        <Modal.Footer>
          {eventType === 'add' && (
            <Button variant="success" onClick={addEvent}>
              Add
            </Button>
          )}
          {eventType === 'edit' && (
            <>
              <Button
                variant="warning"
                disabled={!hasGuests}
                onClick={() => popInvitesModal(eventDetail)}
              >
                Send Invites
              </Button>
              <Button
                variant="warning"
                onClick={() => updateEvent(eventDetail)}
              >
                Update
              </Button>
              <Button variant="danger" onClick={() => deleteEvent(eventDetail)}>
                Delete
              </Button>
            </>
          )}
          <Button onClick={handleClose}>Close</Button>
        </Modal.Footer>

        {showInvitesModal && (
          <SendInvitesModal
            guests={eventDetail.guests}
            title={eventDetail.title}
            showInvitesModal={showInvitesModal}
            handleInvitesHide={handleInvitesHide}
            sending={sending}
            inviteError={inviteError}
            inviteErrorMsg={inviteErrorMsg}
            GuestList={GuestList}
            sendInvites={sendInvites}
            loadGuestList={loadGuestList}
          />
        )}
      </Modal>
    )
  }
}

EventDetails.propTypes = {
  eventDetail: PropTypes.object,
  inviteError: PropTypes.object,
  inviteSuccess: PropTypes.bool,
}
export default EventDetails
