/* CONSTANTS AND GLOBALS */
const width = window.innerWidth * 0.8,
  height = window.innerHeight * 0.7,
  margin = { top: 20, bottom: 50, left: 25, right: 30 },
  radius = 3;

// these variables allow us to access anything we manipulate in init() but need access to in draw().
// All these variables are empty before we assign something to them.
let svg;
let xScale;
let yScale;


/* APPLICATION STATE */
let state = {
  data: [],
  selectedMonth: "November", // + YOUR FILTER SELECTION
};

/* LOAD DATA */
// + SET YOUR DATA PATH
d3.csv("../data/Denali_Weather.csv", d => ({
  date: new Date(d.date),
  station: d.name,
  month: d.monthName,
  precipitation: +d.precip,
  snowfall: +d.snowfall,
  snowdepth: +d.snowdepth,
  tempMax: +d.tempMax,
  tempMin: +d.tempMin,
  event: d.event
})).then(raw_data => {
  console.log("raw_data", raw_data);
  state.data = raw_data;
  init();
});

/* INITIALIZING FUNCTION */
// this will be run *one time* when the data finishes loading in
function init() {
  // + SCALES
  xScale = d3.scaleTime()
    .domain(d3.extent(state.data, d => d.date))
    .range([margin.left, width - margin.right]);

  yScale = d3.scaleLinear()
    .domain([d3.min(state.data, d => d.tempMin), d3.max(state.data, d => d.tempMax)]) 
    .range([height - margin.bottom, margin.top]);
  
  // + AXES
  xAxis = d3.axisBottom(xScale);
  yAxis = d3.axisRight(yScale);//.tickSize(width - margin.left - margin.right);

  // + UI ELEMENT SETUP

  const selectElement = d3.select("#dropdown").on("change", function() {
    // `this` === the selectElement
    // 'this.value' holds the dropdown value a user just selected
    state.selectedMonth = this.value; // + UPDATE STATE WITH YOUR SELECTED VALUE
    console.log("new value is", this.value);
    draw(); // re-draw the graph based on this new selection
  });


  // add in dropdown options from the unique values in the data
  selectElement
    .selectAll("option")
    .data(["November", "December", "January", "February", "March"])
    .join("option")
    .attr("value", d => d)
    .text(d => d);

  // + SET SELECT ELEMENT'S DEFAULT VALUE (optional)
  selectElement.property("value", "November");
  
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
   .text("Month");

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
   .text("Temperature (F)");

  draw(); // calls the draw function
};

/* DRAW FUNCTION */
// we call this everytime there is an update to the data/state
function draw() {
  // + FILTER DATA BASED ON STATE
  let filteredData;
  if (state.selectedMonth !== null) {
    filteredData = state.data.filter(d => d.month === state.selectedMonth);
  }
  // + UPDATE SCALE(S), if needed
 
  yScale.domain([d3.min(filteredData, d => d.tempMin), d3.max(filteredData, d => d.tempMax)]);
  xScale.domain(d3.extent(filteredData, d => d.date))
  
  const lineFuncMax = d3
    .line()
    .x(d => xScale(d.date))
    .y(d => yScale(d.tempMax));

  const lineFuncMin = d3
    .line()
    .x(d => xScale(d.date))
    .y(d => yScale(d.tempMin));

  const areaFunc = d3
    .area()
    .x(d => xScale(d.date))
    .y1(d => yScale(d.tempMax))
    .y0(d => yScale(d.tempMin));
 
  // + UPDATE AXIS/AXES, if needed
  d3.select("g.y-axis")
  .transition()
  .duration(1000)
  .call(yAxis.scale(yScale));

  d3.select("g.x-axis")
  .transition()
  .duration(1000)
  .call(xAxis.scale(xScale));

  // + DRAW CIRCLES, if you decide to
  const dot = svg
    .selectAll("circle")
    .data(filteredData, d => d.month)
    .join(
      enter =>
       enter
         .append("circle")
         .attr("class", "dot") // Note: this is important so we can identify it in future updates
         .attr("r", radius)
         .attr("cy", margin.top) // initial value - to be transitioned
         .attr("cx", d => xScale(d.date)),     
      update => update
     )
    .call(
      selection =>
        selection
          .transition() // initialize transition
          .duration(1000) // duration 1000ms / 1s
          .attr("cy", d => yScale(d.tempMax)) 
    )
    .call( // NOTE FROM VAL: I tried to use the code form the demo, but the dots would not exit. When I took the exit
      exit => // out of the .join statement the dots would exit. I have no clue why. 
          exit
            .transition()
            .delay(d => d.date)
            .duration(500)
            .attr("cy", height - margin.bottom)
            .remove()
      );

   // dot.on("mouseover", d => d.tempMax);
    
   
  //+ DRAW LINE AND AREA
  const lineMax = svg
    .selectAll("path.trendMax")
    .data([filteredData])
    .join(
      enter =>
        enter
          .append("path")
          .attr("class", "trendMax")
          .attr("opacity", 0), // start them off as opacity 0 and fade them in
      update => update, // pass through the update selection
      exit => exit.remove()
  )
  .call(selection =>
    selection
      .transition() // sets the transition on the 'Enter' + 'Update' selections together.
      .duration(1000)
      .attr("opacity", 1)
      .attr("d", d => lineFuncMax(d))
  );
    
  const lineMin = svg
    .selectAll("path.trendMin")
    .data([filteredData])
    .join(
      enter =>
        enter
          .append("path")
          .attr("class", "trendMin")
          .attr("opacity", 0), // start them off as opacity 0 and fade them in
      update => update, // pass through the update selection
      exit => exit.remove()
  )
  .call(selection =>
    selection
      .transition() // sets the transition on the 'Enter' + 'Update' selections together.
      .duration(1000)
      .attr("opacity", 1)
      .attr("d", d => lineFuncMin(d))
  );

  const area = svg
    .selectAll("path.area")
    .data([filteredData])
    .join(
      enter =>
        enter
          .append("path")
          .attr("class", "area")
          .attr("opacity", 0), 
      update => update, 
      exit => exit.remove()
  )
  .call(selection =>
    selection
      .transition() 
      .duration(1000)
      .attr("opacity", 1)
      .attr("d", d => areaFunc(d))
  );

};
