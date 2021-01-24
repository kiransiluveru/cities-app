import React, { Component } from 'react';
import ReactSpinner from 'react16-spinjs';
import $ from 'jquery';
import _ from 'lodash';
import { Map, GoogleApiWrapper, Marker } from 'google-maps-react';
import data from '../../src/Cities';

class MapViewer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      states: data.states,
      cities_of_state: [],
      selected_state: "Andhra Pradesh",
      cities_lat_lngs: [],
      isLoading: true,
    };
    this.mapRef = React.createRef();
  }
  componentDidMount() {
    $('[data-toggle="tooltip"]').tooltip();
    const { selected_state } = this.state;
    this.onSelectState(selected_state);
  }

  getLatitudeLongitudes = async (city) => {
    const request_url = `http://api.positionstack.com/v1/forward?access_key=7c03b572c66f489cc980d2b32dfe939a&query=${city}`;
    return fetch(request_url)
      .then((resp) => resp.json())
  }

  onMarkerClick = (props, marker, e) => {
    this.setState(_ => ({
      selectedPlace: props,
      activeMarker: marker,
      showingInfoWindow: true
    }));
  }

  onMarkerMounted = element => this.onMarkerClick(element.props, element.marker, element);

  onSelectState = async (selected_state) => {
    this.setState({ isLoading: true });
    const { states } = this.state;
    const matched_state = _.filter(states, (obj) => obj.state === selected_state);
    let cities = matched_state[0].districts;
    const cities_lat_lngs = [];
    for (let i = 0; i < cities.length; i++) {
      let city = cities[i];
      const resp = await this.getLatitudeLongitudes(encodeURI(city));
      let lat = _.get(resp, ['data', '0', 'latitude'], undefined);
      let lng = _.get(resp, ['data', '0', 'longitude'], undefined);
      if (lat && lng) {
        cities_lat_lngs.push({ lat, lng, city });
      }
    }
    this.setState({ cities_of_state: cities, cities_lat_lngs, isLoading: false });
  }

  componentDidUpdate() {
    $('[data-toggle="tooltip"]').tooltip();
    const bounds = new window.google.maps.LatLngBounds()
    this.state.cities_lat_lngs && this.state.cities_lat_lngs.map((result) => {
      let lat = parseFloat(result.lat);
      let lng = parseFloat(result.lng);
      if (Boolean(lat) && Boolean(lng)) {
        bounds.extend(new window.google.maps.LatLng(
          parseFloat(result.lat),
          parseFloat(result.lng)
        ));
      }
    });
    this.mapRef.map.fitBounds(bounds);
  }

  render() {
    const { states, cities_of_state, cities_lat_lngs, isLoading } = this.state;
    const states_list = _.map(states, 'state');
    return (
      <div className="parent d-flex p-2">
        { isLoading && <ReactSpinner />}
        <div className="child-1 p-2 col-md-12 col-lg-6">
          <select title="Select State" id="selectBox" onChange={(event) => this.onSelectState(event.target.value)}>
            {Boolean(states_list.length) &&
              states_list.map((state, index) => {
                return (
                  <option title={state} key={`${state}-${index}`} value={state}  >{state}</option>
                );
              })
            }
          </select>
          <ul className="list-group list-group-flush scrollable-list">
            {Boolean(cities_of_state.length) &&
              cities_of_state.map((city, index) => {
                return (
                  <li title={city} key={`${city}-${index}`} className="list-group-item">
                    <span data-toggle="tooltip" data-placement="top" data-original-title={city}>
                      {city}
                    </span>
                  </li>
                )
              })
            }
          </ul>
        </div>
        <div className="child-2 p-2 col-lg-6">
          <div>
            {
              this.props.google &&
              <Map
                google={this.props.google}
                zoom={2}
                className="height-95-percent"
                ref={(mapRef) => this.mapRef = mapRef}
              >
                {Boolean(cities_lat_lngs) &&
                  cities_lat_lngs.map((obj) => {
                    return (<Marker
                      key={obj.city}
                      title={obj.city}
                      name={obj.city}
                      position={{ lat: obj.lat, lng: obj.lng }}
                    />)
                  })
                }
              </Map>
            }
          </div>
        </div>
      </div>
    );
  }
}
export default GoogleApiWrapper({
  apiKey: 'AIzaSyBEAPa-uM3bZ2sZaGRBCQsYRFsqECeaoog'
})(MapViewer);
