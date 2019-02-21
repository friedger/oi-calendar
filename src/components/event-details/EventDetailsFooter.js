import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Button } from 'react-bootstrap'
import moment from 'moment'
import { checkHasGuests } from './EventDetails'
import { guestsStringToArray } from './EventDetailsBody'
import SendInvitesModal from './SendInvitesModal'

export default class EventDetailsFooter extends Component {
  constructor(props) {
    super(props)
    const { inviteError, inviteSuccess } = props

    this.state = {
      showInvitesModal: (!!inviteSuccess && !inviteSuccess) || !!inviteError,
      sending: false,
    }

    this.bound = [
      'handleInvitesHide',
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
    const { inviteSuccess, inviteError } = this.props

    console.log('nextProp', nextProps)
    const notProcessedYet = (!!inviteSuccess && !inviteSuccess) || !!inviteError
    this.setState({
      showInvitesModal: showInvitesModal && notProcessedYet,
      sending: sending && notProcessedYet,
    })
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
    const { addEvent, eventDetail, handleClose } = this.props
    const { popInvitesModal, updateEndDateFromDuration } = this.bound
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
    const { deleteEvent, handleClose } = this.props
    deleteEvent(obj)
    handleClose()
  }

  updateEvent(eventDetail) {
    console.log('[updateEvent]', eventDetail)
    const { updateEndDateFromDuration } = this.bound
    const { updateEvent, handleClose } = this.props

    updateEndDateFromDuration()

    updateEvent(eventDetail)
    handleClose()
  }

  render() {
    const {
      views,
      eventType,
      eventDetail,
      inviteError,
      loadGuestList,
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

    const { sending, showInvitesModal } = this.state
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

    return (
      <>
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
            <Button variant="warning" onClick={() => updateEvent(eventDetail)}>
              Update
            </Button>
            <Button variant="danger" onClick={() => deleteEvent(eventDetail)}>
              Delete
            </Button>

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
          </>
        )}
      </>
    )
  }
}

EventDetailsFooter.propTypes = {
  eventType: PropTypes.string,
  eventDetail: PropTypes.object,
  loadGuestList: PropTypes.func,
  views: PropTypes.any,
}
