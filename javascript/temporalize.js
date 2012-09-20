      dojo.require("esri.map");
      dojo.require("dojo.io.script");
      dojo.require("esri.layers.FeatureLayer");      
      dojo.require("dijit.TooltipDialog");
      //dojo.require("esri.dijit.TimeSlider");
      dojo.require("myModules.TimeSliderGeoiqExt");


      var timeSlider; 
      var tweetLayer;
      var categories;
      
      function init() {
        var startExtent = new esri.geometry.Extent({"xmax": -1809428.3126246613,"xmin": -14293735.268382609,"ymax": 6308647.171301952,"ymin": -393351.46874051995,"spatialReference":{"wkid":102100}});
        var map = new esri.Map("map", {extent:startExtent});
        
        var layers = [];
        var basemap = new esri.layers.ArcGISTiledMapServiceLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer");
        layers.push(basemap);

        //tweetLayer = new esri.layers.FeatureLayer("http://ec2-23-22-185-186.compute-1.amazonaws.com:6080/arcgis/rest/services/PhillyCrime/MapServer/0"
        //                                                , { mode: esri.layers.FeatureLayer.MODE_SNAPSHOT
        //                                                   , outFields: ["UCRHundred", "STOLEN_VALUE", "RECOVERED_VALUE", "LOCATION", "STATUS", "MODUS_OPERANDI"] });
        
        //tweetLayer = new esri.layers.FeatureLayer("http://services.arcgis.com/bkrWlSKcjUDFDtgw/arcgis/rest/services/Irene_Tweets/FeatureServer/0"
        //                                                , { mode: esri.layers.FeatureLayer.MODE_SNAPSHOT 
        //                                                  , outFields: ["*"]});
        tweetLayer = new esri.layers.FeatureLayer("http://ec2-23-22-185-186.compute-1.amazonaws.com:6080/arcgis/rest/services/IreneTwitter/MapServer/0"
                                                    , { mode: esri.layers.FeatureLayer.MODE_SNAPSHOT 
                                                    , outFields: ["*"]});
        //old: http://ec2-23-22-185-186.compute-1.amazonaws.com:6080/arcgis/rest/services/IreneTwitter/MapServer/0
        //http://ec2-23-22-185-186.compute-1.amazonaws.com:6080/arcgis/rest/services/IreneTwitter/MapServer
        
        hurcnirene = new esri.layers.KMLLayer('http://geocommons.com/overlays/275854.kml', {id:"track"})
        //layers.push(hurcnirene);
        map.addLayer(hurcnirene);
        console.log('hur', hurcnirene)
        
        var renderer = new esri.renderer.SimpleRenderer(
          new esri.symbol.SimpleFillSymbol(
            "solid",
            null,
            new dojo.Color([255, 0, 255, 0.75]) // fuschia lakes!
          )
        );
        //map.getLayer("track").setRenderer(renderer);
        
        tweetLayer.maxRecordCount = 100000;
        
        console.log('tweet layer', tweetLayer)
        // end categorical styling
        layers.push(tweetLayer);

        //add all the layers to the map then initialize the slider
        map.addLayers(layers);
        dojo.connect(map,"onLayersAddResult",initSlider);

        //when fired, create a new graphic with the geometry from the event.graphic and add it to the maps graphics layer
        dojo.connect(tweetLayer, "onMouseOver", openDialog);
        dojo.connect(tweetLayer, "onMouseOut", closeDialog);
        //dojo.connect(map, "onExtentChange", showExtent);
        dojo.connect(map, "onExtentChange", showExtent);
      }
      
      function showExtent(extent) {
        console.log('extent', extent)
      }
      
      function openDialog(evt){
        closeDialog();
        
        var dialog = new dijit.TooltipDialog({
          id: "tooltipDialog",
          style: "position: absolute; width: 250px; font: normal normal normal 10pt Helvetica;z-index:100"
        });
        dialog.startup();

        //var t = "<b>Type: </b>"+type+"<br /><hr><b>Stolen Value: </b>${STOLEN_VALUE:NumberFormat}<br/>"
        //                 + "<b>Recovered Value: </b>${RECOVERED_VALUE:NumberFormat}<br/>"
        //                 + "<b>Locations: </b>${LOCATION}<br />"

        var t = '<b>Username</b>: ${userscreen} <br />'
                 + '<b>Sent</b>: ${SentAt2}'
        
        var content = esri.substitute(evt.graphic.attributes,t);

        // var highlightGraphic = new esri.Graphic(evt.graphic.geometry,highlightSymbol);
        // map.graphics.add(highlightGraphic);

        dialog.setContent(content);

        dojo.style(dialog.domNode, "opacity", 0.85);
        dijit.popup.open({popup: dialog, x:evt.pageX,y:evt.pageY});

      }
      function closeDialog() {
        var widget = dijit.byId("tooltipDialog");
        if (widget) {
          widget.destroy();
        }
      }
      
      // Called after the FeatureLayer finishes loading.
      function initSlider(results) {
        var map = this;
        timeSlider = new myModules.TimeSliderGeoiqExt({style: "width: 760px; display:none"},dojo.byId("timeSliderDiv"));
        //timeSlider = new esri.dijit.TimeSlider({style: "width: 760px; display:none"},dojo.byId("timeSliderDiv"));
        map.setTimeSlider(timeSlider);
        var timeExtent = new esri.TimeExtent();
        timeExtent.startTime = new Date("2011/08/27 23:26:26 UTC");
        timeExtent.endTime = new Date("2011/08/28 13:43:01 UTC");
        //timeExtent.startTime = new Date("2002/06/01 00:04:00 UTC");
        //timeExtent.endTime = new Date("2002/06/29 23:59:00 UTC");
        timeSlider.setThumbCount(2);
        timeSlider.createTimeStopsByTimeInterval(timeExtent,1,'esriTimeUnitsMinutes');
        timeSlider.setThumbIndexes([0,50]);
        timeSlider.setThumbMovingRate(200);
        timeSlider.numberBins = timeSlider.timeStops.length-1;
        timeSlider.bins = [];
        timeSlider.timeField = 'SentDate';
        //timeSlider.startup(); 
        
        //wait until features array as length, then calculate bins
        setTimeout(function(){
          if (!tweetLayer.graphics.length){
            setTimeout(arguments.callee, 25);
            return;
          } 
          // else
          calculateBins();
        }, 0)
        
        labels = null;
        timeSlider.setLabels(labels);
      }
      
      function calculateBins() {
        timeSlider.features = tweetLayer.graphics
        var timeStops = [];
        var times = [];
        for(i=0;i<timeSlider.timeStops.length-1;i++) {
          timeStops[i] = timeSlider.timeStops[i].getTime();
          timeSlider.bins.push({"count": 0, "timestamp": timeSlider.timeStops[i], 'utc': timeStops[i]});
        }
        
        var features = tweetLayer.graphics;
        var test = 0;
        var first_time = timeStops[0];
        
        for(var i=0;i<features.length;i++) {
          var fTime = features[i].attributes[timeSlider.timeField];
          for(var j=0;j<=timeStops.length;j++) {
            var val = timeSlider.bins[j-1] ? j-1 : j;
            if (j != timeStops.length - 1) {
              if (fTime >= first_time && fTime <= timeStops[j]) {
                timeSlider.bins[val].count++;
              };
            } else {
              if (fTime >= first_time && fTime <= timeStops[j]) {
                timeSlider.bins[val].count++;
              };
            }
            if(j == timeStops.length) {
              if(fTime >= timeStops[timeStops.length]) timeSlider.bins[val].count++;
            }
            first_time = timeStops[j];
          };
        };
        
        //init slider
        timeSlider.initSlider()
      }
      
      function updateSlider() {
          dojo.connect(timeSlider, "onTimeExtentChange", function(timeExtent) {
      });
          
       }
      
      dojo.addOnLoad(init);