import React, { Component, createRef } from "react";
import API_KEY from "../API-KEYS/maps-api.js";
import SubmitButton from "./SubmitButton";
import CancelButton from "./CancelButton";
import ResultsPage from "./ResultsPage";
import mapStyle from "../Data/mapStyling";
// import customMarker from "../resources/customMarker";
import customLine from "../resources/customLine";
import { auth } from "../firebaseInitialise";
import { Grid } from "@material-ui/core";

class GoogleMap extends Component {
  state = {
    marker: null,
    linkLine: null,
    dimensions: { width: null, height: null },
    googleMap: null,
  };

  googleMapRef = createRef();

  /******** MAP FUNCTIONS ********/
  createGoogleMap = () => {

    return new window.google.maps.Map(this.googleMapRef.current, {
      zoom: 2,
      center: {
        lat: 0,
        lng: 0,
      },
      disableDefaultUI: true,
      styles: mapStyle,
    });
  };

  placeMarker = (latLng) => {
    let user = auth.currentUser;
    const { recordPlayerMarker } = this.props;
    const newMarker = new window.google.maps.Marker({
      position: latLng,
      map: this.state.googleMap,
      icon: {
        url: user.photoURL,
        scaledSize: new window.google.maps.Size(50, 50),
        anchor: new window.google.maps.Point(25, 25),
      },
    });
    recordPlayerMarker(newMarker);
    return newMarker;
  };

  removeMarker = () => {
    const { marker } = this.state;
    if (marker !== null) {
      marker.setMap(null);
    }
    this.setState({ marker: null });
  };

  submitMarker = () => {
    const { endRound } = this.props;
    endRound();
  };

  plotLinkLine = () => {
    const { marker } = this.state;
    const { question } = this.props;
    if (marker !== null && question.position !== null) {
      const markerPosition = {
        lat: marker.position.lat(),
        lng: marker.position.lng(),
      };
      const linkPath = [markerPosition, question.position];

      const linkLine = new window.google.maps.Polyline({
        path: linkPath,
        ...customLine,
      });

      linkLine.setMap(this.state.googleMap);

      this.setState({ linkLine });
    }
  };

  removeLinkLine = () => {
    const { linkLine } = this.state;
    if (linkLine !== null) {
      linkLine.setMap(null);
    }

    this.setState({ linkLine: null });
  };

  plotCountryBorder = () => {
    const { question } = this.props;
    if (question.borderData) {
      this.state.googleMap.data.addGeoJson(question.borderData);
      this.state.googleMap.data.setStyle({
        fillColor: "white",
        fillOpacity: 0.5,
        strokeColor: "white",
        strokeWeight: 0.5,
      });
    }
  };

  createAndPanToBounds = () => {
    const { question } = this.props;
    const { marker } = this.state;
    if (marker !== null) {
      const lat = marker.position.lat();
      const lng = marker.position.lng();
      let resultBounds = new window.google.maps.LatLngBounds();
      resultBounds.extend({ lat, lng });
      resultBounds.extend(question.position);
      this.state.googleMap.fitBounds(resultBounds);
      this.state.googleMap.panToBounds(resultBounds);
    }
  };

  resetMapView = () => {
    this.state.googleMap.setCenter({ lat: 0, lng: 0 });
    this.state.googleMap.setZoom(2);
  };

  handleMapClick = (e) => {
    this.removeMarker();
    this.setState({
      marker: this.placeMarker(e.latLng),
    });
  };

  /** RESIZE WINDOW TO RERENDER GOOGLEMAP */
  updateDimensions = () => {

    this.setState({ dimensions: { width: window.innerWidth, height: window.innerHeight } }, () => {
      //console.log(`window is resized to ${this.state.dimensions.width} x ${this.state.dimensions.height} `);
    });
  }

  /******** REACT LIFE CYCLES ********/
  componentDidUpdate(prevProps, prevState) {
    const { round, roundIsRunning } = this.props;
    const { marker } = this.state;
    const roundHasStopped =
      !roundIsRunning &&
      roundIsRunning !== prevProps.roundIsRunning &&
      marker !== null;
    const roundHasStarted =
      roundIsRunning && roundIsRunning !== prevProps.roundIsRunning;

    if (roundHasStarted) {
      window.google.maps.event.addListener(
        this.state.googleMap,
        "click",
        this.handleMapClick
      );
    }
    if (roundHasStopped) {
      this.plotLinkLine();
      this.plotCountryBorder();
      this.createAndPanToBounds();
      window.google.maps.event.clearListeners(this.state.googleMap, "click");
    }
    if (round !== prevProps.round) {
      this.removeLinkLine();
      this.removeMarker();
      this.resetMapView();
    }
  }

  componentDidMount() {
    const googleMapScript = document.createElement("script");
    googleMapScript.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places`;
    window.document.body.appendChild(googleMapScript);

    googleMapScript.addEventListener("load", () => {
      this.setState({ googleMap: this.createGoogleMap() })
      // this.state.googleMap = this.createGoogleMap();
    });

    this.updateDimensions()

    window.addEventListener('resize', this.updateDimensions);
    window.addEventListener('orientationchange', this.updateDimensions);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateDimensions);
    window.removeEventListener('orientationchange', this.updateDimensions);
    window.google = {};
  }

  render() {
    const { marker, dimensions } = this.state;
    const { roundIsRunning } = this.props;

    return (
      <Grid container>
        <Grid container item xs={12}
          elevation={3}
          square={true}
          id="google-map"
          ref={this.googleMapRef}
          style={{
            width: 0.95 * dimensions.width,
            height: 0.95 * dimensions.height,
          }}
        />
        <Grid container item xs={12}>
          <Grid item xs={6}>
            <SubmitButton
              submitMarker={this.submitMarker}
              marker={marker}
              roundIsRunning={roundIsRunning}
            />
          </Grid>
          <Grid item xs={6}>
            <CancelButton
              removeMarker={this.removeMarker}
              marker={marker}
              roundIsRunning={roundIsRunning}
            />
          </Grid>
        </Grid>
      </Grid>
    );
  }
}

export default GoogleMap;
