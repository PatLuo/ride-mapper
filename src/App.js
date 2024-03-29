import React, { useState, useEffect } from "react";
import axios from "axios";
import "./app.css";
import Sidebar from "./sidebar";
import { UserAuth } from "./context/AuthContext";

// Firebase
import { db } from "./firebase-config";
import { collection, getDoc, setDoc, doc } from "firebase/firestore";
// leaflet map
import polyline from "@mapbox/polyline";
import { MapContainer, TileLayer, LayersControl, Popup, Polyline } from "react-leaflet";
// loading spinner
import SyncLoader from "react-spinners/SyncLoader";
import { css } from "@emotion/react";

const { BaseLayer } = LayersControl;

export default function App() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  const usersColRef = collection(db, "users");

  const searchURL = window.location.search;

  const override = css`
    margin: 0;
    position: absolute;
    top: 50%;
    left: 50%;
  `;

  useEffect(() => {
    async function exchangeAuthCodeForRefreshToken(authCode) {
      setLoading(true);
      const exchangeCodeForToken = await axios.all([axios.post(`https://www.strava.com/oauth/token?client_id=${process.env.REACT_APP_CLIENTID}&client_secret=${process.env.REACT_APP_CLIENTSECRET}&code=${authCode}&grant_type=authorization_code`)]);
      const refreshToken = exchangeCodeForToken[0].data.refresh_token;
      const uid = searchURL.split("&")[0].split("=")[1];
      await setDoc(doc(usersColRef, uid), { refreshToken: refreshToken });
      window.location.search = "uid=" + uid;
    }
    async function getRefreshToken() {
      setLoading(true);
      const uid = searchURL.split("&")[0].split("=")[1];
      const userDoc = await getDoc(doc(usersColRef, uid));
      const userDocData = userDoc.data();
      return userDocData.refreshToken;
    }
    async function fetchActivityData(refreshToken = process.env.REACT_APP_REFRESHTOKEN) {
      setLoading(true);
      const activityData = [];
      const newAccessTokenData = await axios.all([axios.post(`https://www.strava.com/oauth/token?client_id=${process.env.REACT_APP_CLIENTID}&client_secret=${process.env.REACT_APP_CLIENTSECRET}&refresh_token=${refreshToken}&grant_type=refresh_token`)]);
      const accessToken = newAccessTokenData[0].data.access_token;
      const activityResponse = await axios.get(`https://www.strava.com/api/v3/athlete/activities?per_page=100&access_token=${accessToken}`);

      activityResponse.data.forEach((activity) => {
        if (!activity.map.summary_polyline) {
          return; // skip if no polyline
        }
        const startDate = new Date(activity.start_date);
        const activityDate = startDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
        const activityPolyline = polyline.decode(activity.map.summary_polyline);
        const activityDuration = new Date(activity.elapsed_time * 1000).toISOString().substr(11, 8);
        const activityDistance = Math.round((activity.distance / 1000) * 100) / 100;
        activityData.push({ date: activityDate, polyline: activityPolyline, duration: activityDuration, distance: activityDistance });
      });
      setActivities(activityData);
      setLoading(false);
    }

    if (searchURL.includes("code")) {
      const authCode = searchURL.split("&")[2].split("=")[1];
      exchangeAuthCodeForRefreshToken(authCode);
    } else if (searchURL.includes("uid")) {
      getRefreshToken().then((token) => fetchActivityData(token));
    }
    fetchActivityData();
  }, []);

  return (
    <div className="app">
      {loading ? (
        <SyncLoader color={`#4ba2fa`} loading={loading} css={override} size={20} />
      ) : (
        <div className="content">
          <MapContainer center={[45.3755676397901, -75.7501302762503]} zoom={13} scrollWheelZoom={true} zoomControl={false}>
            <LayersControl>
              <BaseLayer name="Light">
                <TileLayer attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors' url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png" maxZoom="20" />
              </BaseLayer>
              <BaseLayer checked name="Dark">
                <TileLayer attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors' url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png" maxZoom="20" />
              </BaseLayer>
              <BaseLayer name="Colorful">
                <TileLayer attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors' url="https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png" maxZoom="20" />
              </BaseLayer>
              <BaseLayer name="Satellite">
                <TileLayer attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community" url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
              </BaseLayer>
            </LayersControl>

            <div className="shapes">
              {activities.map((activity, i) => (
                <Polyline className="polyline" key={i} positions={activity.polyline} pathOptions={{ color: "#54a9ff", stroke: "false" }}>
                  <Popup>
                    <h2>{activity.date}</h2>
                    <h3>Duration: {activity.duration}</h3>
                    <h3>Distance: {activity.distance} km</h3>
                  </Popup>
                </Polyline>
              ))}
            </div>
          </MapContainer>
          <div className="background">
            <div className="sidebar">
              <Sidebar activities={activities} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
