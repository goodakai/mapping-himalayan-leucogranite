// JavaScript code for mapping leucogranite based on GEE
// author: Dakai Guo,Ziye Wang
// contact: Ziye Wang (Email: ziyewang@cug.edu.cn)

// input vector file
var aoi = ee.FeatureCollection("Asset ID/Asset name1");// uploaded vector file of the Himalayan orogenic belt region
var hl_aoi = ee.FeatureCollection("Asset ID/Asset name2");// uploaded vector file of the Cuonadong dome region
var unhl_aoi = ee.FeatureCollection("Asset ID/Asset name3");// uploaded vector file of the Himalayan orogenic belt area excluding the area of Cuonadong dome

// Sentinel2 cloud mask function
function maskS2clouds(image)
{
        var  qa = image.select('QA60');// cloud mask band
        var  cloudBitMask = 1 << 10;// the 10th digit of QA60 represents the probability of cloud presence
        var  cirrusBitMask = 1 << 11;// the 11th digit of QA60 represents the probability of cirrus presence
        var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
                     .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
return image.updateMask(mask).divide(100);// for consistency with the ASTER value range divided by 100
}

// input ASTER and Sentinel2 image
var asterimage =  ee.Image('Asset ID/Asset name3')// uploaded TIF file of atmospherically corrected ASTER image
                    .select(['green','red','nir','swir1','swir2','swir3','swir4','swir5','swir6'],
                            ['A01','A02','A3N','A04','A05','A06','A07','A08','A09'])
                    .multiply (100)// for consistency with the Sentinel2 value range multiply by 100
                    .clip(aoi);
                    
var sentinel2image =  ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")// calling Sentinel-2 image data from GEE cloud servers
                   .filterDate('2020-01-01','2022-12-31')// filtering the date range in which the image was taken
                   .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',10))// filtering images with less than 10% cloud parameter
                   .filterBounds(aoi)
                   .map(maskS2clouds)
                   .select(['B2','B3','B4','B5','B6','B7','B8','B8A','B11','B12'],
                           ['S02','S03','S04','S05','S06','S07','S08','S8A','S11','S12'])
                   .median()
                   .clip(aoi)
                   .reproject('EPSG:4326',null,100);// resampling of sentinel2 data to EPSG:4326 and 100 m resolution

// select remote sensing bands
var asterbands = asterimage.select('A3N','A04','A06','A07');
var sentinel2bands = sentinel2image.select('S11');
var allimage = asterbands.addBands(sentinel2bands);
print(allimage);
var bands = allimage.bandNames();

// production of train data
var positive_po = ee.FeatureCollection.randomPoints(hl_aoi,4000);// 4000 randomly selected pixels in the leucogranite area of Cuonadng
var negative_po = ee.FeatureCollection.randomPoints(unhl_aoi,4000);// 4000 randomly selected pixels in unknown area

function add_1(feature)
{
  return feature.set('Lithology', 1);// add label 1 to positive data
}

function add_0(feature)
{
  return feature.set('Lithology', 0);// add label 0 to negative data
}

var positive_data = positive_po.map(add_1);
var negative_data = negative_po.map(add_0);

var train_points = positive_data.merge(negative_data);

var train_data = allimage.sampleRegions({
  collection: train_points,
  properties: ['Lithology'],// copy label values to the property list
  scale: 100// spatial resolution for extracting pixel values
});

// training the random forest model
var withRandom = train_data.randomColumn('random');
var split = 0.7; // set a threshold for splitting the dataset
var trainingPartition = withRandom.filter(ee.Filter.lt('random', split));
var testingPartition = withRandom.filter(ee.Filter.gte('random', split));

var rfModel = ee.Classifier.smileRandomForest(15).setOutputMode('PROBABILITY').train
(
  {
  features: trainingPartition,
  classProperty: 'Lithology',
  inputProperties: bands
  }
);//construct a rf model with 15 trees and set it to PROBABILITY output mode

// test model performance
var validated = testingPartition.classify(rfModel);

var probToClass = function(feature) 
{
  var prob = ee.Number(feature.get('classification'));
  var label = prob.gte(0.5).toInt();// the results of the testingPartition were split according to a threshold of 0.5
  return feature.set('predicted', label);
};

var validatedClass = validated.select('Lithology','classification').map(probToClass);
var confusionMatrix = validatedClass.errorMatrix('Lithology', 'predicted');// calculate the confusionMatrix
print('confusionMatrix',confusionMatrix);
print('overall accuracy', confusionMatrix.accuracy());
print('kappa accuracy', confusionMatrix.kappa());

// output the mapping results
var img_classfication = allimage.classify(rfModel);
print(img_classfication);
var exportParams = 
{
  image: img_classfication,
  description: 'description',//exporting task descriptions
  folder: 'folder',//export to Google Cloud Drive folder
  fileNamePrefix: 'fileName',// name of the exported file
  region: aoi,
  scale: 100,// resolution of the exported file
  crs: 'EPSG:4326',// coordinate of the exported file
  fileFormat: 'GeoTIFF'
};
Export.image.toDrive(exportParams);

// visualization
Map.addLayer(asterimage, {min:0, max:100, bands:['A3N', 'A02','A01']}, 'ASTER');// show ASTER image
Map.addLayer(sentinel2image, {min:0, max:80, bands:['S04', 'S03','S02']}, 'Sentinel2');// show Sentinel2 image
Map.addLayer(img_classfication, {min:0, max:1, palette:['yellow', 'red','blue']}, 'img_classfication');// show leucogranite mapping image
Map.addLayer(aoi, {}, 'aoi');// show study area boundaries
Map.centerObject(aoi);// using the study area as a display center
