// Overall dimension of the canvas
const width = window.innerWidth;
const height = window.innerHeight/1.1; //adjusted for anthonys laptop

// Dimensions for the parallel coordinates plot
let parallelLeft = 0, parallelTop = (3/4) * height;
let parallelMargin = {top: 10, right: 30, bottom: 30, left: 60},
    parallelWidth = width - parallelMargin.left - parallelMargin.right,
    parallelHeight = height - 450 - parallelMargin.top - parallelMargin.bottom;

let colors = [
    '#0384fc', //Married
    '#ff2a00', //Single
    '#194d19', //Other
    '#FF10F0' // user data
];
let opacityRS = [
    0, //Married
    0, //Single
    0, //Other
];
// let opacityG = [
//     0, //Married
//     0, //Single
//     0, //Other
// ];

let dimensions = ["Age", "Gender", "Social Media Avg Time", "Outcome"];
// made this global to see if it helps with the updating chart problem?
let rawData = [];
let g1;
function processingData(rawData) {
    // Data Processing
    // Transform data to number, string, and boolean values
    rawData.forEach(function(d) {  
        d["Age"] = Number(d["1. What is your age?"]);
        d["Gender"] = (d["2. Gender"] === "Female" || d["2. Gender"] === "Male") ? d["2. Gender"] : "Other";
        d["3. Relationship Status"] = (d["3. Relationship Status"] === "Single" || d["3. Relationship Status"] === "Married") ? d["3. Relationship Status"] : "Other";
        //d["4. Occupation Status"] = String(d["4. Occupation Status"]);
        //d["5. What type of organizations are you affiliated with?"] = String(d["5. What type of organizations are you affiliated with?"]);
        //d["6. Do you use social media?"] = d["6. Do you use social media?"] == "Yes" ? true : false;
        //d["7. What social media platforms do you commonly use?"] = String(d["7. What social media platforms do you commonly use?"]);
        d["Social Media Avg Time"] = convertToHours(d["8. What is the average time you spend on social media every day?"]);

        function convertToHours(str){
            switch(str){
                case 'Less than an Hour': return 0;
                case 'Between 1 and 2 hours': return 1;
                case 'Between 2 and 3 hours': return 2;
                case 'Between 3 and 4 hours': return 3;
                case 'Between 4 and 5 hours': return 4;
                case 'More than 5 hours': return 5; 
                default: return null; 
            }
        }
    d["ADHD"] = (Number(d["9. How often do you find yourself using Social media without a specific purpose?"]) +
                Number(d["10. How often do you get distracted by Social media when you are busy doing something?"]) +
                Number(d["11. Do you feel restless if you haven't used Social media in a while?"]) +
                Number(d["12. On a scale of 1 to 5, how easily distracted are you?"])) / 4.00;
    d["Anxiety"] = (Number(d["13. On a scale of 1 to 5, how much are you bothered by worries?"]) +
                    Number(d["14. Do you find it difficult to concentrate on things?"])) / 2.00;
    d["Self-Esteem"] = (Number(d["15. On a scale of 1-5, how often do you compare yourself to other successful people through the use of social media?"]) +
                        Number(d["16. Following the previous question, how do you feel about these comparisons, generally speaking?"]) +
                        Number(d["17. How often do you look to seek validation from features of social media?"])) / 3.00;
    d["Depression"] = (Number(d["18. How often do you feel depressed or down?"]) +
                        Number(d["19. On a scale of 1 to 5, how frequently does your interest in daily activities fluctuate?"]) +
                        Number(d["20. On a scale of 1 to 5, how often do you face issues regarding sleep?"])) / 3.00;
    d["Total Score"] = (4*Number(d["ADHD"]) + 2*Number(d["Anxiety"]) + 3*Number(d["Self-Esteem"]) + 3*Number(d["Depression"]));
    d["Outcome"] = Number(d["Total Score"]) >= 40;
});

    return [rawData];
}

d3.selectAll(".filterButtonsOut").on("change", function () {
    if (this.checked) {
        dimensions.push(this.name);
    } else {
        dimensions = dimensions.filter(d => d !== this.name);
    }
    d3.select("svg").selectAll("*").remove();
    updateChart();
});

d3.selectAll(".filterButtonsRS").on("change", function () {
    if (this.name == "single" && this.checked) {
        opacityRS[1] = 0.2;
    } else if (this.name == "single" && !this.checked) {
        opacityRS[1] = 0;
    }
    if (this.name == "married" && this.checked) {
        opacityRS[0] = 0.2;
    } else if (this.name == "married" && !this.checked) {
        opacityRS[0] = 0;
    }
    if (this.name == "other" && this.checked) {
        opacityRS[2] = 0.2;
    } else if (this.name == "other" && !this.checked) {
        opacityRS[2] = 0;
    } 
    d3.select("svg").selectAll("*").remove();
    updateChart();
});

function handleFormSubmit(event) {
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    if(rawData[rawData.length - 1].isUserInput){
        rawData.pop();
    }
    // You can add it to your dataset:
    data.isUserInput = true;
    
    rawData.push(data);
    console.log("Pushed User Data");
    console.log("----------------------------------");
    console.log(data);
    console.log("----------------------------------");


    // add user input to the graph and add a separe line
    // g1.selectAll("myPath")
    //     .data(rawData)
    //     .join("path")
    //     .attr("d",  path)
    //     .style("fill", "none" )
    //     .style("stroke", function(d) {
    //         if (d.isUserInput) {
    //             return "#ff0000"; 
    //         } else {
    //             return color(d["3. Relationship Status"]);
    //         }
    //     })
    //     .style("opacity", function(d){
    //         return d["3. Relationship Status"] === "Single" ? opacityRS[1] :
    //         d["3. Relationship Status"] === "Married" ? opacityRS[0] :
    //         opacityRS[2];
    //     });
        updateChart();
}

function updateChart(){
    if(dimensions.includes("Outcome")){
        dimensions.push(dimensions.splice(dimensions.indexOf("Outcome"), 1)[0]);
    }
    const svg = d3.select("svg");
    d3.select("svg").selectAll("*").remove();
    

        // Data Processing
        [rawData] = processingData(rawData);
        console.log(rawData);

        
    
        g1 = svg.append("g")
                    .attr("width", (parallelWidth + parallelMargin.left + parallelMargin.right))
                    .attr("height", (parallelHeight + parallelMargin.top + parallelMargin.bottom))
                    .attr("transform", `translate(${parallelMargin.left + 90}, ${height - (parallelHeight + parallelMargin.top + parallelMargin.bottom) - 400})`);
    
    
        const color = d3.scaleOrdinal()
            .range(colors);

        // store y objects
        const y = {};
        for (let i in dimensions) {
            let name = dimensions[i];
            if (name === "Gender") {
                y[name] = d3.scalePoint()
                    .domain(d3.set(rawData.map(function(d) { return d[name]; })).values())
                    .range([parallelHeight, 0]);
            } else if (name === "3. Relationship Status") {
                y[name] = d3.scalePoint()
                    .domain(d3.set(rawData.map(function(d) { return d[name]; })).values())
                    .range([parallelHeight, 0]);
            }
            else {
                y[name] = d3.scaleLinear()
                    .domain(d3.extent(rawData, function(d) { return +d[name]; }))
                    .range([parallelHeight, 0]);
            }
        }
    
        // Build the X scale -> it find the best position for each Y axis
        const x = d3.scalePoint()
            .range([0, parallelWidth - 500])
            .padding(1)
            .domain(dimensions);
    
        function path(d) {
            return d3.line()(dimensions.map(function(p) { return [x(p), y[p](d[p])]; }));
        }
    
    
        // Draw paths
    g1.selectAll("myPath")
        .data(rawData)
        .join("path")
        .attr("d",  path)
        .style("fill", "none" )
        .style("stroke", function(d) {
            if (d.isUserInput) {
                return "#FF10F0"; // Use a different color for user data
            } else {
                return color(d["3. Relationship Status"]);
            }
        })
        .style("opacity", function(d){
            if (d.isUserInput) {
                return 0.8; 
            } else {
                return d["3. Relationship Status"] === "Single" ? opacityRS[1] :
                d["3. Relationship Status"] === "Married" ? opacityRS[0] :
                opacityRS[2];
            }
        });
    
        // Set up axis
        g1.selectAll("myAxis")
            .data(dimensions).enter()
            .append("g")
            .attr("class", "axis")
            .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
            .each(function(d) { d3.select(this).call(d3.axisLeft().scale(y[d])); })
            .append("text")
              .style("text-anchor", "middle")
              .attr("y", -9)
              .style("font-size", "12px")
              .text(function(d) { return d; })
              .style("fill", "black");
    
        // Add a title
        g1.append("text")
            .attr("x", (parallelWidth / 2) - 250)
            .attr("y", -30)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text("Social Media and Mental Health Plot");
    
    const relationshipStatus = ["Married", "Single", "Other", "User Data"];
    const colorMapping = {
        "Married": "#0384fc",
        "Single": "#ff2a00",
        "Other": "#194d19",
        "User Data": "#FF10F0"
    }
    const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${width - 1800},  300)`);

    const legendRectSize = 18;
    const legendSpacing = 4;

    const legendItems = legend.selectAll(".legend.item")
            .data(relationshipStatus)
            .enter()
            .append("g")
            .attr("class", "legend-item")
            .attr("transform", function (d, i) {return `translate(0, ${i * (legendRectSize + legendSpacing)})`;});

    legendItems.append("rect")
            .attr("width", legendRectSize)
            .attr("height", legendRectSize)
            .style("fill", function (d) {return colorMapping[d];});
    legendItems.append("text")
            .attr("x", legendRectSize + legendSpacing)
            .attr("y", legendRectSize - legendSpacing)
            .text(function (d) {return d;});


};


document.getElementById('survey-form').addEventListener('submit', function(event) {
    event.preventDefault();
    handleFormSubmit(event);
});
document.getElementById('toggleButton').addEventListener('click', function() {
    var img = document.getElementById('myImage');
    var txt = document.getElementById('myText');
    var displayStyle = img.style.display == "none" ? "block" : "none";
    img.style.display = displayStyle;
    txt.style.display = displayStyle;
});

d3.csv("smmh.csv").then(data => {
    rawData = data;
    updateChart(rawData);
}).catch(function(error){
    console.log(error);
});

