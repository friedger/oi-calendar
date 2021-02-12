import React, { Component } from 'react'
import { Form, Card, ProgressBar } from 'react-bootstrap'
import { renderMatrixError } from '../EventDetails'
const guestsStringToArray = function(guestsString) {
  if (!guestsString || !guestsString.length) {
    return []
  }
  const guests = guestsString.split(/[,\s]+/g)
  return guests.filter(g => g.length > 0).map(g => g.toLowerCase())
}

export default class Notifications extends Component {
  constructor(props) {
    super(props)

    const { allNotifEnabled, richNotifEnabled, richNofifExclude } = this.props

    this.state = {
      richNofifExclude: richNofifExclude ? richNofifExclude.join(',') : '',
      richNotifEnabled,
      allNotifEnabled,
    }
  }
  handleAllNotificationsChange = event => {
    const { enableAllNotif, disableAllNotif } = this.props
    const checked = event.target.checked
    this.setState({ allNotifEnabled: checked })
    console.log({ checked })
    if (checked) {
      enableAllNotif()
    } else {
      disableAllNotif()
    }
  }

  handleEnrichedNotificationsChange = event => {
    const { enableRichNotif, disableRichNotif } = this.props
    if (event.target.checked) {
      enableRichNotif()
    } else {
      disableRichNotif()
    }
  }

  handleExcludedGuestsChange = event => {
    const { saveRichNotifExcludeGuests } = this.props
    saveRichNotifExcludeGuests(guestsStringToArray(event.target.value))
  }

  renderBody = () => {
    const { allNotifEnabled, richNotifEnabled, richNofifExclude } = this.state
    const { richNotifError, chatStatus } = this.props
    console.log({ allNotifEnabled })
    const checkingChatStatus = chatStatus === 'checking'
    const richNotifErrorMsg = richNotifError
      ? renderMatrixError('Rich notifications not allowed.', richNotifError)
      : []
    return (
      <Form>
        <Form.Group controlId="formBasicChecbox">
          <Form.Check
            type="checkbox"
            label="Use browser notifications"
            defaultChecked={allNotifEnabled}
            onChange={this.handleAllNotificationsChange}
          />
        </Form.Group>
        <Form.Group controlId="formBasicChecbox">
          <Form.Check
            type="checkbox"
            label="Enable Enriched Notifications"
            defaultChecked={richNotifEnabled}
            onChange={this.handleEnrichedNotificationsChange}
          />
        </Form.Group>
        <Form.Group controlId="formEcludedGuests">
          <Form.Label>Excluded guests</Form.Label>
          <Form.Control
            type="email"
            defaultValue={richNofifExclude}
            placeholder="bob.id, alice.id.blockstack, ..."
            onBlur={this.handleExcludedGuestsChange}
          />
        </Form.Group>
        {checkingChatStatus && (
          <>
            Connecting to OI Chat ..
            <ProgressBar animated now={50} />
          </>
        )}
        {richNotifError && <>{richNotifErrorMsg}</>}
      </Form>
    )
  }

  render() {
    return (
      <Card style={{}}>
        <Card.Header>Notifications</Card.Header>
        <Card.Body>{this.renderBody()}</Card.Body>
      </Card>
    )
  }
}
