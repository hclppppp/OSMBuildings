var APP;
var MAP, glx, gl;

var OSMBuildings = function(options) {
  APP = this; // references to this. Should make other globals obsolete.

  options = options || {};

  if (options.style) {
    this.setStyle(options.style);
  }

  APP.baseURL = options.baseURL || '.';

  render.bendRadius = 500;
  render.bendDistance = 500;

  render.backgroundColor = new Color(options.backgroundColor || BACKGROUND_COLOR).toArray();
  render.fogColor        = new Color(options.fogColor        || FOG_COLOR).toArray();
  render.highlightColor  = new Color(options.highlightColor  || HIGHLIGHT_COLOR).toArray();

  render.Buildings.showBackfaces = options.showBackfaces;

  // can be: 'quality', 'performance'
  render.optimize = options.optimize || 'quality';

  this.attribution = options.attribution || OSMBuildings.ATTRIBUTION;

  APP.minZoom = parseFloat(options.minZoom) || 15;
  APP.maxZoom = parseFloat(options.maxZoom) || 22;
  if (APP.maxZoom < APP.minZoom) {
    APP.maxZoom = APP.minZoom;
  }
};

OSMBuildings.VERSION = '1.0.1';
OSMBuildings.ATTRIBUTION = '© OSM Buildings <a href="http://osmbuildings.org">http://osmbuildings.org</a>';

OSMBuildings.prototype = {

  on: function(type, fn) {
    Events.on(type, fn);
    return this;
  },

  off: function(type, fn) {
    Events.off(type, fn);
  },

  addTo: function(map) {
    MAP = map;
    glx = new GLX(MAP.container, MAP.width, MAP.height, render.optimize);
    gl = glx.context;

    MAP.addLayer(this);

    render.start();

    return this;
  },

  remove: function() {
    render.stop();
    MAP.removeLayer(this);
    MAP = null;
  },

  setStyle: function(style) {
    //render.backgroundColor = new Color(options.backgroundColor || BACKGROUND_COLOR).toArray();
    //render.fogColor        = new Color(options.fogColor        || FOG_COLOR).toArray();
    //render.highlightColor  = new Color(options.highlightColor  || HIGHLIGHT_COLOR).toArray();

    DEFAULT_COLOR = style.color || style.wallColor || DEFAULT_COLOR;
    //if (color.isValid) {
    //  DEFAULT_COLOR = color.toArray();
    //}
    return this;
  },

  transform: function(latitude, longitude, elevation) {
    var
      pos = MAP.project(latitude, longitude, TILE_SIZE*Math.pow(2, MAP.zoom)),
      x = pos.x-MAP.center.x,
      y = pos.y-MAP.center.y;

    var scale = 1/Math.pow(2, 16 - MAP.zoom);
    var modelMatrix = new glx.Matrix()
      .translate(0, 0, elevation)
      .scale(scale, scale, scale*HEIGHT_SCALE)
      .translate(x, y, 0);

    var mvp = glx.Matrix.multiply(modelMatrix, render.viewProjMatrix);
    var t = glx.Matrix.transform(mvp);
    return { x: t.x*MAP.width, y: MAP.height - t.y*MAP.height, z: t.z }; // takes current cam pos into account.
  },

  addOBJ: function(url, position, options) {
    return new mesh.OBJ(url, position, options);
  },

  addGeoJSON: function(url, options) {
    return new mesh.GeoJSON(url, options);
  },

  // TODO: allow more data layers later on
  addGeoJSONTiles: function(url, options) {
    options = options || {};
    options.fixedZoom = options.fixedZoom || 16;
    APP._dataGrid = new Grid(url, data.Tile, options);
    return APP._dataGrid;
  },

  addMapTiles: function(url, options) {
    APP._basemapGrid = new Grid(url, basemap.Tile, options);
    return APP._basemapGrid;
  },

  highlight: function(id) {
    render.Buildings.highlightID = id ? render.Interaction.idToColor(id) : null;
  },

  show: function(selector, duration) {
    Filter.remove('hidden', selector, duration);
    return this;
  },

  hide: function(selector, duration) {
    Filter.add('hidden', selector, duration);
    return this;
  },

  getTarget: function(x, y) {
    return render.Interaction.getTarget(x, y);
  },

  screenshot: function(callback) {
    // TODO: use promises here
    render.screenshotCallback = callback;
    return this;
  },

  destroy: function() {
    render.destroy();
    Events.destroy();
    if (APP._basemapGrid) APP._basemapGrid.destroy();
    if (APP._dataGrid)    APP._dataGrid.destroy();

    // TODO: when taking over an existing canvas, don't destroy it here
    glx.destroy();
  }
};

//*****************************************************************************

if (typeof global.define === 'function') {
  global.define([], OSMBuildings);
} else if (typeof global.exports === 'object') {
  global.module.exports = OSMBuildings;
} else {
  global.OSMBuildings = OSMBuildings;
}
