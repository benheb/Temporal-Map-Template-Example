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
        http://ec2-23-22-185-186.compute-1.amazonaws.com:6080/arcgis/rest/services/IreneTwitter/MapServer
        tweetLayer.maxRecordCount = 100000;

        // Styling the Categories
        /*var markerOpacity = 180;
        
        var categoryColors = {red: [215, 0, 0, markerOpacity], green: [34, 150, 94, markerOpacity], blue: [51, 137, 186, markerOpacity]}
        categories = [{code: 100, label: "Homicide", color: "red"},
                          {code: 200, label: "Sexual Assault", color: "red"},
                          {code: 300, label: "Robbery", color: "blue"},
                          {code: 400, label: "Assault", color: "red"},
                          {code: 500, label: "Burglary", color: "green"},
                          {code: 600, label: "Theft", color: "green"},
                          {code: 700, label: "Stolen Vehicle", color: "green"}];

        var renderer = new esri.renderer.UniqueValueRenderer({type: "uniqueValue",
                                                              field1: "latitude",
                                                              defaultSymbol: {
                                                                color: [0, 0, 0, 64],
                                                                outline: {color: [255, 255, 255, 255], width: 1, type: "esriSMS", style: "esriSMSNull"},
                                                                type: "esriSMS",
                                                                style: "esriSMSCircle"
                                                              }});
        dojo.map(categories, function(category, i) {
            renderer.addValue({
                value: category.code,
                label: category.label,
                symbol: { 
                    color: categoryColors[category.color],
                    outline: {color: [255, 255, 255, 255], width: 1, type: "esriSMS", style: "esriSMSCircle"},
                    type: "esriSMS",
                    style: "esriSMSCircle"} 
            });
        });
        
        
        console.log('render: ', renderer)
        
        tweetLayer.setRenderer(renderer);
        */
        console.log('tweet layer', tweetLayer)
        // end categorical styling
        layers.push(tweetLayer);

        //add all the layers to the map then initialize the slider
        map.addLayers(layers);
        dojo.connect(map,"onLayersAddResult",initSlider);

        //when fired, create a new graphic with the geometry from the event.graphic and add it to the maps graphics layer
        //dojo.connect(tweetLayer, "onMouseOver", openDialog);
        //dojo.connect(tweetLayer, "onMouseOut", closeDialog);
        //dojo.connect(map, "onExtentChange", showExtent);
        dojo.connect(map, "onExtentChange", showExtent);
      }
      
      function showExtent(extent) {
        console.log('extent', extent)
      }
      
      function openDialog(evt){
        closeDialog();
        
        var type;
        dojo.forEach(categories, function(cat,i) {
          if (cat.code == evt.graphic.attributes.UCRHundred) {
            type = cat['label'];
            return;            
          }
        })
        
        var dialog = new dijit.TooltipDialog({
          id: "tooltipDialog",
          style: "position: absolute; width: 250px; font: normal normal normal 10pt Helvetica;z-index:100"
        });
        dialog.startup();

        var t = "<b>Type: </b>"+type+"<br /><hr><b>Stolen Value: </b>${STOLEN_VALUE:NumberFormat}<br/>"
                         + "<b>Recovered Value: </b>${RECOVERED_VALUE:NumberFormat}<br/>"
                         + "<b>Locations: </b>${LOCATION}<br />"

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
        timeSlider.createTimeStopsByTimeInterval(timeExtent,1,'esriTimeUnitsHours');
        timeSlider.setThumbIndexes([0,5]);
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