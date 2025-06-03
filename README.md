# SuperSplatViewer - 3D Gaussian Splat Editor with Walkable Area and first person Camera

Uses SuperSplat as base and has a Tool to draw in a Zone for the Camera to move inside. Also adjusts Camera to get a first person experience.

To learn more about SuperSplat, please refer to the [original git](https://github.com/playcanvas/supersplat).

## Local Development

To initialize a local development environment for SuperSplat, ensure you have [Node.js](https://nodejs.org/) 18 or later installed. Follow these steps:

1. Clone the repository:

   ```sh
   git clone https://github.com/Deldood/superSplatViewer.git
   cd supersplat
   ```

2. Install dependencies:

   ```sh
   git submodule update --init
   npm install
   ```

3. Build SuperSplat and start a local web server:

   ```sh
   npm run develop
   ```

4. Open a web browser tab and make sure network caching is disabled on the network tab and the other application caches are clear:

   - On Safari you can use `Cmd+Option+e` or Develop->Empty Caches.
   - On Chrome ensure the options "Update on reload" and "Bypass for network" are enabled in the Application->Service workers tab:

   <img width="846" alt="Screenshot 2025-04-25 at 16 53 37" src="https://github.com/user-attachments/assets/888bac6c-25c1-4813-b5b6-4beecf437ac9" />

5. Navigate to `http://localhost:3000`

When changes to the source are detected, SuperSplat is rebuilt automatically. Simply refresh your browser to see your changes.

## Using Area Tool
1. Load the splat automatically
   To automatically load the gaussian splat (in ply format) you can put in in the <projectroot>/dist/model folder. On startup it will load the model and rotate it to get it        upright (if Gaussian Splatting model was created with splatfacto)

2. Remove top of your Model
   To make it easier to draw in the Walkable Area you first have to remove the top part of your Model.
   Fist align with the coordiante axis by using the coordinate system in the top right of the screen (clicking on axis)
   Use preferred selection tool to select all Gaussians that should be removed
   Press del
   
3. Draw in Walkable Area
   click on the 'Define Walkalbe Area' button in the bottom toolbar.
   Before Drawing in your the line you sould make sure you see the whole Area, where you want to draw in your line (Zooming in and out <mouse wheel > while drawing is not          advised and panning < hold right mouse button > is not possible)
   Left click to begin tracing out your Walkabale Area. To finish connect last line to the starting point.
   press ctrl + Z twice to respawn gaussians

5. Going into first person view
   By reselecting the Walkable Area Tool in the bottom Toolbar you get transportet to first person View.
   Hold left mouse button to look around and arrow keys to move.
   
      
# superSplatViewer
