import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import moment from 'moment'
import { Card, ProgressBar, Button, Alert } from 'react-bootstrap'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import queryString from 'query-string'
// Containers
import EventDetailsContainer from '../../containers/EventDetails'

let localizer = momentLocalizer(moment)

class PublicCalendar extends Component {
	constructor(props) {
		super(props)
		this.bound = [].reduce((acc, d) => {
			acc[d] = this[d].bind(this)
			return acc
		}, {})
	}

	componentWillMount() {
		if (this.props.public) {
			const query = queryString.parse(this.props.location.search)
			const calendarName = query.c
			if (
				calendarName &&
				this.props.events.user &&
				this.props.events.user.username &&
				this.props.events.user.username.length > 0
			) {
				if (calendarName.endsWith(this.props.events.user.username)) {
					this.props.showMyPublicCalendar(calendarName)
				} else {
					this.props.viewPublicCalendar(calendarName)
				}
			} else {
				this.props.history.replace('/')
			}
		}
	}

	eventStyle(event, start, end, isSelected) {
		var bgColor = event && event.hexColor ? event.hexColor : '#265985'
		var style = {
			backgroundColor: bgColor,
			borderColor: 'white',
		}
		return {
			style: style,
		}
	}

	getEventStart(eventInfo) {
		return eventInfo ? new Date(eventInfo.start) : new Date()
	}

	getEventEnd(eventInfo) {
		return eventInfo && (eventInfo.end || eventInfo.calculatedEndTime)
			? eventInfo.end
				? new Date(eventInfo.end)
				: new Date(eventInfo.calculatedEndTime)
			: new Date()
	}

	render() {
		console.log('[PublicCalendar.render]', this.props)
		const {
			signedIn,
			myPublicCalendar,
			myPublicCalendarIcsUrl,
			publicCalendar,
			publicCalendarEvents,
			currentCalendarLength,
			currentCalendarIndex,
			eventModal,
			showError,
			error,
			showSettingsAddCalendar,
			markErrorAsRead,
		} = this.props
		const {
			handleEditEvent,
			handleAddEvent,
			handleViewAllCalendars,
		} = this.bound

		let events = Object.values(this.props.events.allEvents)
		let shareUrl = null
		if (myPublicCalendar) {
			events = events.filter(e => e.public && e.calendarName === 'default')
			shareUrl =
				window.location.origin + '/?intent=view&name=' + myPublicCalendar
		} else if (publicCalendarEvents) {
			events = publicCalendarEvents
			shareUrl =
				window.location.origin + '/?intent=addics&url=' + publicCalendar
		}

		const calendarView = (
			<div>
				<div style={{ height: 8 }}>
					{currentCalendarLength && (
						<ProgressBar
							animated
							variant="success"
							style={{ height: 8 }}
							now={currentCalendarIndex + 1}
							max={currentCalendarLength}
						/>
					)}
				</div>
				<Calendar
					localizer={localizer}
					selectable={
						this.props.signedIn && !myPublicCalendar && !publicCalendar
					}
					events={events}
					step={60}
					showMultiDayTimes
					defaultDate={new Date(moment())}
					onSelectEvent={event => handleEditEvent(event)}
					onSelectSlot={slotInfo => handleAddEvent(slotInfo)}
					style={{ minHeight: '500px' }}
					eventPropGetter={this.eventStyle}
					startAccessor={this.getEventStart}
					endAccessor={this.getEventEnd}
				/>
				{showError && (
					<div
						style={{
							position: 'fixed',
							bottom: '10px',
							right: '10px',
							zIndex: '10',
						}}
					>
						<Alert variant="danger" dismissible>
							{error}
							<p>
								<Button onClick={() => showSettingsAddCalendar()}>
									Go to settings
								</Button>
								<span> or </span>
								<Button onClick={markErrorAsRead}>Hide this message</Button>
							</p>
						</Alert>
					</div>
				)}
			</div>
		)

		return (
			<div className="body-container">
				{eventModal && <EventDetailsContainer />}
				{(myPublicCalendar || publicCalendar) && (
					<Card>
						<Card.Header>
							Public Calendar {myPublicCalendar}
							{publicCalendar}
							<button
								type="button"
								className="close"
								onClick={handleViewAllCalendars}
							>
								<span aria-hidden="true">×</span>
								<span className="sr-only">Close</span>
							</button>
						</Card.Header>
						{myPublicCalendar && events.length > 0 && (
							<Card.Body>
								Share this url: <a href={shareUrl}>{shareUrl}</a>
								{myPublicCalendarIcsUrl && (
									<span>
										{' '}
										or <a href={myPublicCalendarIcsUrl}> as .ics file</a>
									</span>
								)}
							</Card.Body>
						)}
						{myPublicCalendar && events.length === 0 && (
							<Card.Body>
								No public events yet. Start publishing your events!
							</Card.Body>
						)}
						{publicCalendar && events.length > 0 && signedIn && (
							<Card.Body>
								<a href={shareUrl}>Add to my calandars</a>
							</Card.Body>
						)}
						<Card.Body>{calendarView}</Card.Body>
					</Card>
				)}
			</div>
		)
	}
}

PublicCalendar.propTypes = {
	location: PropTypes.object,
	public: PropTypes.bool,
	showMyPublicCalendar: PropTypes.func,
}

export default PublicCalendar
