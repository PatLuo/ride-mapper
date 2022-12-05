import React, { useState, useEffect } from "react";
import "./sidebar.css";

export default function Sidebar(props) {
  const [numberOfRides, setNumberOfRides] = useState();
  const [totalDistanceRounded, setTotalDistanceRounded] = useState();
  const [highestOccurance, setHighestOccurance] = useState();
  const [lastRide, setLastRide] = useState();

  useEffect(() => {
    const updateStats = () => {
      const data = props.activities;

      setNumberOfRides(data.length);

      let totalDistance = 0;
      for (const activity of data) {
        totalDistance += activity.distance;
      }
      setTotalDistanceRounded(Math.round(totalDistance * 100) / 100);

      let dayOccurance = [];
      for (const activity of data) {
        dayOccurance.push(activity.date.substr(0, activity.date.indexOf(",")));
      }
      const mode = (arr) =>
        [...new Set(arr)]
          .map((value) => [value, arr.filter((v) => v === value).length])
          .sort((a, b) => a[1] - b[1])
          .reverse()
          .filter((value, i, a) => a.indexOf(value) === i)
          .filter((v, i, a) => v[1] === a[0][1])
          .map((v) => v[0]);

      setHighestOccurance(mode(dayOccurance)[0]);
      if (data.length !== 0) {
        setLastRide(data[0].date);
      }
    };
    updateStats();
  }, [props.activities]);

  return (
    <div>
      <div className="header">
        <h1 className="title">Ride Mapper🚴‍♂️</h1>
        <p>Mapping out all my bike rides across Ottawa🍁 using the Strava API. Made with react-leaflet.</p>
        <h4>Click on a path for details</h4>
      </div>
      <hr className="headerDivider"></hr>
      <h4>View your own rides</h4>
      <button className="loginButton">Login</button>

      <hr className="headerDivider"></hr>

      <div className="overview">
        <h1>Overview</h1>
        <div className="stat">
          <h4>I've gone on...</h4>
          <h1>{numberOfRides} rides</h1>
        </div>
        <hr className="statDivider"></hr>
        <div className="stat">
          <h4>Travelled a total of...</h4>
          <h1>{totalDistanceRounded} km</h1>
        </div>
        <hr className="statDivider"></hr>
        <div className="stat">
          <h4>Most likely to go biking on a...</h4>
          <h1>{highestOccurance}</h1>
        </div>
        <hr className="statDivider"></hr>
        <div className="stat">
          {" "}
          <h4>My last bike ride was on...</h4>
          <h1>{lastRide}</h1>
        </div>
      </div>
    </div>
  );
}
