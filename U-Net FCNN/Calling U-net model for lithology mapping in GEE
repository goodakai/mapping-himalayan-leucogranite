var aoi = ee.FeatureCollection("projects/ee-kaifangguo/assets/AOI");
Map.centerObject(aoi)
var cndhl = ee.FeatureCollection("projects/ee-kaifangguo/assets/cndhl");

var BANDS = ['a3n','a04','a06','a07','s11','a10','a11','a12','a13','a14'];
// var BANDS = ['a10', 'a11', 'a12', 'a13', 'a14', 's11'];

var asterswimage = ee.Image('projects/ee-kaifangguo/assets/aster_ac_SW').clip(aoi)
                   .select(['swir1','swir2','swir3','swir4','swir5','swir6'],['a04','a05','a06','a07','a08','a09'])
                   .multiply(100)    
                   //.unmask(0)
                   .reproject('EPSG:4326',null,30)
                  // .float()
var astervnimage = ee.Image('projects/ee-kaifangguo/assets/aster_ac_VN').clip(aoi)
                   .select(['green','red','nir'],['a01','a02','a3n'])
                   .multiply(100)    
                   //.unmask(0)
                   //.reproject('EPSG:4326',null,30)                 
var s2image =  ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
                   .filterDate('2020-01-01','2022-12-31')
                   .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',10))
                   .filterBounds(aoi)
                   .median()
                   .clip(aoi)
                   .select(['B2','B3','B4','B5','B6','B7','B8','B8A','B11','B12']
                          ,['s02','s03','s04','s05','s06','s07','s08','s8a','s11','s12'])
                   .divide(100)
                  // .unmask(0)
                   .reproject('EPSG:4326',null,30);
//Map.addLayer(s2image,{min:0,max:100,Bands:['s06','s07','s08']})
//var allimage = s2image//.addBands(asterimage)
// var a3n = ee.Image("projects/ee-kaifangguo/assets/unzhibei").select('a3n')
 var a10 = ee.Image("projects/ee-kaifangguo/assets/a10").select(['A10'],['a10'])
 var a11 = ee.Image("projects/ee-kaifangguo/assets/a11").select(['A11'],['a11'])
 var a12 = ee.Image("projects/ee-kaifangguo/assets/a12").select(['A12'],['a12'])
 var a13 = ee.Image("projects/ee-kaifangguo/assets/a13").select(['A13'],['a13'])
 var a14 = ee.Image("projects/ee-kaifangguo/assets/a14").select(['A14'],['a14'])
// var s11 = ee.Image("projects/ee-kaifangguo/assets/unzhibei").select('s11')

var rsimage = ee.Image("projects/ee-kaifangguo/assets/unzhibei").select(['a3n','a04','a06','a07','s11'])
// var dsm = ee.ImageCollection('JAXA/ALOS/AW3D30/V3_2').filterBounds(aoi).median().clip(aoi).select('DSM');

 var image1 = a10.addBands(a11).addBands(a12).addBands(a13).addBands(a14).clip(aoi)
 var allimage = rsimage.addBands(image1)
print(allimage)
//加载我们刚才训练好的模型

var model = ee.Model.fromVertexAi({
    endpoint:'projects/ee-kaifangguo/locations/us-central1/endpoints/2073958205938991104',
    inputTileSize:[128,128],
    inputOverlapSize:[80,80],
    inputShapes:{'array_image':[10]},
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


//print('scale of output', predictions.projection().nominalScale().getInfo())

//print('scale of output', predictions.projection().nominalScale().getInfo())
//var labels = predictions.arrayArgmax().arrayGet(0).byte().rename('label')
//输出的数组每个元素含有7种地物的概率，把这个转为一个三维数组
//var probabilities = predictions.arrayFlatten([['quater', 'leuco','triassic','paleo','biotiter','cambr','jurass']]);
print(predictions)
//print(labels)
// Map.addLayer(predictions.arrayGet([0]),{},'1')
//Map.addLayer(cndhl,{},'cndhl')
//Map.addLayer(labels,{},'2')
//Map.centerObject(table,12);
//Map.addLayer(probabilities.select('a'),{},('a'));
//Map.addLayer(labels,{},('11'));
//Map.addLayer(s2image,{'bands': ['S08', 'S06', 'S07'],min:0,max:100},('s2'));

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
  //fileDimensions: 10240
};
Export.image.toDrive(exportParams);
