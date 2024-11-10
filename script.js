function App() {
  const [Data, setData] = React.useState(null);

  React.useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(
          'https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json'
        );
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setData(data);
      } catch (error) {
        console.error('Fetch error:', error);
      }
    }

    fetchData();
  }, []);

  React.useEffect(() => {
    if (Data) {
      createHeatMap(Data);
    }
  }, [Data]);

  return (
    <div>
      <h1>HeatMap</h1>
    </div>
  );
}

function createHeatMap(Data) {
  const { monthlyVariance, baseTemperature } = Data;
  const minYear = 1754;
  const maxYear = 2015;
  const years = [1754, 1800, 1850, 1900, 1950, 2000, 2015];
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];
  const colors = [
    '#0b3d91',
    '#1f77b4',
    '#6baed6',
    '#ffff99',
    '#fdae61',
    '#f46d43',
    '#d73027'
  ];
  const margin = { top: 100, right: 50, bottom: 100, left: 50 };
  const width = 1000 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;
  const cellWidth = width / (maxYear - minYear);
  const cellHeight = height / 12;

  const svg = d3
    .select('body')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  const temperatures = monthlyVariance.map(
    (d) => baseTemperature + d.variance
  );
  const minTemp = Math.min(...temperatures);
  const maxTemp = Math.max(...temperatures);

  const tempRanges = [];
  const numColors = colors.length;
  const step = (maxTemp - minTemp) / numColors;

  for (let i = 0; i < numColors; i++) {
    const tempStart = minTemp + i * step;
    const tempEnd = tempStart + step;
    tempRanges.push([tempStart.toFixed(1), tempEnd.toFixed(1)]);
  }

  svg
    .append('text')
    .text('Monthly Global Land-Surface Temperature')
    .attr('id', 'title')
    .attr('x', width / 2)
    .attr('y', -20)
    .attr('text-anchor', 'middle')
    .style('font-size', '24px');

  svg
    .append('text')
    .text(`${minYear} - ${maxYear}: base temperature ${baseTemperature}°C`)
    .attr('id', 'description')
    .attr('x', width / 2)
    .attr('y', -5)
    .attr('text-anchor', 'middle')
    .style('font-size', '16px');

  const xAxis = d3
    .scaleLinear()
    .domain([minYear, maxYear])
    .range([0, width]);

  const yAxis = d3
    .scaleBand()
    .domain(months)
    .range([0, height])
    .padding(0.1);

  svg
    .append('g')
    .attr('id', 'x-axis')
    .attr('transform', `translate(0, ${height})`)
    .call(d3.axisBottom(xAxis).tickValues(years).tickFormat(d3.format('d')));

  svg.append('g').attr('id', 'y-axis').call(d3.axisLeft(yAxis));

  svg
    .selectAll('.cell')
    .data(monthlyVariance)
    .enter()
    .append('rect')
    .attr('class', 'cell')
    .attr('data-month', (d) => d.month - 1)
    .attr('data-year', (d) => d.year)
    .attr('data-temp', (d) => d.variance + baseTemperature)
    .attr('x', (d) => xAxis(d.year))
    .attr('y', (d) => yAxis(months[d.month - 1]))
    .attr('width', cellWidth)
    .attr('height', cellHeight)
    .style('fill', (d) => {
      const temp = Math.round(baseTemperature + d.variance);
      let colorIndex = 0;
      tempRanges.forEach((range, index) => {
        if (temp >= range[0] && temp <= range[1]) {
          colorIndex = index;
        }
      });
      return colors[colorIndex];
    });

  const tooltip = d3.select('body').append('div').attr('id', 'tooltip');

  svg
    .selectAll('.cell')
    .on('mouseover', function (event, d) {
      const temp = baseTemperature + d.variance;
      tooltip
        .attr('data-year', d.year)
        .style('display', 'block')
        .style('left', `${event.pageX + 10}px`)
        .style('top', () => {
          const rect = this.getBoundingClientRect();
          return `${rect.top - 40}px`;
        })
        .html(`${d.year} - ${months[d.month - 1]} : ${temp.toFixed(2)}°C`);

      d3.select(this).style('stroke', 'black').style('stroke-width', '2px');
    })
    .on('mouseout', function () {
      tooltip.style('display', 'none');

      d3.select(this).style('stroke', 'none');
    });

  const legendWidth = 300;
  const legendHeight = 30;
  const legendRectWidth = legendWidth / colors.length;

  const legend = svg
    .append('g')
    .attr('id', 'legend')
    .attr(
      'transform',
      `translate(${width / 2 - legendWidth / 2}, ${height + 40})`
    );

  legend
    .selectAll('rect')
    .data(colors)
    .enter()
    .append('rect')
    .attr('x', (d, i) => i * legendRectWidth)
    .attr('y', 0)
    .attr('width', legendRectWidth)
    .attr('height', legendHeight)
    .style('fill', (d) => d)
    .style('stroke', 'black');

  legend
    .selectAll('line')
    .data(colors)
    .enter()
    .append('line')
    .attr('x1', (d, i) => i * legendRectWidth)
    .attr('y1', legendHeight)
    .attr('x2', (d, i) => i * legendRectWidth)
    .attr('y2', legendHeight + 5)
    .style('stroke', 'black')
    .style('stroke-width', 1);

  legend
    .append('line')
    .attr('x1', legendRectWidth * tempRanges.length)
    .attr('y1', legendHeight)
    .attr('x2', legendRectWidth * tempRanges.length)
    .attr('y2', legendHeight + 5)
    .style('stroke', 'black')
    .style('stroke-width', 1);

  legend
    .selectAll('text')
    .data(tempRanges)
    .enter()
    .append('text')
    .attr('x', (d, i) => i * legendRectWidth)
    .attr('y', legendHeight + 15)
    .text((d) => `${d[0]}°C`)
    .style('font-size', '10px')
    .attr('text-anchor', 'middle');

  legend
    .append('text')
    .attr('x', legendRectWidth * tempRanges.length)
    .attr('y', legendHeight + 15)
    .text((d) => `${tempRanges[tempRanges.length - 1][1]}°C`)
    .style('font-size', '10px')
    .attr('text-anchor', 'middle');

  legend
    .append('line')
    .attr('x1', 0 - 30)
    .attr('x2', legendWidth + 30)
    .attr('y1', legendHeight)
    .attr('y2', legendHeight)
    .style('stroke', 'black')
    .style('stroke-width', 1);
}

ReactDOM.render(<App />, document.getElementById('root'));

