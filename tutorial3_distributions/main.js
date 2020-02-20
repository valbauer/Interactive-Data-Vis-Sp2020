/* CONSTANTS AND GLOBALS */
const width = window.innerWidth * 0.9,
  height = window.innerHeight * 0.7,
  margin = { top: 20, bottom: 70, left: 90, right: 40 },
  radius = 5;

// these variables allow us to access anything we manipulate in init() but need access to in draw().
// All these variables are empty before we assign something to them.
let svg;
let xScale;
let yScale;
let boroColors;

/* APPLICATION STATE */
let state = {
  data: [],
  selectedBoro: "NYC" // + YOUR FILTER SELECTION
};

/* LOAD DATA */
d3.csv("../data/Data73200_Tutorial3.csv", d3.autoType).then(raw_data => {
  // + SET YOUR DATA PATH
  console.log("raw_data", raw_data);
  state.data = raw_data;
  init();
});

/* INITIALIZING FUNCTION */
// this will be run *one time* when the data finishes loading in 
function init() {
  // + SCALES
  xScale = d3
    .scaleLinear()
    .domain(d3.extent(state.data, d => d["Percent Population Over 18 Under 100% Poverty Level"]))
    .range([margin.left, width - margin.right]);

  yScale = d3
    .scaleLinear()
    .domain(d3.extent(state.data, d => d["Percent Registered Voters"]))
    .range([height - margin.bottom, margin.top]);

  boroColor = d3.scaleOrdinal()
    .domain(d => d["Boro"])
    .range(d3.schemeDark2);

  // + AXES
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale);

  // + UI ELEMENT SETUP

  const selectElement = d3.select("#dropdown").on("change", function() {
    // `this` === the selectElement
    // 'this.value' holds the dropdown value a user just selected

    state.selectedBoro = this.value
    console.log("new value is", this.value);
    draw(); // re-draw the graph based on this new selection
  });

  // add in dropdown options from the unique values in the data
  selectElement
    .selectAll("option")
    .data(["NYC", "Brooklyn", "Bronx", "Manhattan", "Queens", "Staten Island"]) // + ADD UNIQUE VALUES
    .join("option")
    .attr("value", d => d)
    .text(d => d);

  // + CREATE SVG ELEMENT
  svg = d3
    .select("#d3-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // + CALL AXES
  svg
    .append("g")
    .attr("class", "axis x-axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(xAxis)
    .append("text")
    .attr("class", "axis-label")
    .attr("x", "50%")
    .attr("dy", "3em")
    .text("Percent of Population 18+ Under 100% Poverty Level");

  svg
    .append("g")
    .attr("class", "axis y-axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(yAxis)
    .append("text")
    .attr("class", "axis-label")
    .attr("y", "50%")
    .attr("dx", "-3em")
    .attr("writing-mode", "vertical-rl")
    //.attr("transform", "rotate(180deg)")
    .text("Percent of Registered Voters");

  draw(); // calls the draw function
}

/* DRAW FUNCTION */
 // we call this everytime there is an update to the data/state
function draw() {
  
  // + FILTER DATA BASED ON STATE
  let filteredData = state.data;

  if (state.selectedBoro !== "NYC") {
    filteredData = state.data.filter(d => d.boro === state.selectedBoro);
  }

   const dot = svg
     .selectAll("circle")
     .data(filteredData, d => d.boro)
     .join(
       enter => 
        enter
          .append("circle")
          .attr("class", "dot") // Note: this is important so we can identify it in future updates
          .attr("stroke", "lightgrey")
          .attr("opacity", 0.5)
          .attr("fill", function(d){return boroColor(d)})
          .attr("r", radius)
          .attr("cy", d => yScale(d["Percent Registered Voters"]))
          .attr("cx", d => margin.left) // initial value - to be transitioned
          .call(enter =>
            enter
              .transition() // initialize transition
              .delay(d => 500 * d["Percent Population Over 18 Under 100% Poverty Level"]) // delay on each element
              .duration(500) // duration 500ms
              .attr("cx", d => xScale(d["Percent Population Over 18 Under 100% Poverty Level"]))
          ), // + HANDLE ENTER SELECTION
       update => 
        update.call(update =>
        // update selections -- all data elements that match with a `.dot` element
          update
            .transition()
            .duration(250)
            .attr("stroke", "black")
            .transition()
            .duration(250)
            .attr("stroke", "lightgrey")
      ), // + HANDLE UPDATE SELECTION
       exit => 
        exit.call(exit =>
        // exit selections -- all the `.dot` element that no longer match to HTML elements
         exit
           .transition()
           .delay(d => 50 * d["Percent Population Over 18 Under 100% Poverty Level"])
           .duration(500)
           .attr("cx", width)
           .remove()
      ) // + HANDLE EXIT SELECTION
     );
}
