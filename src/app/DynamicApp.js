// view
import React, { Component } from "react";
import { Row, Col } from "react-bootstrap";
import {
  AppHeader,
  AppFooter
} from "../components/branding/AppHeaderAndFooter";
import AppMenu from "../components/app-menu/AppMenu";
import Calendar from "../components/event-calendar/EventCalendar";
import Settings from "../components/settings/Settings";
import { connectToStore, PlaceHolder } from "./_FN";
// style
import "./etc/App.css";
// flow
import registerServiceWorker from "../flow/io/registerServiceWorker";
import connectCalendar from "../flow/connect/connectEventCalendar";
import connectAppMenu from "../flow/connect/connectAppMenu";
import connectSettings from "../flow/connect/connectSettings";
import connectApp from "../flow/connect/connectApp";
import { createInitialStore } from "../flow/store/storeManager";

let store = createInitialStore();
registerServiceWorker();

class DynamicApp extends Component {
  render() {
    const ConnectedCalendar = connectToStore(Calendar, connectCalendar, store);
    const ConnectedSettings = connectToStore(Settings, connectSettings, store);
    const ConnectedAppMenu = connectToStore(AppMenu, connectAppMenu, store);
    const { views } = this.props;
    const { EventCalendar, UserProfile } = views;
    return (
      <div className="App">
        <header className="App-header">
          <AppHeader>
            <Row>
              <Col sm={6} />
              <Col xs={6} sm={4}>
                {UserProfile && <UserProfile />}
              </Col>
              <Col xs={6} sm={2}>
                <ConnectedAppMenu />
              </Col>
            </Row>
          </AppHeader>
        </header>
        <ConnectedSettings />
        <ConnectedCalendar />
        <footer>
          <AppFooter />
        </footer>
      </div>
    );
  }
  componentDidMount() {
    import("./LazyLoaded").then(({ initializeLazy }) => {
      initializeLazy(store);
      // this.forceUpdate();
    });
  }
}

const ConnectedDynamicApp = connectToStore(DynamicApp, connectApp, store);
export default <ConnectedDynamicApp />;
