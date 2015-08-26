
var Renderer = {

  start: function(options) {
    this.layers = {};

//this.layers.depth       = Depth.initShader();
    this.layers.skydome   = SkyDome.initShader();
    this.layers.basemap   = Basemap.initShader();
    this.layers.buildings = Buildings.initShader({
      showBackfaces: options.showBackfaces
    });

    this.resize();
    Events.on('resize', this.resize.bind(this));

    this.backgroundColor = Color.parse(options.backgroundColor || '#cccccc').toRGBA(true);

    GL.cullFace(GL.BACK);
    GL.enable(GL.CULL_FACE);
    GL.enable(GL.DEPTH_TEST);

    //Events.on('contextlost', function() {
    //  this.stop();
    //}.bind(this));

    //Events.on('contextrestored', function() {
    //  this.start();
    //}.bind(this));

    this.loop = setInterval(function() {
      requestAnimationFrame(function() {
        Map.transform = new glx.Matrix()
          .rotateZ(Map.rotation)
          .rotateX(Map.tilt)
          .translate(0, -HEIGHT/2, -1220); // 0, map y offset to neutralize camera y offset, map z -1220 scales map tiles to ~256px

// console.log('CONTEXT LOST?', GL.isContextLost());

        // TODO: do matrix operations only on map change + store vpMatrix here
        var vpMatrix = new glx.Matrix(glx.Matrix.multiply(Map.transform, this.perspective));

//      this.layers.depth.render(vpMatrix);

        GL.clearColor(this.backgroundColor.r, this.backgroundColor.g, this.backgroundColor.b, 1);
        GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

        this.layers.skydome.render(vpMatrix);
        this.layers.buildings.render(vpMatrix);
        this.layers.basemap.render(vpMatrix);
      }.bind(this));
    }.bind(this), 17);
  },

  stop: function() {
    clearInterval(this.loop);
  },

  resize: function() {
    this.perspective = new glx.Matrix()
      .scale(1, -1, 1) // flip Y
      .multiply(new glx.Matrix.Perspective(45, WIDTH/HEIGHT, 0.1, 5000))
      .translate(0, -1, 0); // camera y offset

    GL.viewport(0, 0, WIDTH, HEIGHT);
  },

  destroy: function() {
    this.stop();
    for (var k in this.layers) {
      this.layers[k].destroy();
    }
  }
};