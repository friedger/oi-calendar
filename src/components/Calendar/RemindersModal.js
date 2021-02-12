import { Button, Modal } from 'react-bootstrap'
import React from 'react'
import PropTypes from 'prop-types'

class RemindersModal extends React.Component {
  constructor(props) {
    super(props)
    console.log('SetRemindersModal')
  }

  render() {
    const { handleRemindersHide, handleNoPermissionCheck } = this.props
    let notifPermissionGranted = true
    if (Notification.permission !== 'granted') {
      notifPermissionGranted = false
      Notification.requestPermission()
    }
    return (
      <Modal show onHide={handleRemindersHide}>
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title">Reminders</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!notifPermissionGranted && (
            <>
              Please grant permission to receive notifcations from the browser.
            </>
          )}
          {notifPermissionGranted && (
            <>
              You already granted permissions to receive notifications from the
              browser!
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={handleNoPermissionCheck}>
            Do not show again
          </Button>
          <Button onClick={handleRemindersHide}>Close</Button>
        </Modal.Footer>
      </Modal>
    )
  }
}

RemindersModal.propTypes = {
  handleRemindersHide: PropTypes.func,
  handleNoPermissionCheck: PropTypes.func,
}

export default RemindersModal
