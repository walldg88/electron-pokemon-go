import React, { PropTypes, Component } from 'react';
import { default as raf } from 'raf';
import { GoogleMapLoader, GoogleMap, Circle, InfoWindow, Marker } from 'react-google-maps';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as LocationActions from '../actions/location';
import * as GameActions from '../actions/game';

class Map extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      content: null,
      radius: 0
    };
  }

  componentDidMount() {
    const tick = () => {
      this.setState({ radius: this.state.radius + 1 });

      if (this.state.radius > 100) {
        this.setState({ radius: 0 });
        setTimeout(() => { raf(tick); }, 500);
      } else {
        raf(tick);
      }
    };
    raf(tick);
  }

  handleMapClick(event) {
    this.props.setLocation({
      type: 'coords',
      coords: {
        latitude: event.latLng.lat(),
        longitude: event.latLng.lng()
      }
    });
    this.props.heartbeat();
  }


  render() {
    const { content, radius } = this.state;
    let center;
    if (this.props.location && this.props.location.coords) {
      center = { lat: this.props.location.coords.latitude || 0, lng: this.props.location.coords.longitude || 0 };
    }
    let contents = [];

    if (center) {
      contents.push(
        (<Circle key="circle" center={center} radius={radius} options={{
          fillColor: 'blue',
          fillOpacity: 0.1,
          strokeColor: 'purple',
          strokeOpacity: 0.8,
          strokeWeight: 1,
        }}
        />)
      );
      if (content) {
        contents.push((<InfoWindow key="info" position={center} content={content} />));
      }
    }

    if (this.props.game.nearbyPokemon) {
      contents = contents.concat(this.props.game.nearbyPokemon.map((pokemon, i) => {
        const markerKey = `Pokemon${i}`;
        const position = {
          lat: pokemon.latitude,
          lng: pokemon.longitude
        };
        const size = Math.min(120 / (this._googleMapComponent && this._googleMapComponent.getZoom() / 8), 64);
        const icon = {
          url: pokemon.img,
          scaledSize: {
            width: size,
            height: size
          }
        };
        return (
          <Marker key={markerKey} position={position} icon={icon} />
        );
      }));
    }

    return (
      <GoogleMapLoader
        containerElement={
          <div
            style={{
              height: '100%',
            }}
          />
        }
        googleMapElement={
          <GoogleMap
            ref={(map) => (this._googleMapComponent = map)}
            defaultZoom={16}
            center={this._googleMapComponent && this._googleMapComponent.getCenter() || center}
            onClick={::this.handleMapClick}
          >
            {contents}
          </GoogleMap>
        }
      />
    );
  }
}

Map.propTypes = {
  game: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  setLocation: PropTypes.func.isRequired,
  heartbeat: PropTypes.func.isRequired
};

Map.contextTypes = {
  router: PropTypes.object.isRequired
};

function mapStateToProps(state) {
  return {
    game: state.game,
    location: state.location
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ ...LocationActions, ...GameActions }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Map);
