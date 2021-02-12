import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Modal, Button, FormCheck, Row, Col, Container } from 'react-bootstrap'
import moment from 'moment'

// Styles
import '../../css/datetime.css'
import '../../css/EventDetails.css'

const Datetime = require('react-datetime')

// TODO this should not be exported as it is only for UI
// the eventDetails needs to hold the guests as array
export function guestsStringToArray(guestsString) {
	if (!guestsString || !guestsString.length) {
		return []
	}
	const guests = guestsString.split(/[,\s]+/g)
	return guests.filter(g => g.length > 0).map(g => g.toLowerCase())
}

export function renderMatrixError(topicMsg, error) {
	if (error.errcode === 'M_CONSENT_NOT_GIVEN') {
		var linkUrl = error.data.consent_uri
		return (
			<div>
				{topicMsg} Please review and accept{' '}
				<a target="_blank" rel="noopener noreferrer" href={linkUrl}>
					the T&amp;C of your chat provider
				</a>{' '}
				openintents.modular.im (OI Chat)
			</div>
		)
	} else {
		return <div>{error.message}</div>
	}
}

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

		const {
			currentEvent,
			inviteStatus,
			inviteError,
			inviteSuccess,
			showModal,
		} = props

		this.state = {
			showModal: showModal,
			showInvitesModal:
				(!!inviteSuccess && !inviteSuccess) || !!inviteError || !!inviteStatus,
			sending: false,
			eventDetails: currentEvent,
			endDateOrDuration:
				currentEvent && currentEvent.duration ? 'duration' : 'endDate',
			addingConferencing: false,
			removingConferencing: false,
			calendarName: 'default',
		}

		this.bound = [
			'handleDataChange',
			'handleEndDateOrDurationChange',
			'handleClose',
			'popInvitesModal',
			'addEvent',
			'updateEvent',
			'deleteEvent',
			'updateEndDateFromDuration',
			'addConferencing',
			'removeConferencing',
		].reduce((acc, d) => {
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

	handleDataChange(e, ref) {
		var { eventDetails } = this.state
		var val = ''
		if (ref !== 'allDay' && ref !== 'public' && ref !== 'reminderEnabled') {
			if (ref === 'start' || ref === 'end') {
				val = new Date(moment(e))
			} else {
				val = e.target.value
			}
		} else {
			val = e.target.checked
		}

		eventDetails[ref] = val

		if (ref === 'allDay' && val) {
			this.handleEndDateOrDurationChange(e, 'endDate')
		}

		if (ref === 'reminderEnabled') {
			this.handleRemindersEnabled(val)
		}

		this.setState({ eventDetails })
	}

	handleEndDateOrDurationChange(e, ref) {
		var { eventDetails } = this.state

		if (ref === 'duration') {
			eventDetails['duration'] = eventDetails.duration
				? eventDetails.duration
				: '00:00'
		} else {
			eventDetails['duration'] = null
		}

		this.setState({
			endDateOrDuration: ref,
			eventDetails,
		})
	}

	handleRemindersEnabled(val) {
		const { showRemindersModal } = this.props
		console.log('notif permission', Notification.permission)
		if (val && Notification.permission !== 'granted') {
			showRemindersModal(true)
		}
	}

	updateEndDateFromDuration() {
		const { eventDetails } = this.state

		if (eventDetails.duration) {
			eventDetails['calculatedEndTime'] = moment(eventDetails.start).add(
				moment.duration(eventDetails.duration)
			)
			eventDetails['end'] = null
		}
	}

	addEvent() {
		const { addEvent, calendars } = this.props
		const { eventDetails, calendarName } = this.state
		const {
			popInvitesModal,
			handleClose,
			updateEndDateFromDuration,
		} = this.bound
		const { guests, noInvites } = eventDetails

		this.handleRemindersEnabled(eventDetails.reminderEnabled)
		updateEndDateFromDuration()

		const privateCalendar = calendars.find(
			c => c.type === 'private' && c.name === 'default'
		)
		if (privateCalendar) {
			eventDetails.hexColor = privateCalendar.hexColor
		}
		eventDetails.calendarName = calendarName

		console.log('add event', eventDetails, checkHasGuests(guests))
		if (noInvites || !checkHasGuests(guests)) {
			addEvent(eventDetails)
			handleClose()
		} else {
			popInvitesModal(eventDetails)
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

	updateEvent(eventDetails) {
		console.log('[updateEvent]', eventDetails)
		const { handleClose, updateEndDateFromDuration } = this.bound
		const { updateEvent } = this.props
		this.handleRemindersEnabled(eventDetails.reminderEnabled)

		updateEndDateFromDuration()

		updateEvent(eventDetails)
		handleClose()
	}

	popInvitesModal(eventDetails) {
		const { popSendInvitesModal } = this.props
		popSendInvitesModal(eventDetails)
	}

	addConferencing() {
		const { createConferencingRoom } = this.props
		const { eventDetails } = this.state
		const { guests } = this.state
		console.log('add conferencing')
		createConferencingRoom(eventDetails, guestsStringToArray(guests))
	}

	removeConferencing() {
		const { removeConferencingRoom } = this.props
		const { eventDetails } = this.state
		console.log('remove conferencing')
		removeConferencingRoom(eventDetails, eventDetails.url)
	}

	render() {
		console.log('[EVENDETAILS.render]', this.props)
		const { endDateOrDuration, eventDetails } = this.state
		const { handleClose } = this.bound
		const {
			editMode,
			addingConferencing,
			removingConferencing,
			allNotifEnabled,
			richNotifEnabled,
			richNofifExclude,
		} = this.props
		const {
			handleDataChange,
			handleEndDateOrDurationChange,
			popInvitesModal,
			addEvent,
			updateEvent,
			deleteEvent,
			addConferencing,
			removeConferencing,
		} = this.bound
		const hasGuests = checkHasGuests(eventDetails.guests)

		function renderEndComponent() {
			return eventDetails.allDay ? (
				<Datetime
					value={eventDetails.end}
					dateFormat="MM-DD-YYYY"
					timeFormat={false}
					onChange={e => handleDataChange(e, 'end')}
				/>
			) : (
				<Datetime
					value={eventDetails.end}
					onChange={e => handleDataChange(e, 'end')}
				/>
			)
		}

		function renderDurationComponent() {
			return (
				<input
					type="text"
					className="form-control"
					placeholder="Enter the Event Duration"
					ref="duration"
					value={eventDetails.duration || ''}
					onChange={e => handleDataChange(e, 'duration')}
				/>
			)
		}

		function getLabelForReminder() {
			var isEnriched = false
			if (richNotifEnabled) {
				let array = guestsStringToArray(eventDetails.guests)

				if (richNofifExclude) {
					array.forEach(e => {
						if (!richNofifExclude.includes(e)) {
							isEnriched = true
						}
					})
				} else {
					isEnriched = array.length > 0
				}
			}

			return isEnriched
				? 'Set Reminder with Enriched Notification'
				: 'Set Reminder'
		}

		return (
			<Modal size="lg" show onHide={handleClose} centered animation={false}>
				<Modal.Header closeButton>
					<Modal.Title id="contained-modal-title">Event Details</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<Container fluid>
						<Row>
							<Col xs={12}>
								<label> Event Name </label>
								<input
									type="text"
									className="form-control"
									placeholder="Enter the Event Name"
									ref="title"
									value={eventDetails.title || ''}
									onChange={e => handleDataChange(e, 'title')}
								/>
							</Col>
						</Row>
						<Row>
							<Col xs={12}>
								<label> Start Date </label>
								{eventDetails.allDay ? (
									<Datetime
										value={eventDetails.start}
										dateFormat="MM-DD-YYYY"
										timeFormat={false}
										onChange={e => handleDataChange(e, 'start')}
									/>
								) : (
									<Datetime
										value={eventDetails.start}
										onChange={e => handleDataChange(e, 'start')}
									/>
								)}
							</Col>
						</Row>
						<Row>
							<Col xs={12} sm={8}>
								{endDateOrDuration === 'endDate' ? (
									<div>
										<label> End Date </label>
										{renderEndComponent()}
									</div>
								) : (
									<div>
										<label> Duration </label>
										{renderDurationComponent()}
									</div>
								)}
							</Col>
							<Col xs={12} sm={4}>
								<FormCheck
									type="radio"
									name="endDateOrDuration"
									label="Use End Date"
									checked={endDateOrDuration === 'endDate' ? 'checked' : ''}
									onChange={e => handleEndDateOrDurationChange(e, 'endDate')}
									inline
								/>
								<FormCheck
									type="radio"
									name="endDateOrDuration"
									label="Use Duration"
									checked={endDateOrDuration === 'duration' ? 'checked' : ''}
									onChange={e => handleEndDateOrDurationChange(e, 'duration')}
									disabled={eventDetails.allDay}
									inline
								/>
							</Col>
						</Row>
						<Row>
							<Col xs={12}>
								<label> {getLabelForReminder()} </label>
								<input
									type="checkBox"
									name="reminderEnabled"
									value={eventDetails.reminderEnabled}
									checked={eventDetails.reminderEnabled}
									onChange={e => handleDataChange(e, 'reminderEnabled')}
									style={{ marginRight: '5px', marginLeft: '5px' }}
								/>
								<label> Enabled </label>
								<div className="reminder-group">
									<input
										type="number"
										className="form-control"
										placeholder="10"
										ref="reminderTime"
										value={eventDetails.reminderTime}
										onChange={e => handleDataChange(e, 'reminderTime')}
									/>

									<select
										value={eventDetails.reminderTimeUnit}
										onChange={e => handleDataChange(e, 'reminderTimeUnit')}
									>
										<option value="minutes">Minutes</option>
										<option value="hours">Hours</option>
									</select>
								</div>
							</Col>
						</Row>

						<Row>
							<Col xs={12}>
								<label> Event Notes </label>
								<textarea
									className="form-control"
									placeholder="Event Notes"
									ref="notes"
									value={eventDetails.notes || ''}
									onChange={e => handleDataChange(e, 'notes')}
								/>
							</Col>
						</Row>
						<Row>
							<Col sm={8} xs={12}>
								<label> Guests (experimental)</label>
								<textarea
									className="form-control"
									placeholder="bob.id, alice.id.blockstack,.."
									ref="guests"
									value={eventDetails.guests || ''}
									onChange={e => handleDataChange(e, 'guests')}
								/>
							</Col>
							<Col sm={4} xs={12}>
								<div style={{ marginTop: '10px', marginBottom: '10px' }}>
									{!eventDetails.url ? (
										<Button
											variant="primary"
											size="sm"
											onClick={() => addConferencing()}
											disabled={addingConferencing}
										>
											{addingConferencing
												? 'Adding conferencing...'
												: 'Add conferencing'}
										</Button>
									) : (
										<div>
											<Button
												variant="danger"
												size="sm"
												onClick={() => removeConferencing()}
												disabled={removingConferencing}
											>
												{removingConferencing
													? 'Removing conferencing...'
													: 'Remove conferencing'}
											</Button>
											<Button
												variant="linkUrl"
												href={eventDetails.url}
												target="_blank"
											>
												Open conferencing
											</Button>
										</div>
									)}
								</div>
							</Col>
						</Row>
						<Row>
							<Col xs={12}>
								<input
									type="checkBox"
									name="all_Day"
									value={eventDetails.allDay}
									checked={eventDetails.allDay}
									onChange={e => handleDataChange(e, 'allDay')}
									style={{ marginRight: '5px', marginLeft: '5px' }}
								/>
								<label> All Day </label>
							</Col>
						</Row>
						{!allNotifEnabled && (
							<Row>
								<Col xs={12}>
									<small>Browser notifaction settings are ignored.</small>
								</Col>
							</Row>
						)}
					</Container>
				</Modal.Body>
				<Modal.Footer>
					{editMode === 'add' && (
						<Button variant="success" onClick={addEvent}>
							Add
						</Button>
					)}
					{editMode === 'edit' && (
						<React.Fragment>
							<Button
								variant="warning"
								disabled={!hasGuests}
								onClick={() => popInvitesModal(eventDetails)}
							>
								Send Invites
							</Button>
							<Button
								variant="warning"
								onClick={() => updateEvent(eventDetails)}
							>
								Update
							</Button>
							<Button
								variant="danger"
								onClick={() => deleteEvent(eventDetails)}
							>
								Delete
							</Button>
						</React.Fragment>
					)}
					<Button onClick={handleClose}>Close</Button>
				</Modal.Footer>
			</Modal>
		)
	}
}

EventDetails.propTypes = {
	currentEvent: PropTypes.object.isRequired,
	inviteError: PropTypes.instanceOf(Error),
	inviteSuccess: PropTypes.bool,
	showModal: PropTypes.bool,
	richNotifEnabled: PropTypes.bool,
	calendars: PropTypes.array,
	showRemindersModal: PropTypes.func,
}

export default EventDetails
