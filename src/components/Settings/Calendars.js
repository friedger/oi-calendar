import React, { Component } from 'react'
import {
  Button,
  Card,
  Row,
  Col,
  DropdownButton,
  Dropdown,
  Alert,
} from 'react-bootstrap'

import AddDeleteSetting from './AddDeleteSetting'

import { uuid, guaranteeHexColor } from '../../core/eventFN'

const DropdownItem = Dropdown.Item

class CalendarItem extends Component {
  constructor(props) {
    super(props)
    const { type, name, disabled, hexColor } = props.item || {}
    const isPrivateDefault = type === 'private' && name === 'default'

    this.state = {
      disabled: disabled || false,
      hexColor: hexColor || '#000000',
      isPrivateDefault,
    }

    this.bound = {
      onColorChange: this.onColorChange.bind(this),
      onVisibilityChange: this.onVisibilityChange.bind(this),
    }
  }

  onVisibilityChange(event) {
    const checked = event.target.checked
    const { item: calendar, idx, onChangeItem } = this.props
    onChangeItem(calendar, { disabled: !checked }, idx)
    this.setState({ disabled: !checked })
  }

  onColorChange(event) {
    const hexColor = event.target.value
    const { item: calendar, idx, onChangeItem } = this.props
    onChangeItem(calendar, { hexColor }, idx)
    this.setState({ hexColor })
  }

  render() {
    const { item: calendar, user } = this.props || {}
    const { hexColor, disabled, isPrivateDefault } = this.state
    const { onColorChange, onVisibilityChange } = this.bound
    var name = (calendar || {}).name
    if (isPrivateDefault) {
      name = 'Your private calendar (' + user.username + ')'
    }
    return (
      <div>
        <input
          type="checkbox"
          checked={!disabled}
          onChange={onVisibilityChange}
        />
        <input
          type="color"
          value={hexColor}
          onChange={onColorChange}
          style={{ marginRight: '20px', marginLeft: '5px' }}
        />

        <label>{name}</label>
        {/* TODO implement editCalendar
        {privateCalendar && (
          <Button variant="light">
            <span className="glyphicon glyphicon-pencil" />
          </Button>
        )}
        */}
      </div>
    )
  }
}

export default class Calendars extends AddDeleteSetting {
  constructor(props) {
    super(props)
    const addPlaceholder = 'e.g. https://calendar.google..../basic.ics'
    this.state.ItemRenderer = CalendarItem
    this.state.addTitle = 'Add Calendar from url'
    this.state.listTitle = 'Calendars'
    this.state.calendarName = ''
    this.state.calendarEvents = 0
    this.state.showFollow = false
    this.state.hexColor = ''
    this.state.isVerified = false
    this.state.menuItems = [
      {
        name: 'US Holidays',
        url:
          'https://www.calendarlabs.com/ical-calendar/ics/76/US_Holidays.ics',
      },
      {
        name: 'India Holidays',
        url:
          'https://www.calendarlabs.com/ical-calendar/ics/33/India_Holidays.ics',
      },
    ]
    const { verifiedNewCalendarData } = this.props
    if (
      verifiedNewCalendarData.status === 'ok' &&
      verifiedNewCalendarData.calendar
    ) {
      this.state.calendarName = verifiedNewCalendarData.calendar.name
      this.state.hexColor = verifiedNewCalendarData.calendar.hexColor
    }
    this.state.addValueToItem = (valueOfAdd, asyncReturn) => {
      let newItem

      let errors = []

      const { items } = this.props
      const names = items.map(d => {
        return d.name
      })
      if (names.includes(valueOfAdd)) {
        errors.push('Calendar already included')
      }

      if (valueOfAdd) {
        if (valueOfAdd.startsWith('http')) {
          newItem = {
            type: 'ics',
            data: { src: valueOfAdd },
          }
        } else {
          const [src, user, more] = valueOfAdd.split('@')
          if (src && user && !more) {
            newItem = {
              type: 'blockstack-user',
              data: { user, src: src + '/AllEvents' },
            }
          } else {
            errors.push('Invalid calendar ')
          }
        }
      }

      if (newItem) {
        const { type, data } = newItem
        newItem = {
          uid: uuid(),
          type,
          name: this.state.calendarName || valueOfAdd,
          hexColor: this.state.hexColor,
          mode: 'read-only',
          data,
        }
      }

      asyncReturn({
        item: newItem,
        error: (errors || []).join(' '),
      })
    }

    this.state.renderAdd = () => {
      return (
        <input
          placeholder={addPlaceholder}
          type="text"
          value={this.state.valueOfAdd}
          onChange={this.bound2.onAddValueChange}
          style={{ width: '80%' }}
        />
      )
    }

    this.bound2 = ['onAddValueChange'].reduce((acc, d) => {
      acc[d] = this[d].bind(this)
      delete this[d]
      return acc
    }, {})
  }

  handleSelect = (eventKey, event) => {
    const { verifyNewCalendar } = this.props
    const { addValueToItem } = this.state

    this.setState(
      {
        hexColor: guaranteeHexColor(null),
        calendarName: this.state.menuItems[eventKey].name,
      },
      () => {
        addValueToItem(
          this.state.menuItems[eventKey].url,
          ({ item, error }) => {
            if (error) {
              this.setState({
                valueOfAdd: this.state.menuItems[eventKey].url,
                errorOfAdd: (error || '').toString(),
              })
            } else {
              verifyNewCalendar(item)
            }
          }
        )
      }
    )
  }

  renderOrSeparator = () => (
    <Row style={{ padding: '5px' }}>
      <Col sm={12} style={{ textAlign: 'center' }}>
        or
      </Col>
    </Row>
  )

  handleVerifyButton = () => {
    const { verifyNewCalendar } = this.props
    const { valueOfAdd, addValueToItem } = this.state

    this.setState(
      {
        hexColor: guaranteeHexColor(null),
        calendarName: valueOfAdd.split('/').pop(),
      },
      () => {
        addValueToItem(valueOfAdd, ({ item, error }) => {
          if (error) {
            this.setState({
              valueOfAdd,
              errorOfAdd: (error || '').toString(),
            })
          } else {
            verifyNewCalendar(item)
          }
        })
      }
    )
  }

  handleCalendarNameChange = event => {
    this.setState({ calendarName: event.target.value })
  }

  onColorChange = event => {
    const hexColor = event.target.value
    console.log('onColorChange', event.target.value)
    this.setState({ hexColor })
  }

  handleFileInputChange = event => {
    const { verifyNewCalendar } = this.props

    console.log('selected files', event.target.files[0])
    if (event.target.files[0]) {
      const file = event.target.files[0]

      const fileReader = new FileReader()
      fileReader.onloadend = e => {
        console.log('read file complete')

        const calendar = {
          uid: uuid(),
          type: 'ics-raw',
          name: this.state.calendarName,
          hexColor: this.state.hexColor,
          mode: '',
          data: {
            events: fileReader.result,
          },
        }

        verifyNewCalendar(calendar)
      }

      fileReader.readAsText(file)
    }
  }

  handleAddCalendarClick = event => {
    const { verifiedNewCalendarData, addItem } = this.props

    if (verifiedNewCalendarData.status === 'ok') {
      let calendar = Object.assign({}, verifiedNewCalendarData.calendar)
      calendar.name = this.state.calendarName
      calendar.hexColor = this.state.hexColor

      addItem(calendar)
    }
  }

  onCreateTeamCalendar(e) {
    console.log('create team calendar')
    this.props.createTeamCalendar('new team')
  }

  render() {
    const {
      items: itemList,
      user,
      calendars,
      verifiedNewCalendarData,
    } = this.props
    const { renderItem } = this.bound
    const {
      valueOfAdd,
      addTitle,
      listTitle,
      renderAdd,
      errorOfAdd,
    } = this.state

    const canAddCalendar =
      verifiedNewCalendarData.status === 'ok' &&
      this.state.calendarName != null &&
      this.state.calendarName.trim() !== ''

    return (
      <div className="settings">
        <Card style={{}}>
          <Card.Header>{addTitle}</Card.Header>
          <Card.Body>
            <Row>
              <Col xs={12}>
                <input
                  value={'create team calendar'}
                  type="submit"
                  onClick={e => this.onCreateTeamCalendar(e)}
                  style={{ width: '80%' }}
                />
              </Col>
            </Row>
            <Row>
              <Col md={6} sm={12}>
                <Row style={{ padding: '5px' }}>
                  {renderAdd()}{' '}
                  <Button
                    onClick={this.handleVerifyButton}
                    disabled={!valueOfAdd}
                  >
                    Verify
                  </Button>
                </Row>
                {verifiedNewCalendarData.status === 'error' && (
                  <Row style={{ padding: '5px' }}>
                    <Col sm={12} style={{ textAlign: 'center' }}>
                      <Alert style={{ marginBottom: '0px' }} bsStyle="danger">
                        Failed to verify calendar
                      </Alert>
                    </Col>
                  </Row>
                )}
                {this.renderOrSeparator()}
                <Row style={{ padding: '5px' }}>
                  <Col sm={12} style={{ textAlign: 'center' }}>
                    <label>
                      Upload .ics calendar file:
                      <br />
                      <input
                        id="fileInputIcs"
                        type="file"
                        onChange={this.handleFileInputChange}
                      />
                    </label>
                  </Col>
                </Row>
                {this.renderOrSeparator()}
                <Row style={{ padding: '5px' }}>
                  <Col sm={12} style={{ textAlign: 'center' }}>
                    <DropdownButton
                      title="Choose from list..."
                      id="document-type"
                      onSelect={this.handleSelect}
                    >
                      {this.state.menuItems.map((opt, i) => (
                        <DropdownItem key={i} eventKey={i}>
                          {opt.name}
                        </DropdownItem>
                      ))}
                    </DropdownButton>
                  </Col>
                </Row>
              </Col>
              <Col md={6} sm={12}>
                <Row style={{ padding: '5px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Calendar name"
                    value={this.state.calendarName}
                    onChange={this.handleCalendarNameChange}
                    disabled={verifiedNewCalendarData.status !== 'ok'}
                  />
                </Row>
                <Row style={{ padding: '5px' }}>
                  <Col sm={12} style={{ textAlign: 'center' }}>
                    <input
                      type="color"
                      value={this.state.hexColor}
                      onChange={this.onColorChange}
                      style={{
                        marginRight: '20px',
                        marginLeft: '5px',
                        width: '50%',
                        height: '44px',
                      }}
                      disabled={verifiedNewCalendarData.status !== 'ok'}
                    />
                  </Col>
                </Row>
                <Row style={{ padding: '5px' }}>
                  <Col sm={12} style={{ textAlign: 'center' }}>
                    <Alert style={{ marginBottom: '0px' }}>
                      Calendar{' '}
                      <span style={{ fontWeight: 'bold' }}>
                        {this.state.calendarName}
                      </span>{' '}
                      has{' '}
                      <span style={{ fontWeight: 'bold' }}>
                        {verifiedNewCalendarData.eventsCount}
                      </span>{' '}
                      events
                    </Alert>
                  </Col>
                </Row>

                <Row style={{ padding: '5px' }}>
                  <Col sm={12} style={{ textAlign: 'center' }}>
                    <Button
                      onClick={this.handleAddCalendarClick}
                      disabled={!canAddCalendar}
                      style={{ margin: 8 }}
                    >
                      Add Calendar
                    </Button>
                  </Col>
                </Row>
              </Col>
            </Row>
            <span style={{ paddingLeft: 16 }}>{errorOfAdd}</span>
          </Card.Body>
        </Card>

        <Card style={{}}>
          <Card.Header>{listTitle}</Card.Header>
          <Card.Body>
            <div>
              {(itemList || []).map((v, k) =>
                renderItem(v, k, user, calendars)
              )}
            </div>
          </Card.Body>
        </Card>
      </div>
    )
  }
}
