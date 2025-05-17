
const margin = 20,
    width = 700 - margin,
    height = 750 - margin;
const colorScheme = d3.scaleOrdinal(d3.schemePaired);
var currentData = null;
var boxPlotData = null;
var xScaleBoxPlot = null;
var yScaleBoxPlot = null;

function onSelectDataset(){

    $('#x_attribute').html('');
    $('#y_attribute').html('');
    $('#color_attribute').html('');
    $('#boxplot_attribute').html('');
    removeLassoAndBoxPlot();

    let datasetName = $('#dataset')[0].value;

    if(datasetName === 'Select Dataset'){
        $('#x_attribute').html('');
        $('#y_attribute').html('');
        $('#color_attribute').html('');
        $('#boxplot_attribute').html('');
        currentData = [];
        boxPlotData = [];
        drawScatterPlot();
        drawBoxPlotAxes();
        return;
    }
    
    let id = 0;
    d3.csv('testing/data/'+datasetName+'.csv', d => {
        d.id = id;
        id++;
        for (const key in d) {
            if (Object.prototype.hasOwnProperty.call(d, key)) {
                const element = d[key];
                if($.isNumeric(element)){
                    d[key] = Number(element);
                }
            }
        }
        return d;
    }).then(data => {

        if(!data){
            console.log("No data");
            currentData = [];
            boxPlotData = [];
            drawScatterPlot();
            drawBoxPlotAxes();
            return;
        }

        let row1 = data[0];
        let quantOptions = '';
        let qualOptions = '';

        for (const key in row1) {
            if (Object.prototype.hasOwnProperty.call(row1, key)) {

                if(key === 'id'){
                    continue;
                }

                if(datasetName === 'Pokemon' && (key === '#' || key === 'Name' || key === 'Type 2')){
                    continue;
                }

                const element = row1[key];
                let option = '<option value="'+key+'">'+key+'</option>';
                if ($.isNumeric(element)) {
                    quantOptions += option;
                }else{
                    qualOptions += option;
                }
            }
        }

        $('#x_attribute').html(quantOptions);
        $('#y_attribute').html(quantOptions);
        $('#color_attribute').html(qualOptions);
        $('#boxplot_attribute').html(quantOptions);

        $('#y_attribute option:eq(1)').prop('selected', true);

        currentData = data;
        drawScatterPlot();
        drawBoxPlotAxes();
    })
}

function drawScatterPlot(){

    removeLassoAndBoxPlot();

    let xAttr = $('#x_attribute')[0].value;
    let yAttr = $('#y_attribute')[0].value;
    let colorAttr = $('#color_attribute')[0].value;

    let maxX = Number.MIN_VALUE;
    let maxY = Number.MIN_VALUE;
    let minX = Number.MAX_VALUE;
    let minY = Number.MAX_VALUE;
    for (const element of currentData) {
        if(element[xAttr] > maxX){
            maxX = element[xAttr];
        }
        if(element[yAttr] > maxY){
            maxY = element[yAttr];
        }
        if(element[xAttr] < minX){
            minX = element[xAttr];
        }
        if(element[yAttr] < minY){
            minY = element[yAttr];
        }
    }  

    let xExtra = (maxX-minX)/10;
    let yExtra = (maxY-minY)/10;
    maxX += xExtra;
    minX -= xExtra;
    maxY += yExtra;
    minY -= yExtra;

    const svg = d3.select("#scatter_svg");

    //x axis
    let xScale = d3.scaleLinear()
        .domain([minX, maxX])
        .range([margin+10, width-margin*3]);
    
    let xAxis = d3.axisBottom(xScale);

    let gXAxis = svg.selectAll('.gXAxis').data([0]);

    gXAxis.enter()
        .append('g')
            .attr('class', 'gXAxis')
            .attr('transform', `translate(${margin+10},${height+margin})`)
            .merge(gXAxis)
            .transition()
            .duration(1000)
            .call(xAxis);

    //x axis label
    let xLabel = svg.selectAll('.xLabel').data([null])

    xLabel.enter()
        .append('text')
            .attr('class', 'xLabel')
            .attr('x', width/2 - margin*2)
            .attr('y', height+margin*3)
            .merge(xLabel)
            .transition()
            .duration(1000)
            .text(xAttr);

    //y axis
    let yScale = d3.scaleLinear()
        .domain([maxY, minY])
        .range([margin, height]);
    
    let yAxis = d3.axisLeft(yScale);

    let gYAxis = svg.selectAll('.gYAxis').data([0]);

    gYAxis.enter()
        .append('g')
            .attr('class', 'gYAxis')
            .attr('transform', `translate(${margin*2+20}, ${margin})`)
            .merge(gYAxis)
            .transition()
            .duration(1000)
            .call(yAxis);

    //y axis label
    let yLabel = svg.selectAll('.yLabel').data([null])

    yLabel.enter()
        .append('text')
            .attr('class', 'yLabel')
            .attr('transform', `translate(${margin}, ${(height/2)+margin*3}), rotate(-90)`)
            .merge(yLabel)
            .transition()
            .duration(1000)
            .text(yAttr);

    //dots
    let scatterDots = svg.selectAll('.scatterDots')
        .data(currentData, d => d.id);

    scatterDots.enter()
        .append("circle")
        .merge(scatterDots)
            .transition()
            .duration(1000)
            .attr('class', 'scatterDots')
            .attr('id', d => `dot-${d.id}`)
            .attr("cx", d => xScale(d[xAttr]))
            .attr("cy", d => yScale(d[yAttr]))
            .attr("r", "4")
            .attr('transform', `translate(${margin+10},${margin})`)
            .style("fill", d => colorScheme(d[colorAttr]))
            .style('stroke', 'lightgray')
            .attr("stroke-opacity", 1)
            .style("opacity", 1);
 
    scatterDots.exit()
        .transition()
        .duration(1000)
        .style("opacity", 0)
        .remove();

    //color key
    let uniqueCategories = Array.from(new Set(currentData.map(d => d[colorAttr])));

    let colorKey = uniqueCategories.reduce((acc, category) => {
        acc[category] = colorScheme(category);
        return acc;
    }, {});

    let colorSetDiv = d3.select('#color_set_div')
        .style('background-color', 'white')
        .style('padding-bottom', '10px')
        .style('margin', '0px')
        .style('border', '1px solid lightgray')
        .style('border-radius', '3px')
        .style('overflow-y', 'auto')
        .html('');

    uniqueCategories.forEach((category, index) => {
        
        let legendItem = colorSetDiv.append("div")
            .attr("class", "col-auto d-flex align-items-center")
            .style("width", "150px")
            .style("opacity", 0)
            .style("margin-top", "10px");

        
        legendItem.append("div")
            .style("width", "18px")
            .style("height", "18px")
            .style("background-color", colorKey[category])
            .style("margin-right", "10px")
            .style('border', '0.5px solid lightgray');

        legendItem.append("div")
            .text(category);

        legendItem.transition()
            .duration(800)    
            .delay(index * 10)
            .style("opacity", 1); 
    });

    //lasso
    let coords = [];
    const lineGenerator = d3.line();
    
    const pointInPolygon = function (point, vs) {
    
        let x = point[0],
            y = point[1];
    
        let inside = false;
        for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            let xi = vs[i][0],
                yi = vs[i][1];
            let xj = vs[j][0],
                yj = vs[j][1];
    
            let intersect =
                yi > y != yj > y &&
                x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
            if (intersect) inside = !inside;
        }
    
        return inside;
    };

    const drawPath = function() {
        d3.select("#lasso")
            .style("stroke", "black")
            .style("stroke-width", 2)
            .style("fill", "#00000054")
            .attr("d", lineGenerator(coords));
    }
    
    const dragStart = function() {
        coords = [];
        removeLasso();
        d3.select("#scatter_svg")
            .append("path")
            .attr("id", "lasso");
    }
    
    const dragMove = function(event) {
        let mouseX = event.sourceEvent.offsetX;
        let mouseY = event.sourceEvent.offsetY;
        coords.push([mouseX, mouseY]);
        drawPath();
    }

    let translateX = margin + 10;
    let translateY = margin;
    
    const dragEnd = function() {
        boxPlotData = [];
        d3.selectAll('.scatterDots').each((d, i) => {
            let e = d3.select(`#dot-${d.id}`);

            let cx = parseFloat(e.attr('cx'));
            let cy = parseFloat(e.attr('cy'));

            let point = [
                cx + translateX,
                cy + translateY 
            ];

            if (pointInPolygon(point, coords)) {
                e.style('stroke', 'black')
                    .style('stroke-width', '2');

                boxPlotData.push(d);
            }
        });
        $('#selectedDotsLabel').html(boxPlotData.length > 0 ? `No. of points within lasso: <b>${boxPlotData.length}</b>` : '');
        drawBoxPlot();
        d3.select("#lasso").remove();
        coords = [];
    }

    let drag = d3.drag()
        .on("start", dragStart)
        .on("drag", dragMove)
        .on("end", dragEnd);

    svg.call(drag);
}

function drawBoxPlotAxes(){

    let colorAttr = $('#color_attribute')[0].value;
    let boxPlotAttr = $('#boxplot_attribute')[0].value; 

    let maxX = Number.MIN_VALUE;
    let minX = Number.MAX_VALUE;
    for (const element of currentData) {
        if(element[boxPlotAttr] > maxX){
            maxX = element[boxPlotAttr];
        }
        if(element[boxPlotAttr] < minX){
            minX = element[boxPlotAttr];
        }
    }  

    let xExtra = (maxX-minX)/10;
    maxX += xExtra;
    minX -= xExtra;

    const svg = d3.select("#box_svg");

    //x axis
    xScaleBoxPlot = d3.scaleLinear()
        .domain([minX, maxX])
        .range([margin+10, width-margin*3-10]);
    
    let xAxis = d3.axisBottom(xScaleBoxPlot);

    let gXAxis = svg.selectAll('.gXAxis').data([0]);

    gXAxis.enter()
        .append('g')
            .attr('class', 'gXAxis')
            .attr('transform', `translate(${margin+20},${height+margin})`)
            .merge(gXAxis)
            .transition()
            .duration(1000)
            .call(xAxis);

    //x axis label
    let xLabel = svg.selectAll('.xLabel').data([null])

    xLabel.enter()
        .append('text')
            .attr('class', 'xLabel')
            .attr('x', width/2 - margin*2)
            .attr('y', height+margin*3)
            .merge(xLabel)
            .transition()
            .duration(1000)
            .text(boxPlotAttr);

    //y axis
    let yScaleDomain = [...new Set(currentData.map(d => d[colorAttr]))].reverse();

    yScaleBoxPlot = d3.scaleBand()
        .domain(yScaleDomain)
        .range([margin, height])
        .padding(.4);
    
    let yAxis = d3.axisLeft(yScaleBoxPlot);

    let gYAxis = svg.selectAll('.gYAxis').data([0]);

    gYAxis.enter()
        .append('g')
            .attr('class', 'gYAxis')
            .attr('transform', `translate(${margin*2+30}, ${margin})`)
            .merge(gYAxis)
            .transition()
            .duration(1000)
            .call(yAxis)
            .selection()
            .selectAll("text")
            .attr("transform", "translate(-3, -8) rotate(-45)") 
            .style("text-anchor", "end");

    //y axis label
    let yLabel = svg.selectAll('.yLabel').data([null])

    yLabel.enter()
        .append('text')
            .attr('class', 'yLabel')
            .attr('transform', `translate(${margin}, ${(height/2)+margin*3}), rotate(-90)`)
            .merge(yLabel)
            .transition()
            .duration(1000)
            .text(colorAttr);
}

function drawBoxPlot(){

    if(boxPlotData == null){
        return;
    }

    let boxPlotAttr = $('#boxplot_attribute')[0].value;
    let colorAttr = $('#color_attribute')[0].value;
    const svg = d3.select("#box_svg");
        // .attr('transform', `translate(${margin*2}, ${margin})`);

    let countObj = boxPlotData.reduce((acc, d) => {
        acc[d[colorAttr]] = (acc[d[colorAttr]] || 0) + 1;
        return acc;
    }, {});

    let boxPlotDataFinal = [];
    let dotPlotData = [];

    boxPlotData.forEach(d => {
        if(countObj.hasOwnProperty(d[colorAttr])){
            let count = countObj[d[colorAttr]];
            if(count < 5){
                dotPlotData.push(d); //draw dot plot for points <5
            }else{
                boxPlotDataFinal.push(d); //draw box plot for points >=5
            }
        }
    });

    let id = 0;

    //show box plot
    let outliers = [];
    id = 0;
    var sumstat = d3.rollup(boxPlotDataFinal,
        d => {
            let attrArr = d.map(g => g[boxPlotAttr]).sort(d3.ascending);
            let q1 = d3.quantile(attrArr,.25);
            let median = d3.quantile(attrArr,.5);
            let q3 = d3.quantile(attrArr,.75);
            let interQuantileRange = q3 - q1;
            let min = Math.max(attrArr[0], q1 - 1.5 * interQuantileRange);
            let max = Math.min(attrArr[attrArr.length-1], q3 + 1.5 * interQuantileRange);
            let outliersArr = attrArr.filter(v => v < min || v > max);
            outliersArr.forEach(element => {
                outliers.push({
                    y: d[0][colorAttr], 
                    x: element,
                    id: id
                });
                id++;
            });
            return ({
                q1: q1, 
                median: median, 
                q3: q3, 
                interQuantileRange: interQuantileRange, 
                min: min, 
                max: max
            });
        }, 
        d => d[colorAttr]
    );

    id = 0;
    sumstat.forEach((value, key) => {
        value.id = ++id;
    });

    //fade out the outliers and box dots first
    svg.selectAll('.outlierDots, .boxDots')
        .data([], d => d.id)
        .exit()
        .transition()
        .duration(1000)
        .style('opacity', 0)
        .delay(d => d.id*200)
        .remove();

    setTimeout(() => {

        // Show the main horizontal line
        let horztLines = svg.selectAll(".horztLines")
            .data(sumstat, d => d[0]);
    
        horztLines.enter()
            .append("line")
            .merge(horztLines)
                .attr('class', 'horztLines')
                .attr("stroke", "black")
                .style("width", 40)
                .attr('transform', `translate(${margin*2}, ${margin})`)
                .transition()
                .duration(1000)
                .attr("x1", d => xScaleBoxPlot(d[1].min))
                .attr("x2", d => xScaleBoxPlot(d[1].max))
                .attr("y1", d => yScaleBoxPlot(d[0]) + (yScaleBoxPlot ? yScaleBoxPlot.bandwidth()/2 : 0))
                .attr("y2", d => yScaleBoxPlot(d[0]) + (yScaleBoxPlot ? yScaleBoxPlot.bandwidth()/2 : 0))
                .delay(d => d[1].id*200);
    
        horztLines.exit()
            .transition()
            .duration(1000)
            .attr('x2', d => xScaleBoxPlot(d[1].min))
            .delay(d => d[1].id*200)
            .remove();

        setTimeout(() => {

            // rectangle for the main box
            let boxes = svg.selectAll(".boxes")
                .data(sumstat, d => d[0]);
            
            boxes.enter()
                .append("rect")
                .merge(boxes)
                    .attr('class', 'boxes')
                    .attr("stroke", "black")
                    .attr('transform', `translate(${margin*2}, ${margin})`)
                    .style("fill", d => colorScheme(d[0]))
                    .transition()
                    .duration(1000)
                    .attr("y", d => yScaleBoxPlot(d[0]))
                    .attr("x", d => xScaleBoxPlot(d[1].q1)) 
                    .attr("width", d => xScaleBoxPlot(d[1].q3)-xScaleBoxPlot(d[1].q1))
                    .attr("height", yScaleBoxPlot ? yScaleBoxPlot.bandwidth() : 0)
                    .delay(d => d[1].id*200);
            
            boxes.exit()
                .transition()
                .duration(1000)
                .attr('width', 0)
                .delay(d => d[1].id*200)
                .remove();
        
            // Show the median
            let medianLines = svg.selectAll(".medianLines")
                .data(sumstat, d => d[0]);
        
            medianLines.enter()
                .append("line")
                .merge(medianLines)
                    .attr('class', 'medianLines')
                    .attr("stroke", "black")
                    .attr('transform', `translate(${margin*2}, ${margin})`)
                    .transition()
                    .duration(1000)
                    .attr("y1", d => yScaleBoxPlot(d[0]))
                    .attr("y2", d => yScaleBoxPlot(d[0]) + (yScaleBoxPlot ? yScaleBoxPlot.bandwidth()/2 : 0))
                    .attr("x1", d => xScaleBoxPlot(d[1].median))
                    .attr("x2", d => xScaleBoxPlot(d[1].median))
                    .style("width", 80)
                    .delay(d => d[1].id*200);
            
            medianLines.exit()
                .transition()
                .duration(1000)
                .attr("y1", d => yScaleBoxPlot(d[0]) + (yScaleBoxPlot ? yScaleBoxPlot.bandwidth()/2 : 0))
                .delay(d => d[1].id*200)
                .remove();

            d3.selectAll("rect").lower();
            d3.selectAll("line").raise();

            setTimeout(() => {

                //show dot plot
                id = 0;
                dotPlotData = dotPlotData.map(d => {
                    d.id = ++id;
                    return d;
                });

                //show box dots
                svg.selectAll('.boxDots')
                    .data(dotPlotData, d => d.id)
                    .enter()
                    .append("circle")
                        .attr('class', 'boxDots')
                        .style("fill", d => colorScheme(d[colorAttr]))
                        .style('stroke', 'black')
                        .attr('transform', `translate(${margin*2}, ${margin+10})`)
                        .attr("stroke-opacity", 1)
                        .transition()
                        .duration(1000)
                        .attr("cx", d => xScaleBoxPlot(d[boxPlotAttr]))
                        .attr("cy", d => yScaleBoxPlot(d[colorAttr]))
                        .attr("r", 4)
                        .style("opacity", 1)
                        .delay(d => d.id*200);

                setTimeout(() => {

                    //show outliers
                    svg.selectAll('.outlierDots')
                        .data(outliers, d => d.id)
                        .enter()
                        .append("circle")
                            .attr('class', 'outlierDots')
                            .style("fill", d => colorScheme(d.y))
                            .style('stroke', 'black')
                            .attr('transform', `translate(${margin*2}, ${margin+10})`)
                            .attr("stroke-opacity", 1)
                            .transition()
                            .duration(1000)
                            .attr("cx", d => xScaleBoxPlot(d.x))
                            .attr("cy", d => yScaleBoxPlot(d.y))
                            .attr("r", 4)
                            .style('opacity', 1)
                            .delay(d => d.id*200);
                
                    d3.selectAll("circle").raise();

                }, 200*dotPlotData.length + 500);

            }, 200*($('.boxes').length) + 500);

        }, 200*($('.horztLines').length) + 500);

    }, 200*($('.outlierDots').length + $('.boxDots').length) + 500);
}

function removeLassoAndBoxPlot(){
    removeLasso();
    boxPlotData = [];
    drawBoxPlot();
}

function removeLasso(){
    $('#selectedDotsLabel').html('');
    $('.scatterDots').css({
        'stroke': 'lightgray',
        'stroke-width': '1'
    });
    d3.select("#lasso").remove();
}
