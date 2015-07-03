
var OBJMesh = function(url, options) {
  Mesh.call(this, url, options);

  var R = 6378137;
  var C = R*Math.PI*2;
  this.inMeters = TILE_SIZE / (Math.cos(this.position.latitude*Math.PI/180) * C);
};

(function() {

  OBJMesh.prototype = Object.create(Mesh.prototype);

  OBJMesh.prototype.load = function(url) {
    var onLoad = this._onLoad.bind(this);

    this.request = Request.getText(url, function(objData) {
      var mtlFile = objData.match(/^mtllib\s+(.*)$/m);

      if (!mtlFile) {
        setTimeout(function() {
          onLoad(OBJ.parse(objData));
        }, 1);
        return;
      }

      var baseURL = url.replace(/[^\/]+$/, '');
      Request.getText(baseURL + mtlFile[1], function(mtlData) {
        onLoad(OBJ.parse(objData, mtlData));
      });
    });
  };

  OBJMesh.prototype.getMatrix = function() {
    if (!this.isReady) {
      return;
    }

    var mMatrix = Matrix.create();

    if (this.elevation) {
      mMatrix = Matrix.translate(mMatrix, 0, 0, this.elevation);
    }

    var scale = Math.pow(2, Map.zoom) * this.inMeters;
    mMatrix = Matrix.scale(mMatrix, scale, scale, scale);

    mMatrix = Matrix.rotateZ(mMatrix, -this.rotation);

    var
      worldSize = TILE_SIZE*Math.pow(2, Map.zoom),
      position = project(this.position.latitude, this.position.longitude, worldSize),
      mapCenter = Map.center;
    mMatrix = Matrix.translate(mMatrix, position.x - mapCenter.x, position.y - mapCenter.y, 0);

    return mMatrix;
  };

}());