var aoi = ee.FeatureCollection("projects/ee-kaifangguo/assets/AOI");
Map.centerObject(aoi)
var cndhl = ee.FeatureCollection("projects/ee-kaifangguo/assets/cndhl");
var BANDS = ['a3n','a04','a06','a07','s11'];
var rsimage = ee.Image("projects/ee-kaifangguo/assets/unzhibei").select(BANDS).clip(aoi)
var allimage = rsimage
print(allimage)
//加载我们刚才训练好的模型

var model = ee.Model.fromVertexAi({
    endpoint:'projects/ee-kaifangguo/locations/us-central1/endpoints/2073958205938991104',
    inputTileSize:[128,128],
    inputOverlapSize:[80,80],
    inputShapes:{'array_image':[5]},
    proj:ee.Projection('EPSG:4326').atScale(30),
    fixInputProj:true,
    maxPayloadBytes:5242880,
    outputBands:{
      'array': {
        'type': ee.PixelType.float(),
        'dimensions': 1
      }
    }
    });
//对图像进行预测

var predictions = model.predictImage(allimage.select(BANDS).float().toArray().rename('array_image'));


var exportParams = 
{
  image: predictions.arrayGet([0]),
  description: 'unet100_75',
  folder: 'GEE',
  fileNamePrefix: 'unet100_75',
  region: aoi,
  scale: 100,
  crs: 'EPSG:4326',
  fileFormat: 'GeoTIFF',
  maxPixels:10e10,
};
Export.image.toDrive(exportParams);
