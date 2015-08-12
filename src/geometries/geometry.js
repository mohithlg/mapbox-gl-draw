'use strict';

import hat from 'hat';
import Immutable from 'immutable';
import { translate } from '../util';
import { LatLng, LatLngBounds } from 'mapbox-gl';
import extent from 'turf-extent';

/**
 * Base Geometry class from which other geometries inherit
 *
 * @param {Object} map - Instance of MapboxGL Map
 * @param {Object} drawStore - Overall store for session
 * @param {String} type - Type of GeoJSON geometry
 * @param {Object} [data] - GeoJSON feature
 * @returns {Geometry} this
 * @private
 */
export default class Geometry {

  constructor(map, type, coordinates) {
    this._map = map;
    this.drawId = hat();
    this.coordinates = coordinates;

    this.geojson = {
      type: 'Feature',
      properties: {
        drawId: this.drawId
      },
      geometry: {
        type: type,
        coordinates: this.coordinates.toJS()
      }
    };
  }

  /**
   * @return {Object} GeoJSON feature
   */
  getGeoJSON() {
    this.geojson.geometry.coordinates = this.coordinates.toJS();
    return this.geojson;
  }

  /**
   * Called after a draw is done
   */
  _done(type) {
    this._map.fire('finish.edit');
    this._map.fire('draw.end', {
      geometry: this,
      featureType: type
    });
  }

  /**
   * Clear the edit drawings and render the changes to the main draw layer
   */
  completeEdit() {
    this._map.fire('edit.end', { geometry: this });
  }

  /**
   * Translate this polygon
   *
   * @param {Array<Number>} init - Mouse position at the beginining of the drag
   * @param {Array<Number>} curr - Current mouse position
   */
  translate(init, curr) {
    if (!this.translating) {
      this.translating = true;
      this.initGeom = JSON.parse(JSON.stringify(this.getGeoJSON()));
    }

    var translatedGeom = translate(JSON.parse(JSON.stringify(this.initGeom)), init, curr, this._map);
    this.coordinates = Immutable.List(translatedGeom.geometry.coordinates);

    this._map.fire('new.edit');
  }

  getExtent() {
    var ext = extent(this.getGeoJSON());
    return new LatLngBounds(
      new LatLng(ext[1], ext[0]),
      new LatLng(ext[3], ext[2])
    );
  }

}
