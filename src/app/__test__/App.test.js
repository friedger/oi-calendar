import React from "react";
import ReactDOM from "react-dom";
import App from "./App";

let EventCalendar = props => {
  return <div>EventCalenda r</div>;
};
let UserProfile = props => {
  return <div>UserProfile</div>;
};

it("renders without crashing", () => {
  const div = document.createElement("div");
  ReactDOM.render(<App views={{ EventCalendar, UserProfile }} />, div);
  ReactDOM.unmountComponentAtNode(div);
});
