// JavaScript code for mapping leucogranite based on GEE
// author: Dakai Guo,Ziye Wang
// contact: Ziye Wang (Email: ziyewang@cug.edu.cn)

// input vector file
var aoi = ee.FeatureCollection("Asset ID");// uploaded vector file of the Himalayan orogenic belt region
Map.centerObject(aoi)
var BANDS = ['a3n','a04','a06','a07','s11'];
var rsimage = ee.Image("Asset ID").select(BANDS).clip(aoi)// Call the pre-processed remote sensing data
var allimage = rsimage
print(allimage)

// Calling the U-Net model endpoint in VertexAi
var model = ee.Model.fromVertexAi({
    endpoint:'endpoints ID',
    inputTileSize:[128,128],
    inputOverlapSize:[125,125],
    inputShapes:{'array_image':[5]}, // The length of the data string should be the size of BANDS
    proj:ee.Projection('EPSG:4326').atScale(30), // Setting the Projection and resolution
    fixInputProj:true,
    maxPayloadBytes:5242880,
    outputBands:{
      'array': {
        'type': ee.PixelType.float(),
        'dimensions': 1 // The dimensions of the output data
      }
    }
    });

// Lithology prediction from remote sensing data
var predictions = model.predictImage(allimage.select(BANDS).float().toArray().rename('array_image'));

// Exporting prediction results
var exportParams = 
{
  image: predictions.arrayGet([0]),
  description: 'unet_prediction',
  folder: 'GEE',
  fileNamePrefix: 'unet_prediction',
  region: aoi,
  scale: 30,
  crs: 'EPSG:4326',
  fileFormat: 'GeoTIFF',
  maxPixels:10e10,
};
Export.image.toDrive(exportParams);
