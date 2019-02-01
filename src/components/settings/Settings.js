import React, { Component } from "react";
import { Modal, Button } from "react-bootstrap";
import Calendars from "./Calendars";
import Contacts from "./Contacts";

export default class Settings extends Component {
  render() {
    const {
      show,
      handleHide,
      calendars,
      addCalendarUrl,
      contacts,
      addCalendar,
      lookupContacts,
      addContact,
      deleteContacts
    } = this.props;
    return (
      <Modal show={show} onHide={handleHide}>
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title">Settings</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <label>Calendars</label>
          <Calendars
            calendars={calendars}
            addCalendar={addCalendar}
            addCalendarUrl={addCalendarUrl}
          />
        </Modal.Body>
        <Modal.Body>
          <label>Contacts</label>
          <Contacts
            contacts={contacts}
            lookupContacts={lookupContacts}
            addContact={addContact}
            deleteContacts={deleteContacts}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleHide}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
