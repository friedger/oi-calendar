import React, { Component } from 'react'
import { Button } from 'react-bootstrap'

import Calendars from './Calendars'
import Contacts from './Contacts'
import Notifications from './Notifications'

class SettingsPage extends Component {
	render() {
		const {
			CalendarsContent,
			ContactsContent,
			NotificationsContent,
			handleHide,
		} = this.props
		return (
			<div
				className="body-container"
				style={{ textAlign: 'left', marginTop: '10px' }}
			>
				<h4>Settings</h4>

				{CalendarsContent}
				{ContactsContent}
				{NotificationsContent}
				<Button onClick={handleHide}>Done</Button>
			</div>
		)
	}
}

export default class Settings extends Component {
	componentWillMount() {
		this.props.showSettings()
	}
	render() {
		const {
			// show,
			handleHide,
			calendars,
			addCalendarUrl,
			contacts,
			addCalendar,
			deleteCalendars,
			setCalendarData,
			lookupContacts,
			addContact,
			deleteContacts,
			followContact,
			unfollowContact,
			user,
			verifyNewCalendar,
			verifiedNewCalendarData,
			allNotifEnabled,
			richNotifEnabled,
			richNofifExclude,
			richNotifError,
			chatStatus,
			enableAllNotif,
			disableAllNotif,
			enableRichNotif,
			disableRichNotif,
			saveRichNotifExcludeGuests,
		} = this.props
		const CalendarsContent = (
			<div>
				<Calendars
					items={calendars}
					addItem={addCalendar}
					deleteItems={deleteCalendars}
					setItemData={setCalendarData}
					valueOfAdd={addCalendarUrl}
					user={user}
					verifyNewCalendar={verifyNewCalendar}
					verifiedNewCalendarData={verifiedNewCalendarData}
				/>
			</div>
		)

		const ContactsContent = (
			<div>
				<Contacts
					items={Object.values(contacts || {})}
					lookupContacts={lookupContacts}
					addItem={addContact}
					deleteItems={deleteContacts}
					followItem={followContact}
					unfollowItem={unfollowContact}
					user={user}
					calendars={calendars}
				/>
			</div>
		)

		const NotificationsContent = (
			<div>
				<Notifications
					allNotifEnabled={allNotifEnabled}
					richNotifEnabled={richNotifEnabled}
					richNofifExclude={richNofifExclude}
					richNotifError={richNotifError}
					enableAllNotif={enableAllNotif}
					disableAllNotif={disableAllNotif}
					enableRichNotif={enableRichNotif}
					disableRichNotif={disableRichNotif}
					saveRichNotifExcludeGuests={saveRichNotifExcludeGuests}
					chatStatus={chatStatus}
				/>
			</div>
		)

		return (
			<SettingsPage
				CalendarsContent={CalendarsContent}
				ContactsContent={ContactsContent}
				NotificationsContent={NotificationsContent}
				handleHide={() => handleHide(this.props.history)}
			/>
		)
	}
}
