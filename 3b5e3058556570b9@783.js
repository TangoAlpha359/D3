function _1(md){return(
md`# INTERACTIVE SCATTER PLOT USING VORONOI
## SPOTIFY | GENRES | D3

Often we want to add "detail on demand" interactivity options to a scatter plot. If we also want to add animation options to the circles, we might run into execution problems. A way to keep the hovering option separated from the circles is to add an invisible voronoi diagram in the background, which will be used only to handle the mouse interactivity events. 

So what is exactly a voronoi diagram? 

In a [voronoi diagram](https://flowingdata.com/charttype/voronoi-diagram/) each polygon, or voronoi cell, contains an original point and all areas that are closer to that point than any other. Hence for every location on a scatter plot, there is a dot that is the closest. The Voronoi diagram is constructed by connecting the circumcenters of adjacent triangles in the Delaunay triangulation. In [this notebook](https://observablehq.com/@mbostock/the-delaunays-dual) Mike created an impressive animation-walk-through. 

The data used in this example are describing audio features of different music genres defined and modelled by [Spotify](https://developer.spotify.com/documentation/web-api/reference/#category-tracks). `
)}

async function _data(d3,FileAttachment){return(
d3.csvParse(
  await FileAttachment("data_by_genres.csv").text(),
  d3.autoType
)
)}

function _3(md){return(
md`## VORONOI WITH D3.JS 
[d3.Delaunay](https://github.com/d3/d3-delaunay) is an external library, the API is a bit different from other d3 code. A delaunay triangulation is a way to join a set of points to create a triangular mesh. To create this, we can pass d3.Delaunay.from() three parameters:

1. our dataset,
2. an x accessor function, and
3. a y accessor function.

Of course as always we apply scales to our positions in order to match the pixel space to the data variable units. If you are new to sales, please check out [this notebook](https://observablehq.com/@sandraviz/d3-scale?collection=@sandraviz/30-days-of-d3-dataviz)`
)}

function _voronoi(d3,data,x,y,margin,width,height){return(
d3.Delaunay.from(
  data,
  (d) => x(d.danceability),
  (d) => y(d.energy)
).voronoi([
  margin.left,
  margin.top,
  width - margin.right,
  height - margin.bottom
])
)}

function _x(d3,data,margin,width){return(
d3
  .scaleLinear()
  .domain(d3.extent(data, (d) => d.danceability))
  .nice()
  .range([margin.left, width - margin.right])
)}

function _y(d3,data,height,margin){return(
d3
  .scaleLinear()
  .domain(d3.extent(data, (d) => d.energy))
  .nice()
  .range([height - margin.bottom, margin.top])
)}

function _7(md){return(
md`### 1. Step | Voronoi diagram 

To start building this visualisation, we first draw the voronoi using the two variables *danceability* and *energy* from the Spotify genre dataset, which we will later use for the scatter plot. By defining the fill of the strokes of each path we make the voronoi structure visible, as you can see below. `
)}

function _voronoi_chart(d3,width,height,data,voronoi)
{
  const svg = d3.create("svg").attr("viewBox", [0, 0, width, height]);

  const cells = svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 0.5)
    .attr("pointer-events", "all")
    .selectAll("path")
    .data(data)
    .join("path")
    .attr("d", (d, i) => voronoi.renderCell(i));

  return svg.node();
}


function _9(md){return(
md`### 2. Step | Voronoi diagram with hover

In the second step we create our tooltip with the events "mouseenter" and "mouseout"`
)}

function _hover(margin,width){return(
(tip, pos, text) => {
  const side_padding = 3;

  tip
    .style("text-anchor", "middle")
    .style("pointer-events", "none")
    .attr("transform", `translate(${pos[0]}, ${pos[1]})`)
    .selectAll("text")
    .data(text)
    .join("text")
    .style("dominant-baseline", "ideographic")
    .text((d) => d)
    .attr("y", (d, i) => (i - (text.length - 1)) * 15)
    .style("font-weight", (d, i) => (i === 0 ? "bold" : "normal"));

  const bbox = tip.node().getBBox();

  // Add a rectangle (as background)
  tip
    .append("rect")
    .attr("y", bbox.y)
    .attr("x", bbox.x - side_padding)
    .attr("width", bbox.width + side_padding * 2)
    .attr("height", bbox.height)
    .style("fill", "white")
    .style("stroke", "white")
    .lower();

  // Reposition the full g element to make sure it doesn't go offscreen
  let x = pos[0];
  let y = pos[1];

  // Make sure it doesn't go beyond the left of the chart
  if (x + bbox.x < margin.left) {
    x = margin.left + bbox.width / 2 + side_padding;
  }
  // Make sure it doesn't go beyond the right of the chart
  else if (x - bbox.x > width - margin.right) {
    x = width - margin.right - bbox.width / 2;
  }

  // Make sure it doesn't go over the top of the chart
  if (y + bbox.y < 0) {
    y = margin.top + bbox.height + 10;
  }
  tip.attr("transform", `translate(${x}, ${y})`);
}
)}

function _voronoi_chart2(d3,width,height,data,voronoi,x,y,hover)
{
  const svg = d3.create("svg").attr("viewBox", [0, 0, width, height]);

  const cells = svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 0.5)
    .attr("pointer-events", "all")
    .selectAll("path")
    .data(data)
    .join("path")
    .attr("d", (d, i) => voronoi.renderCell(i));

  const tip = svg
    .append("g")
    .style("pointer-events", "none")
    .attr("class", "tooltip");

  cells
    .on("mouseenter", (event) => {
      const value = event.target.__data__;
      const pointer = [x(value.danceability), y(value.energy)];
      const text = [value.genres];
      tip.call(hover, pointer, text);
    })
    .on("mouseout", (event) => {
      tip.selectAll("*").remove();
    });

  return svg.node();
}


function _12(md){return(
md`### 3. Step | Voronoi diagram with circles

In the third step we create our standard scatter plot by adding circle elements which depend in their x and y position on the same two variables "danceability" and "energy" as we've used to create the voronoi diagram before. Moreover we add a color scale called c, to help the audience to detect relationship patterns. `
)}

function _c(d3,data){return(
d3
  .scaleLinear()
  .range(["#022859", "#1ce3cd"])
  .domain(d3.extent(data, (d) => d.danceability))
)}

function _voronoi_chart3(d3,width,height,data,x,y,c,voronoi,hover)
{
  const svg = d3.create("svg").attr("viewBox", [0, 0, width, height]);

  // Circles for the scatter

  const circles = svg
    .append("g")
    .selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", (d) => x(d.danceability))
    .attr("cy", (d) => y(d.energy))
    .style("fill", (d) => c(d.danceability))
    .attr("r", 3);

  //Voronoi diagram

  const cells = svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 0.5)
    .attr("pointer-events", "all")
    .selectAll("path")
    .data(data)
    .join("path")
    .attr("d", (d, i) => voronoi.renderCell(i));

  //Hover

  const tip = svg
    .append("g")
    .style("pointer-events", "none")
    .attr("class", "tooltip");
  cells
    .on("mouseenter", (event) => {
      const value = event.target.__data__;
      const pointer = [x(value.danceability), y(value.energy)];
      const text = [value.genres];
      tip.call(hover, pointer, text);
    })
    .on("mouseout", (event) => {
      tip.selectAll("*").remove();
    });

  return svg.node();
}


function _15(md){return(
md`### 4. Step | Make the voronoi invisible

Finally we just need to make the voronoi invisible in order to create the visual perception of a scatter plot. The only functionality of the voronoi was to add hover interactivity, which is inline with the position of the circles. Et voila! To check out the final version using animation and axes for more context, please check out [this notebook](https://observablehq.com/@sandraviz/spotify-genres-voronoi) `
)}

function _voronoi_chart4(d3,width,height,data,x,y,c,voronoi,hover)
{
  const svg = d3.create("svg").attr("viewBox", [0, 0, width, height]);

  // Circles for the scatter

  const circles = svg
    .append("g")
    .selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", (d) => x(d.danceability))
    .attr("cy", (d) => y(d.energy))
    .style("fill", (d) => c(d.danceability))
    .attr("r", 3);

  //Voronoi diagram

  const cells = svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke", "none")
    .attr("pointer-events", "all")
    .selectAll("path")
    .data(data)
    .join("path")
    .attr("d", (d, i) => voronoi.renderCell(i));

  //Hover

  const tip = svg
    .append("g")
    .style("pointer-events", "none")
    .attr("class", "tooltip");
  cells
    .on("mouseenter", (event) => {
      const value = event.target.__data__;
      const pointer = [x(value.danceability), y(value.energy)];
      const text = [value.genres];
      tip.call(hover, pointer, text);
    })
    .on("mouseout", (event) => {
      tip.selectAll("*").remove();
    });

  return svg.node();
}


function _17(md){return(
md`
---
### Appendix`
)}

function _height(){return(
400
)}

function _d3(require){return(
require("d3@6")
)}

function _margin(){return(
{top: 20, right: 30, bottom: 30, left: 40}
)}

function _style(html){return(
html`<style>

@import url("https://fonts.googleapis.com/css2?family=Montserrat+Alternates:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Montserrat:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Roboto:ital,wght@0,100;0,300;1,100;1,300&display=swap");

body {
  font-family: 'Montserrat Alternates', sans-serif;
  font-weight:400;
  font-size:13px;
  background-color:white;
}

svg {
  background-color:white;
}

/*Defining text stylings*/

h1 {
  margin-top: 50;
  font-size: 1.3rem;
  color:#f20666;
  margin-bottom: 50;
  font-weight:600;
}

h2 {
  margin-top: 5px;
  font-size: 1rem;
  margin-bottom: 5px;
  color:#f20666;
  font-weight:500;
}

h3 {
  margin-top: 5px;
  font-size: 1rem;
  margin-bottom: 10px;
  color:#f20666;
  font-weight:400;
}

h4 {
  margin-top: 5px;
  font-size: 0.9rem;
  margin-bottom: 5px;
  color:#f20666;
  font-weight:300;
}

h5 {
  margin-top: 5px;
  font-size: 1rem;
  margin-bottom: 0px;
  color:#f20666;
  font-weight:400;
}

a:link, a:active, a:visited {
  margin-top:0.5px;
  color:#662e9b;
  font-size:12px;
  font-weight:500;
}

a:hover {
  margin-top:0.5px;
  color:#662e9b;
  font-size:12px;
  font-weight:500;
}

/*Defining axis stylings*/

.y_text, .x_text {
  font-family:'Montserrat Alternates', sans-serif;
  font-weight:400;
  font-size:12px;
  opacity:1;
  fill:#f20666;
}

.y-axis text, .x-axis text {
  font-family:'Montserrat Alternates', sans-serif;
  font-weight:400;
  font-size:9px;
  opacity:1;
  fill:#495867;
}

.y-axis path, .x-axis path {
  fill:none;
  stroke-width:0;
  stroke-opacity:1;
  stroke:#495867;
}

.y-axis line, .x-axis line {
  fill:none;
  stroke-width:0.1;
  stroke-opacity:1;
  stroke:#495867;
  stroke-dasharray:2;
}

.y-axis text, .x-axis text {
  font-family:'Montserrat Alternates', sans-serif;
  font-weight:400;
  font-size:12px;
  opacity:1;
  fill:#495867;
}

/*Defining chart stylings*/

.tooltip {
  font-family:'Montserrat Alternates', sans-serif;
  font-weight:700;
  font-size:17px;
  fill:#f20666;
}

.tooltip2 {
  font-family:'Montserrat Alternates', sans-serif;
  font-weight:400;
  font-size:11px;
  fill:#f20666;
}

circle {
   opacity:1;
   stroke:#f20666;
   stroke-width:0;
}

</style>`
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["data_by_genres.csv", {url: new URL("./files/b82f35cd7b8a3f2940b2809489b233df0c89b8bfcd60b22f11102b5eb97b89bed3e3e402726958d4735ecd54b25ae0d9b436617bf8c2f6b62549527c2108e70b", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("data")).define("data", ["d3","FileAttachment"], _data);
  main.variable(observer()).define(["md"], _3);
  main.variable(observer("voronoi")).define("voronoi", ["d3","data","x","y","margin","width","height"], _voronoi);
  main.variable(observer("x")).define("x", ["d3","data","margin","width"], _x);
  main.variable(observer("y")).define("y", ["d3","data","height","margin"], _y);
  main.variable(observer()).define(["md"], _7);
  main.variable(observer("voronoi_chart")).define("voronoi_chart", ["d3","width","height","data","voronoi"], _voronoi_chart);
  main.variable(observer()).define(["md"], _9);
  main.variable(observer("hover")).define("hover", ["margin","width"], _hover);
  main.variable(observer("voronoi_chart2")).define("voronoi_chart2", ["d3","width","height","data","voronoi","x","y","hover"], _voronoi_chart2);
  main.variable(observer()).define(["md"], _12);
  main.variable(observer("c")).define("c", ["d3","data"], _c);
  main.variable(observer("voronoi_chart3")).define("voronoi_chart3", ["d3","width","height","data","x","y","c","voronoi","hover"], _voronoi_chart3);
  main.variable(observer()).define(["md"], _15);
  main.variable(observer("voronoi_chart4")).define("voronoi_chart4", ["d3","width","height","data","x","y","c","voronoi","hover"], _voronoi_chart4);
  main.variable(observer()).define(["md"], _17);
  main.variable(observer("height")).define("height", _height);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("margin")).define("margin", _margin);
  main.variable(observer("style")).define("style", ["html"], _style);
  return main;
}
