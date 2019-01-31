import React from "react";

export const AppHeader = props => {
  return (
    <div>
      <h1>
        <img
          src="/android-chrome-192x192.png"
          alt="logo"
          style={{ marginRight: "10px", height: "40px" }}
        />
        OI Calendar{" "}
      </h1>
      {props.children}
    </div>
  );
};

export const AppFooter = props => {
  return (
    <div>
      <hr />
      <h5>
        Developed By <a href="https://openintents.org">OpenIntents</a>, free and{" "}
        <a href="https://github.com/friedger/oi-calendar">open source</a>, based
        on work by{" "}
        <a href="https://github.com/yasnaraj/react-calendar-events-example">
          Yasna R.
        </a>{" "}
        | {new Date().getFullYear().toString()}
      </h5>
      <h5>
        Love OI apps? You can now donate to our open collective:
        <br />
        <a href="https://opencollective.com/openintents/donate">
          https://opencollective.com/openintents/donate
        </a>
      </h5>
      <h5>
        Using <a href="https://glyphicons.com">glyphicons.com</a>
      </h5>
    </div>
  );
};
