/**
 * CONSTANTS AND GLOBALS
 * */
const width = window.innerWidth * 0.9,
  height = window.innerHeight * 0.7,
  margin = { top: 20, bottom: 50, left: 60, right: 40 },
  radius = 4;

/** these variables allow us to access anything we manipulate in
 * init() but need access to in draw().
 * All these variables are empty before we assign something to them.*/
let svg;

/**
 * APPLICATION STATE
 * */
let state = {
  geojson: null,
  extremes: null,
  geojsonHover: {
    Latitude: null,
    Longitude: null,
    State: null,
  },
  extremesHover: {
    numDays: null
  }
};

/**
 * LOAD DATA
 * Using a Promise.all([]), we can load more than one dataset at a time
 * */
Promise.all([
  d3.json("../data/us-state.json"),
  d3.csv("../data/usHeatExtremes.csv", d3.autoType),
]).then(([geojson, extremes]) => {
  // + SET STATE WITH DATA
  state.geojson = geojson;
  state.extremes = extremes;
  console.log("state: ", state);
  init();
});

/**
 * INITIALIZING FUNCTION
 * this will be run *one time* when the data finishes loading in
 * */
function init() {
  // create an svg element in our main `d3-container` element
  svg = d3
    .select("#d3-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // + SET UP PROJECTION
  const projection = d3.geoAlbersUsa().fitSize([width, height], state.geojson);
  const path = d3.geoPath().projection(projection);

  // + SET UP GEOPATH
  svg
    .selectAll(".state")
    .data(state.geojson.features)
    .join("path")
    .attr("d", path)
    .attr("class", "state")
    .attr("fill", "transparent")
    .on("mouseover", d => {
      // when the mouse rolls over this feature, do this
      state.geojsonHover["State"] = d.properties.NAME;
      draw(); // re-call the draw function when we set a new hoveredState
    });

  // + DRAW BASE MAP PATH
  //console.log(d3.max(state.extremes, d => d["Change in 95 percent Days"]))
  
  const radiusScale = d3
    .scaleSqrt()
    .domain([0, 55])
    .range([0,20]);

  const dot = svg
    .selectAll("circle")
    .data(state.extremes, d => d)
    .join("circle")
    .attr("class", "extremes")
    .attr("fill", d => {
      if (d["Change in 95 percent Days"] > 0) {
      return "#C70039"
      } else { 
        return "#49A7D3"
      }
    })
    .attr("r", d => radiusScale(Math.abs(d["Change in 95 percent Days"])))
    .attr("transform", d => {
      const [x, y] = projection([d.Long, d.Lat]);
      return `translate(${x}, ${y})`;
    })
    .on("mouseover", d => {
      // when the mouse rolls over this feature, do this
      state.extremesHover["Change in 95 percent Days"] = d["Change in 95 percent Days"];
      draw();
    })

  svg.on("mousemove", () => {
    // we can use d3.mouse() to tell us the exact x and y positions of our cursor
    const [mx, my] = d3.mouse(svg.node());
    // projection can be inverted to return [lat, long] from [x, y] in pixels
    const proj = projection.invert([mx, my]);
    state.geojsonHover["Longitude"] = proj[0];
    state.geojsonHover["Latitude"] = proj[1];
    draw();
  }); 

  draw(); // calls the draw function
};

/**
 * DRAW FUNCTION
 * we call this everytime there is an update to the data/state
 * */
function draw() {

  // return an array of [key, value] pairs

  geojsonHoverData = Object.entries(state.geojsonHover);
  extremesHoverData = Object.entries(state.extremesHover);

  d3.select("#hover-content")
    .selectAll("div.row")
    .data(geojsonHoverData)
    .join("div")
    .attr("class", "row")
    .html(
      d =>
        // each d is [key, value] pair
        d[1] // check if value exist
          ? `${d[0]}: ${d[1]}` // if they do, fill them in
          : null // otherwise, show nothing
    );
  d3.select("#hover-content")
    .selectAll("g")
    .data(extremesHoverData)
    .join("g")
    .attr("class", "extremesText")
    .html(
      d =>
        // each d is [key, value] pair
        d[1] // check if value exist
          ? `${d[0]}: ${d[1]}` // if they do, fill them in
          : null // otherwise, show nothing
  );
  
};
