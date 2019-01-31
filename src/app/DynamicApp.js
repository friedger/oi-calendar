// view
import React, { Component } from "react";
import {
  AppHeader,
  AppFooter
} from "../components/branding/AppHeaderAndFooter";
import { AppMenu } from "../components/app-menu/AppMenu";
import Calendar from "../components/event-calendar/EventCalendar";
import { connectToStore, PlaceHolder } from "./_FN";
// style
import "./etc/App.css";
// flow
import registerServiceWorker from "../flow/io/registerServiceWorker";
import connectCalendar from "../flow/connect/connectEventCalendar";
import connectApp from "../flow/connect/connectApp";
import { createInitialStore } from "../flow/store/storeManager";

let store = createInitialStore();
registerServiceWorker();

class DynamicApp extends Component {
  render() {
    const ConnectedCalendar = connectToStore(Calendar, connectCalendar, store);
    const { views } = this.props;
    const { EventCalendar, UserProfile } = views;
    return (
      <div className="App">
        <header className="App-header">
          <AppHeader>{UserProfile && <UserProfile />}</AppHeader>
          <AppMenu />
        </header>
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
