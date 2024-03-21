// JavaScript code for mapping leucogranite based on GEE
// author: Dakai Guo,Ziye Wang
// contact: Ziye Wang (Email: ziyewang@cug.edu.cn)

// input vector file
var aoi = ee.FeatureCollection("projects/ee-kaifangguo/assets/AOI");
var hl_aoi = ee.FeatureCollection("projects/ee-kaifangguo/assets/cndhl");
var unhl_aoi = ee.FeatureCollection("projects/ee-kaifangguo/assets/unhl");

// Sentinel2 cloud mask function
function maskS2clouds(image)
{
        var  qa = image.select('QA60');
        var  cloudBitMask = 1 << 10;
        var  cirrusBitMask = 1 << 11;
        var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
                     .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
return image.updateMask(mask).divide(100);
}

// input ASTER and Sentinel2 image
var asterimage =  ee.Image("projects/ee-kaifangguo/assets/asterjz")
                    .select(['green','red','nir','swir1','swir2','swir3','swir4','swir5','swir6'],
                            ['A01','A02','A3N','A04','A05','A06','A07','A08','A09'])
                    .multiply (100)
                    .clip(aoi);
                    
var sentinel2image =  ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
                   .filterDate('2020-01-01','2022-12-31')
                   .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',10))
                   .filterBounds(aoi)
                   .map(maskS2clouds)
                   .select(['B2','B3','B4','B5','B6','B7','B8','B8A','B11','B12'],
                           ['S02','S03','S04','S05','S06','S07','S08','S8A','S11','S12'])
                   .median()
                   .clip(aoi);

// select remote sensing bands
var asterbands = asterimage.select('A3N','A04','A06','A07');
var sentinel2bands = sentinel2image.select('S11');
var allimage = asterbands.addBands(sentinel2bands);
print(allimage);
var bands = allimage.bandNames();

// production of train data
var positive_po = ee.FeatureCollection.randomPoints(hl_aoi,4000);
var negative_po = ee.FeatureCollection.randomPoints(unhl_aoi,4000);

function add_1(feature)
{
  return feature.set('Lithology', 1);
}

function add_0(feature)
{
  return feature.set('Lithology', 0);
}

var positive_data = positive_po.map(add_1);
var negative_data = negative_po.map(add_0);

var train_points = positive_data.merge(negative_data);

var train_data = allimage.sampleRegions({
  collection: train_points,
  properties: ['Lithology'],
  scale: 100
});

// training the random forest model
var withRandom = train_data.randomColumn('random');
var split = 0.7; 
var trainingPartition = withRandom.filter(ee.Filter.lt('random', split));
var testingPartition = withRandom.filter(ee.Filter.gte('random', split));

var rfModel = ee.Classifier.smileRandomForest(15).setOutputMode('PROBABILITY').train
(
  {
  features: trainingPartition,
  classProperty: 'Lithology',
  inputProperties: bands
  }
);

// test model performance
var validated = testingPartition.classify(rfModel);

var probToClass = function(feature) 
{
  var prob = ee.Number(feature.get('classification'));
  var label = prob.gte(0.5).toInt();
  return feature.set('predicted', label);
};

var validatedClass = validated.select('Lithology','classification').map(probToClass);
var confusionMatrix = validatedClass.errorMatrix('Lithology', 'predicted');
print('confusionMatrix',confusionMatrix);
print('overall accuracy', confusionMatrix.accuracy());
print('kappa accuracy', confusionMatrix.kappa());

// output the mapping results
var img_classfication = allimage.classify(rfModel);
print(img_classfication);
var exportParams = 
{
  image: img_classfication,
  description: '5bands',
  folder: 'GEE',
  fileNamePrefix: '5bands',
  region: aoi,
  scale: 100,
  crs: 'EPSG:4326',
  fileFormat: 'GeoTIFF'
};
Export.image.toDrive(exportParams);

// visualization
Map.addLayer(asterimage, {min:0, max:100, bands:['A3N', 'A02','A01']}, 'ASTER');
Map.addLayer(sentinel2image, {min:0, max:80, bands:['S04', 'S03','S02']}, 'Sentinel2');
Map.addLayer(img_classfication, {min:0, max:1, palette:['yellow', 'red','blue']}, 'img_classfication');
Map.addLayer(aoi, {}, 'aoi');
Map.centerObject(aoi);
