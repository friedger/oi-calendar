import React, { Component } from "react";
import { Button } from "react-bootstrap";

const LINK_URL_BASE = "https://debutapp.social/";

const Contact = props => {
  const { contact } = props;
  const linkUrl = LINK_URL_BASE + contact.username;
  var avatarUrl;
  if (
    contact.image &&
    contact.image.length > 0 &&
    contact.image[0].contentUrl
  ) {
    avatarUrl = contact.image[0].contentUrl;
  }
  var name = contact.name;
  if (!name) {
    name = contact.username;
  }
  return (
    <div>
      <input type="checkbox" />
      {avatarUrl && <img src={avatarUrl} height="16px" alt="avatar" />}
      {!avatarUrl && <span className="glyphicon glyphicon-user" />}
      <a href={linkUrl}>{name}</a>
    </div>
  );
};

export default class Contacts extends Component {
  constructor(props) {
    super(props);
    this.state = { nameToAdd: "", lookingUpContacts: false };
    this.bound = ["lookupContacts", "addContact", "deleteContacts"].reduce(
      (acc, d) => {
        acc[d] = this[d].bind(this);
        return acc;
      },
      {}
    );
  }
  renderContacts(contacts) {
    const list = [];
    for (var property in contacts) {
      if (contacts.hasOwnProperty(property)) {
        var contact = contacts[property];
        contact.username = property;
        list.push(<Contact key={property} contact={contact} />);
      }
    }
    return list;
  }

  lookupContacts(event) {
    const { lookupContacts, contacts } = this.props;
    const contactQuery = event.target.value;

    this.setState({ lookingUpContacts: true, nameToAdd: contactQuery });
    const proposedContacts = contacts.filter(c => c.contains(contactQuery));
    this.setState({ proposedContacts, lookingUpContacts: false });
    lookupContacts(contactQuery).then(
      proposedContacts =>
        this.setState({ proposedContacts, lookingUpContacts: false }),
      () => {
        this.setState({ lookingUpContacts: false });
      }
    );
  }

  addContact() {
    const { addContact } = this.props;
    const { nameToAdd } = this.state;
    addContact(nameToAdd);
  }

  deleteContacts() {
    const { deleteContacts } = this.props;
    const selectedContacts = []; // TODO
    deleteContacts(selectedContacts);
  }

  render() {
    const { contacts } = this.props;
    const { lookupContacts, addContact, deleteContacts } = this.bound;
    const contactsView = this.renderContacts(contacts);
    return (
      <div className="settings">
        <input
          type="text"
          placeholder="e.g. alice.id or bob.id.blockstack"
          onChange={lookupContacts}
        />
        <Button onClick={addContact}>Add</Button>
        {contactsView}
        <Button bsStyle="danger" bsSize="small" onClick={deleteContacts}>
          Delete
        </Button>
      </div>
    );
  }
}
