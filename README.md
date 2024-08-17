**Abstract**

Mapping Himalayan leucogranite based on multi-source remote sensing data and Google Earth Engine platform.

-   The GEE computation platform provides online JavaScript and Python Application Programming Interfaces, so there are two code files based on different APIs.
-   The input data were three vector files containing the study area region, and the remote sensing data were called from the GEE cloud server.
-   The input results are TIF files saved to Google Cloud Drive, mapped according to the probability that each pixel point in the study area is a Himalayan leucogranite, which can be displayed online.

**Environment(JavaScript)**

-   Interactive JavaScript using the Code Editor(https://code.earthengine.google.com/), the open source JavaScript library in Node.js.

**Environment(Python)**

-   To facilitate the mounting of the GEE Python API, the code needs to be run in Google Colaboratory(https://colab.research.google.com/).
-   Google Colaboratory can load all open source libraries without additional configuration.

**Input dataset (example)**

-   ee.FeatureCollection("Asset ID/Asset name1")

    Locally uploaded vector file of the Himalayan orogenic belt region.

-   ee.FeatureCollection("Asset ID/Asset name2")

    Locally uploaded vector file of the Cuonadong dome region.

-   ee.FeatureCollection("Asset ID/Asset name3")

    Locally uploaded vector file of the Himalayan orogenic belt area excluding the area of Cuonadong dome.

-   ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')

    Calling Sentinel-2 image data from GEE cloud servers.


**Output dataset**

-   img_classfication.tif

    The mapping results is a TIF file saved to Google Cloud Drive.


Usage

-   Setting: study area, sample points and remote sensing bands
-   Run ‘GEE_mapping.ipynb’ in Google Colaboratory or run ‘GEE_mapping.js’ in GEE Code Editor
