/**
 * CONSTANTS AND GLOBALS
 * */

 "use strict"

const width = window.innerWidth * 0.9,
  height = window.innerHeight * 0.7,
  margin = { top: 20, bottom: 50, left: 60, right: 40 };

let svg;
let tooltip;
//let mousePosition;

/**
 * APPLICATION STATE
 * */
let state = {
  data: null,
  hover: null,
  //mousePosition: null,
};

/**
 * LOAD DATA
 * */
d3.json("../data/flare.json", d3.autotype).then(data => {
  state.data = data;
  console.log(state.data)
  init();
});

/**
 * INITIALIZING FUNCTION
 * this will be run *one time* when the data finishes loading in
 * */
function init() {
  const container = d3.select("#d3-container").style("position", "relative");

  const colorScale = d3.scaleOrdinal(d3.schemeDark2);

  tooltip = container
  .append("div")
  .attr("class", "tooltip")
  .attr("width", 100)
  .attr("height", 100)
  .style("position", "absolute");

  svg = container
    .append("svg")
    .attr("width", width)
    .attr("height", height);


  // + CREATE YOUR ROOT HIERARCHY NODE
  const root = d3
    .hierarchy(state.data) 
    .sum(d => d.value) 
    .sort((a, b) => b.value - a.value);


  // + CREATE YOUR LAYOUT GENERATOR
  const circlePack = d3
    .pack()
    .size([width, height])
    .padding(5);    
    
  // + CALL YOUR LAYOUT FUNCTION ON YOUR ROOT DATA
  circlePack(root);

  console.log(root);

  // + CREATE YOUR GRAPHICAL ELEMENTS
  
  const circle = svg
    .selectAll("g")
    .data(root.descendants())
    .join("g")
    .attr("transform", d => `translate(${d.x},${d.y})`);

  circle
    .append("circle")
    .attr("class", "nodeCircle")
    .attr("fill", d => {
      return colorScale(d.depth)
    })
    .attr("r", d => d.r)
    .on("mousemove", d => {
      state.hover = {
        name: d.data.name,
        value: d.data.value,
        title: `${d
          .ancestors()
          .reverse()
          .map(d => d.data.name)
          .join("/")}`,
      };
      draw();
    });

  draw(); 

};
 

/**
 * DRAW FUNCTION
 * we call this everytime there is an update to the data/state
 * */

  // + UPDATE TOOLTIP
 function draw() {
    if (state.hover) {
      tooltip
        .html(
          `
          <div>Name: ${state.hover.name}</div>
          <div>Value: ${state.hover.value}</div>
          <div>Hierarchy Path: ${state.hover.title}</div>
        `
        )
        .transition()
        .duration(100)
        .style(
          "transform", () => {
            const [mx, my] = d3.mouse(svg.node());
            return `translate(${mx+10}px,${my}px)`
          }

        );
    }
  


}
