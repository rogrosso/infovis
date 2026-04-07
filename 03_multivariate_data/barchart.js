import * as d3 from "d3"
import { axes, genDivTooltip } from "draw"

export default function drawBarChart(divElId) {
    const gridObj = d3.select(`#${divElId}`)
    const divMenu = gridObj.append("div").attr("class", "cell").attr("id", "dropdown-menu")
    const divCanvas = gridObj.append("div").attr("class", "cell").attr("id", "barchart_canvas")    

    const width = 650
    const height = 400
    const margin = { top: 30, bottom: 25, left: 85, right: 20 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    let divTooltip = genDivTooltip()

    const svg = divCanvas.append("svg")
        .attr("width", width)
        .attr("height", height)

    const worldPopulation = [
        { country: "China", population: 1397029 },
        { country: "India", population: 1309054 },
        { country: "USA", population: 319929 },
        { country: "Indonesia", population: 258162 },
        { country: "Brazil", population: 205962 },
        { country: "Pakistan", population: 189381 },
        { country: "Nigeria", population: 181182 },
        { country: "Bangladesh", population: 161201 },
    ]
    // statistics of number of students at the FAU in 2019
    const studentsFAU = [
        { faculty: "PhilFak", students: 9278 },
        { faculty: "WISO", students: 9697 },
        { faculty: "MedFak", students: 4477 },
        { faculty: "NatFak", students: 5943 },
        { faculty: "TechFak", students: 10262 },
    ]

    const dropdownOptions = [
        { key: "nrStudents", value: "Students at the FAU" },
        { key: "population", value: "World Population" },
    ]
    const divTooltipFormat = d3.formatLocale

    let dataSet = studentsFAU
    let titleText = "Students an the FAU"
    const props = {
        selection: svg,
        key: "faculty",
        value: "students",
        data: dataSet,
        title: titleText,
        width: innerWidth,
        height: innerHeight,
        xPos: margin.left,
        yPos: margin.top,
    }

    // dropdown menu
    const dropDown = divMenu.append("div")
        .attr("class", "dropdown")
        .attr("id", "dropdown-menut-barchart")
        .append("select")
        .on("change", function (event) {
            selectHandler(event.target.value)
        })
    const options = dropDown
        .selectAll("option")
        .data(dropdownOptions, (d) => d.key)
        .join("option")
        .attr("value", (d) => d.value)
        .text((d) => d.value)

    draw(props)

    function selectHandler(selection) {
        if (selection === "Students at the FAU") {
            props.data = studentsFAU
            props.key = "faculty"
            props.value = "students"
            props.title = "Students at the FAU"
        } else {
            props.data = worldPopulation
            props.key = "country"
            props.value = "population"
            props.title = "World Population"
        }
        draw(props)
    }

    // get name of faculty from key
    const m = new Map()
    m.set("PhilFak", "Philosophische Fakultät")
    m.set("WISO", "Wirtschafts- und Sozialwissenschaften")
    m.set("MedFak", "Medizinische Fakultät")
    m.set("NatFak", "Natuwissenschaftliche Fakultät")
    m.set("TechFak", "Technische Fakultät")

    function draw({
        selection,
        key,
        value,
        data,
        title,
        width,
        height,
        xPos,
        yPos,
    }) {
        // remove all
        selection.selectAll("*").remove()
        // global variables
        //const fillColor = '#E3BA22'
        //const fillColor = '#E6842A'
        //const fillColor = '#B396AD'
        const fillColor = "#C1BAA9"
        const strokeColor = "#7C715E"
        // prepare data
        data.sort((a, b) => b[value] - a[value])
        const xMaxValue = d3.max(data, (d) => d[value])
        const xScale = d3.scaleLinear().domain([0, xMaxValue]).range([0, width])
        const yScale = d3
            .scaleBand()
            .domain(data.map((e) => e[key]))
            .range([0, height])
            .padding(0.06)
        const xAxisFormat =
            key === "country"
                ? (val) =>
                      d3.format(".2s")(val).replace("M", "B").replace("k", "M")
                : (val) => d3.format(".2s")(val)
        const xTickValues =
            key === "country"
                ? d3.range(0, xMaxValue + xMaxValue / 9, xMaxValue / 9)
                : d3.range(0, xMaxValue + xMaxValue / 10, xMaxValue / 10)
        // draw axis
        const propsAxis = {
            selection: selection,
            width: width,
            height: height,
            xScale: xScale,
            yScale: yScale,
            xPos: xPos,
            yPos: yPos,
            className: "barchartAxis",
            xTickValues: xTickValues, // data.map( d => d[value]),
            yTickValues: undefined, //data.map( k => k[key]),
            xTickSize: undefined,
            yTickSize: undefined,
            xTickFormat: xAxisFormat,
            yTickFormat: undefined,
        }
        axes(propsAxis)
        // the bars
        const g = selection
            .append("g")
            .attr("class", "bars")
            .attr("transform", `translate(${xPos}, ${yPos})`)
        const tRec = d3.transition().duration(700).ease(d3.easeLinear)
        const rects = g
            .selectAll("g")
            .data(data, (d) => d[key])
            .join(
                (enter) => {
                    const gEnter = enter.append("g")
                    gEnter
                        .append("rect")
                        .attr("y", (d) => yScale(d[key]))
                        .attr("x", 1.5)
                        .attr("width", 0)
                        .attr("height", yScale.bandwidth())
                        .attr("fill", fillColor) // '#20B2AA')
                        .attr("stroke", strokeColor)
                        .transition(tRec)
                        .attr("width", (d) => xScale(d[value]))
                    gEnter
                        .on("mouseover", function (event, elem) {
                            d3.selectAll("rect")
                                .transition()
                                .tween("divTool", function (d) {
                                    if (elem[key] === d[key]) {
                                        return function (t) {
                                            d3.select(this)
                                                .attr("fill-opacity", 1)
                                                .attr("stroke-width", 1)
                                                .attr("stroke", "#A52A2A")
                                        }
                                    } else {
                                        const lerp = d3.interpolate(1, 0.7)
                                        return function (t) {
                                            d3.select(this).attr(
                                                "fill-opacity",
                                                lerp(t),
                                            )
                                        }
                                    }
                                })
                            mouseOver()
                        })
                        .on("mousemove", function (event, d) {
                            mouseMove(
                                d[key] + ": " + d3.format(",")(d[value]),
                                {
                                    x: event.pageX,
                                    y: event.pageY,
                                },
                            )
                        })
                        .on("mouseout", function (event, d) {
                            d3.selectAll("rect")
                                .transition()
                                .duration(200)
                                .attr("fill-opacity", 1)
                                .attr("stroke", strokeColor)
                            mouseOut()
                        })
                },
                (update) => update, // do nothing by update
                (exit) =>
                    exit
                        .attr("class", (d, i) => console.log("d " + d))
                        .remove(), // actually nothing to remove
            )
    }
    function mouseOver() {
        divTooltip.style("display", "inline-block")
    }
    function mouseMove(text, pos) {
        const { x, y } = pos
        divTooltip
            .html(text)
            .style("left", `${x + 10}px`)
            .style("top", `${y}px`)
    }
    function mouseOut() {
        divTooltip.style("display", "none")
    }
}
