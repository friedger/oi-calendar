import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Button, FormCheck, Row, Col, Container } from 'react-bootstrap'
import moment from 'moment'

// Styles
import '../../css/datetime.css'
import '../../css/EventDetails.css'

const Datetime = require('react-datetime')
// TODO this should not be exported as it is only for UI
// the eventDetail needs to hold the guests as array
export function guestsStringToArray(guestsString) {
  if (!guestsString || !guestsString.length) {
    return []
  }
  const guests = guestsString.split(/[,\s]+/g)
  return guests.filter(g => g.length > 0).map(g => g.toLowerCase())
}

export default class EventDetailsBody extends Component {
  constructor(props) {
    super(props)

    const { eventDetail } = props

    this.state = {
      sending: false,
      endDateOrDuration:
        eventDetail && eventDetail.duration ? 'duration' : 'endDate',
      addingConferencing: false,
      removingConferencing: false,
    }

    this.bound = [
      'handleDataChange',
      'handleEndDateOrDurationChange',
      'addConferencing',
      'removeConferencing',
    ].reduce((acc, d) => {
      acc[d] = this[d].bind(this)
      delete this[d]
      return acc
    }, {})
  }

  handleDataChange(e, ref) {
    var { eventDetail } = this.props
    var val = ''
    if (ref !== 'allDay' && ref !== 'public') {
      if (ref === 'start' || ref === 'end') {
        val = new Date(moment(e))
      } else {
        val = e.target.value
      }
    } else {
      val = e.target.checked
    }

    eventDetail[ref] = val

    if (ref === 'allDay' && val) {
      this.handleEndDateOrDurationChange(e, 'endDate')
    }

    this.setState({ eventDetail })
  }

  handleEndDateOrDurationChange(e, ref) {
    var { eventDetail } = this.props

    if (ref === 'duration') {
      eventDetail['duration'] = eventDetail.duration
        ? eventDetail.duration
        : '00:00'
    } else {
      eventDetail['duration'] = null
    }

    this.setState({
      endDateOrDuration: ref,
      eventDetail,
    })
  }

  addConferencing() {
    const { createConferencingRoom, eventDetail } = this.props
    const { guests } = this.state
    console.log('add conferencing')
    createConferencingRoom(eventDetail, guestsStringToArray(guests))
  }

  removeConferencing() {
    const { removeConferencingRoom } = this.props
    console.log('remove conferencing')
    removeConferencingRoom()
  }

  render() {
    console.log('[EVENDETAILSBody.render]', this.props)
    const { endDateOrDuration } = this.state
    const {
      eventDetail,
      addingConferencing,
      removingConferencing,
      richNofifExclude,
    } = this.props
    const {
      handleDataChange,
      handleEndDateOrDurationChange,
      addConferencing,
      removeConferencing,
    } = this.bound

    function renderEndComponent() {
      return eventDetail.allDay ? (
        <Datetime
          value={eventDetail.end}
          dateFormat="MM-DD-YYYY"
          timeFormat={false}
          onChange={e => handleDataChange(e, 'end')}
        />
      ) : (
        <Datetime
          value={eventDetail.end}
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
          value={eventDetail.duration || ''}
          onChange={e => handleDataChange(e, 'duration')}
        />
      )
    }

    function getLabelForReminder() {
      var isEnriched = false
      let array = guestsStringToArray(eventDetail.guests)

      if (richNofifExclude) {
        array.forEach(e => {
          if (!richNofifExclude.includes(e)) {
            isEnriched = true
          }
        })
      }

      return isEnriched ? 'Enriched Notification' : 'Set Reminder'
    }

    return (
      <Container fluid>
        <Row>
          <Col xs={12}>
            <label> Event Name </label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter the Event Name"
              ref="title"
              value={eventDetail.title || ''}
              onChange={e => handleDataChange(e, 'title')}
            />
          </Col>
        </Row>
        <Row>
          <Col xs={12}>
            <label> Start Date </label>
            {eventDetail.allDay ? (
              <Datetime
                value={eventDetail.start}
                dateFormat="MM-DD-YYYY"
                timeFormat={false}
                onChange={e => handleDataChange(e, 'start')}
              />
            ) : (
              <Datetime
                value={eventDetail.start}
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
              disabled={eventDetail.allDay}
              inline
            />
          </Col>
        </Row>
        <Row>
          <Col xs={12}>
            <div className="reminder-container">
              <label> {getLabelForReminder()} </label>

              <div className="reminder-group">
                <input
                  type="number"
                  className="form-control"
                  placeholder="10"
                  ref="reminderTime"
                  value={eventDetail.reminderTime}
                  onChange={e => handleDataChange(e, 'reminderTime')}
                />

                <select
                  value={eventDetail.reminderTimeUnit}
                  onChange={e => handleDataChange(e, 'reminderTimeUnit')}
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                </select>
              </div>
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
              value={eventDetail.notes || ''}
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
              value={eventDetail.guests || ''}
              onChange={e => handleDataChange(e, 'guests')}
            />
          </Col>
          <Col sm={4} xs={12}>
            <div style={{ marginTop: '10px', marginBottom: '10px' }}>
              {!eventDetail.url ? (
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
                    href={eventDetail.url}
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
              value={eventDetail.allDay}
              checked={eventDetail.allDay}
              onChange={e => handleDataChange(e, 'allDay')}
              style={{ marginRight: '5px', marginLeft: '5px' }}
            />
            <label> All Day </label>
            <input
              type="checkBox"
              name="public"
              value={eventDetail.public}
              checked={eventDetail.public}
              onChange={e => handleDataChange(e, 'public')}
              style={{ marginRight: '5px', marginLeft: '5px' }}
            />
            <label> Public </label>
          </Col>
        </Row>
      </Container>
    )
  }
}

EventDetailsBody.propTypes = {
  eventDetail: PropTypes.object,
  createConferencingRoom: PropTypes.func,
  removeConferencingRoom: PropTypes.func,
}
